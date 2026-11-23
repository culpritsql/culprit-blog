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

function cleanMdxBodyForMarkdown(body) {
  return body
    .replace(/^import\s+[^\n]+\n+/gm, "")
    .replace(/<MssqlPlanDiffEmbed\s*\/>/g, "> [Interactive SQL Server .sqlplan Before/After comparison available on the web version](https://explain.culpritsql.com/compare)")
    .replace(/<MssqlDeadlockEmbed\s*\/>/g, "> [Interactive SQL Server .xdl deadlock cycle graph available on the web version](https://explain.culpritsql.com/deadlock)")
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
