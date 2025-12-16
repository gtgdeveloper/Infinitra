import React, { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

export type Category = "ebike" | "battery" | "humanoid";

export type Site = {
  id: string;
  name: string;
  category: Category;
  city: string;
  region: string;
  country: "Canada" | "USA";
  lat: number;
  lng: number;
  description: string;
};

type Hub = Omit<Site, "id" | "name"> & { hubName: string };

const HUBS: Record<Category, Hub[]> = {
  ebike: [
    { hubName: "Toronto", category: "ebike", city: "Toronto", region: "ON", country: "Canada", lat: 43.6532, lng: -79.3832, description: "E-bike product, assembly & distribution focus." },
    { hubName: "New York", category: "ebike", city: "New York", region: "NY", country: "USA", lat: 40.7128, lng: -74.0060, description: "Go-to-market, channel partnerships and service." },
    { hubName: "Chicago", category: "ebike", city: "Chicago", region: "IL", country: "USA", lat: 41.8781, lng: -87.6298, description: "Urban fleet pilots & service network." },
    { hubName: "Los Angeles", category: "ebike", city: "Los Angeles", region: "CA", country: "USA", lat: 34.0522, lng: -118.2437, description: "West coast distribution & marketing." }
  ],
  battery: [
    { hubName: "Vancouver", category: "battery", city: "Vancouver", region: "BC", country: "Canada", lat: 49.2827, lng: -123.1207, description: "Battery pack design + BMS integration." },
    { hubName: "Austin", category: "battery", city: "Austin", region: "TX", country: "USA", lat: 30.2672, lng: -97.7431, description: "Battery supply-chain, testing and field deployments." },
    { hubName: "Detroit", category: "battery", city: "Detroit", region: "MI", country: "USA", lat: 42.3314, lng: -83.0458, description: "Energy systems validation & automotive partners." }
  ],
  humanoid: [
    { hubName: "Montréal", category: "humanoid", city: "Montréal", region: "QC", country: "Canada", lat: 45.5019, lng: -73.5674, description: "Humanoid control stack + AI autonomy research." },
    { hubName: "San Francisco", category: "humanoid", city: "San Francisco", region: "CA", country: "USA", lat: 37.7749, lng: -122.4194, description: "Partner ecosystem for humanoid pilots & components." },
    { hubName: "Boston", category: "humanoid", city: "Boston", region: "MA", country: "USA", lat: 42.3601, lng: -71.0589, description: "Robotics research collaborations." }
  ]
};

const COUNTS: Record<Category, number> = { ebike: 30, humanoid: 20, battery: 10 };

function jitterCoord(lat: number, lng: number, radiusDeg: number) {
  // random point in a circle (approx degrees)
  const t = 2 * Math.PI * Math.random();
  const r = radiusDeg * Math.sqrt(Math.random());
  const dLat = r * Math.cos(t);
  const dLng = r * Math.sin(t) / Math.max(0.2, Math.cos((lat * Math.PI) / 180));
  return { lat: lat + dLat, lng: lng + dLng };
}

function generateSites(): Site[] {
  const out: Site[] = [];
  (Object.keys(COUNTS) as Category[]).forEach((cat) => {
    const n = COUNTS[cat];
    const hubs = HUBS[cat];
    for (let i = 1; i <= n; i++) {
      const hub = hubs[(i - 1) % hubs.length];
      const p = jitterCoord(hub.lat, hub.lng, cat === "battery" ? 0.55 : 0.40);

      const label =
        cat === "ebike" ? `E-Bike Node ${String(i).padStart(2, "0")}` :
        cat === "battery" ? `Battery System ${String(i).padStart(2, "0")}` :
        `Humanoid Unit ${String(i).padStart(2, "0")}`;

      out.push({
        id: `${cat}-${i}`,
        name: label,
        category: cat,
        city: hub.city,
        region: hub.region,
        country: hub.country,
        lat: Number(p.lat.toFixed(5)),
        lng: Number(p.lng.toFixed(5)),
        description: hub.description
      });
    }
  });
  return out;
}

export const SITES: Site[] = generateSites();

function makeDivIcon(category: Category) {
  const dotClass =
    category === "ebike" ? "dot-ebike" : category === "battery" ? "dot-battery" : "dot-humanoid";

  const svg =
    category === "ebike"
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="rgba(0,220,255,0.95)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
           <circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/>
           <path d="M15 6h2l2 4"/><path d="M6 17.5l4-9h4l3 6"/><path d="M10 8.5h4"/>
         </svg>`
      : category === "battery"
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="rgba(124,92,255,0.95)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
           <rect x="2" y="7" width="16" height="10" rx="2" ry="2"/>
           <path d="M22 11v2"/><path d="M6 12h6"/><path d="M9 9l-2 3h4l-2 3"/>
         </svg>`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,212,0,0.95)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
           <rect x="7" y="2" width="10" height="6" rx="2"/><path d="M12 8v3"/>
           <rect x="5" y="11" width="14" height="8" rx="2"/>
           <path d="M8 19v3"/><path d="M16 19v3"/><path d="M9 14h.01"/><path d="M15 14h.01"/>
         </svg>`;

  const html = `
    <div class="markerIcon">
      ${svg}
      <span class="legendDot ${dotClass}" style="position:absolute; right:-2px; bottom:-2px;"></span>
    </div>
  `;

  return L.divIcon({
    className: "",
    html,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -36]
  });
}

function prettyCategory(c: Category) {
  if (c === "ebike") return "E-Bike";
  if (c === "battery") return "Battery System";
  return "Humanoids / Robotics";
}

export default function NorthAmericaMap(props: {
  selected: Site | null;
  onSelect: (s: Site | null) => void;
  filters: Record<Category, boolean>;
  onFiltersChange: (f: Record<Category, boolean>) => void;
}) {
  const { onSelect, filters, onFiltersChange } = props;

  const visibleSites = useMemo(() => SITES.filter((s) => filters[s.category]), [filters]);

  const bounds = useMemo(
    () => L.latLngBounds(L.latLng(14.0, -168.0), L.latLng(72.0, -52.0)),
    []
  );

  return (
    <>
      <div className="toolbar">
        <div className="pills">
          <button
            className="pill"
            aria-pressed={filters.ebike}
            onClick={() => onFiltersChange({ ...filters, ebike: !filters.ebike })}
            title="Toggle E-Bike"
          >
            <span className="legendDot dot-ebike" />
            E-Bike
          </button>
          <button
            className="pill"
            aria-pressed={filters.battery}
            onClick={() => onFiltersChange({ ...filters, battery: !filters.battery })}
            title="Toggle Battery Systems"
          >
            <span className="legendDot dot-battery" />
            Battery Systems
          </button>
          <button
            className="pill"
            aria-pressed={filters.humanoid}
            onClick={() => onFiltersChange({ ...filters, humanoid: !filters.humanoid })}
            title="Toggle Humanoids/Robotics"
          >
            <span className="legendDot dot-humanoid" />
            Humanoids
          </button>
        </div>

        <div className="small">Showing <b>{visibleSites.length}</b> nodes • Click a site to view live metrics</div>
      </div>

      <div className="mapWrap">
        <MapContainer bounds={bounds} maxBounds={bounds.pad(0.1)} minZoom={3} maxZoom={8} scrollWheelZoom worldCopyJump>
          <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {visibleSites.map((site) => (
            <Marker
              key={site.id}
              position={[site.lat, site.lng]}
              icon={makeDivIcon(site.category)}
              eventHandlers={{
                click: () => onSelect(site)
              }}
            >
              <Popup>
                <div>
                  <p className="popupTitle">{site.name}</p>
                  <p className="popupMeta">
                    {prettyCategory(site.category)} • {site.city}, {site.region} • {site.country}
                  </p>
                  <p className="popupMeta">{site.description}</p>
                  <p className="popupMeta"><b>Tip:</b> Open the right panel for live data.</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </>
  );
}
