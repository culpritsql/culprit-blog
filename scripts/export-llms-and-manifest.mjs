import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contentDir = path.join(root, "src/content/blog");
const distDir = path.join(root, "dist");
const fontsDir = path.join(root, "scripts/fonts");

const fontFiles = [
  path.join(fontsDir, "Geist-Regular.ttf"),
  path.join(fontsDir, "Geist-SemiBold.ttf"),
  path.join(fontsDir, "Geist-Bold.ttf"),
  path.join(fontsDir, "GeistMono-SemiBold.ttf"),
];

function escapeXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapWords(text, maxCharsPerLine) {
  const words = text.split(/\s+/);
  const lines = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > maxCharsPerLine && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = next;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function wrapTitleLines(title, maxCharsPerLine = 28) {
  let lines = wrapWords(title, maxCharsPerLine);
  if (lines.length > 3) {
    lines = wrapWords(title, 34);
  }
  if (lines.length > 3) {
    throw new Error(`OG card title exceeds 3 lines even at 34 chars/line: "${title}"`);
  }
  return lines;
}

function wrapDescLines(desc, maxCharsPerLine = 84) {
  const words = desc.split(/\s+/);
  const lines = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > maxCharsPerLine && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = next;
    }
  }
  if (cur) lines.push(cur);
  if (lines.length > 2) {
    lines[1] = `${lines[1].replace(/[.,;:!?]+$/, "")}...`;
    return lines.slice(0, 2);
  }
  return lines;
}

