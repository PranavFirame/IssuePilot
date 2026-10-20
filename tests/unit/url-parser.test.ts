import { describe, expect, it } from "vitest";
import { parseRepositoryUrl } from "../../lib/github/url-parser";

describe("parseRepositoryUrl", () => {
  it("parses standard owner/repo format", () => {
    const result = parseRepositoryUrl("facebook/react");
    expect(result.isValid).toBe(true);
    expect(result.data).toEqual({
      owner: "facebook",
      repo: "react",
      fullName: "facebook/react",
    });
  });

  it("parses full HTTPS GitHub URL", () => {
    const result = parseRepositoryUrl("https://github.com/vercel/next.js");
    expect(result.isValid).toBe(true);
    expect(result.data).toEqual({
      owner: "vercel",
      repo: "next.js",
      fullName: "vercel/next.js",
    });
  });

  it("handles trailing slashes and .git extensions", () => {
    const result = parseRepositoryUrl("https://github.com/tailwindlabs/tailwindcss.git/");
    expect(result.isValid).toBe(true);
    expect(result.data).toEqual({
      owner: "tailwindlabs",
      repo: "tailwindcss",
      fullName: "tailwindlabs/tailwindcss",
    });
  });

  it("rejects non-github domains to protect against SSRF", () => {
    const gitlabResult = parseRepositoryUrl("https://gitlab.com/owner/repo");
    expect(gitlabResult.isValid).toBe(false);
    expect(gitlabResult.error).toContain("Only public GitHub repositories");

    const evilResult = parseRepositoryUrl("https://attacker.internal/evil/repo");
    expect(evilResult.isValid).toBe(false);
  });

  it("rejects path traversal attempts", () => {
    const traversal = parseRepositoryUrl("../..");
    expect(traversal.isValid).toBe(false);
  });

  it("rejects empty or whitespace input", () => {
    const empty = parseRepositoryUrl("   ");
    expect(empty.isValid).toBe(false);
  });
});
