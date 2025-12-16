import { useEffect, useMemo, useRef, useState } from "react";
import type { Site } from "./NorthAmericaMap";
import type { EventItem } from "./events";
import { makeEvent } from "./events";

type FeedOptions = {
  maxItems?: number;
  tickMs?: number;
};

export function useEventFeed(sites: Site[], opts: FeedOptions = {}) {
  const maxItems = opts.maxItems ?? 80;
  const tickMs = opts.tickMs ?? 1100;

  const sitesRef = useRef(sites);
  useEffect(() => { sitesRef.current = sites; }, [sites]);

  const [items, setItems] = useState<EventItem[]>(() => {
    const now = Date.now();
    // seed with a few
    return sites.slice(0, Math.min(6, sites.length)).map((s, i) => makeEvent(s, now - (6 - i) * 1500));
  });

  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      const s = sitesRef.current[Math.floor(Math.random() * sitesRef.current.length)];
      const ev = makeEvent(s, now);

      setItems((prev) => {
        const next = [ev, ...prev];
        return next.slice(0, maxItems);
      });
    }, tickMs);

    return () => clearInterval(id);
  }, [maxItems, tickMs]);

  const stats = useMemo(() => {
    const last10 = items.slice(0, 10);
    const critical = last10.filter((x) => x.severity === "critical").length;
    const warn = last10.filter((x) => x.severity === "warn").length;
    return { critical, warn, total: items.length };
  }, [items]);

  return { items, stats };
}
