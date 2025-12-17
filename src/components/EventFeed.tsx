import React from "react";
import type { Site } from "./NorthAmericaMap";
import { SITES } from "./NorthAmericaMap";
import { useEventFeed } from "./useEventFeed";

function pad2(n:number){ return n.toString().padStart(2,"0"); }
function fmtTime(ms:number){
  const d=new Date(ms);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}
function sevMeta(sev:"info"|"warn"|"critical"){
  if(sev==="critical") return { label:"CRIT", cls:"sevCrit" as const };
  if(sev==="warn") return { label:"WARN", cls:"sevWarn" as const };
  return { label:"INFO", cls:"sevInfo" as const };
}

export default function EventFeed(props:{ onJumpToSite?: (site: Site) => void; paused?: boolean; }){
  const { onJumpToSite, paused = false } = props;
  const { items, stats, heartbeat } = useEventFeed(SITES, { maxItems: 140, tickMs: 900, paused });

  return (
    <div>
      <div className="feedHeader">
        <div style={{fontWeight:800, display:"flex", alignItems:"center", gap:8}}>  <span>Incoming Data (LIVE)</span>  <span className="heartbeatDot" aria-label="Live" data-tick={heartbeat} /></div>
        <div className="feedBadges">
          <span className={`sevChip sevWarn`} title="Warnings in last 10">WARN {stats.warn}</span>
          <span className={`sevChip sevCrit`} title="Critical in last 10">CRIT {stats.critical}</span>
        </div>
      </div>

      <div className="feedList" role="log" aria-live="polite">
        {items.map((ev) => {
          const site = SITES.find((x) => x.id === ev.siteId);
          const meta = sevMeta(ev.severity);
          return (
            <button key={ev.id} className={`feedItem ${ev.title.toLowerCase().includes("alert") && (Date.now()-ev.ts)<8000 ? "flashAlert" : ""}`} onClick={() => site && onJumpToSite?.(site)} title="Click to select this node">
              <div className="feedTop">
                <span className="feedTime">{fmtTime(ev.ts)}</span>
                <span className={`sevChip ${meta.cls}`}>{meta.label}</span>
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
