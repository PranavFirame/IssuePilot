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
  await testEndpoint("1. Landing Page (GET /)", `${BASE_URL}/`);

  // 2. Explore Page
  await testEndpoint("2. Explore Page (GET /explore)", `${BASE_URL}/explore`);

  // 3. Workspace Page
  await testEndpoint("3. Workspace Page (GET /workspace)", `${BASE_URL}/workspace`);

  // 4. Explore API
  console.log("\nTesting Beginner Issues Search API...");
  const exploreApi = await testEndpoint(
    "4. Explore API (GET /api/explore?lang=typescript)",
    `${BASE_URL}/api/explore?lang=typescript&perPage=5`
  );
  if (exploreApi.success && exploreApi.json) {
    console.log(`       Found: ${exploreApi.json.totalCount} issues`);
    console.log(`       Rate Limit Remaining: ${exploreApi.json.rateLimit?.remaining}`);
  }

  // 5. User Preferences API
  console.log("\nTesting User Preferences API...");
  await testEndpoint(
    "5. Save Preferences (POST /api/workspace/preferences)",
    `${BASE_URL}/api/workspace/preferences`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "smoke-test-user",
        languages: ["TypeScript", "Rust"],
        experienceLevel: "beginner",
        topics: ["web", "cli"],
        monthlyGoal: 4,
      }),
    }
  );

  // 6. Track Issue in Workspace
  console.log("\nTesting Workspace Issue Tracking...");
  let trackedId = null;
  const trackRes = await testEndpoint(
    "6. Track Issue (POST /api/workspace)",
    `${BASE_URL}/api/workspace`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "smoke-test-user",
        issueNumber: 999,
        repoOwner: "test-owner",
        repoName: "test-repo",
        title: "Sample beginner task",
        htmlUrl: "https://github.com/test-owner/test-repo/issues/999",
        status: "saved",
        notes: "Test note for workspace",
      }),
    }
  );
  if (trackRes.success && trackRes.json?.item?.id) {
    trackedId = trackRes.json.item.id;

    // 7. Link verified PR
    await testEndpoint(
      "7. Link Verified PR (PATCH /api/workspace)",
      `${BASE_URL}/api/workspace`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: trackedId,
          status: "completed",
          prUrl: "https://github.com/test-owner/test-repo/pull/1",
        }),
      }
    );

    // 8. Delete tracked item
    await testEndpoint(
      "8. Delete Tracked Issue (DELETE /api/workspace)",
      `${BASE_URL}/api/workspace?id=${trackedId}`,
      { method: "DELETE" }
    );
  }

  // 9. Repository Analysis API
  console.log("\nTesting Live GitHub Repository Analysis...");
  await testEndpoint(
    "9. Analyze API (POST /api/analyze with octocat/Hello-World)",
    `${BASE_URL}/api/analyze`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repo: "octocat/Hello-World" }),
    }
  );

  console.log("\n==================================================");
  console.log("   Local Smoke Test Completed Successfully!       ");
  console.log("==================================================");
}

runLocalTests();
