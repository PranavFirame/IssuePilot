import { NormalizedIssue } from "../github/types";

export interface DuplicateCandidate {
  primaryIssue: {
    number: number;
    title: string;
    state: "open" | "closed";
    htmlUrl: string;
    createdAt: string;
  };
  similarIssue: {
    number: number;
    title: string;
    state: "open" | "closed";
    htmlUrl: string;
    createdAt: string;
  };
  similarityScore: number; // 0 to 100 percentage
  sharedTerms: string[];
  explanation: string;
}

const STOP_WORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't",
  "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by",
  "can", "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing",
  "don't", "down", "during", "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't",
  "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself",
  "him", "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is",
  "isn't", "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself",
  "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours",
  "ourselves", "out", "over", "own", "same", "shan't", "she", "she'd", "she'll", "she's", "should",
  "shouldn't", "so", "some", "such", "than", "that", "that's", "the", "their", "theirs", "them",
  "themselves", "then", "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've",
  "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "wasn't", "we",
  "we'd", "we'll", "we're", "we've", "were", "weren't", "what", "what's", "when", "when's", "where",
  "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would",
  "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves",
  "bug", "issue", "error", "problem", "fails", "fail", "broken", "help", "please", "thanks", "test",
]);

export function tokenize(text: string): string[] {
  if (!text) return [];
  // Strip code blocks, urls, and special chars
  const clean = text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .toLowerCase()
    .replace(/[^a-z0-9_ -]/g, " ");

  return clean
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

/**
 * Calculates cosine similarity using weighted TF-IDF vectorization.
 * Issue titles are given 3x weight compared to issue bodies.
 */
export function findPotentialDuplicates(
  issues: NormalizedIssue[],
  minThreshold: number = 0.38,
  maxResults: number = 20
): DuplicateCandidate[] {
  if (issues.length < 2) return [];

  // Filter out PRs if any
  const issueList = issues.filter((i) => !i.isPullRequest);
  if (issueList.length < 2) return [];

  const docCount = issueList.length;
  const tokenizedDocs: {
    issue: NormalizedIssue;
    titleTokens: string[];
    bodyTokens: string[];
    termFreq: Map<string, number>;
  }[] = [];

  const docFreq = new Map<string, number>();

  for (const issue of issueList) {
    const titleTokens = tokenize(issue.title);
    const bodyTokens = tokenize(issue.body || "");

    const termFreq = new Map<string, number>();

    // Title weight: 3x
    for (const t of titleTokens) {
      termFreq.set(t, (termFreq.get(t) || 0) + 3);
    }
    // Body weight: 1x
    for (const t of bodyTokens) {
      termFreq.set(t, (termFreq.get(t) || 0) + 1);
    }

    // Unique tokens for document frequency
    const uniqueTokens = new Set([...titleTokens, ...bodyTokens]);
    for (const token of uniqueTokens) {
      docFreq.set(token, (docFreq.get(token) || 0) + 1);
    }

    tokenizedDocs.push({
      issue,
      titleTokens,
      bodyTokens,
      termFreq,
    });
  }

  // Pre-calculate TF-IDF vectors and norms
  const vectors: {
    issue: NormalizedIssue;
    tfidf: Map<string, number>;
    norm: number;
  }[] = [];

  for (const doc of tokenizedDocs) {
    const tfidf = new Map<string, number>();
    let sumSquares = 0;

    for (const [term, freq] of doc.termFreq.entries()) {
      const df = docFreq.get(term) || 1;
      const idf = Math.log(1 + docCount / df);
      const weight = freq * idf;
      tfidf.set(term, weight);
      sumSquares += weight * weight;
    }

    vectors.push({
      issue: doc.issue,
      tfidf,
      norm: Math.sqrt(sumSquares) || 1,
    });
  }

  const candidates: DuplicateCandidate[] = [];

  // Pairwise comparison
  for (let i = 0; i < vectors.length; i++) {
    for (let j = i + 1; j < vectors.length; j++) {
      const v1 = vectors[i];
      const v2 = vectors[j];

      // Calculate dot product and shared terms
      let dotProduct = 0;
      const shared: { term: string; score: number }[] = [];

      for (const [term, w1] of v1.tfidf.entries()) {
        const w2 = v2.tfidf.get(term);
        if (w2) {
          const product = w1 * w2;
          dotProduct += product;
          shared.push({ term, score: product });
        }
      }

      const cosineSim = dotProduct / (v1.norm * v2.norm);

      if (cosineSim >= minThreshold) {
        shared.sort((a, b) => b.score - a.score);
        const topSharedTerms = shared.slice(0, 5).map((s) => s.term);

        const scorePercent = Math.round(cosineSim * 100);

        let explanation = `Shares key technical terms: ${topSharedTerms.join(", ")}.`;
        if (scorePercent >= 70) {
          explanation = `Strong similarity in subject matter and symptom descriptions around [${topSharedTerms.slice(0, 3).join(", ")}].`;
        } else if (scorePercent >= 50) {
          explanation = `Moderate overlap in reported functionality regarding [${topSharedTerms.slice(0, 3).join(", ")}].`;
        }

        candidates.push({
          primaryIssue: {
            number: v1.issue.number,
            title: v1.issue.title,
            state: v1.issue.state,
            htmlUrl: v1.issue.htmlUrl,
            createdAt: v1.issue.createdAt,
          },
          similarIssue: {
            number: v2.issue.number,
            title: v2.issue.title,
            state: v2.issue.state,
            htmlUrl: v2.issue.htmlUrl,
            createdAt: v2.issue.createdAt,
          },
          similarityScore: scorePercent,
          sharedTerms: topSharedTerms,
          explanation,
        });
      }
    }
  }

  // Sort by highest similarity score
  candidates.sort((a, b) => b.similarityScore - a.similarityScore);
  return candidates.slice(0, maxResults);
}
