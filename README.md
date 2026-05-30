# 🧡 Oerall — onze Oerol 2026 app

Our go-to companion app for **Oerol 2026** on Terschelling (45th edition, **12–21 June 2026**).
One beautiful, fun, mobile-first place for everything we need this festival:

- ☀️ **Vandaag** — a **live ticking countdown** to the festival, today's **weather & wind** for Terschelling, the **next event** (with "over X uur") and a one-tap bike route, and today's schedule.
- 🎭 **Programma** — the events we're visiting, filterable per day, each with details, who's going, and a **share** button.
- 🗺️ **Kaart** — Google Maps of Terschelling: tap a venue (or the house) to see its **exact** spot by address, with **open in Google Maps** and a **route to the next event**.
- 🏠 **Thuis** — everything about the house we sleep in: address, wifi, house rules, what's nearby, emergency numbers.
- ✨ **Meer** — quick links to the official **Oerol website**, the daily **Oerol Krant**, tickets, the ferry and more, plus the full **Terschelling in beeld** art collection.
- 🖼️ **Terschelling in beeld** — a small gallery of hand-drawn nature scenes of the island (the Brandaris, dunes, the Wad, the kwelder, the beach, cranberry fields), shown on **Vandaag** and **Meer**.

Built as a **static PWA** (plain HTML/CSS/JS, no build step). Installable to your phone's home
screen and works offline once loaded. Styled as an **editorial, art-first gallery** — a warm,
nature-derived palette with the editorial serif *Fraunces*, built for art-loving visitors. All
imagery is hand-crafted SVG (in [`img/`](img/)), so it stays crisp and works fully offline.
The UI icons — tab bar, weather, tickets, loading/waiting, etc. — are a matching hand-drawn
SVG set (`ICONS` in [`js/app.js`](js/app.js)) that inherits text colour, so it adapts to light
and dark mode automatically.

## Run it locally

Any static file server works. From this folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

> Use a server (not `file://`) so the service worker, map and modules load correctly.

## Make it ours (edit the content)

**You only need to edit one file:** [`js/data.js`](js/data.js). It holds:

- `home` — the house we're staying in (address, coords, wifi, rules, nearby, emergency numbers).
- `events` — the events we plan to visit. Copy an entry to add one; keep the same shape.
  - For each `venue`, set `query` to the real address/name — Google Maps geocodes it for the
    map view, "open in Maps" and routing. (`lat` / `lng` are only an optional fallback.)
  - `genre` is one of: `theater`, `muziek`, `straat`, `woord`, `kunst`, `eten` (controls the colour).
  - `attendees` are just names — who from the crew is going.
- `crew` — the group's names.
- `links` — official URLs (update if any change).
- `gallery` — the **Terschelling in beeld** plates: each `{ img, title, caption }` points to an
  SVG in `img/` and shows a museum-style label. Add or reword captions freely.

Save and reload — no build step.

> The current events/home are **realistic samples** so the app looks great immediately.
> Swap in our real plans before we leave. Double-check the **Oerol Krant** URL in `links` against
> the official site closer to the festival.

## Deploy (share with friends)

Free hosting via **GitHub Pages**:

1. Push this repo to GitHub.
2. Repo **Settings → Pages → Build and deployment**: Source = *Deploy from a branch*, pick your
   branch and the `/ (root)` folder.
3. Open the published URL on your phone and tap **Share → Add to Home Screen** to install it as an app.

## How the map & routing work

- Map: **Google Maps**, embedded keylessly via `output=embed`. Locations are shown by their real
  address/name (`venue.query`), so Google pinpoints the exact spot — no hand-placed coordinates.
- **Route to next event** / **🚲 Route ernaartoe**: open turn-by-turn **cycling** directions from
  the house, both inside the embed and in the full Google Maps app/site.
- Note: the map needs an internet connection to load.

## Project layout

```
index.html               app shell + tab navigation
css/styles.css           editorial, art-first theme (Fraunces + nature palette)
js/data.js               ← EDIT THIS: all our content (incl. the gallery)
js/app.js                router + page rendering + countdown / next-event logic
js/map.js                Google Maps embeds, venue selector, maps hand-off
img/                     hand-drawn SVG nature art of Terschelling (hero, banners, gallery)
manifest.webmanifest     PWA install metadata
sw.js                    service worker (offline app shell)
icons/                   app icons (sun over the dunes)
```

Made with 🧡 for our Oerol. Veel plezier op Terschelling!
