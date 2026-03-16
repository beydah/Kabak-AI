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
- Deployment (Netlify)
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
- React 18 + Vite 7
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
3. Start the client dev server.
```bash
npm run dev
```
4. Open `http://localhost:3000`.

## Environment Variables
Required:
- `VITE_GEMINI_API_KEY` - Google Gemini API key for text, image, and video flows.

Optional:
- `VITE_USERNAME` - basic auth username for the app.
- `VITE_PASSWORD` - basic auth password for the app.
- `VITE_EXCHANGE_RATE_API_KEY` - USD/TRY conversion in pricing widgets.

## Scripts
- `npm run dev` - start client dev server
- `npm run build:client` - build client bundle
- `npm run preview:client` - preview client build
- `npm run dev:server` - start server entry (optional)
- `npm run typecheck` - run TypeScript checks
- `npm run check` - typecheck + client build

## Deployment (Netlify)
- Build command: `npm run build:client`
- Publish directory: `client/dist`
- Required env vars: `VITE_GEMINI_API_KEY`

## Docs
- `docs/CONTRIBUTING.md`
- `docs/SECURITY.md`
- `docs/TESTING.md`
- `docs/MODELS.md`

## Security
See `docs/SECURITY.md`.

## Contributing
See `docs/CONTRIBUTING.md`.

## License
MIT License. See `LICENSE`.
