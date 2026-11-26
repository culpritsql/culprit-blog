import { PlanDiffViewer, type Plan, type PlanDiff } from "@culpritsql/plan-viewer";
import "@culpritsql/plan-viewer/styles.css";
import { useEffect, useState } from "react";

export interface PlanDiffIslandProps {
  a: Plan;
  b: Plan;
  diff: PlanDiff;
  nameA: string;
  nameB: string;
  explainUrl: string;
  caption: string;
  pillLabel?: string;
}

function readCurrentTheme(): "dark" | "light" {
  if (typeof document === "undefined") return "dark";
  const explicit = document.documentElement.dataset.theme;
  if (explicit === "dark" || explicit === "light") return explicit;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function PlanDiffIsland({
  a,
  b,
  diff,
  nameA,
  nameB,
  explainUrl,
  caption,
  pillLabel = "Live .sqlplan diff",
}: PlanDiffIslandProps) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    setTheme(readCurrentTheme());
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => setTheme(readCurrentTheme());
    mq.addEventListener("change", sync);
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      mq.removeEventListener("change", sync);
      obs.disconnect();
    };
  }, []);

  return (
    <figure className="blog-embed-card">
      <div className="blog-embed-head">
        <div className="blog-embed-meta">
          <span className="blog-embed-pill">{pillLabel}</span>
          <span className="blog-embed-hint">Click any operator or switch Diagram / Tree</span>
        </div>
        <a
          className="blog-embed-link"
          href={explainUrl}
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
