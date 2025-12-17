import React, { useMemo } from "react";
export default function Sparkline(props: { series: number[]; stroke: string }) {
  const { series, stroke } = props;
  const path = useMemo(() => {
    if (!series.length) return "";
    const w = 300, h = 54, pad = 6;
    const min = Math.min(...series), max = Math.max(...series);
    const span = Math.max(1e-6, max - min);
    const pts = series.map((v, i) => {
      const x = pad + (i * (w - pad * 2)) / Math.max(1, series.length - 1);
      const y = h - pad - ((v - min) / span) * (h - pad * 2);
      return [x, y];
    });
    return pts.map((p, i) => (i === 0 ? `M ${p[0].toFixed(2)} ${p[1].toFixed(2)}` : `L ${p[0].toFixed(2)} ${p[1].toFixed(2)}`)).join(" ");
  }, [series]);
  return (
    <svg viewBox="0 0 300 54" preserveAspectRatio="none" className="sparkLine">
      <path d={path} fill="none" stroke={stroke} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" opacity="0.95" />
    </svg>
  );
}
