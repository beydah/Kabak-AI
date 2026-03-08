# Product Pipeline Workflow

This document describes the product processing pipeline used by Kabak AI.

## Pipeline Stages
1. Input collection
- Front/back product images are uploaded.
- Product attributes and free-text description are collected.

2. Visual analysis
- Front and back images are analyzed for product details.
- Analysis output is stored and reused in downstream stages.

3. SEO copy generation
- Title and description are generated from user input + visual analysis.
- Language preference is applied (`tr` or `en`).

4. Front image generation
- Primary mannequin image is generated from product context.

5. Back image generation
- Back image is generated using front output for consistency.

6. Completion or failure
- Successful jobs are marked `finished`.
- Failed jobs are marked `failed`/`exited` with error metadata.

## Runtime Guarantees
- Active jobs are polled and processed in chain order.
- Retry and timeout guards prevent infinite loops.
- Job status is persisted in IndexedDB.

## Storage Model
- Products, draft state, logs, and metrics are stored in IndexedDB.
- Preferences are synced via cookie + localStorage fallback.
