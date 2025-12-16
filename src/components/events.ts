import type { Site } from "./NorthAmericaMap";

export type Severity = "info" | "warn" | "critical";

export type EventItem = {
  id: string;
  ts: number; // epoch ms
  siteId: string;
  siteName: string;
  category: Site["category"];
  severity: Severity;
  title: string;
  message: string;
};

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function fmtLocalTime(ms: number) {
  const d = new Date(ms);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

function randFloat(min: number, max: number, digits = 2) {
  const v = min + Math.random() * (max - min);
  return Number(v.toFixed(digits));
}

const ROUTES = [
  { from: "Yonge St", to: "Bay St", delta: "-6 min", reason: "congestion" },
  { from: "Gardiner", to: "Lakeshore Blvd", delta: "-4 min", reason: "incident" },
  { from: "I-280", to: "US-101", delta: "-5 min", reason: "traffic wave" },
  { from: "I-35", to: "MoPac", delta: "-7 min", reason: "construction" },
  { from: "Queensway", to: "DVP", delta: "-3 min", reason: "slowdowns" }
];

export function makeEvent(s: Site, now: number): EventItem {
  const localTime = fmtLocalTime(now);

  // Category-specific templates
  const ebikeTitles = [
    "E-bike ride telemetry received",
    "Fleet charging recommendation",
    "Traffic-aware route optimization"
  ];
  const batteryTitles = [
    "Battery cost window detected",
    "Grid price dip — charge now",
    "Peak shaving suggestion"
  ];
  const humanoidTitles = [
    "Humanoid movement update",
    "Safety zone compliance",
    "Task completion telemetry"
  ];

  const severity: Severity = (() => {
    const r = Math.random();
    if (r < 0.78) return "info";
    if (r < 0.94) return "warn";
    return "critical";
  })();

  let title = "Telemetry update";
  let message = "New data ingested.";

  if (s.category === "battery") {
    title = pick(batteryTitles);
    const cost = randFloat(0.06, 0.18, 2);
    const tz = pick(["PST", "EST", "CST"]);
    const windowMins = Math.floor(15 + Math.random() * 60);
    const action = cost <= 0.10 ? "Charge now" : "Hold charge";
    message =
      `Battery cost ${cost.toFixed(2)} at ${localTime} ${tz}. ` +
      `${action} for ~${windowMins}m. ` +
      `AI note: ${cost <= 0.10 ? "optimal window detected" : "not optimal (above target)"} — ` +
      `adjust schedule to minimize cost.`;
  } else if (s.category === "ebike") {
    const which = Math.random();
    if (which < 0.5) {
      title = pick(ebikeTitles);
      const speed = randFloat(6, 28, 1);
      const rider = pick(["E-Bike 1", "E-Bike 2", "Courier Unit 7", "Demo Unit A"]);
      message =
        `${rider}: speed ${speed.toFixed(1)} km/h at ${localTime}. ` +
        `AI tip: smooth acceleration recommended to extend range.`;
    } else {
      title = "Traffic update (real-time simulated)";
      const r = pick(ROUTES);
      const level = pick(["light", "moderate", "heavy"]);
      message =
        `Traffic on ${r.from}: ${level} at ${localTime}. ` +
        `Offer alternative route via ${r.to} (${r.delta}) due to ${r.reason}. ` +
        `Broadcasting to nearby units.`;
    }
  } else {
    title = pick(humanoidTitles);
    const speed = randFloat(0.0, 6.5, 1);
    const task = pick(["warehouse pick", "inspection", "patrol", "assist demo", "load handling"]);
    const compliance = pick(["OK", "OK", "OK", "ATTN"]);
    message =
      `Movement ${speed.toFixed(1)} km/h • task=${task} • compliance=${compliance} at ${localTime}. ` +
      `AI note: ${compliance === "OK" ? "within parameters" : "review sensor calibration (simulated)"} .`;
  }

  return {
    id: `${now}-${s.id}-${Math.floor(Math.random() * 1e9)}`,
    ts: now,
    siteId: s.id,
    siteName: s.name,
    category: s.category,
    severity,
    title,
    message
  };
}