function buildOgSvg({ kicker, title, description, tags, footerLeft, footerRight }) {
  const titleLines = wrapTitleLines(title, 28);
  const descLines = wrapDescLines(description, 68);
  const titleFontSize = titleLines.length >= 3 ? 52 : 58;
  const titleLineHeight = titleLines.length >= 3 ? 62 : 68;
  const titleStartY = 212;
  const descStartY = titleStartY + titleLines.length * titleLineHeight + 18;

  let pillX = 76;
  const pillsSvg = (tags || []).slice(0, 4).map((tag) => {
    const textW = Math.round(tag.length * 9.4) + 28;
    const svg = `
      <g transform="translate(${pillX}, 118)">
        <rect width="${textW}" height="32" rx="16" fill="#1c1b17" stroke="#333029" stroke-width="1.5"/>
        <text x="${Math.round(textW / 2)}" y="21" text-anchor="middle" font-family="Geist" font-size="14" font-weight="600" fill="#c5c2b9">${escapeXml(tag)}</text>
      </g>`;
    pillX += textW + 10;
    return svg;
  }).join("");

  const titleSvg = titleLines
    .map(
      (ln, idx) =>
        `<text x="76" y="${titleStartY + idx * titleLineHeight}" font-family="Geist" font-size="${titleFontSize}" font-weight="700" letter-spacing="-1.4" fill="#f5f3ed">${escapeXml(ln)}</text>`,
    )
    .join("");

  const descSvg = descLines
    .map(
      (ln, idx) =>
        `<text x="76" y="${descStartY + idx * 32}" font-family="Geist" font-size="22" font-weight="400" fill="#a8a49a">${escapeXml(ln)}</text>`,
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="glow" cx="82%" cy="14%" r="65%">
      <stop offset="0%" stop-color="#ffcf33" stop-opacity="0.22"/>
      <stop offset="65%" stop-color="#ffcf33" stop-opacity="0.03"/>
      <stop offset="100%" stop-color="#0f0e0c" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1" fill="#25231e"/>
    </pattern>
  </defs>

  <rect width="1200" height="630" fill="#0f0e0c"/>
  <rect width="1200" height="630" fill="url(#grid)" opacity="0.75"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <rect x="24" y="24" width="1152" height="582" rx="22" fill="none" stroke="#282621" stroke-width="2"/>

  <!-- Top Brand Row -->
  <g transform="translate(76, 58)">
    <svg width="38" height="38" viewBox="0 0 460 460">
      <rect width="460" height="460" rx="102" fill="#ffcf33"/>
      <path d="M 283.33 301.78 A 106.25 106.25 0 1 1 283.33 158.22" fill="none" stroke="#1b1a18" stroke-width="67.5" stroke-linecap="butt"/>
      <polygon points="340.5,179 391.5,230 340.5,281 289.5,230" fill="#e0484e"/>
    </svg>
    <text x="52" y="26" font-family="Geist" font-size="22" font-weight="700" fill="#f2f0ea">Culprit <tspan fill="#8f8b81" font-weight="600">SQL Blog</tspan></text>
  </g>

  <text x="1124" y="83" text-anchor="end" font-family="Geist Mono" font-size="15" font-weight="600" fill="#ffcf33">${escapeXml(kicker)}</text>

  ${pillsSvg}
  ${titleSvg}
  ${descSvg}

  <!-- Bottom Divider & Byline -->
  <line x1="76" y1="530" x2="1124" y2="530" stroke="#282621" stroke-width="1.5"/>
  <circle cx="92" cy="566" r="16" fill="#262216" stroke="#ffcf33" stroke-width="1.5"/>
  <text x="92" y="571" text-anchor="middle" font-family="Geist" font-size="12" font-weight="700" fill="#ffcf33">CS</text>
  <text x="120" y="572" font-family="Geist" font-size="18" font-weight="600" fill="#e6e3db">${escapeXml(footerLeft)}</text>
  <text x="1124" y="572" text-anchor="end" font-family="Geist Mono" font-size="16" font-weight="600" fill="#8f8b81">${escapeXml(footerRight)}</text>
</svg>`;
}

function renderSvgToPng(svg) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: 1200 },
    font: {
      fontFiles,
      loadSystemFonts: false,
      defaultFontFamily: "Geist",
    },
  });
  return resvg.render().asPng();
}

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error("Missing frontmatter in blog post");
  const meta = {};
  for (const line of match[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!kv) continue;
    const key = kv[1];
    let val = kv[2].trim();
    if (
      (val.startsWith("[") && val.endsWith("]")) ||
      (val.startsWith("{") && val.endsWith("}"))
    ) {
      meta[key] = JSON.parse(val);
      continue;
    }
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    meta[key] = val;
  }
  return { meta, body: match[2] };
}

function stripHtmlTags(str) {
  return str
    .replace(/<\/?strong>/g, "**")
    .replace(/<\/?code>/g, "`")
    .replace(/<a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g, "[$2]($1)")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function cleanMdxBodyForMarkdown(body) {
  return body
    .replace(/^import\s+[^\n]+\n+/gm, "")
    .replace(/<KeyTakeaways[\s\S]*?items=\{\[([\s\S]*?)\]\}\s*\/>/g, (_m, arr) => {
      const bullets = Array.from(arr.matchAll(/"((?:\\.|[^"\\])*)"/g)).map(
        (m) => `- ${stripHtmlTags(m[1].replace(/\\"/g, '"'))}`,
      );
      return `## TL;DR\n\n${bullets.join("\n")}`;
    })
    .replace(/<Callout\s+title="([^"]+)"[^>]*>([\s\S]*?)<\/Callout>/g, (_m, title, inner) => {
      const txt = stripHtmlTags(inner).replace(/\s+/g, " ").trim();
      return `> **${title}:** ${txt}`;
    })
    .replace(/<StatStrip[\s\S]*?stats=\{\[([\s\S]*?)\]\}\s*\/>/g, (_m, arr) => {
      const items = Array.from(
        arr.matchAll(/value:\s*"([^"]+)",\s*label:\s*"([^"]+)"/g),
      ).map((m) => `- **${m[1]}**: ${m[2]}`);
      return items.join("\n");
    })
    .replace(/<Timeline[\s\S]*?steps=\{\[([\s\S]*?)\]\}\s*\/>/g, (_m, arr) => {
      const steps = Array.from(
        arr.matchAll(/date:\s*"([^"]+)",\s*title:\s*"([^"]+)",\s*detail:\s*"([^"]+)"/g),
      ).map((m) => `- **${m[1]} (${m[2]}):** ${m[3]}`);
      return steps.join("\n");
    })
    .replace(/<WorkflowCards[\s\S]*?cards=\{\[([\s\S]*?)\]\}\s*\/>/g, (_m, arr) => {
      const cards = Array.from(
        arr.matchAll(/when:\s*"([^"]+)",\s*tool:\s*"([^"]+)",\s*href:\s*"([^"]+)"/g),
      ).map((m) => `- **${m[1]}:** [${m[2]}](${m[3]})`);
      return cards.join("\n");
    })
    .replace(
      /<ArchiveFleetShot\s+variant="elastic-pool"\s*\/>/g,
      "> [Screenshot: culprit-archive-web Estate Triage grouped by Elastic Pool and Managed Instance](https://culpritsql.com/blog/images/archive-fleet-elastic-pool-light.webp)",
    )
    .replace(
      /<ArchiveFleetShot\s+variant="multiengine"\s*\/>/g,
      "> [Screenshot: culprit-archive-web multi-engine Estate Triage across Azure SQL, PostgreSQL, MySQL, and SQL MI](https://culpritsql.com/blog/images/archive-fleet-multiengine-light.webp)",
    )
    .replace(
      /<MssqlPlanDiffEmbed\s*\/>/g,
      "> [Interactive SQL Server .sqlplan Before/After comparison available on the web version](https://explain.culpritsql.com/compare)",
    )
    .replace(
      /<MssqlRegressionDiffEmbed\s*\/>/g,
      "> [Interactive SQL Server .sqlplan regression comparison available on the web version](https://explain.culpritsql.com/compare)",
    )
    .replace(
      /<MssqlElasticPoolDiffEmbed\s*\/>/g,
      "> [Interactive SQL Server Elastic Pool DOP=4 noisy-neighbor .sqlplan comparison available on the web version](https://explain.culpritsql.com/compare)",
    )
    .replace(
      /<PostgresMcpPlanDiffEmbed\s*\/>/g,
      "> [Interactive PostgreSQL EXPLAIN JSON Before/After comparison available on the web version](https://explain.culpritsql.com/compare)",
    )
    .replace(
      /<PostgresSubtransDiffEmbed\s*\/>/g,
      "> [Interactive PostgreSQL SubtransSLRU & Index Only Scan Heap Fetches comparison available on the web version](https://explain.culpritsql.com/compare)",
    )
    .replace(
      /<PostgresFkCascadeDiffEmbed\s*\/>/g,
      "> [Interactive PostgreSQL Foreign Key Cascade Seq Scan vs Index Scan comparison available on the web version](https://explain.culpritsql.com/compare)",
    )
    .replace(
      /<MssqlImplicitConversionEmbed\s*\/>/g,
      "> [Interactive SQL Server CONVERT_IMPLICIT .sqlplan comparison available on the web version](https://explain.culpritsql.com/compare)",
    )
    .replace(
      /<MssqlDeadlockEmbed\s*\/>/g,
      "> [Interactive SQL Server .xdl deadlock cycle graph available on the web version](https://explain.culpritsql.com/deadlock)",
    )
    .replace(
      /<MssqlWebhookDeadlockEmbed\s*\/>/g,
      "> [Interactive SQL Server billing webhook .xdl deadlock graph available on the web version](https://explain.culpritsql.com/deadlock)",
    )
    .replace(/\]\(\/blog\//g, "](https://culpritsql.com/blog/")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// 1. Render Blog Index OG image (dist/og.png)
const indexOgPng = renderSvgToPng(
  buildOgSvg({
    kicker: "ENGINEERING NOTES",
    title: "Database performance, execution plans, and telemetry.",
    description:
      "Practical field notes on SQL Server .sqlplan diffs, deadlocks, Azure SQL Database Watcher, ADX KQL alerts, and PostgreSQL query tuning.",
    tags: ["SQL Server", "PostgreSQL", "Azure SQL", "ADX & KQL"],
    footerLeft: "Culprit Team · Open-Source MIT Ecosystem",
    footerRight: "culpritsql.com/blog",
  }),
);
fs.writeFileSync(path.join(distDir, "og.png"), indexOgPng);

// 2. Render Per-Post OG images, Markdown files, and posts.json manifest
const files = fs.readdirSync(contentDir).filter((f) => f.endsWith(".mdx")).sort();
const manifest = [];

for (const file of files) {
  const slug = file.replace(/\.mdx$/, "");
  const raw = fs.readFileSync(path.join(contentDir, file), "utf8");
  const { meta, body } = parseFrontmatter(raw);
  const cleanBody = cleanMdxBodyForMarkdown(body);
  const faqBlock =
    Array.isArray(meta.faq) && meta.faq.length > 0
      ? `\n\n## Frequently asked questions\n\n${meta.faq
          .map((item) => `### ${item.question}\n\n${item.answer}`)
          .join("\n\n")}`
      : "";
  const updatedNote = meta.updatedDate ? ` · Updated: ${meta.updatedDate}` : "";
  const mdOut = `# ${meta.title}\n\nPublished: ${meta.pubDate}${updatedNote} · Author: ${meta.author || "Culprit Team"} · Canonical: https://culpritsql.com/blog/${slug}/\n\n${meta.description}\n\n---\n\n${cleanBody}${faqBlock}\n`;

  fs.writeFileSync(path.join(distDir, `${slug}.md`), mdOut, "utf8");

  const postOgDir = path.join(distDir, slug);
  fs.mkdirSync(postOgDir, { recursive: true });
  const postOgPng = renderSvgToPng(
    buildOgSvg({
      kicker: `${meta.pubDate} · ${meta.readingMinutes} MIN READ`,
      title: meta.title,
      description: meta.seoDescription || meta.description,
      tags: Array.isArray(meta.tags) ? meta.tags : [],
      footerLeft: meta.author || "Culprit Team",
      footerRight: `culpritsql.com/blog/${slug}`,
    }),
  );
  fs.writeFileSync(path.join(postOgDir, "og.png"), postOgPng);

  manifest.push({
    slug,
    title: meta.title,
    seoTitle: meta.seoTitle,
    description: meta.seoDescription || meta.description,
    pubDate: meta.pubDate,
    ...(meta.updatedDate ? { updatedDate: meta.updatedDate } : {}),
    url: `https://culpritsql.com/blog/${slug}/`,
    markdownUrl: `https://culpritsql.com/blog/${slug}.md`,
    ogImageUrl: `https://culpritsql.com/blog/${slug}/og.png`,
  });
}

manifest.sort((a, b) => b.pubDate.localeCompare(a.pubDate));
fs.writeFileSync(path.join(distDir, "posts.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");
console.log(`Exported ${manifest.length} plain Markdown posts, ${manifest.length + 1} 1200x630 OG PNG cards, and dist/posts.json`);
