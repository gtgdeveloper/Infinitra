import { useEffect, useMemo, useRef, useState } from "react";
import type { Site } from "./NorthAmericaMap";

export type Telemetry = {
  isOnline: boolean;
  startedAt: number;
  lastUpdateAt: number;

  powerKw: number;
  energyKwhToday: number;
  speedKph: number;
  tempC: number;

  powerSeries: number[];
  speedSeries: number[];
};

function clamp(n:number,min:number,max:number){ return Math.max(min, Math.min(max, n)); }
function jitter(n:number, mag:number){ return n + (Math.random()*2 - 1) * mag; }

function makeBase(site: Site): Telemetry {
  const now = Date.now();
  const basePower =
    site.category === "battery" ? 38 :
    site.category === "humanoid" ? 16 :
    6;

  const baseSpeed =
    site.category === "humanoid" ? 2.0 :
    site.category === "lev" ? 18 :
    0.0;

  return {
    isOnline: true,
    startedAt: now - (1000 * 60 * 60 * 24 * (30 + Math.random() * 900)),
    lastUpdateAt: now,
    powerKw: basePower,
    energyKwhToday: basePower * 0.25,
    speedKph: baseSpeed,
    tempC: 24 + Math.random() * 6,
    powerSeries: Array.from({ length: 36 }, () => basePower),
    speedSeries: Array.from({ length: 36 }, () => baseSpeed)
  };
}

export function useTelemetry(sites: Site[]) {
  const [state, setState] = useState<Record<string, Telemetry>>(() => {
    const init: Record<string, Telemetry> = {};
    for (const s of sites) init[s.id] = makeBase(s);
    return init;
  });

  const sitesRef = useRef(sites);
  useEffect(() => { sitesRef.current = sites; }, [sites]);

  useEffect(() => {
    const id = setInterval(() => {
      setState((prev) => {
        const next: Record<string, Telemetry> = { ...prev };
        const now = Date.now();

        for (const site of sitesRef.current) {
          const t = next[site.id] ?? makeBase(site);

          const offlineRoll = Math.random();
          let isOnline = t.isOnline;
          if (offlineRoll < 0.002) isOnline = false;
          if (offlineRoll > 0.998) isOnline = true;

          const powerTarget =
            site.category === "battery" ? 34 :
            site.category === "humanoid" ? 15 :
            5;

          const speedTarget =
            site.category === "humanoid" ? 2.0 :
            site.category === "lev" ? 20.0 :
            0.0;

          const powerKw = clamp(jitter(t.powerKw * 0.92 + powerTarget * 0.08, site.category === "battery" ? 4.2 : 1.8), 0, 120);
          const speedKph = clamp(jitter(t.speedKph * 0.85 + speedTarget * 0.15, site.category === "lev" ? 5.0 : 1.2), 0, 60);
          const tempC = clamp(jitter(t.tempC * 0.96 + 26 * 0.04, 0.8), 10, 60);

          const seconds = (now - t.lastUpdateAt) / 1000;
          const energyKwhToday = clamp(t.energyKwhToday + (powerKw * seconds) / 3600, 0, 9000);

          const push = (arr: number[], v: number) => {
            const out = arr.length >= 60 ? arr.slice(arr.length - 59) : arr.slice();
            out.push(v);
            return out;
          };

          next[site.id] = {
            ...t,
            isOnline,
            lastUpdateAt: now,
            powerKw: isOnline ? powerKw : 0,
            speedKph: isOnline ? speedKph : 0,
            tempC,
            energyKwhToday,
            powerSeries: push(t.powerSeries, isOnline ? powerKw : 0),
            speedSeries: push(t.speedSeries, isOnline ? speedKph : 0)
          };
        }

        return next;
      });
    }, 900);

    return () => clearInterval(id);
  }, []);

  const totals = useMemo(() => {
    const all = Object.values(state);
    const online = all.filter((t) => t.isOnline).length;
    const powerKw = all.reduce((a, t) => a + t.powerKw, 0);
    const energyKwhToday = all.reduce((a, t) => a + t.energyKwhToday, 0);
    return { online, total: all.length, powerKw, energyKwhToday };
  }, [state]);

  return { telemetry: state, totals };
}
