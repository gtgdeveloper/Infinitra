import { useEffect, useMemo, useRef, useState } from "react";
import type { Site } from "./NorthAmericaMap";
import type { EventItem } from "./events";
import { makeEvent } from "./events";

type FeedOptions = { maxItems?: number; tickMs?: number; paused?: boolean };

function rand(min:number, max:number){ return min + Math.random()*(max-min); }
function randInt(min:number, max:number){ return Math.floor(rand(min, max+1)); }

export function useEventFeed(sites: Site[], opts: FeedOptions = {}) {
  const maxItems = opts.maxItems ?? 140;
  // tickMs kept for compatibility but we now use a more realistic random cadence
  const paused = false; // always live

  const sitesRef = useRef(sites);
  useEffect(() => { sitesRef.current = sites; }, [sites]);

  const [items, setItems] = useState<EventItem[]>(() => []);
  const [heartbeat, setHeartbeat] = useState(0);

  // Burst escalation state (after a critical incident)
  const burstLeftRef = useRef(0);
  const burstUntilRef = useRef(0);

  useEffect(() => {
    let disposed = false;
    let t: number | undefined;

    const nextDelay = () => {
      const now = Date.now();

      // If we're in an incident burst window, emit faster
      if (burstLeftRef.current > 0 && now < burstUntilRef.current) {
        burstLeftRef.current -= 1;
        // 1–3 seconds during burst
        return randInt(1000, 3000);
      }

      // Otherwise normal cadence: 3–15 seconds
      return randInt(3000, 15000);
    };

    const schedule = () => {
      if (disposed) return;

      t = window.setTimeout(() => {
        if (disposed) return;

        const sList = sitesRef.current;
        if (!sList || sList.length === 0) {
          schedule();
          return;
        }

        const now = Date.now();
        const s = sList[Math.floor(Math.random() * sList.length)];
        const ev = makeEvent(s, now);

        // Heartbeat tick on every incoming event
        setHeartbeat((x) => x + 1);

        setItems((prev) => [ev, ...prev].slice(0, maxItems));

        // Priority alerts interrupt cadence: if critical, schedule the next event ASAP
        const isPriority = ev.severity === "critical" || ev.title.toLowerCase().includes("alert");

        // Burst escalation during incidents:
        // If a priority event happens, start a burst window of 10–18 seconds,
        // emitting 4–8 extra events faster.
        if (isPriority) {
          burstLeftRef.current = Math.max(burstLeftRef.current, randInt(4, 8));
          burstUntilRef.current = Math.max(burstUntilRef.current, now + randInt(10_000, 18_000));
          // interrupt cadence: schedule again quickly (0.4–0.9s) to feel immediate
          t = window.setTimeout(schedule, randInt(400, 900));
          return;
        }

        schedule();
      }, nextDelay());
    };

    schedule();
    return () => {
      disposed = true;
      if (t) window.clearTimeout(t);
    };
  }, [maxItems, paused]);

  const stats = useMemo(() => {
    const last10 = items.slice(0, 10);
    const critical = last10.filter((x) => x.severity === "critical").length;
    const warn = last10.filter((x) => x.severity === "warn").length;
    return { critical, warn, total: items.length };
  }, [items]);

  return { items, stats, heartbeat };
}
