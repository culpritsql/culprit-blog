import { describe, expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dir, "..");
const contentDir = path.join(root, "src/content/blog");
const distDir = path.join(root, "dist");

const EXPECTED_SLUGS = [
  "after-azure-data-studio",
  "automated-sql-root-cause-investigations-adx-clickhouse-schema",
  "azure-data-explorer-vs-clickhouse-database-telemetry",
  "azure-sql-database-watcher-retirement",
  "database-fleet-dashboard-adx-without-grafana-enterprise",
  "database-mcp-server-autonomous-verified-index-prs",
  "microsoft-database-hub-vs-culprit-adx",
  "monitor-azure-sql-postgres-fleet-aks-adx-helm",
  "postgres-subtransaction-slru-savepoint-cliff",
  "postgres-zero-downtime-migrations-lock-queue-ci",
  "sql-blocking-deploy-regression-alerts-slack-teams-pagerduty",
  "sql-server-containers-apple-silicon-mac-rosetta-arm64",
  "why-database-monitors-cry-wolf-seven-evidence-rules",
];

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
  /\bmoreover\b/i,
  /\bfurthermore\b/i,
  /\bcrucially\b/i,
  /\btapestry\b/i,
  /\btestament to\b/i,
  /\bholistic\b/i,
  /\bcutting-edge\b/i,
  /\bit's worth noting\b/i,
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
  expect(buf.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
  };
}

