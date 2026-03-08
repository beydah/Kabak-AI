# Project Structure and Best Practices

## Root Structure
- `client/` frontend app
- `server/` backend runtime
- `shared/` cross-layer contracts
- `docs/` architecture and operations
- `.github/` collaboration templates

## React + Vite + Tailwind Guidelines
- Keep route logic in `pages/`, not in deeply nested components.
- Keep components presentational where possible.
- Keep side effects in hooks/providers, not atoms.
- Prefer typed service APIs over direct access in components.
- Keep Tailwind utility usage consistent and avoid one-off style drift.

## Naming and File Hygiene
- Use stable, descriptive file names.
- Keep one main responsibility per file.
- Remove dead files and duplicate implementations.
- Keep barrel exports accurate or remove unused barrels.

## GitHub Workflow Baseline
- Use PR template and issue templates.
- Keep checks in CI (`typecheck` + `build`).
- Require review before merge.

## Deployment Baseline (Netlify)
- Build from root with `npm run build:client`.
- Publish `client/dist`.
- Add SPA redirect rule to `/index.html`.
