import { describe, expect, it } from "vitest";
import { buildSearchQuery } from "../../lib/github/search";

describe("buildSearchQuery", () => {
  it("builds default beginner query when no filters are passed", () => {
    const q = buildSearchQuery({});
    expect(q).toContain("is:issue");
    expect(q).toContain("is:open");
    expect(q).toContain('label:"good first issue"');
    expect(q).toContain("stars:>10");
  });

  it("applies specific difficulty label when requested", () => {
    const q = buildSearchQuery({ difficulty: "help wanted" });
    expect(q).toContain('label:"help wanted"');
    expect(q).not.toContain('label:"good first issue" OR');
  });

  it("applies language constraint", () => {
    const q = buildSearchQuery({ language: "TypeScript" });
    expect(q).toContain('language:"TypeScript"');
  });

  it("sanitizes text query to prevent syntax injection", () => {
    const q = buildSearchQuery({ query: 'memory leak "unsafe" \\tag' });
    expect(q).toContain("memory leak unsafe tag");
    expect(q).not.toContain('\\tag');
  });
});
