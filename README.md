# INFINITRA AI — Map + Telemetry + Incoming Data Feed (Vite + React + Leaflet)

Now includes:
- Avvenire Technologies logo (top-left) linking to https://avveniretech.com
- Investor button linking to https://avveniretech.com/invest
- **60 map nodes**: 30 E-bikes, 20 Humanoids, 10 Battery Systems (distributed around hubs)
- Simulated live telemetry + incoming AI recommendations feed

## Run locally
```bash
npm install
npm run dev
```

## Production test
```bash
npm run build
npm run preview
```

## Customize
- Node generation (counts/hubs): `src/components/NorthAmericaMap.tsx`
- Telemetry simulation: `src/components/telemetry.ts`
- Incoming feed simulation: `src/components/events.ts` + `src/components/useEventFeed.ts`
