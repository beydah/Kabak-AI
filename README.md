# Kabak AI

Kabak AI is a React + Vite application for AI-assisted fashion content generation.
It helps teams generate product copy, mannequin visuals, and media assets from raw product images.

## Stack
- React 18
- Vite 7
- Tailwind CSS 3
- TypeScript
- Express (lightweight server entry)
- IndexedDB (local-first storage)

## Monorepo Layout
- `client/`: frontend app (React/Vite/Tailwind)
- `server/`: backend entry and controllers
- `shared/`: cross-layer constants and types
- `docs/`: architecture and operational docs
- `.github/`: issue and PR templates

## Quick Start
```bash
npm install
cp .env.example .env
npm run dev
```

Client runs on `http://localhost:3000` by default.

## Scripts
- `npm run dev`: run Vite dev server
- `npm run build`: build frontend
- `npm run preview:client`: preview frontend build
- `npm run dev:server`: run server entry with ts-node
- `npm run typecheck`: run TypeScript checks (client + server)
- `npm run check`: typecheck + frontend build

## Environment Variables
Create `.env` in repository root.

Required:
- `VITE_GEMINI_API_KEY`: Google Gemini API key

Optional:
- `VITE_USERNAME`: login username
- `VITE_PASSWORD`: login password
- `PORT`: server port (default `4000`)

## Deployment (Netlify)
`netlify.toml` is included with SPA redirect support:
- build command: `npm run build:client`
- publish directory: `client/dist`

See `docs/DEPLOYMENT_NETLIFY.md` for details.

## Engineering Docs
- `docs/ARCHITECTURE.md`
- `docs/PROJECT_STRUCTURE.md`
- `workflow.md`
- `CONTRIBUTING.md`
- `SECURITY.md`

## License
MIT. See `LICENSE`.
