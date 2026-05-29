# 🧡 Oerall — onze Oerol 2026 app

Our go-to companion app for **Oerol 2026** on Terschelling (45th edition, **12–21 June 2026**).
One beautiful, fun, mobile-first place for everything we need this festival:

- ☀️ **Vandaag** — a **live ticking countdown** to the festival, today's **weather & wind** for Terschelling, the **next event** (with "over X uur") and a one-tap bike route, and today's schedule.
- 🎭 **Programma** — the events we're visiting, filterable per day, each with details, who's going, and a **share** button.
- 🗺️ **Kaart** — interactive map of Terschelling with venue + house pins, and a **route to the next event**.
- 🏠 **Thuis** — everything about the house we sleep in: address, wifi, house rules, what's nearby, emergency numbers.
- ✨ **Meer** — quick links to the official **Oerol website**, the daily **Oerol Krant**, tickets, the ferry and more.

Built as a **static PWA** (plain HTML/CSS/JS, no build step). Installable to your phone's home
screen and works offline once loaded. Styled in Oerol's bold, raw, landscape-inspired look.

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
  - For each `venue`, set `lat` / `lng` so it shows on the map + routing.
    (In Google Maps: right-click a spot → **What's here?** to read off the coordinates.)
  - `genre` is one of: `theater`, `muziek`, `straat`, `woord`, `kunst`, `eten` (controls the colour).
  - `attendees` are just names — who from the crew is going.
- `crew` — the group's names.
- `links` — official URLs (update if any change).

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

- Map: [Leaflet](https://leafletjs.com) (**vendored locally** in `vendor/leaflet/`, so the app
  works offline) with OpenStreetMap tiles.
- **Route to next event**: draws a line from the house to the next venue on the map, and the
  **🚲 Route ernaartoe** buttons open turn-by-turn **cycling** directions in Google/Apple Maps.
- Note: map *tiles* need an internet connection. Open the map once on wifi and it's cached for offline.

## Project layout

```
index.html               app shell + tab navigation
css/styles.css           Oerol-style theme
js/data.js               ← EDIT THIS: all our content
js/app.js                router + page rendering + countdown / next-event logic
js/map.js                Leaflet map, pins, route line, maps hand-off
manifest.webmanifest     PWA install metadata
sw.js                    service worker (offline app shell)
icons/                   app icons (coral "O" on teal)
vendor/leaflet/          Leaflet, vendored for offline use
```

Made with 🧡 for our Oerol. Veel plezier op Terschelling!
