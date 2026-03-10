# Kabak AI

[![License](https://img.shields.io/github/license/beydah/Kabak-AI)](LICENSE)
[![Last Commit](https://img.shields.io/github/last-commit/beydah/Kabak-AI)](https://github.com/beydah/Kabak-AI/commits/main)
[![Issues](https://img.shields.io/github/issues/beydah/Kabak-AI)](https://github.com/beydah/Kabak-AI/issues)
[![Stars](https://img.shields.io/github/stars/beydah/Kabak-AI)](https://github.com/beydah/Kabak-AI/stargazers)

AI-assisted fashion content workflow for e-commerce teams. Kabak AI converts raw product photos into SEO-ready copy, AI model visuals, and short video previews using a local-first UI and IndexedDB storage.

## Table of Contents
- Overview
- Features
- Tech Stack
- Quickstart
- Environment
- Scripts
- Deployment (Netlify)
- Security
- Contributing
- License

## Overview
Kabak AI helps teams turn raw product imagery into consistent, on-brand visuals and content. It includes a landing page for model usage and pricing visibility, and a collection workflow for product generation and review.

## Features
- Local-first storage with IndexedDB for product data and media
- AI image generation for front and back views
- AI video preview generation per product
- Usage analytics for requests and estimated costs
- TR/EN localization
- Tailwind-based responsive UI

## Tech Stack
- React 18
- Vite 7
- Tailwind CSS 3
- TypeScript
- Express (server entry)
- Google GenAI SDKs

## Quickstart
1. Install dependencies.
```bash
npm install
```
2. Create environment file.
```bash
copy .env.example .env
```
3. Start the dev server.
```bash
npm run dev
```
4. Open `http://localhost:3000`.

## Environment
Required:
- `VITE_GEMINI_API_KEY`

Optional:
- `VITE_USERNAME`
- `VITE_PASSWORD`

## Scripts
- `npm run dev`
- `npm run build:client`
- `npm run preview:client`
- `npm run dev:server`
- `npm run typecheck`
- `npm run check`

## Deployment (Netlify)
`netlify.toml` is configured for SPA deployment.
- Build command: `npm run build:client`
- Publish directory: `client/dist`

## Security
See `docs/SECURITY.md`.

## Contributing
See `docs/CONTRIBUTING.md`.

## License
MIT License. See `LICENSE`.