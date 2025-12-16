import { useState } from "react";
import NorthAmericaMap, { Site, Category } from "./components/NorthAmericaMap";
import TelemetryPanel from "./components/TelemetryPanel";
import EventFeed from "./components/EventFeed";
import avvenireLogo from "./assets/avvenire.png";

export default function App() {
  const [selected, setSelected] = useState<Site | null>(null);
  const [filters, setFilters] = useState<Record<Category, boolean>>({
    lev: true,
    battery: true,
    humanoid: true
  });

  return (
    <div className="container">
      <div className="header">
        <div>
          <div className="brandRow">
            <a className="siteLogoLink" href="https://avveniretech.com" target="_blank" rel="noreferrer" title="Open avveniretech.com">
              <img className="siteLogo" src={avvenireLogo} alt="Avvenire Technologies" />
            </a>
            <div>
              <h1 className="h1">INFINITRA AI</h1>
              <p className="sub">
                North America network map with live simulated telemetry + an AI “incoming data” stream.
                <b> LEV</b> includes Terra E‑Bike, Tectus Scope Mobility, and Leggera 3‑Wheel.
              </p>
              <div className="ctaRow">
                <a className="cta" href="https://avveniretech.com/invest" target="_blank" rel="noreferrer">Investor Site</a>
                <div className="small">Demo mode • 100 LEVs • 100 Humanoids • 100 Battery Systems</div>
              </div>
            </div>
          </div>
        </div>

        <div className="small">
          Tip: Click a marker to view details • Click feed items to jump to that node
        </div>
      </div>

      <div className="grid">
        <div className="card mapCard">
          <NorthAmericaMap selected={selected} onSelect={setSelected} filters={filters} onFiltersChange={setFilters} />
        </div>

        <div className="stack">
          <div className="card sideCard">
            <TelemetryPanel selected={selected} />
          </div>
          <div className="card sideCard">
            <EventFeed onJumpToSite={(s) => setSelected(s)} />
          </div>
        </div>
      </div>

      <div className="footerNote">
        Traffic / pricing / routing messages are simulated for demo. Swap these generators with real feeds later.
      </div>
    </div>
  );
}
