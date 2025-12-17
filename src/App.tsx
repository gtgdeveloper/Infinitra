import { useEffect, useMemo, useRef, useState } from "react";
import NorthAmericaMap, { Site, Category } from "./components/NorthAmericaMap";
import TelemetryPanel from "./components/TelemetryPanel";
import EventFeed from "./components/EventFeed";
import { SITES } from "./components/NorthAmericaMap";
import { useTelemetry } from "./components/telemetry";
import avvenireLogo from "./assets/avvenire.png";

type FirmwareTarget = "lev" | "battery" | "humanoid" | null;
type FirmwarePhase = "idle" | "uploading" | "completed";

const VERSION = "V.1.01";

function money(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtMmSs(ms: number) {
  const s = Math.ceil(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export default function App() {
  const [selected, setSelected] = useState<Site | null>(null);
  const [filters, setFilters] = useState<Record<Category, boolean>>({
    lev: true,
    battery: true,
    humanoid: true
  });

  // Global telemetry totals (for KPIs)
  const { totals } = useTelemetry(SITES);

  const [videoModal, setVideoModal] = useState<{ src: string; title: string; tag?: string } | null>(null);
  const [dataRoomOpen, setDataRoomOpen] = useState(false);
  const [dataRoomAuthed, setDataRoomAuthed] = useState(false);
  const [dataRoomPw, setDataRoomPw] = useState("");
  const [dataRoomErr, setDataRoomErr] = useState<string | null>(null);

  function pickLiveViewSrc(s: any): string {
    const p = String(s?.product || "").toLowerCase();
    const n = String(s?.name || "").toLowerCase();
    const hay = `${p} ${n}`;
    if (hay.includes("leggera")) {
      return Math.random() < 0.5 ? "/leggera1.mov" : "/leggera2.mov";
    }
    if (hay.includes("tectus") || hay.includes("mobility") || hay.includes("scooter")) {
      return "/tectus1.mp4";
    }
    return "/video1.mp4";
  }

  function mimeForVideo(src: string): string {
    const lower = (src || "").toLowerCase();
    if (lower.endsWith(".mov")) return "video/quicktime";
    if (lower.endsWith(".mp4")) return "video/mp4";
    return "video/mp4";
  }


  // Earnings tallies
  const [earnClientA, setEarnClientA] = useState(48.5);
  const [earnAds, setEarnAds] = useState(245.0);
  const [earnOffers, setEarnOffers] = useState(442.2);
  const [earnData, setEarnData] = useState(188.75);

  const totalEarned = useMemo(() => earnClientA + earnAds + earnOffers + earnData, [earnClientA, earnAds, earnOffers, earnData]);

  // --- Firmware cycle sequencing (LEV -> Battery -> Humanoid) ---
    const cycleMs = 300000; // 5 minutes
    const uploadMs = 20000; // 20 seconds uploading per class
    const completeMs = 5000; // 5 seconds "completed" between phases

  const [firmwarePhase, setFirmwarePhase] = useState<FirmwarePhase>("idle");
  const [firmwareTarget, setFirmwareTarget] = useState<FirmwareTarget>(null);
  const [cycleCountdownMs, setCycleCountdownMs] = useState<number>(cycleMs);

  useEffect(() => {
    const tick = setInterval(() => {
      setCycleCountdownMs((ms) => {
        if (firmwarePhase !== "idle") return ms;
        return Math.max(0, ms - 1000);
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [firmwarePhase]);

  useEffect(() => {
    const runCycle = () => {
      setCycleCountdownMs(cycleMs);

      const sequence: FirmwareTarget[] = ["lev", "battery", "humanoid"];
      let t = 0;

      sequence.forEach((target) => {
        setTimeout(() => {
          setFirmwareTarget(target);
          setFirmwarePhase("uploading");

        }, t);
        t += uploadMs;

        setTimeout(() => {
          setFirmwarePhase("completed");
        }, t);
        t += completeMs;
      });

      setTimeout(() => {
        setFirmwarePhase("idle");
        setFirmwareTarget(null);
      }, t);
    };

    runCycle();
    const id = setInterval(runCycle, cycleMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isUploading = firmwarePhase === "uploading";

  // Earnings drift upward (simulated) — 10x larger
  useEffect(() => {
    const id = setInterval(() => {
      if (isUploading) return;
      setEarnClientA((v) => v + 40 + Math.random() * 60);
      setEarnAds((v) => v + 15 + Math.random() * 25);
      setEarnOffers((v) => v + 25 + Math.random() * 45);
    }, 1800);
    return () => clearInterval(id);
  }, [isUploading]);

  const firmwareBanner = useMemo(() => {
    const nextIn = fmtMmSs(cycleCountdownMs);
    if (firmwarePhase === "uploading") {
      if (firmwareTarget === "lev") return "FIRMWARE UPLOAD FOR LEV IN PROGRESS";
      if (firmwareTarget === "battery") return "FIRMWARE UPLOAD FOR BATTERY SYSTEMS IN PROGRESS";
      if (firmwareTarget === "humanoid") return "FIRMWARE UPLOAD FOR HUMANOIDS IN PROGRESS";
      return "FIRMWARE UPLOAD IN PROGRESS";
    }
    if (firmwarePhase === "completed") return "FIRMWARE COMPLETED";
    return `Next firmware window in ${nextIn}`;
  }, [firmwarePhase, firmwareTarget, cycleCountdownMs]);

  return (
    <div className="container">
<div className="header">
        <div>
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
              <h1 className="h1">
                INFINITRA AI <span className="versionBadge" style={{ marginLeft: 10 }}>{VERSION}</span>
              </h1>
            </div>
          </div>
        </div>

        <div className="small">
          Tip: Click a marker to view details • Click feed items to jump to that node
        </div>
      </div>

      {/* KPI Bar */}
      <div className="card kpiBar">
        <div className="kpiBarGrid">
          <div className="kpiBarItem">
            <div className="kpiBarLabel">Units online</div>
            <div className="kpiBarValue">
              {totals.online} / {totals.total}
            </div>
          </div>

          <div className="kpiBarItem">
            <div className="kpiBarLabel">Revenue earned</div>
            <div className="kpiBarValue">${money(totalEarned)}</div>
            <div className="kpiBarSub">Ads / Offers / Data: ${money(earnAds + earnOffers + earnData)}</div>
          </div>

          <div className="kpiBarItem">
            <div className="kpiBarLabel">Total power connected</div>
            <div className="kpiBarValue">{totals.powerKw.toLocaleString(undefined, { maximumFractionDigits: 1 })} kW</div>
            <div className="kpiBarSub">
              Energy today: {totals.energyKwhToday.toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh
            </div>
          </div>

          <div className={`kpiBarItem firmware ${firmwarePhase}`}>
            <div className="kpiBarLabel">Firmware</div>
            <div className="kpiBarValue">{firmwareBanner}</div>
            <div className="kpiBarSub">Sequence: LEV → Battery → Humanoid</div>
          </div>

          <div className="kpiBarItem">
            <div className="kpiBarLabel">Actions</div>
            <div className="kpiActions">
              <a className="cta" href="https://avveniretech.com/invest" target="_blank" rel="noreferrer">
                Investor Site
              </a>

              <button className="pill" onClick={() => setDataRoomOpen(true)} title="Open the investor data room">
                Data Room
              </button>
            </div>
            <div className="kpiBarSub">Demo controls</div>
          </div>
        </div>
      </div>

      <div className="grid">
        <div className="card mapCard">
          <NorthAmericaMap
  selected={selected}
  onSelect={setSelected}
  filters={filters}
  onFiltersChange={setFilters}
  levFlash={isUploading && firmwareTarget === "lev"}
  batteryFlash={isUploading && firmwareTarget === "battery"}
  humanoidFlash={isUploading && firmwareTarget === "humanoid"}
/>
          

<div className="caseStudies">
  <div className="caseStudiesTitle">CASE STUDIES</div>

  <div className="caseStudiesGrid">
    <div className="caseVideoCard" onClick={() => setVideoModal({ src: '/case1.mp4', title: 'Danger Jobs and Repairs', tag: 'Case Study' })}>
      <video autoPlay loop muted playsInline>
        <source src="/case1.mp4" type="video/mp4" />
        <source src="/video1.mp4" type="video/mp4" />
      </video>
      <div className="caseVideoMeta">
        <span>Danger Jobs and Repairs</span><span className="caseTag">Case Study</span>
      </div>
    </div>

    <div className="caseVideoCard" onClick={() => setVideoModal({ src: '/case2.mp4', title: 'Defense Project', tag: 'Case Study' })}>
      <video autoPlay loop muted playsInline>
        <source src="/case2.mp4" type="video/mp4" />
        <source src="/video1.mp4" type="video/mp4" />
      </video>
      <div className="caseVideoMeta">
        <span>Defense Project</span><span className="caseTag">Peak-shaving • Smart charge</span>
      </div>
    </div>

    <div className="caseVideoCard" onClick={() => setVideoModal({ src: '/case3.mp4', title: 'Army', tag: 'Case Study' })}>
      <video autoPlay loop muted playsInline>
        <source src="/case3.mp4" type="video/mp4" />
        <source src="/video1.mp4" type="video/mp4" />
      </video>
      <div className="caseVideoMeta">
        <span>Army</span><span className="caseTag">Warehouse • Retail</span>
      </div>
    </div>

    <div className="caseVideoCard" onClick={() => setVideoModal({ src: '/case4.mp4', title: 'EV & Robot', tag: 'Case Study' })}>
      <video autoPlay loop muted playsInline>
        <source src="/case4.mp4" type="video/mp4" />
        <source src="/video1.mp4" type="video/mp4" />
      </video>
      <div className="caseVideoMeta">
        <span>EV & Robot</span><span className="caseTag">Optimization • Firmware</span>
      </div>
    </div>
  </div>
</div>

<div className="caseStudiesGrid">
  <div className="caseVideoCard">
    <video autoPlay loop muted playsInline>
      <source src="/case5.mp4" type="video/mp4" />
      <source src="/video1.mp4" type="video/mp4" />
    </video>
    <div className="caseVideoMeta">
      <span>Medical Assistant</span><span className="caseTag">Urban • Fleet</span>
    </div>
  </div>

  <div className="caseVideoCard">
    <video autoPlay loop muted playsInline>
      <source src="/case6.mp4" type="video/mp4" />
      <source src="/video1.mp4" type="video/mp4" />
    </video>
    <div className="caseVideoMeta">
      <span>Personal</span><span className="caseTag">Load • Storage</span>
    </div>
  </div>

  <div className="caseVideoCard">
    <video autoPlay loop muted playsInline>
      <source src="/case7.mp4" type="video/mp4" />
      <source src="/video1.mp4" type="video/mp4" />
    </video>
    <div className="caseVideoMeta">
      <span>Search and Rescue</span><span className="caseTag">Warehouse • Retail</span>
    </div>
  </div>

  <div className="caseVideoCard">
    <video autoPlay loop muted playsInline>
      <source src="/case8.mp4" type="video/mp4" />
      <source src="/video1.mp4" type="video/mp4" />
    </video>
    <div className="caseVideoMeta">
      <span>Under the Sea</span><span className="caseTag">Optimization • Autonomy</span>
    </div>
  </div>
</div>

</div>

        <div className="stack">
          <div className="card sideCard">
            <TelemetryPanel selected={selected} onLiveView={(s) => setVideoModal({ src: pickLiveViewSrc(s), title: `${s.name} — Live View`, tag: `${s.product}` })} />
          </div>
          <div className="card sideCard">
            <EventFeed onJumpToSite={(s) => setSelected(s)} paused={isUploading} />
          </div>
        </div>
      </div>

      {videoModal && (
        <div className="videoModalBackdrop" onClick={() => setVideoModal(null)}>
          <div className="videoModal" onClick={(e) => e.stopPropagation()}>
            <div className="videoModalHeader">
              <div className="videoModalTitle">{videoModal.title}</div>
              <button
                type="button"
                className="videoModalClose"
                onClick={() => setVideoModal(null)}
              >
                CLOSE
              </button>
            </div>
            {videoModal.tag && <div className="videoModalTag">{videoModal.tag}</div>}
            <video src={videoModal.src} autoPlay controls />
          </div>
        </div>
      )}


      {dataRoomOpen && (
        <div className="videoModalBackdrop" onClick={() => { setDataRoomOpen(false); setDataRoomPw(""); setDataRoomErr(null); setDataRoomAuthed(false); }}>
          <div className="videoModal" onClick={(e) => e.stopPropagation()}>
            <div className="videoModalHeader">
              <div className="videoModalTitle">Investor Data Room</div>
              <button
                type="button"
                className="videoModalClose"
                onClick={() => { setDataRoomOpen(false); setDataRoomPw(""); setDataRoomErr(null); setDataRoomAuthed(false); }}
              >
                CLOSE
              </button>
            </div>

            {!dataRoomAuthed ? (
              <div style={{ marginTop: 10 }}>
                <div className="videoModalTag">Enter password to access documents</div>

                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <input
                    className="input"
                    type="password"
                    value={dataRoomPw}
                    placeholder="Password"
                    onChange={(e) => { setDataRoomPw(e.target.value); setDataRoomErr(null); }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        if (dataRoomPw === "avvenire2026") { setDataRoomAuthed(true); setDataRoomErr(null); }
                        else setDataRoomErr("Incorrect password.");
                      }
                    }}
                    style={{ flex: "1 1 220px" }}
                  />
                  <button
                    type="button"
                    className="cta"
                    onClick={() => {
                      if (dataRoomPw === "avvenire2026") { setDataRoomAuthed(true); setDataRoomErr(null); }
                      else setDataRoomErr("Incorrect password.");
                    }}
                  >
                    Unlock
                  </button>
                </div>

                {dataRoomErr && <div style={{ marginTop: 10, color: "var(--bad)", fontSize: 12 }}>{dataRoomErr}</div>}
              </div>
            ) : (
              <div style={{ marginTop: 10 }}>
                <div className="videoModalTag">Select a document</div>

                <div style={{ display: "grid", gap: 10 }}>
                  <a className="cta" href="/avveniredeck.pdf" target="_blank" rel="noreferrer">1. Avvenire Tech Deck</a>
                  <a className="cta" href="/Avvenirebusinessplan.pdf" target="_blank" rel="noreferrer">2. Avvenire Tech Business Plan</a>
                  <a className="cta" href="/infinite.pdf" target="_blank" rel="noreferrer">3. Avvenire Technologies Infinitra Patent</a>
                  <button type="button" className="pill" onClick={() => { setDataRoomOpen(false); setDataRoomPw(""); setDataRoomErr(null); setDataRoomAuthed(false); }}>Close Data Room</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

<div className="footerNote">
        Add your media files: <b>public/video1.mp4</b> (fallback) and optionally <b>public/case1.mp4</b> … <b>public/case4.mp4</b> for the CASE STUDIES strip. 
      </div>
</div>
  );
}
