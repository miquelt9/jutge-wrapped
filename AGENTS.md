# Agent Guidance

This repository already documents its collaboration standards in `CONTRIBUTING.md` and its code organization in `docs/ARCHITECTURE.md`. Read those first before making structural changes.

## Project priorities

- Preserve the current app behavior while improving contributor experience.
- Prefer small, boundary-respecting changes over broad folder reshuffles.
- Keep changes easy to review and verify with local commands.

## Where changes belong

- Slide UI, layout, or narrative presentation: `src/features/wrapped/slides/*`
- Wrapped metrics, ranking logic, and derived insight fields: `src/features/wrapped/selectors.ts`
- Date-range filtering, period rules, and aggregation: `src/features/wrapped/period.ts`
- Live-data vs snapshot loading flow: `src/features/wrapped/useWrappedData.ts` and `src/context/SnapshotContext.tsx`
- App-wide providers and shell behavior: `src/App.tsx` and `src/context/*`
- Reusable charts and controls: `src/components/*`
- UI copy and translations: `src/i18n/locales/en.json`, `src/i18n/locales/es.json`, `src/i18n/locales/ca.json`

## Important constraints

- Do not hand-edit generated API clients unless the change is intentionally part of a regeneration or sync workflow:
  - `src/api/jutgeClient.ts`
  - `jutge_api_client.ts`
- Keep `src/components/*` generic unless a component is intentionally specific to the wrapped feature.
- Keep feature-specific logic inside `src/features/wrapped/*`.
- When adding or changing UI strings, update `en`, `es`, and `ca` together in the same change.
- Do not commit `.env` files, credentials, or files from `artifacts/`.

## Verification

Before finishing substantial work, run:

```bash
npm run lint
npm run test
npm run build
```

If you changed formatting-sensitive files, also run:

```bash
npm run format:check
```

## Current architecture debt

These are known debt areas, not patterns to copy:

- `src/features/wrapped/WrappedDeck.tsx` currently owns multiple deck responsibilities.
- `src/features/wrapped/selectors.ts` mixes pure calculations with translation-driven narrative generation.
- Some shared chart components still depend on wrapped feature types.
- The generated API client exists in two runtime-specific copies.
