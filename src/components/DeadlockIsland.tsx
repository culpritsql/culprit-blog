import { DeadlockViewer, type Deadlock } from "@culpritsql/plan-viewer";
import "@culpritsql/plan-viewer/styles.css";
import { useEffect, useState } from "react";

export interface DeadlockIslandProps {
  deadlock: Deadlock;
  caption: string;
}

function readCurrentTheme(): "dark" | "light" {
  if (typeof document === "undefined") return "dark";
  const explicit = document.documentElement.dataset.theme;
  if (explicit === "dark" || explicit === "light") return explicit;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function DeadlockIsland({ deadlock, caption }: DeadlockIslandProps) {
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
          <span className="blog-embed-pill">Live .xdl deadlock graph</span>
          <span className="blog-embed-hint">Hover a session or lock node to trace the cycle</span>
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
