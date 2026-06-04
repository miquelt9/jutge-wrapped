# Contributing

## Prerequisites

- Node 22
- npm

If you use `nvm`, run `nvm use` after cloning.

## Getting started

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173`.

For HTTPS + LAN testing on another device:

```bash
npm run dev:host
```

## Common commands

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

- `typecheck` validates the TypeScript project references without bundling.
- `lint` checks the application and script code, excluding generated API clients.
- `test` runs focused unit tests for wrapped domain logic.
- `build` is the final local gate before opening a PR.

To format docs and source files:

```bash
npm run format
```

To check formatting without writing changes:

```bash
npm run format:check
```

## Project map

Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) before making structural changes. The short version:

- `src/context/*` manages app-wide session, theme, period, and snapshot state.
- `src/api/*` contains the Jutge API client and the thin helpers used by the app.
- `src/features/wrapped/*` owns the wrapped experience, including period logic, insight generation, deck orchestration, and slide components.
- `src/components/*` should stay reusable unless a component is intentionally wrapped-specific.
- `src/i18n/*` and `src/theme/*` handle localization and theming.

## Where to put changes

- New slide UI or narrative layout: `src/features/wrapped/slides/*`
- New wrapped metrics or ranking logic: `src/features/wrapped/selectors.ts`
- Date-range behavior or aggregation rules: `src/features/wrapped/period.ts` and `src/features/wrapped/useWrappedData.ts`
- App-wide providers, login flow, or shell behavior: `src/App.tsx` and `src/context/*`
- Shared charts and controls: `src/components/*`

## Slide change checklist

When adding or significantly changing a slide:

1. Add or update the slide component in `src/features/wrapped/slides/`.
2. Wire the slide into `src/features/wrapped/shareExport.ts`.
3. Wire deck rendering and navigation in `src/features/wrapped/WrappedDeck.tsx`.
4. Add any new insight fields in `src/features/wrapped/types.ts`.
5. Extend `src/features/wrapped/selectors.ts` if the slide needs new derived data.
6. Add translation keys to `src/i18n/locales/en.json`, `src/i18n/locales/es.json`, and `src/i18n/locales/ca.json` in the same change.

## Snapshot workflow

Use snapshots when you want repeatable UI work without live API calls:

```bash
npm run export:snapshot
```

- Snapshot files are written to `artifacts/`.
- `artifacts/` is gitignored and should stay out of commits.
- In development, you can load a snapshot from the login or date-picker UI.
- For auto-load during local development, copy a snapshot into `public/` and set `VITE_SNAPSHOT_PATH` in `.env`.
- Snapshots must include a `submissions` array (written by `npm run export:snapshot`) for per-problem insights such as the intro grind headline. Re-export if your file predates that field.

## Generated API clients

This repository currently tracks two generated Jutge clients:

- `src/api/jutgeClient.ts` for the browser app
- `jutge_api_client.ts` for the local snapshot export script

Do not hand-edit either file unless you are intentionally regenerating or syncing the client output. If one changes, verify whether the other must change too so the app and snapshot tooling stay aligned.

## Pull request checklist

Before opening a PR:

1. Run `npm run lint`
2. Run `npm run test`
3. Run `npm run build`
4. Confirm any new UI strings were added to `en`, `es`, and `ca`
5. Confirm no secrets, `.env` files, or `artifacts/` files are included
6. Keep generated API client updates intentional and explained in the PR description
