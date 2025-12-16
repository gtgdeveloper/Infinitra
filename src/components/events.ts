import type { Site } from "./NorthAmericaMap";

export type Severity = "info" | "warn" | "critical";
export type EventItem = {
  id: string;
  ts: number;
  siteId: string;
  siteName: string;
  category: Site["category"];
  severity: Severity;
  title: string;
  message: string;
};

const ROUTES = [
  { from: "Yonge St", to: "Bay St", delta: "-6 min", reason: "congestion" },
  { from: "Gardiner", to: "Lakeshore Blvd", delta: "-4 min", reason: "incident" },
  { from: "I-280", to: "US-101", delta: "-5 min", reason: "traffic wave" },
  { from: "I-35", to: "MoPac", delta: "-7 min", reason: "construction" },
  { from: "Queensway", to: "DVP", delta: "-3 min", reason: "slowdowns" },
  { from: "Bloor St", to: "Danforth Ave", delta: "-2 min", reason: "slowdowns" }
];

const tzByRegion: Record<string,string> = {
  "BC":"PST","WA":"PST","OR":"PST","CA":"PST",
  "AB":"MST","AZ":"MST","CO":"MST",
  "MB":"CST","TX":"CST","IL":"CST","MO":"CST","MN":"CST","TN":"CST",
  "ON":"EST","QC":"EST","NY":"EST","MA":"EST","PA":"EST","DC":"EST","GA":"EST","FL":"EST"
};

function pick<T>(arr:T[]){ return arr[Math.floor(Math.random()*arr.length)]; }
function pad2(n:number){ return n.toString().padStart(2,"0"); }
function fmtLocalTime(ms:number){
  const d = new Date(ms);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}
function randFloat(min:number,max:number,d=2){
  const v=min+Math.random()*(max-min);
  return Number(v.toFixed(d));
}

const firmwareStart = Date.now();
const firmwareEtaMs = firmwareStart + (1000 * 60 * 60 * 24 * 3) + (1000 * 60 * 60 * 2); // 3 days 2 hours from start
export function firmwareCountdown(now:number){
  const remain = Math.max(0, firmwareEtaMs - now);
  const d = Math.floor(remain / 86400000);
  const h = Math.floor((remain % 86400000) / 3600000);
  const m = Math.floor((remain % 3600000) / 60000);
  return { d, h, m, remain };
}

function aiSuffix(now:number){
  const { d, h, m } = firmwareCountdown(now);
  const learned = (Math.random()*6 + 2).toFixed(1);
  const ver = (2 + Math.random()*0.8).toFixed(2);
  return `Infinitra AI analyzing data… learned → efficiency +${learned}%. Next firmware v${ver} deploying in ${d}d ${h}h ${m}m.`;
}

export function makeEvent(s: Site, now: number): EventItem {
  const tz = tzByRegion[s.region] || (s.country==="Canada" ? "EST" : "EST");
  const localTime = fmtLocalTime(now);

  const severity: Severity = (() => {
    const r = Math.random();
    if (r < 0.80) return "info";
    if (r < 0.95) return "warn";
    return "critical";
  })();

  let title = "Telemetry update";
  let message = "New data ingested.";

  if (s.category === "battery") {
    title = pick(["Battery cost window detected","Grid price dip — charge now","Peak shaving suggestion","Demand response signal"]);
    const cost = randFloat(0.06, 0.18, 2);
    const windowMins = Math.floor(15 + Math.random() * 75);
    const action = cost <= 0.10 ? "Charge now" : "Hold charge";
    message =
      `Battery cost ${cost.toFixed(2)} at ${localTime} ${tz}. ` +
      `${action} for ~${windowMins}m. ` +
      `${aiSuffix(now)}`;
  } else if (s.category === "lev") {
    const which = Math.random();
    if (which < 0.55) {
      title = pick(["LEV telemetry received","Range optimization","Charging recommendation","Acceleration smoothing"]);
      const speed = randFloat(6, 32, 1);
      const soc = randFloat(22, 98, 0);
      message =
        `LEV node speed ${speed.toFixed(1)} km/h • SoC ${soc.toFixed(0)}% at ${localTime} ${tz}. ` +
        `Recommendation: ${soc < 35 ? "route to nearest charger" : "maintain eco mode"} • ` +
        `${aiSuffix(now)}`;
    } else {
      title = "Traffic update (simulated real-time)";
      const r = pick(ROUTES);
      const level = pick(["light","moderate","heavy"]);
      message =
        `Traffic on ${r.from}: ${level} at ${localTime} ${tz}. ` +
        `Offer alternative via ${r.to} (${r.delta}) due to ${r.reason}. ` +
        `${aiSuffix(now)}`;
    }
  } else {
    title = pick(["Humanoid movement update","Safety zone compliance","Task completion telemetry","Actuator health check"]);
    const speed = randFloat(0.0, 7.0, 1);
    const task = pick(["warehouse pick","inspection","patrol","assist demo","load handling","inventory scan"]);
    const compliance = pick(["OK","OK","OK","ATTN"]);
    message =
      `Movement ${speed.toFixed(1)} km/h • task=${task} • compliance=${compliance} at ${localTime} ${tz}. ` +
      `${aiSuffix(now)}`;
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
