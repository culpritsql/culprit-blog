import { PlanDiffViewer, type Plan, type PlanDiff } from "@culpritsql/plan-viewer";
import "@culpritsql/plan-viewer/styles.css";
import { useEffect, useState } from "react";

export interface PlanDiffIslandProps {
  a: Plan;
  b: Plan;
  diff: PlanDiff;
  nameA: string;
  nameB: string;
  caption: string;
}

export function PlanDiffIsland({ a, b, diff, nameA, nameB, caption }: PlanDiffIslandProps) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setTheme(mq.matches ? "dark" : "light");
    const onChange = (e: MediaQueryListEvent) => setTheme(e.matches ? "dark" : "light");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <figure className="blog-embed-card">
      <div className="blog-embed-head">
        <div className="blog-embed-meta">
          <span className="blog-embed-pill">Interactive .sqlplan diff</span>
          <span className="blog-embed-hint">Click any operator or toggle Time / Cost / Rows / Reads</span>
        </div>
        <a
          className="blog-embed-link"
          href="https://explain.culpritsql.com/compare"
          target="_blank"
          rel="noopener"
        >
          Open in Culprit Explain ↗
        </a>
      </div>
      <div className="blog-embed-body">
        <PlanDiffViewer a={a} b={b} diff={diff} nameA={nameA} nameB={nameB} theme={theme} />
      </div>
      <figcaption className="blog-embed-caption">{caption}</figcaption>
    </figure>
  );
}
