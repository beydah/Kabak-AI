# Kabak AI

[![License](https://img.shields.io/github/license/beydah/Kabak-AI)](LICENSE)
[![Last Commit](https://img.shields.io/github/last-commit/beydah/Kabak-AI)](https://github.com/beydah/Kabak-AI/commits/main)
[![Issues](https://img.shields.io/github/issues/beydah/Kabak-AI)](https://github.com/beydah/Kabak-AI/issues)
[![Stars](https://img.shields.io/github/stars/beydah/Kabak-AI)](https://github.com/beydah/Kabak-AI/stargazers)

Kabak AI is a local-first, AI-powered fashion visualization workflow. It turns raw product photos into SEO-ready copy, model-on-mannequin visuals (front/back), and optional video previews using modern GenAI models.

## Table of Contents
- Overview
- Highlights
- Tech Stack
- Quickstart
- Environment Variables
- Scripts
- Deployment (Vercel)
- Docs
- Security
- Contributing
- License

## Overview
Kabak AI helps e-commerce teams generate consistent, on-brand visuals and content from raw product imagery. The app includes a public landing page for model usage and pricing visibility, plus an authenticated collection workflow for product generation and review.

## Highlights
- Local-first storage using IndexedDB with safe localStorage fallback
- Multi-step AI pipeline: analysis -> SEO -> front/back generation -> optional video
- Regeneration workflow with pending/blur UI and real-time updates
- TR/EN localization
- Landing page with live model usage and cost simulation
- iOS-friendly image normalization (HEIC/HEIF -> JPEG)

## Tech Stack
- React 18 + Vite 8
- TypeScript
- Tailwind CSS
- Express (optional server entry)
- Google GenAI SDKs (Gemini, Imagen, Veo)

## Quickstart
1. Install dependencies.
```bash
npm install
```
2. Create environment file.
```bash
copy .env.example .env
```
3. Start the Vercel development server so local requests reach the serverless function.
```bash
npx vercel dev
```
4. Open the URL shown by Vercel CLI.

## Environment Variables
Required on the server only:
- `GEMINI_API_KEY` - Google Gemini API key used by the Vercel function proxy. Add it in Vercel when you are ready to enable AI requests. Do not prefix it with `VITE_`.
- Vercel Blob - a private Blob store is required for generated image and video media. Connect the store to the Vercel project; Vercel manages its credentials.

Optional:
- `VITE_USERNAME` - basic auth username for the app.
- `VITE_PASSWORD` - basic auth password for the app.
- `VITE_EXCHANGE_RATE_API_KEY` - USD/TRY conversion in pricing widgets.

## Scripts
- `npm run dev` - start client dev server
- `npx vercel dev` - run Vite and Vercel Functions together for local AI flows
- `npm run build:client` - build client bundle
- `npm run preview:client` - preview client build
- `npm run dev:server` - start server entry (optional)
- `npm run typecheck` - run TypeScript checks
- `npm run check` - typecheck + client build

## Deployment (Vercel)
- Build command: `npm run build:client`
- Publish directory: `client/dist`
- Function: `api/gemini.js` (Node.js; maximum duration 60 seconds)
- Required server env var: `GEMINI_API_KEY` (not configured yet)
- Connect a private Vercel Blob store for generated media. The API returns short-lived signed media links; the browser fetches media directly from Blob storage, then requests deletion.
- Function JSON requests are capped below Vercel's 4.5 MB payload limit. Video files are capped at 20 MB, streamed from the provider to private Blob storage, and never returned as function response bodies.
- `vercel.json` rewrites client-side routes to the Vite application entrypoint.

## Docs
- `docs/CONTRIBUTING.md`
- `docs/SECURITY.md`
- `docs/TESTING.md`
- `docs/MODELS.md`
- `docs/TESTING.md`

## Security
See `docs/SECURITY.md`.

## Contributing
See `docs/CONTRIBUTING.md`.

## License
MIT License. See `LICENSE`.
