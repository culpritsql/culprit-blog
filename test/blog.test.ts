import { describe, expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dir, "..");
const contentDir = path.join(root, "src/content/blog");
const distDir = path.join(root, "dist");

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

function readPngDimensions(pngPath: string): { width: number; height: number } {
  const buf = fs.readFileSync(pngPath);
  // PNG signature (8 bytes) + IHDR length (4 bytes) + "IHDR" (4 bytes) + width (4B BE) + height (4B BE)
  expect(buf.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
  };
}

describe("Culprit SQL Blog content, prose quality, and textbook SEO", () => {
  test("contains expected posts with SERP-sized SEO frontmatter and zero AI buzzwords", () => {
    const mdxFiles = fs.readdirSync(contentDir).filter((f) => f.endsWith(".mdx")).sort();
    expect(mdxFiles).toEqual([
      "after-azure-data-studio.mdx",
      "azure-sql-database-watcher-retirement.mdx",
    ]);

    for (const file of mdxFiles) {
      const text = fs.readFileSync(path.join(contentDir, file), "utf8");
      expect(text.startsWith("---\n")).toBe(true);
      expect(text).toContain("title:");
      expect(text).toContain("seoTitle:");
      expect(text).toContain("description:");
      expect(text).toContain("seoDescription:");
      expect(text).toContain("keywords:");
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

  test(
    "builds static output passing textbook technical SEO checks (meta lengths, canonicals, JSON-LD, 1200x630 OG cards, H1, alt text)",
    () => {
      execFileSync("bun", ["run", "build"], { cwd: root, stdio: "pipe" });

    // Check index OG card
    expect(readPngDimensions(path.join(distDir, "og.png"))).toEqual({ width: 1200, height: 630 });

    const routes = [
      {
        htmlFile: path.join(distDir, "index.html"),
        expectedCanonical: "https://culpritsql.com/blog/",
        expectedOgImage: "https://culpritsql.com/blog/og.png",
        isArticle: false,
      },
      {
        htmlFile: path.join(distDir, "after-azure-data-studio/index.html"),
        expectedCanonical: "https://culpritsql.com/blog/after-azure-data-studio/",
        expectedOgImage: "https://culpritsql.com/blog/after-azure-data-studio/og.png",
        ogPngFile: path.join(distDir, "after-azure-data-studio/og.png"),
        isArticle: true,
      },
      {
        htmlFile: path.join(distDir, "azure-sql-database-watcher-retirement/index.html"),
        expectedCanonical: "https://culpritsql.com/blog/azure-sql-database-watcher-retirement/",
        expectedOgImage: "https://culpritsql.com/blog/azure-sql-database-watcher-retirement/og.png",
        ogPngFile: path.join(distDir, "azure-sql-database-watcher-retirement/og.png"),
        isArticle: true,
      },
    ];

    for (const r of routes) {
      const html = fs.readFileSync(r.htmlFile, "utf8");

      // 1. SERP-safe <title> length (30..62 chars)
      const titleMatch = html.match(/<title>([^<]+)<\/title>/);
      expect(titleMatch).not.toBeNull();
      const titleText = titleMatch![1]!;
      expect(titleText.length).toBeGreaterThanOrEqual(30);
      expect(titleText.length).toBeLessThanOrEqual(62);

      // 2. SERP-safe <meta name="description"> length (110..160 chars)
      const descMatch = html.match(/<meta name="description" content="([^"]+)"/);
      expect(descMatch).not.toBeNull();
      const descText = descMatch![1]!;
      expect(descText.length).toBeGreaterThanOrEqual(110);
      expect(descText.length).toBeLessThanOrEqual(160);

      // 3. Robots max-image-preview:large + exact canonical with trailing slash
      expect(html).toContain('content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"');
      expect(html).toContain(`<link rel="canonical" href="${r.expectedCanonical}"`);

      // 4. OpenGraph & Twitter card image dimensions + alt text
      expect(html).toContain(`<meta property="og:image" content="${r.expectedOgImage}"`);
      expect(html).toContain('<meta property="og:image:width" content="1200"');
      expect(html).toContain('<meta property="og:image:height" content="630"');
      expect(html).toContain('<meta property="og:image:alt" content="');
      expect(html).toContain(`<meta name="twitter:image" content="${r.expectedOgImage}"`);
      expect(html).toContain('<meta name="twitter:image:alt" content="');

      // 5. Exactly one <h1> and explicit alt attribute on all <img> tags
      const h1Count = (html.match(/<h1[\s>]/g) || []).length;
      expect(h1Count).toBe(1);
      for (const imgMatch of html.matchAll(/<img\b[^>]*>/g)) {
        expect(imgMatch[0]).toMatch(/\balt="/);
      }

      // 6. Valid Schema.org @graph JSON-LD with BreadcrumbList (+ BlogPosting on articles)
      const ldMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
      expect(ldMatch).not.toBeNull();
      const ld = JSON.parse(ldMatch![1]!);
      expect(ld["@context"]).toBe("https://schema.org");
      expect(Array.isArray(ld["@graph"])).toBe(true);
      const types = ld["@graph"].map((item: { "@type": string }) => item["@type"]);
      expect(types).toContain("BreadcrumbList");

      if (r.isArticle && r.ogPngFile) {
        expect(readPngDimensions(r.ogPngFile)).toEqual({ width: 1200, height: 630 });
        expect(types).toContain("BlogPosting");
        expect(html).toContain('<meta property="article:published_time"');
        expect(html).toContain('<meta property="article:modified_time"');
        expect(html).toContain('<link rel="alternate" type="text/markdown"');
      }
      if (r.htmlFile.includes("after-azure-data-studio")) {
        expect(html).toContain("https://explain.culpritsql.com/compare#s=z1.");
        expect(html).toContain("https://explain.culpritsql.com/deadlock#s=z1.");
      }
    }
  },
  30_000,
);
});
