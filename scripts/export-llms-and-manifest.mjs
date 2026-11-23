import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contentDir = path.join(root, "src/content/blog");
const distDir = path.join(root, "dist");

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error("Missing frontmatter in blog post");
  const meta = {};
  for (const line of match[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!kv) continue;
    const key = kv[1];
    let val = kv[2].trim();
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
    .replace(/<[^>]+>/g, "");
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
      /<MssqlPlanDiffEmbed\s*\/>/g,
      "> [Interactive SQL Server .sqlplan Before/After comparison available on the web version](https://explain.culpritsql.com/compare)",
    )
    .replace(
      /<MssqlDeadlockEmbed\s*\/>/g,
      "> [Interactive SQL Server .xdl deadlock cycle graph available on the web version](https://explain.culpritsql.com/deadlock)",
    )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const files = fs.readdirSync(contentDir).filter((f) => f.endsWith(".mdx")).sort();
const manifest = [];

for (const file of files) {
  const slug = file.replace(/\.mdx$/, "");
  const raw = fs.readFileSync(path.join(contentDir, file), "utf8");
  const { meta, body } = parseFrontmatter(raw);
  const cleanBody = cleanMdxBodyForMarkdown(body);
  const mdOut = `# ${meta.title}\n\nPublished: ${meta.pubDate} · Author: ${meta.author || "Cristian Pufu"} · Canonical: https://culpritsql.com/blog/${slug}/\n\n${meta.description}\n\n---\n\n${cleanBody}\n`;

  fs.writeFileSync(path.join(distDir, `${slug}.md`), mdOut, "utf8");
  manifest.push({
    slug,
    title: meta.title,
    description: meta.description,
    pubDate: meta.pubDate,
    url: `https://culpritsql.com/blog/${slug}/`,
    markdownUrl: `https://culpritsql.com/blog/${slug}.md`,
  });
}

manifest.sort((a, b) => b.pubDate.localeCompare(a.pubDate));
fs.writeFileSync(path.join(distDir, "posts.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");
console.log(`Exported ${manifest.length} plain Markdown posts and dist/posts.json`);
