import { useState } from "react";
import NorthAmericaMap, { Site, Category } from "./components/NorthAmericaMap";
import TelemetryPanel from "./components/TelemetryPanel";
import EventFeed from "./components/EventFeed";
import { ArrowUpRight } from "lucide-react";
import avvenireLogo from "./assets/avvenire.png";

export default function App() {
  const [selected, setSelected] = useState<Site | null>(null);
  const [filters, setFilters] = useState<Record<Category, boolean>>({
    ebike: true,
    battery: true,
    humanoid: true
  });

  return (
    <div className="container">
      <div className="header">
        <div className="brand">
          <div className="brandRow">
            <a
              className="siteLogoLink"
              href="https://avveniretech.com"
              target="_blank"
              rel="noreferrer"
              title="Open avveniretech.com"
            >
              <img className="siteLogo" src={avvenireLogo} alt="Avvenire Technologies" />
            </a>

            <div>
              <h1 className="h1">INFINITRA AI</h1>
              <p className="sub">
                North America operations map + simulated incoming telemetry and AI recommendations.
                Click any icon to see uptime, power, speed, and live signals.
              </p>
            </div>
          </div>

          <div className="ctaRow">
            <a className="cta" href="https://avveniretech.com/invest" target="_blank" rel="noreferrer">
              Investor Site <ArrowUpRight size={16} />
            </a>
            <div className="small">
              Demo mode: simulated data feed • update cadence ~1s • 30 E-bikes • 20 Humanoids • 10 Battery Systems
            </div>
          </div>
        </div>

        <div className="small">
          Tip: Drag to pan • Scroll / pinch to zoom • Click marker for site details • Click feed item to jump to site
        </div>
      </div>

      <div className="grid">
        <div className="card mapCard">
          <NorthAmericaMap
            selected={selected}
            onSelect={setSelected}
            filters={filters}
            onFiltersChange={setFilters}
          />
        </div>

        <div className="stack">
          <div className="card sideCard">
            <TelemetryPanel selected={selected} />
          </div>
          <div className="card sideCard" style={{ marginTop: 14 }}>
            <EventFeed onJumpToSite={(s) => setSelected(s)} />
          </div>
        </div>
      </div>

      <div className="footerNote">
        Notes: Traffic / pricing / routing are simulated for demo. Swap these generators with your real feeds later.
      </div>
    </div>
  );
}
