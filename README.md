# Skyline Weather Forecast Dashboard

A production-oriented weather dashboard built with plain HTML5, CSS3, and
vanilla JavaScript (ES modules). No frameworks, no build step — open
`index.html` (via a local server) and it runs.

## Features

- Real-time current conditions: temperature, feels-like, high/low, humidity,
  wind (speed + direction), pressure, visibility, UV index, precipitation
  probability.
- Hourly forecast (next 24 hours, horizontal scroll) and 7-day forecast.
- Sunrise/sunset with a live progress arc.
- City / country / region search with debounced autocomplete.
- Geolocation ("Use current location") with graceful fallback.
- Favorite locations and recent searches (localStorage).
- °C/°F and km/h/mph unit toggle, applied everywhere.
- Light / dark / system theme, persisted.
- Auto-refresh every 10 minutes (paused while the tab is hidden), manual
  refresh button, "Updated X ago" timestamp.
- Skeleton loading states, error states with retry, and an offline fallback
  that shows the last cached reading with an explicit "last available" label.
- Responsive down to small phones; keyboard-navigable search; visible focus
  states; `prefers-reduced-motion` respected.

## Weather provider

Weather and geocoding data come from **[Open-Meteo](https://open-meteo.com)**.
It was chosen deliberately for this client-side project because:

- It requires **no API key** — there is nothing secret to protect, so the
  app has no `.env` file and no backend proxy to manage.
- It's free for non-commercial use and CORS-enabled for direct browser
  requests.

If you swap in a provider that *does* require a key, do not hardcode it in
`js/api.js`. Use a build-time environment variable or a small backend proxy
that injects the key server-side, and keep `.env` out of version control
(already covered by `.gitignore`).

## Project structure

```
weather-app/
│
├── index.html              Semantic markup, all sections, ARIA wiring
│
├── css/
│   ├── style.css            Design tokens, layout, components, theming
│   ├── responsive.css       Breakpoints for tablet/mobile
│   └── animations.css       Transitions, skeleton shimmer, reduced-motion
│
├── js/
│   ├── api.js               Fetch layer: timeout, retry, error typing
│   ├── weather.js           WMO code → icon/label, unit-aware view models
│   ├── icons.js              Inline SVG icon set (no emoji, theme-aware)
│   ├── location.js          navigator.geolocation wrapper
│   ├── search.js            Debounced city search + keyboard navigation
│   ├── storage.js           All localStorage reads/writes
│   ├── ui.js                 DOM rendering — the only module that paints
│   └── app.js                Entry point: wires everything together
│
├── assets/icons/            Standalone SVG icon set (documentation/reuse)
│
├── .gitignore
└── README.md
```

## Running locally

Any static file server works, e.g. VS Code's **Live Server** extension, or:

```bash
npx serve .
# or
python3 -m http.server 5500
```

Then open the served URL in your browser. Geolocation requires a secure
context (`http://localhost` is fine; a plain `file://` URL may block it in
some browsers).

## Notes / known limitations

- Open-Meteo's WMO weather codes don't distinguish "mist" from "haze" —
  both are treated as fog for icon/labeling purposes.
- Reverse geocoding (turning coordinates into a city name) isn't offered by
  this provider, so "Use current location" labels the reading using the
  timezone city Open-Meteo returns (e.g. `Asia/Jakarta` → "Jakarta").
