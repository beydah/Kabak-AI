# Testing Notes

## Last Run
- Date: 2026-03-10
- Commands:
  - `npm.cmd run typecheck`
  - `npm.cmd run build:client`
  - `npm.cmd audit --omit=dev`

## Results
- Typecheck: Passed
- Build: Passed (Vite warns about chunk size and mixed static/dynamic import for `gemini_service.ts`)
- Audit: 0 vulnerabilities

## Security Checks
- Static scan (client/src, server, shared, docs, scripts) for `dangerouslySetInnerHTML`, `eval(`, `new Function`, `innerHTML`: no usage in source; matches only in docs/comments.
- Secret scan (same scope, excluding `client/dist`) for API key patterns: references to `VITE_GEMINI_API_KEY` only; no key strings found.
