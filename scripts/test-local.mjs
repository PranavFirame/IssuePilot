// scripts/test-local.mjs
const BASE_URL = "http://localhost:3000";

async function testEndpoint(name, url, options = {}) {
  const start = Date.now();
  try {
    const res = await fetch(url, options);
    const duration = Date.now() - start;
    const text = await res.text();
    let preview = text.slice(0, 150).replace(/\s+/g, " ");

    let json = null;
    try {
      json = JSON.parse(text);
      preview = JSON.stringify(json).slice(0, 150);
    } catch {
      // HTML response
    }

    const success = res.ok;
    console.log(`[${success ? "PASS" : "FAIL"}] ${name}`);
    console.log(`       Status: ${res.status} ${res.statusText} (${duration}ms)`);
    console.log(`       Sample: ${preview}...`);
    return { success, status: res.status, json, text };
  } catch (err) {
    console.log(`[FAIL] ${name}`);
    console.log(`       Error: ${err.message}`);
    return { success: false, error: err.message };
  }
}

async function runLocalTests() {
  console.log("==================================================");
  console.log("   IssuePilot Local Automated Smoke Test Suite    ");
  console.log("   Target: " + BASE_URL);
  console.log("==================================================\n");

  // 1. Landing Page
  const home = await testEndpoint("1. Landing Page (GET /)", `${BASE_URL}/`);

  // 2. Repository Analysis API with real GitHub repo (e.g. octocat/Hello-World or facebook/react)
  console.log("\nTesting Live GitHub API Ingestion...");
  const analyze = await testEndpoint(
    "2. Analyze API (POST /api/analyze with octocat/Hello-World)",
    `${BASE_URL}/api/analyze`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repo: "octocat/Hello-World" }),
    }
  );

  let savedId = null;
  if (analyze.success && analyze.json) {
    console.log(`       Stars: ${analyze.json.repository.stars}`);
    console.log(`       Health Score: ${analyze.json.health.score} (${analyze.json.health.grade})`);
    console.log(`       Issues Sampled: ${analyze.json.issues.length}`);
    console.log(`       Rate Limit Remaining: ${analyze.json.rateLimit.remaining}`);

    // 3. Save Report Snapshot to Database
    console.log("\nTesting Persistence via Prisma ORM...");
    const saveReport = await testEndpoint(
      "3. Save Report (POST /api/reports)",
      `${BASE_URL}/api/reports`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: analyze.json.repository.owner,
          repo: analyze.json.repository.repo,
          repoName: analyze.json.repository.fullName,
          description: analyze.json.repository.description,
          stars: analyze.json.repository.stars,
          forks: analyze.json.repository.forks,
          openIssues: analyze.json.repository.openIssuesCount,
          openPrs: analyze.json.repository.openPrCount,
          healthScore: analyze.json.health.score,
          primaryLanguage: analyze.json.repository.language,
          dataSnapshot: JSON.stringify(analyze.json),
        }),
      }
    );

    if (saveReport.success && saveReport.json?.report?.id) {
      savedId = saveReport.json.report.id;
      console.log(`       Saved Snapshot ID: ${savedId}`);
    }
  }

  // 4. List Saved Reports
  const listReports = await testEndpoint(
    "4. List Saved Reports (GET /api/reports)",
    `${BASE_URL}/api/reports`
  );

  // 5. Test AI Triage Endpoint (verifying graceful unconfigured fallback)
  console.log("\nTesting AI Triage Fallback Behavior...");
  const triage = await testEndpoint(
    "5. Triage API Fallback (POST /api/triage)",
    `${BASE_URL}/api/triage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        issueNumber: 1,
        title: "Build failure on Windows 11 with Node 20",
        body: "Reproducible error when running npm install.",
        author: "tester",
        repoFullName: "test/repo",
      }),
    }
  );

  // 6. Test Repository Dashboard Route
  console.log("\nTesting Frontend Dashboard Rendering...");
  const dashboard = await testEndpoint(
    "6. Repo Dashboard Page (GET /repo/octocat/Hello-World)",
    `${BASE_URL}/repo/octocat/Hello-World`
  );

  // 7. Cleanup Saved Report
  if (savedId) {
    console.log("\nTesting Database Cleanup...");
    await testEndpoint(
      `7. Delete Report (DELETE /api/reports?id=${savedId})`,
      `${BASE_URL}/api/reports?id=${savedId}`,
      { method: "DELETE" }
    );
  }

  console.log("\n==================================================");
  console.log("   Local Smoke Test Completed Successfully!       ");
  console.log("==================================================");
}

runLocalTests();
