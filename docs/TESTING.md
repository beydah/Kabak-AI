# Testing

## Vercel migration (2026-11-12)
- `npm audit` — 0 vulnerabilities
- `npm run test:api` — 6 passed, including request-size limits, video URL validation, and the no-key 503 response; no Gemini provider request was made
- `npm run typecheck` — passed
- `npm run build:client` — passed; Vite reported the existing `__dirname`, chunk-size, and mixed dynamic-import warnings

## Automated (2026-03-16)
- npm.cmd run typecheck (pass)
- npm.cmd run build:client (pass; warnings about dynamic import chunking and chunk size over 500 kB)

## Manual Checklist (Pending)
- iOS Safari: HEIC and JPEG upload, product create, draft reload, IndexedDB fallback, video no-voice output
- Desktop Chrome/Firefox: product create, front/back generation
- Regeneration UX: edit product triggers new generation while old media stays visible with gray blur until replaced
- Prompt validation: brandless Starbucks-style cafe interior (no logos), New York street-level scene, single subject only, standing full-body
- Accessory validation: Maserati logo key fob, cash-filled wallet, thin black frame glasses with triangular orange lenses
- Video: no voice or dialogue; instrumental music only if any
