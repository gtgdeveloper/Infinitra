import React, { useMemo } from "react";
import type { Site } from "./NorthAmericaMap";
import { SITES } from "./NorthAmericaMap";
import { useTelemetry } from "./telemetry";
import Sparkline from "./Sparkline";
import { Bike, BatteryCharging, Bot, Activity } from "lucide-react";

function catIcon(cat: Site["category"]) {
  if (cat === "ebike") return <Bike size={16} />;
  if (cat === "battery") return <BatteryCharging size={16} />;
  return <Bot size={16} />;
}

function catName(cat: Site["category"]) {
  if (cat === "ebike") return "E-Bike";
  if (cat === "battery") return "Battery Systems";
  return "Humanoids / Robotics";
}

function fmt(n: number, digits = 1) {
  return n.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: 0 });
}

function fmtDuration(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function TelemetryPanel(props: { selected: Site | null }) {
  const { selected } = props;
  const { telemetry, totals } = useTelemetry(SITES);

  const sel = selected ?? null;
  const t = sel ? telemetry[sel.id] : null;

  const statusBadge = useMemo(() => {
    if (!t) return "No site selected";
    return t.isOnline ? "LIVE • online" : "OFFLINE • last known";
  }, [t]);

  return (
    <div>
      <div className="panelTitle">
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Activity size={18} />
          <div style={{ fontWeight: 750 }}>Live Telemetry</div>
        </div>
        <div className="badge">{statusBadge}</div>
      </div>

      <div className="kpiGrid">
        <div className="kpi">
          <p className="kpiLabel">Total power (kW)</p>
          <p className="kpiValue">{fmt(totals.powerKw, 1)}</p>
        </div>
        <div className="kpi">
          <p className="kpiLabel">Energy today (kWh)</p>
          <p className="kpiValue">{fmt(totals.energyKwhToday, 0)}</p>
        </div>
        <div className="kpi">
          <p className="kpiLabel">Nodes online</p>
          <p className="kpiValue">{totals.online} / {totals.total}</p>
        </div>
        <div className="kpi">
          <p className="kpiLabel">Update cadence</p>
          <p className="kpiValue">~0.9s</p>
        </div>
      </div>

      <div className="detailCard">
        {!sel ? (
          <div className="small">
            Click a map icon to view site-level metrics (uptime, power, speed, temperature).
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <div style={{ display: "grid", gap: 2 }}>
                <div style={{ fontWeight: 800, fontSize: 14 }}>{sel.name}</div>
                <div className="small">{sel.city}, {sel.region} • {sel.country}</div>
              </div>
              <div className="badge" style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                {catIcon(sel.category)} {catName(sel.category)}
              </div>
            </div>

            <div className="rows">
              <div className="row"><span>In use for</span><b>{t ? fmtDuration(Date.now() - t.startedAt) : "—"}</b></div>
              <div className="row"><span>Power</span><b>{t ? fmt(t.powerKw, 1) : "—"} kW</b></div>
              <div className="row"><span>Total energy (today)</span><b>{t ? fmt(t.energyKwhToday, 0) : "—"} kWh</b></div>
              <div className="row"><span>Speed / movement</span><b>{t ? fmt(t.speedKph, 1) : "—"} km/h</b></div>
              <div className="row"><span>Temperature</span><b>{t ? fmt(t.tempC, 1) : "—"} °C</b></div>
            </div>

            <div className="spark">
              <Sparkline series={t?.powerSeries ?? []} stroke="rgba(124,92,255,0.95)" />
            </div>
            <div className="small" style={{ marginTop: 8 }}>
              Power (kW) • rolling window
            </div>

            <div className="spark">
              <Sparkline series={t?.speedSeries ?? []} stroke="rgba(0,220,255,0.95)" />
            </div>
            <div className="small" style={{ marginTop: 8 }}>
              Speed (km/h) • rolling window
            </div>
          </>
        )}
      </div>

      <div style={{ marginTop: 10 }} className="small">
        Want this to look like your other INFINITRA demo (ticker feed, events, alerts)? Tell me what panels it had and I’ll mirror it.
      </div>
    </div>
  );
}
