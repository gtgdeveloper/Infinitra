import { useEffect, useMemo, useRef, useState } from "react";
import type { Site } from "./NorthAmericaMap";

export type Telemetry = {
  // totals & status
  isOnline: boolean;
  startedAt: number; // epoch ms
  lastUpdateAt: number;

  // metrics (random walk)
  powerKw: number;        // instantaneous power draw/production
  energyKwhToday: number; // accumulative
  speedKph: number;       // movement if any
  tempC: number;

  // sparklines
  powerSeries: number[];
  speedSeries: number[];
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function jitter(n: number, magnitude: number) {
  return n + (Math.random() * 2 - 1) * magnitude;
}

function makeBase(site: Site): Telemetry {
  const now = Date.now();
  const basePower =
    site.category === "battery" ? 42 :
    site.category === "humanoid" ? 18 :
    6;

  const baseSpeed =
    site.category === "humanoid" ? 2.2 :
    site.category === "ebike" ? 14 :
    0.2;

  return {
    isOnline: true,
    startedAt: now - (1000 * 60 * 60 * 24 * (30 + Math.random() * 900)), // 1-30 months ago-ish
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

          // occasional offline blip
          const offlineRoll = Math.random();
          let isOnline = t.isOnline;
          if (offlineRoll < 0.004) isOnline = false;
          if (offlineRoll > 0.996) isOnline = true;

          // category behavior
          const powerTarget =
            site.category === "battery" ? 35 :
            site.category === "humanoid" ? 16 :
            5;

          const speedTarget =
            site.category === "humanoid" ? 2.0 :
            site.category === "ebike" ? 15.0 :
            0.0;

          const powerKw = clamp(jitter(t.powerKw * 0.92 + powerTarget * 0.08, site.category === "battery" ? 4.0 : 1.8), 0, 120);
          const speedKph = clamp(jitter(t.speedKph * 0.85 + speedTarget * 0.15, site.category === "ebike" ? 4.0 : 1.2), 0, 45);

          const tempC = clamp(jitter(t.tempC * 0.96 + 26 * 0.04, 0.8), 10, 60);

          // energy accumulation (kWh) - approximate over interval
          const seconds = (now - t.lastUpdateAt) / 1000;
          const energyKwhToday = clamp(t.energyKwhToday + (powerKw * seconds) / 3600, 0, 5000);

          const pushSeries = (arr: number[], v: number) => {
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
            powerSeries: pushSeries(t.powerSeries, isOnline ? powerKw : 0),
            speedSeries: pushSeries(t.speedSeries, isOnline ? speedKph : 0)
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
