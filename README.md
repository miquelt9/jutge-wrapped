# Jutge Wrapped

A Spotify Wrapped–style recap for [Jutge.org](https://jutge.org) students. Fully client-side: log in with your Jutge credentials, and your stats are fetched directly from `api.jutge.org` in the browser.

This is an unofficial fan project and is not affiliated with Jutge.org or the UPC.

## Stack

- Vite + React + TypeScript
- Tailwind CSS v4
- Framer Motion
- Lucide React

## Security

- Credentials are sent only to the official Jutge API at login.
- The access token is kept **in memory** only (React state). Refreshing the page clears the session.
- Nothing credential-related is written to `localStorage` or `sessionStorage`.
- UI language preference is stored in `localStorage` under `jutge-wrapped-lang` (English, Spanish, or Catalan).

## Local development

```bash
npm install
npm run dev
```

After login, choose a date window:

- **All time** — uses the Jutge dashboard aggregates (same as the website stats).
- **Custom range / presets** — rebuilds stats from your submission history for those dates.

Use **Dates** in the deck header to change the window without logging out again.

Optional env vars (`.env`):

```env
VITE_JUTGE_API_URL=https://api.jutge.org/api
VITE_JUTGE_DOMAIN=
```

## Export snapshot (design / debugging)

Run locally to dump API responses as JSON (credentials are prompted once, not saved):

```bash
npm run export:snapshot
```

Output goes to `artifacts/` (gitignored).

### Load a snapshot in the app (dev)

In development (`npm run dev`), use **Load JSON snapshot** on the login screen (or date picker) and choose a file from `artifacts/`. The deck opens with **no further API calls**. A **Snapshot** badge appears in the header; use **Clear snapshot** to return to normal login.

Optional auto-load: put a copy of your snapshot in `public/snapshot.json` and set:

```env
VITE_SNAPSHOT_PATH=/snapshot.json
```

## Build

```bash
npm run build
npm run preview
```

For GitHub Pages, production builds use base path `/jutge-wrapped/` (set via `GITHUB_PAGES=true` in CI).

## Deploy

Push to `main` — the [GitHub Actions workflow](.github/workflows/deploy.yml) builds and deploys to GitHub Pages. Enable Pages from the `github-pages` environment / artifact source in repo settings.

## CORS note

If the API does not allow your origin, login may fail with a network error. The app surfaces guidance when that happens. Direct browser access depends on Jutge API CORS policy for your deployment URL.
