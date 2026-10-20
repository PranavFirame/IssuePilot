export interface ParsedRepo {
  owner: string;
  repo: string;
  fullName: string;
}

export interface ParseResult {
  isValid: boolean;
  error?: string;
  data?: ParsedRepo;
}

const GITHUB_NAME_REGEX = /^[a-zA-Z0-9_.-]+$/;

/**
 * Parses and validates a GitHub repository identifier or URL.
 * Strictly verifies the domain is github.com and sanitizes inputs to prevent SSRF.
 */
export function parseRepositoryUrl(input: string): ParseResult {
  if (!input || typeof input !== "string") {
    return { isValid: false, error: "Please enter a repository identifier or GitHub URL." };
  }

  let cleaned = input.trim();

  // Remove trailing slashes and .git extension
  cleaned = cleaned.replace(/\/+$/, "");
  if (cleaned.endsWith(".git")) {
    cleaned = cleaned.slice(0, -4);
  }

  let owner = "";
  let repo = "";

  if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) {
    try {
      const url = new URL(cleaned);
      const host = url.hostname.toLowerCase();

      // Only allow github.com (or www.github.com)
      if (host !== "github.com" && host !== "www.github.com") {
        return {
          isValid: false,
          error: "Only public GitHub repositories (github.com) are supported.",
        };
      }

      const segments = url.pathname.split("/").filter(Boolean);
      if (segments.length < 2) {
        return {
          isValid: false,
          error: "URL must include both owner and repository name (e.g., github.com/owner/repo).",
        };
      }

      owner = segments[0];
      repo = segments[1];
    } catch {
      return { isValid: false, error: "The provided URL is malformed." };
    }
  } else {
    // Shorthand format: owner/repo
    const parts = cleaned.split("/");
    if (parts.length !== 2) {
      return {
        isValid: false,
        error: "Enter a valid repository in the format 'owner/repo' or 'https://github.com/owner/repo'.",
      };
    }
    owner = parts[0];
    repo = parts[1];
  }

  // Validate owner and repo names against GitHub's naming conventions
  if (!GITHUB_NAME_REGEX.test(owner) || owner.length > 39) {
    return {
      isValid: false,
      error: `Invalid repository owner name "${owner}". Owner names must be alphanumeric and may contain hyphens.`,
    };
  }

  if (!GITHUB_NAME_REGEX.test(repo) || repo.length > 100) {
    return {
      isValid: false,
      error: `Invalid repository name "${repo}". Repository names must be alphanumeric with hyphens, underscores, or dots.`,
    };
  }

  // Prevent directory traversal or reserved names
  if (owner === "." || owner === ".." || repo === "." || repo === "..") {
    return {
      isValid: false,
      error: "Path traversal segments are not permitted.",
    };
  }

  return {
    isValid: true,
    data: {
      owner,
      repo,
      fullName: `${owner}/${repo}`,
    },
  };
}
