import React, { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

export type Category = "lev" | "battery" | "humanoid";

export type Site = {
  id: string;
  name: string;          // human readable label
  category: Category;
  product: string;       // Terra / Tectus / Leggera / etc.
  ownerName?: string;    // only for LEV
  city: string;
  region: string;
  country: "Canada" | "USA";
  lat: number;
  lng: number;
  description: string;
};

const FIRST = ["John","Sarah","Michael","Emily","David","Anna","Robert","Laura","Daniel","Sophia","James","Olivia","William","Chloe","Ethan","Mia","Noah","Ava","Lucas","Emma"];
const LAST  = ["Smith","Johnson","Brown","Taylor","Anderson","Miller","Davis","Wilson","Moore","Clark","Martin","Lee","Walker","Young","King","Wright","Scott","Green","Baker","Adams"];

function personName(i:number){
  return `${FIRST[i % FIRST.length]} ${LAST[Math.floor(i / FIRST.length) % LAST.length]}`;
}

// Many hubs so it feels “spread across North America”
const HUBS: Array<{city:string; region:string; country:"Canada"|"USA"; lat:number; lng:number;}> = [
  {city:"Vancouver",region:"BC",country:"Canada",lat:49.2827,lng:-123.1207},
  {city:"Calgary",region:"AB",country:"Canada",lat:51.0447,lng:-114.0719},
  {city:"Edmonton",region:"AB",country:"Canada",lat:53.5461,lng:-113.4938},
  {city:"Winnipeg",region:"MB",country:"Canada",lat:49.8951,lng:-97.1384},
  {city:"Toronto",region:"ON",country:"Canada",lat:43.6532,lng:-79.3832},
  {city:"Ottawa",region:"ON",country:"Canada",lat:45.4215,lng:-75.6972},
  {city:"Montréal",region:"QC",country:"Canada",lat:45.5019,lng:-73.5674},
  {city:"Québec City",region:"QC",country:"Canada",lat:46.8139,lng:-71.2080},
  {city:"Halifax",region:"NS",country:"Canada",lat:44.6488,lng:-63.5752},

  {city:"Seattle",region:"WA",country:"USA",lat:47.6062,lng:-122.3321},
  {city:"Portland",region:"OR",country:"USA",lat:45.5152,lng:-122.6784},
  {city:"San Francisco",region:"CA",country:"USA",lat:37.7749,lng:-122.4194},
  {city:"Los Angeles",region:"CA",country:"USA",lat:34.0522,lng:-118.2437},
  {city:"San Diego",region:"CA",country:"USA",lat:32.7157,lng:-117.1611},
  {city:"Phoenix",region:"AZ",country:"USA",lat:33.4484,lng:-112.0740},
  {city:"Denver",region:"CO",country:"USA",lat:39.7392,lng:-104.9903},
  {city:"Dallas",region:"TX",country:"USA",lat:32.7767,lng:-96.7970},
  {city:"Austin",region:"TX",country:"USA",lat:30.2672,lng:-97.7431},
  {city:"Houston",region:"TX",country:"USA",lat:29.7604,lng:-95.3698},
  {city:"Minneapolis",region:"MN",country:"USA",lat:44.9778,lng:-93.2650},
  {city:"Chicago",region:"IL",country:"USA",lat:41.8781,lng:-87.6298},
  {city:"St. Louis",region:"MO",country:"USA",lat:38.6270,lng:-90.1994},
  {city:"Nashville",region:"TN",country:"USA",lat:36.1627,lng:-86.7816},
  {city:"Atlanta",region:"GA",country:"USA",lat:33.7490,lng:-84.3880},
  {city:"Miami",region:"FL",country:"USA",lat:25.7617,lng:-80.1918},
  {city:"Washington",region:"DC",country:"USA",lat:38.9072,lng:-77.0369},
  {city:"Philadelphia",region:"PA",country:"USA",lat:39.9526,lng:-75.1652},
  {city:"New York",region:"NY",country:"USA",lat:40.7128,lng:-74.0060},
  {city:"Boston",region:"MA",country:"USA",lat:42.3601,lng:-71.0589}
];

const COUNTS: Record<Category, number> = { lev: 100, humanoid: 100, battery: 100 };

function jitterCoord(lat:number,lng:number, radiusDeg:number){
  const t = 2 * Math.PI * Math.random();
  const r = radiusDeg * Math.sqrt(Math.random());
  const dLat = r * Math.cos(t);
  const dLng = (r * Math.sin(t)) / Math.max(0.2, Math.cos((lat * Math.PI) / 180));
  return { lat: lat + dLat, lng: lng + dLng };
}

function makeProduct(i:number){
  const mod = i % 3;
  if(mod === 0) return "Terra E‑Bike";
  if(mod === 1) return "Tectus Scope Mobility";
  return "Leggera 3‑Wheel";
}

export const SITES: Site[] = (() => {
  const out: Site[] = [];
  let seq = 1;

  (Object.keys(COUNTS) as Category[]).forEach((cat) => {
    const n = COUNTS[cat];
    for (let i = 0; i < n; i++) {
      const hub = HUBS[(i * 7 + (cat === "battery" ? 3 : cat === "humanoid" ? 5 : 1)) % HUBS.length];
      const p = jitterCoord(hub.lat, hub.lng, cat === "battery" ? 0.55 : 0.45);

      if (cat === "lev") {
        const owner = personName(i);
        const product = makeProduct(i);
        out.push({
          id: `lev-${seq++}`,
          name: `${owner} • ${product}`,
          ownerName: owner,
          product,
          category: cat,
          city: hub.city,
          region: hub.region,
          country: hub.country,
          lat: Number(p.lat.toFixed(5)),
          lng: Number(p.lng.toFixed(5)),
          description: "LEV (Low‑speed Electric Vehicle) telemetry node."
        });
      } else if (cat === "humanoid") {
        const product = "Avvenire Humanoid";
        out.push({
          id: `humanoid-${seq++}`,
          name: `Humanoid Unit ${i + 1}`,
          product,
          category: cat,
          city: hub.city,
          region: hub.region,
          country: hub.country,
          lat: Number(p.lat.toFixed(5)),
          lng: Number(p.lng.toFixed(5)),
          description: "Humanoid robotics telemetry node."
        });
      } else {
        const product = "Avvenire Battery System";
        out.push({
          id: `battery-${seq++}`,
          name: `Battery Node ${i + 1}`,
          product,
          category: cat,
          city: hub.city,
          region: hub.region,
          country: hub.country,
          lat: Number(p.lat.toFixed(5)),
          lng: Number(p.lng.toFixed(5)),
          description: "Battery / energy telemetry node."
        });
      }
    }
  });

  return out;
})();

function makeDivIcon(category: Category) {
  const dotClass =
    category === "lev" ? "dot-lev" : category === "battery" ? "dot-battery" : "dot-humanoid";

  const svg =
    category === "lev"
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
  if (c === "lev") return "LEV";
  if (c === "battery") return "Battery System";
  return "Humanoid";
}

export default function NorthAmericaMap(props: {
  selected: Site | null;
  onSelect: (s: Site | null) => void;
  filters: Record<Category, boolean>;
  onFiltersChange: (f: Record<Category, boolean>) => void;
}) {
  const { onSelect, filters, onFiltersChange } = props;
  const visibleSites = useMemo(() => SITES.filter((s) => filters[s.category]), [filters]);

  const bounds = useMemo(() => L.latLngBounds(L.latLng(14.0, -168.0), L.latLng(72.0, -52.0)), []);

  return (
    <>
      <div className="toolbar">
        <div className="pills">
          <button className="pill" aria-pressed={filters.lev} onClick={() => onFiltersChange({ ...filters, lev: !filters.lev })}>
            <span className="legendDot dot-lev" /> LEV
          </button>
          <button className="pill" aria-pressed={filters.battery} onClick={() => onFiltersChange({ ...filters, battery: !filters.battery })}>
            <span className="legendDot dot-battery" /> Battery
          </button>
          <button className="pill" aria-pressed={filters.humanoid} onClick={() => onFiltersChange({ ...filters, humanoid: !filters.humanoid })}>
            <span className="legendDot dot-humanoid" /> Humanoid
          </button>
        </div>
        <div className="small">Showing <b>{visibleSites.length}</b> nodes • click for details</div>
      </div>

      <div className="mapWrap">
        <MapContainer bounds={bounds} maxBounds={bounds.pad(0.1)} minZoom={3} maxZoom={8} scrollWheelZoom worldCopyJump>
          <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {visibleSites.map((site) => (
            <Marker
              key={site.id}
              position={[site.lat, site.lng]}
              icon={makeDivIcon(site.category)}
              eventHandlers={{ click: () => onSelect(site) }}
            >
              <Popup>
                <div>
                  <p className="popupTitle">{site.name}</p>
                  <p className="popupMeta">{prettyCategory(site.category)} • {site.city}, {site.region} • {site.country}</p>
                  <p className="popupMeta">{site.product}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </>
  );
}
