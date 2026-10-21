import { describe, expect, it } from "vitest";
import { POST as analyzeHandler } from "../../app/api/analyze/route";
import { POST as triageHandler } from "../../app/api/triage/route";
import {
  DELETE as deleteReportHandler,
  GET as getReportsHandler,
  POST as saveReportHandler,
} from "../../app/api/reports/route";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { generateGuestId, GUEST_COOKIE_NAME } from "@/lib/auth/guest-session";

describe("API Route Integration Tests", () => {
  describe("/api/analyze", () => {
    it("returns 400 when repository format is invalid", async () => {
      const req = new NextRequest("http://localhost:3000/api/analyze", {
        method: "POST",
        body: JSON.stringify({ repo: "invalid-single-word" }),
      });

      const res = await analyzeHandler(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBeDefined();
    });

    it("rejects SSRF attempts to external hosts", async () => {
      const req = new NextRequest("http://localhost:3000/api/analyze", {
        method: "POST",
        body: JSON.stringify({ repo: "https://evil-server.internal/org/repo" }),
      });

      const res = await analyzeHandler(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("Only public GitHub repositories");
    });

    it("auto-saves repository analysis to the database and returns savedAnalysisId", async () => {
      const req = new NextRequest("http://localhost:3000/api/analyze", {
        method: "POST",
        body: JSON.stringify({ repo: "facebook/react" }),
      });

      const res = await analyzeHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.repository).toBeDefined();
      expect(json.savedAnalysisId).toBeDefined();

      const saved = await prisma.savedAnalysis.findUnique({
        where: { id: json.savedAnalysisId },
      });
      expect(saved).not.toBeNull();
      expect(["facebook", "react"]).toContain(saved?.owner.toLowerCase());
      expect(saved?.repo.toLowerCase()).toBe("react");
    });
  });

  describe("/api/triage", () => {
    it("returns 400 for malformed payload", async () => {
      const req = new NextRequest("http://localhost:3000/api/triage", {
        method: "POST",
        body: JSON.stringify({ issueNumber: -10 }),
      });

      const res = await triageHandler(req);
      expect(res.status).toBe(400);
    });

    it("returns unconfigured state gracefully when AI keys are absent", async () => {
      const req = new NextRequest("http://localhost:3000/api/triage", {
        method: "POST",
        body: JSON.stringify({
          issueNumber: 1,
          title: "Test issue title",
          body: "Test issue body",
          author: "user",
          repoFullName: "owner/repo",
        }),
      });

      const res = await triageHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.isConfigured).toBe(false);
    });
  });

  describe("/api/reports persistence", () => {
    const testGuestId = generateGuestId();
    let createdId: string;

    it("saves an analysis snapshot to the database", async () => {
      const req = new NextRequest("http://localhost:3000/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: `${GUEST_COOKIE_NAME}=${testGuestId}`,
        },
        body: JSON.stringify({
          owner: "testorg",
          repo: "testrepo",
          repoName: "testrepo",
          description: "Integration test repo",
          stars: 100,
          forks: 25,
          openIssues: 5,
          openPrs: 2,
          healthScore: 85,
          primaryLanguage: "TypeScript",
          dataSnapshot: JSON.stringify({ mock: true }),
        }),
      });

      const res = await saveReportHandler(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.report.id).toBeDefined();
      createdId = json.report.id;
    });

    it("retrieves the saved report by id", async () => {
      expect(createdId).toBeDefined();
      const req = new NextRequest(
        `http://localhost:3000/api/reports?id=${createdId}`,
        {
          method: "GET",
          headers: {
            cookie: `${GUEST_COOKIE_NAME}=${testGuestId}`,
          },
        }
      );

      const res = await getReportsHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.id).toBe(createdId);
      expect(json.owner).toBe("testorg");
    });

    it("lists all reports", async () => {
      const req = new NextRequest("http://localhost:3000/api/reports", {
        method: "GET",
        headers: {
          cookie: `${GUEST_COOKIE_NAME}=${testGuestId}`,
        },
      });

      const res = await getReportsHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(Array.isArray(json)).toBe(true);
      expect(json.length).toBeGreaterThanOrEqual(1);
    });

    it("deletes the created report", async () => {
      expect(createdId).toBeDefined();
      const req = new NextRequest(
        `http://localhost:3000/api/reports?id=${createdId}`,
        {
          method: "DELETE",
          headers: {
            cookie: `${GUEST_COOKIE_NAME}=${testGuestId}`,
          },
        }
      );

      const res = await deleteReportHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });
  });
});
