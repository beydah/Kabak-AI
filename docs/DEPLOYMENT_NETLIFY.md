# Netlify Deployment

## Build Settings
Use repository root as base directory.

- Build command: `npm run build:client`
- Publish directory: `client/dist`

`netlify.toml` already defines these values.

## Required Environment Variables
Set in Netlify dashboard:
- `VITE_GEMINI_API_KEY`
- `VITE_USERNAME` (optional)
- `VITE_PASSWORD` (optional)

## SPA Routing
Single-page app routing is enabled via redirect:
- `/* -> /index.html (200)`

## Recommended Post-Deploy Checks
1. Open `/`
2. Refresh a nested route like `/collection`
3. Validate login flow and product form save
4. Validate API-dependent actions with real env keys
