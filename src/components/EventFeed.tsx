import React, { useMemo } from "react";
import type { Site } from "./NorthAmericaMap";
import { SITES } from "./NorthAmericaMap";
import { useEventFeed } from "./useEventFeed";
import { Bell, AlertTriangle, ShieldAlert, Radio } from "lucide-react";

function pad2(n: number) { return n.toString().padStart(2, "0"); }
function fmtTime(ms: number) {
  const d = new Date(ms);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

function sevBadge(sev: "info" | "warn" | "critical") {
  if (sev === "critical") return { label: "CRIT", cls: "sevCrit", Icon: ShieldAlert };
  if (sev === "warn") return { label: "WARN", cls: "sevWarn", Icon: AlertTriangle };
  return { label: "INFO", cls: "sevInfo", Icon: Radio };
}

export default function EventFeed(props: {
  onJumpToSite?: (site: Site) => void;
}) {
  const { onJumpToSite } = props;
  const { items, stats } = useEventFeed(SITES, { maxItems: 90, tickMs: 1050 });

  const header = useMemo(() => {
    return {
      critical: stats.critical,
      warn: stats.warn
    };
  }, [stats]);

  return (
    <div className="feedCard">
      <div className="feedHeader">
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Bell size={18} />
          <div style={{ fontWeight: 800 }}>Incoming Data (Simulated)</div>
        </div>
        <div className="feedBadges">
          <span className={`sevChip sevWarn`} title="Warnings in last 10">
            <AlertTriangle size={14} /> {header.warn}
          </span>
          <span className={`sevChip sevCrit`} title="Critical in last 10">
            <ShieldAlert size={14} /> {header.critical}
          </span>
        </div>
      </div>

      <div className="feedList" role="log" aria-live="polite">
        {items.map((ev) => {
          const s = SITES.find((x) => x.id === ev.siteId);
          const meta = sevBadge(ev.severity);
          return (
            <button
              key={ev.id}
              className="feedItem"
              onClick={() => s && onJumpToSite?.(s)}
              title="Click to select this site"
            >
              <div className="feedTop">
                <span className="feedTime">{fmtTime(ev.ts)}</span>
                <span className={`sevChip ${meta.cls}`}>
                  <meta.Icon size={14} />
                  {meta.label}
                </span>
              </div>
              <div className="feedTitle">{ev.title}</div>
              <div className="feedMsg">{ev.message}</div>
              <div className="feedSite">{ev.siteName}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