describe("Culprit SQL Blog content, prose quality, and textbook SEO", () => {
  test("contains all 13 expected posts with SERP-sized SEO frontmatter, valid internal links, and zero AI buzzwords", () => {
    const mdxFiles = fs.readdirSync(contentDir).filter((f) => f.endsWith(".mdx")).sort();
    expect(mdxFiles).toEqual(EXPECTED_SLUGS.map((s) => `${s}.mdx`));

    const slugSet = new Set(EXPECTED_SLUGS);

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
        if (re.test(text)) {
          throw new Error(`Banned AI buzzword ${re} found in ${file}`);
        }
      }

      // Audit every internal /blog/... link for trailing slash and valid target slug
      for (const match of text.matchAll(/(?:\(|href=["'])(\/blog\/[^)"'#?\s]*)/g)) {
        const href = match[1]!;
        if (href === "/blog/" || href === "/blog/rss.xml") continue;
        expect(href.endsWith("/")).toBe(true);
        const targetSlug = href.replace(/^\/blog\//, "").replace(/\/$/, "");
        expect(slugSet.has(targetSlug)).toBe(true);
      }
    }
  });

  test("enforces zero em-dash characters and zero local host paths across all source files", () => {
    const files = collectRepoTextFiles(root);
    expect(files.length).toBeGreaterThan(15);
    for (const f of files) {
      if (f.endsWith("blog.test.ts")) continue;
      const content = fs.readFileSync(f, "utf8");
      if (content.includes("\u2014")) {
        throw new Error(`Em-dash character found in ${path.relative(root, f)}`);
      }
      if (content.includes("/Users/")) {
        throw new Error(`Local host path found in ${path.relative(root, f)}`);
      }
    }
  });

  test(
    "builds static output passing textbook technical SEO checks (meta lengths, canonicals, JSON-LD, FAQ/HowTo schemas, clean .md twins, 1200x630 OG cards, H1, alt text)",
    () => {
      execFileSync("bun", ["run", "build"], { cwd: root, stdio: "pipe" });

      expect(readPngDimensions(path.join(distDir, "og.png"))).toEqual({ width: 1200, height: 630 });

      const routes = [
        {
          slug: "",
          htmlFile: path.join(distDir, "index.html"),
          expectedCanonical: "https://culpritsql.com/blog/",
          expectedOgImage: "https://culpritsql.com/blog/og.png",
          isArticle: false,
        },
        ...EXPECTED_SLUGS.map((slug) => ({
          slug,
          htmlFile: path.join(distDir, `${slug}/index.html`),
          expectedCanonical: `https://culpritsql.com/blog/${slug}/`,
          expectedOgImage: `https://culpritsql.com/blog/${slug}/og.png`,
          ogPngFile: path.join(distDir, `${slug}/og.png`),
          mdFile: path.join(distDir, `${slug}.md`),
          isArticle: true,
        })),
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

        // 6. Valid Schema.org @graph JSON-LD with BreadcrumbList (+ BlogPosting, FAQPage, HowTo)
        const ldMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
        expect(ldMatch).not.toBeNull();
        const ld = JSON.parse(ldMatch![1]!);
        expect(ld["@context"]).toBe("https://schema.org");
        expect(Array.isArray(ld["@graph"])).toBe(true);
        const types = ld["@graph"].map((item: { "@type": string }) => item["@type"]);
        expect(types).toContain("BreadcrumbList");

        if (r.isArticle && "ogPngFile" in r && r.ogPngFile && r.mdFile) {
          expect(readPngDimensions(r.ogPngFile)).toEqual({ width: 1200, height: 630 });
          expect(types).toContain("BlogPosting");
          expect(html).toContain('<meta property="article:published_time"');
          expect(html).toContain('<meta property="article:modified_time"');
          expect(html).toContain('<link rel="alternate" type="text/markdown"');

          // Verify clean Markdown export for llms.txt (zero unrendered MDX components and absolute /blog/ links)
          const md = fs.readFileSync(r.mdFile, "utf8");
          expect(md).not.toMatch(/<(?:KeyTakeaways|Callout|StatStrip|Timeline|WorkflowCards|ArchiveFleetShot|(?:Mssql|Postgres)\w+Embed)\b/);
          expect(md).not.toContain("](/blog/");
        }

        if (
          r.slug === "microsoft-database-hub-vs-culprit-adx" ||
          r.slug === "automated-sql-root-cause-investigations-adx-clickhouse-schema" ||
          r.slug === "sql-server-containers-apple-silicon-mac-rosetta-arm64" ||
          r.slug === "postgres-subtransaction-slru-savepoint-cliff" ||
          r.slug === "postgres-zero-downtime-migrations-lock-queue-ci"
        ) {
          expect(types).toContain("FAQPage");
        }
        if (r.slug === "monitor-azure-sql-postgres-fleet-aks-adx-helm") {
          expect(types).toContain("HowTo");
        }
        if (
          r.slug === "after-azure-data-studio" ||
          r.slug === "microsoft-database-hub-vs-culprit-adx" ||
          r.slug === "database-fleet-dashboard-adx-without-grafana-enterprise" ||
          r.slug === "database-mcp-server-autonomous-verified-index-prs" ||
          r.slug === "postgres-subtransaction-slru-savepoint-cliff" ||
          r.slug === "postgres-zero-downtime-migrations-lock-queue-ci" ||
          r.slug === "why-database-monitors-cry-wolf-seven-evidence-rules"
        ) {
          expect(html).toContain("https://explain.culpritsql.com/compare#s=z1.");
        }
        if (
          r.slug === "after-azure-data-studio" ||
          r.slug === "sql-blocking-deploy-regression-alerts-slack-teams-pagerduty"
        ) {
          expect(html).toContain("https://explain.culpritsql.com/deadlock#s=z1.");
        }
      }
      // Ensure no two posts share an identical live plan/deadlock #s=z1. payload
      const seenExplainUrls = new Map<string, string>();
      for (const slug of EXPECTED_SLUGS) {
        const html = fs.readFileSync(path.join(distDir, `${slug}/index.html`), "utf8");
        for (const m of html.matchAll(/https:\/\/explain\.culpritsql\.com\/(?:compare|deadlock)#s=z1\.[A-Za-z0-9_-]+/g)) {
          const url = m[0];
          const prev = seenExplainUrls.get(url);
          if (prev && prev !== slug) {
            throw new Error(`Duplicate interactive Explain payload shared between ${prev} and ${slug}`);
          }
          seenExplainUrls.set(url, slug);
        }
      }

      const rssXml = fs.readFileSync(path.join(distDir, "rss.xml"), "utf8");
      expect(rssXml).toContain("<link>https://culpritsql.com/blog/</link>");
      for (const slug of EXPECTED_SLUGS) {
        expect(rssXml).toContain(`<link>https://culpritsql.com/blog/${slug}/</link>`);
      }
    },
    60_000,
  );
});
