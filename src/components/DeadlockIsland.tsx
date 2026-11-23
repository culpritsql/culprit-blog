import { DeadlockViewer, type Deadlock } from "@culpritsql/plan-viewer";
import "@culpritsql/plan-viewer/styles.css";
import { useEffect, useState } from "react";

export interface DeadlockIslandProps {
  deadlock: Deadlock;
  caption: string;
}

export function DeadlockIsland({ deadlock, caption }: DeadlockIslandProps) {
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
          <span className="blog-embed-pill">Interactive .xdl deadlock graph</span>
          <span className="blog-embed-hint">Hover a session or table lock node to trace the cycle</span>
        </div>
        <a
          className="blog-embed-link"
          href="https://explain.culpritsql.com/deadlock"
          target="_blank"
          rel="noopener"
        >
          Open in Culprit Explain ↗
        </a>
      </div>
      <div className="blog-embed-body">
        <DeadlockViewer deadlock={deadlock} theme={theme} />
      </div>
      <figcaption className="blog-embed-caption">{caption}</figcaption>
    </figure>
  );
}
