import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleGenAI } from '@google/genai';

// #region constants
const MAX_REQUEST_BYTES = 5_500_000;
const MAX_IMAGE_CHARS = 4_500_000;
const MAX_PROMPT_CHARS = 30_000;
const MAX_VIDEO_PROMPT_CHARS = 8_000;
const MAX_VIDEO_BYTES = 20 * 1024 * 1024;
const ALLOWED_MODELS = new Set([
    'gemini-2.0-flash',
    'gemini-2.5-flash',
    'gemini-3-pro-image-preview',
]);
// #endregion

// #region helpers
const F_Json_Response = (p_status, p_body) => new Response(JSON.stringify(p_body), {
    status: p_status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

const F_Get_Api_Key = () => process.env.GEMINI_API_KEY;

const F_Validate_Contents = (p_contents) => {
    const parts = typeof p_contents === 'string' ? [{ text: p_contents }] : p_contents;
    if (!Array.isArray(parts) || parts.length < 1 || parts.length > 5) return false;

    let text_size = 0;
    for (const part of parts) {
        if (!part || typeof part !== 'object' || Array.isArray(part)) return false;
        if (typeof part.text === 'string') {
            text_size += part.text.length;
        } else if (part.inlineData && typeof part.inlineData === 'object') {
            const { data, mimeType } = part.inlineData;
            if (typeof data !== 'string' || data.length === 0 || data.length > MAX_IMAGE_CHARS ||
                !['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) return false;
        } else {
            return false;
        }
    }
    return text_size <= MAX_PROMPT_CHARS;
};

const F_Get_Validated_Video_Uri = (p_uri) => {
    if (typeof p_uri !== 'string' || p_uri.length > 2048) return null;
    try {
        const uri = new URL(p_uri);
        if (uri.protocol !== 'https:' || uri.hostname !== 'generativelanguage.googleapis.com' ||
            !uri.pathname.startsWith('/v1beta/files/') || uri.searchParams.has('key')) return null;
        return uri;
    } catch {
        return null;
    }
};

const F_Get_Video_Response = async (p_uri, p_api_key) => {
    const uri = F_Get_Validated_Video_Uri(p_uri);
    if (!uri) return F_Json_Response(400, { error: 'Invalid video resource.' });
    uri.searchParams.set('key', p_api_key);

    const provider_response = await fetch(uri, { method: 'GET' });
    if (!provider_response.ok || !provider_response.body) {
        return F_Json_Response(502, { error: 'Video download failed.' });
    }

    const content_length = Number(provider_response.headers.get('content-length') || 0);
    if (content_length > MAX_VIDEO_BYTES) {
        return F_Json_Response(413, { error: 'Generated video exceeds the supported download size.' });
    }

    const content_type = provider_response.headers.get('content-type') || 'video/mp4';
    if (!content_type.startsWith('video/') && content_type !== 'application/octet-stream') {
        return F_Json_Response(502, { error: 'Video provider returned an unsupported content type.' });
    }

    return new Response(provider_response.body, {
        status: 200,
        headers: {
            'content-type': content_type,
            'cache-control': 'no-store',
        },
    });
};

const F_Get_Operation_Name = (p_name) => typeof p_name === 'string' &&
    p_name.length <= 500 && /^(?:models\/[A-Za-z0-9_.-]+\/)?operations\/[A-Za-z0-9_-]+$/.test(p_name);
// #endregion

// #region handler
export default async (request) => {
    if (request.method === 'GET') {
        const uri = new URL(request.url).searchParams.get('videoUri');
        const api_key = F_Get_Api_Key();
        if (!api_key) return F_Json_Response(500, { error: 'Server Gemini API key is not configured.' });
        return F_Get_Video_Response(uri, api_key);
    }
    if (request.method !== 'POST') return F_Json_Response(405, { error: 'Method not allowed.' });

    const content_length = Number(request.headers.get('content-length') || 0);
    if (content_length > MAX_REQUEST_BYTES) {
        return F_Json_Response(413, { error: 'Request body is too large.' });
    }

    let payload;
    try {
        const body = await request.text();
        if (Buffer.byteLength(body, 'utf8') > MAX_REQUEST_BYTES) {
            return F_Json_Response(413, { error: 'Request body is too large.' });
        }
        payload = JSON.parse(body);
    } catch {
        return F_Json_Response(400, { error: 'Request body must be valid JSON.' });
    }

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        return F_Json_Response(400, { error: 'Request body must be a JSON object.' });
    }

    const api_key = F_Get_Api_Key();
    if (!api_key) return F_Json_Response(500, { error: 'Server Gemini API key is not configured.' });

    try {
        if (payload.operation === 'generateContent') {
            const model_name = typeof payload.model === 'string' ? payload.model.replace(/^models\//, '') : '';
            if (!ALLOWED_MODELS.has(model_name) || !F_Validate_Contents(payload.contents)) {
                return F_Json_Response(400, { error: 'Invalid generation request.' });
            }
            const generation_config = payload.generationConfig;
            if (generation_config !== undefined &&
                (!generation_config || typeof generation_config !== 'object' ||
                    Object.keys(generation_config).some((key) => key !== 'responseMimeType'))) {
                return F_Json_Response(400, { error: 'Invalid generation configuration.' });
            }

            const gen_ai = new GoogleGenerativeAI(api_key);
            const model = gen_ai.getGenerativeModel({ model: model_name, generationConfig: generation_config });
            const result = await model.generateContent(payload.contents);
            const response = await result.response;
            let text = '';
            try { text = response.text(); } catch { /* Image-only responses may not include text. */ }
            const output = JSON.stringify({ text, candidates: response.candidates || [] });
            if (Buffer.byteLength(output, 'utf8') > MAX_REQUEST_BYTES) {
                return F_Json_Response(502, { error: 'Generated response exceeds the supported size.' });
            }
            return new Response(output, {
                status: 200,
                headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
            });
        }

        if (payload.operation === 'generateImagen') {
            if (typeof payload.prompt !== 'string' || payload.prompt.trim().length === 0 ||
                payload.prompt.length > MAX_PROMPT_CHARS) {
                return F_Json_Response(400, { error: 'Invalid image prompt.' });
            }
            const provider_response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=${encodeURIComponent(api_key)}`,
                {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({
                        instances: [{ prompt: payload.prompt }],
                        parameters: { sampleCount: 1, aspectRatio: '3:4', personGeneration: 'allow_adult' },
                    }),
                },
            );
            if (!provider_response.ok) return F_Json_Response(502, { error: 'Image provider request failed.' });
            const data = await provider_response.json();
            const image_data = data.predictions?.[0]?.bytesBase64Encoded;
            if (typeof image_data !== 'string' || image_data.length > MAX_IMAGE_CHARS) {
                return F_Json_Response(502, { error: 'Image provider returned an invalid image.' });
            }
            return F_Json_Response(200, { data_url: `data:image/jpeg;base64,${image_data}` });
        }

        if (payload.operation === 'videoStart') {
            if (typeof payload.prompt !== 'string' || payload.prompt.trim().length === 0 ||
                payload.prompt.length > MAX_VIDEO_PROMPT_CHARS || typeof payload.imageBytes !== 'string' ||
                payload.imageBytes.length === 0 || payload.imageBytes.length > MAX_IMAGE_CHARS ||
                payload.mimeType !== 'image/jpeg') {
                return F_Json_Response(400, { error: 'Invalid video generation request.' });
            }
            const gen_ai = new GoogleGenAI({ apiKey: api_key });
            const operation = await gen_ai.models.generateVideos({
                model: 'veo-3.1-generate-preview',
                prompt: payload.prompt,
                image: { imageBytes: payload.imageBytes, mimeType: payload.mimeType },
                config: { aspectRatio: '9:16', resolution: '1080p' },
            });
            return F_Json_Response(200, { operationName: operation.name, done: operation.done === true });
        }

        if (payload.operation === 'videoPoll') {
            if (!F_Get_Operation_Name(payload.operationName)) {
                return F_Json_Response(400, { error: 'Invalid video operation.' });
            }
            const gen_ai = new GoogleGenAI({ apiKey: api_key });
            const operation = await gen_ai.operations.getVideosOperation({
                operation: { name: payload.operationName },
            });
            const uri = operation.response?.generatedVideos?.[0]?.video?.uri || '';
            return F_Json_Response(200, {
                done: operation.done === true,
                error: Boolean(operation.error),
                raiMediaFilteredReasons: operation.response?.raiMediaFilteredReasons || [],
                uri,
            });
        }

        return F_Json_Response(400, { error: 'Unsupported Gemini operation.' });
    } catch {
        return F_Json_Response(502, { error: 'Gemini provider request failed.' });
    }
};

export const config = {
    path: '/api/gemini',
    rateLimit: {
        action: 'rate_limit',
        aggregateBy: 'ip',
        windowLimit: 30,
        windowSize: 60,
    },
};
// #endregion
