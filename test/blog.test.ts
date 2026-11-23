import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dir, "..");
const contentDir = path.join(root, "src/content/blog");

const BANNED_AI_BUZZWORDS = [
  /\bdelve\b/i,
  /\blandscape\b/i,
  /\bgame-changer\b/i,
  /\bseamless(?:ly)?\b/i,
  /\bempower(?:s|ing|ed)?\b/i,
  /\bunlock(?:s|ing)?\b/i,
  /\bsupercharg(?:e|es|ing)\b/i,
  /\bparadigm\b/i,
  /\bbleeding-edge\b/i,
  /\brevolutioniz(?:e|es|ing)\b/i,
  /\blet's dive in\b/i,
  /\bin today's fast-paced\b/i,
  /\belevate your\b/i,
];

function collectRepoTextFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".astro" || entry.name === ".git") {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...collectRepoTextFiles(full));
    } else if (/\.(mdx|md|astro|ts|tsx|css|mjs|json)$/.test(entry.name) && entry.name !== "bun.lock") {
      out.push(full);
    }
  }
  return out;
}

describe("Culprit SQL Blog content & prose quality", () => {
  test("contains expected posts with valid frontmatter and zero AI buzzwords", () => {
    const mdxFiles = fs.readdirSync(contentDir).filter((f) => f.endsWith(".mdx")).sort();
    expect(mdxFiles).toEqual([
      "after-azure-data-studio.mdx",
      "azure-sql-database-watcher-retirement.mdx",
    ]);

    for (const file of mdxFiles) {
      const text = fs.readFileSync(path.join(contentDir, file), "utf8");
      expect(text.startsWith("---\n")).toBe(true);
      expect(text).toContain("title:");
      expect(text).toContain("description:");
      expect(text).toContain("pubDate:");
      expect(text).toContain("readingMinutes:");
      for (const re of BANNED_AI_BUZZWORDS) {
        expect(re.test(text)).toBe(false);
      }
    }
  });

  test("enforces zero em-dash characters and zero local host paths across all source files", () => {
    const files = collectRepoTextFiles(root);
    expect(files.length).toBeGreaterThan(10);
    for (const f of files) {
      if (f.endsWith("blog.test.ts")) continue;
      const content = fs.readFileSync(f, "utf8");
      expect(content.includes("\u2014")).toBe(false);
      expect(content.includes("/Users/")).toBe(false);
    }
  });
});
