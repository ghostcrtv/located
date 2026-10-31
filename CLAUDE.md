# LOCATED. — notes for Claude

Owner: Steve (designer, not a programmer). Do the technical work; explain in plain English; keep everything free (no paid services, no credit-card sign-ups without asking).

## Stack
React 19 + Vite + TypeScript. Leaflet for maps. Natural Earth borders (public/geo/countries-50m.json) for passport checks and the offline base map. Optional Mapillary street imagery (lazy-loaded). localStorage for all progress. No backend.

## Publish
`npm test` → `npm run build` (outputs to `docs/`) → commit everything including `docs/` → push to `main`. GitHub Pages serves `main /docs`. `base: './'` keeps paths relative (GitHub Pages subfolder + future Capacitor app).

## Rules that matter
- Never invent locations. Every catalog entry = a real photo that was viewed, with camera coordinates and license from its Wikimedia Commons record. Allowed licenses: CC0, PD, CC BY, CC BY-SA. Keep author/license/source/title in `photo.credit`.
- Photo file names must be opaque (`l<hash>.jpg`), resized to ≤1920 px, metadata stripped.
- During play show only author + license; title and source link appear on the reveal and in Credits (titles often name the place).
- Decode riddles and facts must be true. No AI calls at runtime.
- Benny's jokes are welcome (quirky, weird) but must never hint at a wrong answer.
- A passport stamp requires a correct Four Corners pick or a guess inside the country's borders (15 km coastal tolerance).
- Achievements/records are applied exactly once per round/game (`applied`, `recorded` flags) — keep that when refactoring.

## Adding a place
Add an entry to `src/data/catalog.ts` (see existing entries), put the photo in `public/photos/`, give three plausible decoy countries (ISO alpha-2 codes that exist in `src/data/countries.ts`), run `npm test`.
