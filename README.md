# LOCATED.

**How well do you know the world?** A geography guessing game hosted by Benny, a very opinionated Pomeranian.

Look at a real place, drop a pin on the world map, and score up to 5,000 points depending on how close you are. Three optional clues (Four Corners, Decode, Proximity) cost 500 points each. Collect passport stamps, unlock achievements, and beat your own records.

- **World Tour** — 5 rounds. With a free Mapillary key you can look around real streets; without one, each round uses a real photo of the place.
- **One Shot** — 5 rounds, one fixed photo each. No moving.
- **Endless Explorer** — keep going until you stop.

Everything is free: no accounts, no servers, no ads, no paid services. Progress is saved in the browser on each device.

---

## Play it on the iPad (Home Screen icon)

1. Open the game's web address in **Safari** on the iPad.
2. Tap the **Share** button (square with an arrow).
3. Tap **Add to Home Screen** → **Add**.
4. Benny's icon appears on the Home Screen. Opening it runs the game full-screen, like an app.

---

## Publishing on GitHub Pages (free)

The finished website lives in the **`docs`** folder. GitHub Pages serves that folder directly — no build step on GitHub.

**First time only**

1. On github.com, create a new **public** repository called `located` (leave it empty — no README).
2. Upload this project to it (or ask Claude to push it for you).
3. In the repository, go to **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**, branch **main**, folder **/docs**, then **Save**.
5. After a minute or two the game is live at `https://<your-username>.github.io/located/`.

**Updating later**

Ask Claude to make the change. Claude runs the tests, rebuilds the `docs` folder, and pushes. GitHub Pages updates itself within a couple of minutes. On the iPad, close and reopen the game to get the new version.

---

## Optional: real street-level imagery (Mapillary)

World Tour and Endless can show real, walkable street imagery from Mapillary — free, no credit card.

1. Make a free account at <https://www.mapillary.com>.
2. Go to **Dashboard → Developers → Register application** (any name, e.g. "LOCATED"; tick *read* access).
3. Copy the **Client Token** — it starts with `MLY|`. (Not the "client secret".)
4. In the game: **Settings → Street-level imagery** → paste → **Save & Test**.

The key is stored only on that device. Mapillary client tokens are designed to be used inside browsers, so it is fine that the game can read it. Where a place has no street imagery, the round honestly falls back to a real photo of that place and says so.

---

## For whoever works on the code next

```bash
npm install        # once
npm run dev        # play locally at http://localhost:5173
npm test           # automated tests (scoring, distance, clues, saving, achievements…)
npm run build      # rebuilds the docs/ folder that GitHub Pages serves
```

- `src/config.ts` — every tunable number: scoring curve, clue cost, proximity bands, map tiles.
- `src/data/catalog.ts` — the places. Each has real coordinates, a licensed photo, a riddle, three decoy countries and a fact.
- `src/data/dialogue.ts` — everything Benny says. Add jokes freely.
- `src/data/achievements.ts` — achievements are data; add one without touching game code.
- `public/benny/` — Benny artwork. Replace with higher-resolution files of the same names any time.
- `public/photos/` — location photos with opaque file names (so the name never gives the answer away).

See `ATTRIBUTION.md` for credits and licenses.

**App Store later:** the project uses relative paths and no server, so it can be wrapped with Capacitor and built in Xcode without restructuring. Before a commercial release, switch the detailed map tiles in `src/config.ts` to a dedicated tile provider (OpenStreetMap's own servers are meant for light use) and re-check every photo license (all current photos allow commercial use with attribution).

© 2026 Steve R. Benny appears as himself.
