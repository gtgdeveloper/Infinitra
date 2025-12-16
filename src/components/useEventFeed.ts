import { useEffect, useMemo, useRef, useState } from "react";
import type { Site } from "./NorthAmericaMap";
import type { EventItem } from "./events";
import { makeEvent } from "./events";

type FeedOptions = { maxItems?: number; tickMs?: number; };

export function useEventFeed(sites: Site[], opts: FeedOptions = {}) {
  const maxItems = opts.maxItems ?? 120;
  const tickMs = opts.tickMs ?? 900;

  const sitesRef = useRef(sites);
  useEffect(() => { sitesRef.current = sites; }, [sites]);

  const [items, setItems] = useState<EventItem[]>(() => {
    const now = Date.now();
    return sites.slice(0, 8).map((s, i) => makeEvent(s, now - (8 - i) * 900));
  });

  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      const s = sitesRef.current[Math.floor(Math.random() * sitesRef.current.length)];
      const ev = makeEvent(s, now);
      setItems((prev) => [ev, ...prev].slice(0, maxItems));
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
