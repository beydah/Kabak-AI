# Testing

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
