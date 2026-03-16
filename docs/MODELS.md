# Models

## Image Generation
- Primary: models/gemini-3-pro-image-preview (front/back, image-to-image)
- Fallback: imagen-4.0-fast-generate-001 (text-to-image)
- QC + analysis: gemini-2.0-flash
- SEO: gemini-2.5-flash

## Video Generation
- Model: veo-3.1-generate-preview
- Config: aspectRatio 9:16, resolution 1080p, compressionQuality LOSSLESS, generateAudio false
- Prompt constraints: standing full-body, single subject only, no other people, no voice/no audio

## Shared Prompt Constraints
- Full-body, standing, single subject only; no other people in frame.
- Cafe background: Starbucks cafe interior.
- Urban background: New York city skyline/cityscape.
- Accessory detail: Maserati logo visible key fob.
- Accessory detail: Open wallet filled with cash.
- Accessory detail: Thin black frame glasses with triangular orange lenses.
- Accessory detail: Bag is a business briefcase (male) or a classic women's handbag (female).

## Notes
- Structured prompts are used for Gemini and Imagen fallback to keep constraints consistent.
