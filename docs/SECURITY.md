# Security Policy

## Supported Versions
Only the latest mainline version is supported for security fixes.

## Reporting a Vulnerability
Please report vulnerabilities privately:
- Email: `info.beydahsaglam@gmail.com`

Do not disclose vulnerabilities publicly before a fix is available.

## What to Include
- A clear description of the issue
- Reproduction steps
- Impact assessment
- Logs, screenshots, or proof-of-concept (if safe)

## Response Targets
- Initial response: within 48 hours
- Triage: within 5 business days
- Fix timeline: depends on severity and scope

## Security Baselines
- Keep dependencies updated
- Store `GEMINI_API_KEY` as a server-side Vercel environment variable; never use a `VITE_` prefix for it
- Route all Gemini text, image, and video operations through `api/gemini.js`
- Store generated media in a private Vercel Blob store and use short-lived signed read/delete links
- Enforce the Vercel function payload limit and the 20 MB video limit
- Validate file uploads and user input
- Restrict API keys and rotate when needed
