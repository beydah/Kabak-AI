import { randomUUID } from 'node:crypto';
import { issueSignedToken, presignUrl, put } from '@vercel/blob';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleGenAI } from '@google/genai';

const MAX_REQUEST_BYTES = 4_000_000;
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_IMAGE_CHARS = 3_500_000;
const MAX_PROMPT_CHARS = 30_000;
const MAX_VIDEO_PROMPT_CHARS = 8_000;
const MAX_VIDEO_BYTES = 20 * 1024 * 1024;
const SIGNED_MEDIA_TTL_MS = 30 * 60 * 1000;
const ALLOWED_MODELS = new Set([
    'gemini-2.0-flash',
    'gemini-2.5-flash',
    'gemini-3-pro-image-preview',
]);

const F_Send_Json = (response, status, body) => {
    response.statusCode = status;
    response.setHeader('content-type', 'application/json; charset=utf-8');
    response.setHeader('cache-control', 'no-store');
    response.end(JSON.stringify(body));
};

const F_Read_Body = async (request) => {
    const header_length = Number(request.headers['content-length'] || 0);
    if (header_length > MAX_REQUEST_BYTES) {
        const error = new Error('Request body is too large.');
        error.statusCode = 413;
        throw error;
    }

    const chunks = [];
    let size = 0;
    for await (const chunk of request) {
        const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        size += bytes.length;
        if (size > MAX_REQUEST_BYTES) {
            const error = new Error('Request body is too large.');
            error.statusCode = 413;
            throw error;
        }
        chunks.push(bytes);
    }

    try {
        return JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch {
        const error = new Error('Request body must be valid JSON.');
        error.statusCode = 400;
        throw error;
    }
};

const F_Get_Api_Key = () => process.env.GEMINI_API_KEY;

export const F_Validate_Contents = (contents) => {
    const parts = typeof contents === 'string' ? [{ text: contents }] : contents;
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

export const F_Get_Validated_Video_Uri = (value) => {
    if (typeof value !== 'string' || value.length > 2048) return null;
    try {
        const uri = new URL(value);
        if (uri.protocol !== 'https:' || uri.hostname !== 'generativelanguage.googleapis.com' ||
            !/^\/v1beta\/files\/[a-zA-Z0-9_-]+:download$/.test(uri.pathname) || uri.searchParams.has('key')) {
            return null;
        }
        return uri;
    } catch {
        return null;
    }
};

export const F_Get_Operation_Name = (name) => typeof name === 'string' &&
    name.length <= 500 && /^(?:models\/[A-Za-z0-9_.-]+\/)?operations\/[A-Za-z0-9_-]+$/.test(name);

const F_Create_Media_Links = async (pathname) => {
    const valid_until = Date.now() + SIGNED_MEDIA_TTL_MS;
    const token = await issueSignedToken({
        pathname,
        operations: ['get', 'delete'],
        validUntil: valid_until,
    });
    const [{ presignedUrl: media_url }, { presignedUrl: delete_url }] = await Promise.all([
        presignUrl(token, { operation: 'get', pathname, access: 'private', validUntil: valid_until }),
        presignUrl(token, { operation: 'delete', pathname, access: 'private', validUntil: valid_until }),
    ]);
    return { media_url, delete_url, media_pathname: pathname };
};

const F_Store_Media = async (body, content_type, extension) => {
    const pathname = `generated/${Date.now()}-${randomUUID()}.${extension}`;
    const blob = await put(pathname, body, {
        access: 'private',
        addRandomSuffix: false,
        contentType: content_type,
        cacheControlMaxAge: 60,
        multipart: content_type.startsWith('video/'),
    });
    return F_Create_Media_Links(blob.pathname);
};

const F_Move_Inline_Images_To_Blob = async (candidates) => {
    for (const candidate of candidates) {
        for (const part of candidate.content?.parts || []) {
            const inline_data = part.inlineData;
            if (typeof inline_data?.data !== 'string') continue;

            const bytes = Buffer.from(inline_data.data, 'base64');
            if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) {
                throw new Error('Generated image exceeds the supported size.');
            }
            const content_type = ['image/png', 'image/webp'].includes(inline_data.mimeType)
                ? inline_data.mimeType
                : 'image/jpeg';
            const extension = content_type === 'image/png' ? 'png' : content_type === 'image/webp' ? 'webp' : 'jpg';
            const media = await F_Store_Media(bytes, content_type, extension);
            part.inlineData = { mimeType: content_type, ...media };
        }
    }
    return candidates;
};

const F_Get_Video_Media = async (uri_value, api_key) => {
    const uri = F_Get_Validated_Video_Uri(uri_value);
    if (!uri) return { status: 400, body: { error: 'Invalid video resource.' } };
    uri.searchParams.set('key', api_key);

    const provider_response = await fetch(uri, { method: 'GET' });
    if (!provider_response.ok || !provider_response.body) {
        return { status: 502, body: { error: 'Video download failed.' } };
    }

    const content_length = Number(provider_response.headers.get('content-length') || 0);
    if (content_length > MAX_VIDEO_BYTES) {
        return { status: 413, body: { error: 'Generated video exceeds the 20 MB storage limit.' } };
    }
    const content_type = provider_response.headers.get('content-type') || 'video/mp4';
    if (!content_type.startsWith('video/') && content_type !== 'application/octet-stream') {
        return { status: 502, body: { error: 'Video provider returned an unsupported content type.' } };
    }

    const reader = provider_response.body.getReader();
    const chunks = [];
    let total_bytes = 0;
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        total_bytes += value.byteLength;
        if (total_bytes > MAX_VIDEO_BYTES) {
            await reader.cancel();
            return { status: 413, body: { error: 'Generated video exceeds the 20 MB storage limit.' } };
        }
        chunks.push(Buffer.from(value));
    }
    if (total_bytes === 0) return { status: 502, body: { error: 'Video provider returned an empty file.' } };
    const extension = content_type === 'video/webm' ? 'webm' : 'mp4';
    const media = await F_Store_Media(Buffer.concat(chunks), content_type, extension);
    return { status: 200, body: media };
};

const F_Get_Query_Value = (request, name) => {
    const query_value = request.query?.[name];
    if (typeof query_value === 'string') return query_value;
    try {
        return new URL(request.url, 'https://kabak-ai.vercel.app').searchParams.get(name);
    } catch {
        return null;
    }
};

export default async function handler(request, response) {
    if (request.method === 'OPTIONS') {
        response.setHeader('allow', 'GET, POST, OPTIONS');
        response.statusCode = 204;
        response.end();
        return;
    }

    if (request.method === 'GET') {
        const uri = F_Get_Query_Value(request, 'videoUri');
        if (!F_Get_Validated_Video_Uri(uri)) {
            F_Send_Json(response, 400, { error: 'Invalid video resource.' });
            return;
        }
        const api_key = F_Get_Api_Key();
        if (!api_key) {
            F_Send_Json(response, 503, { error: 'Gemini API key is not configured yet.' });
            return;
        }
        const result = await F_Get_Video_Media(uri, api_key);
        F_Send_Json(response, result.status, result.body);
        return;
    }

    if (request.method !== 'POST') {
        response.setHeader('allow', 'GET, POST, OPTIONS');
        F_Send_Json(response, 405, { error: 'Method not allowed.' });
        return;
    }

    let payload;
    try {
        payload = await F_Read_Body(request);
    } catch (error) {
        F_Send_Json(response, error.statusCode || 400, { error: error.message });
        return;
    }
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        F_Send_Json(response, 400, { error: 'Request body must be a JSON object.' });
        return;
    }

    const api_key = F_Get_Api_Key();
    if (!api_key) {
        F_Send_Json(response, 503, { error: 'Gemini API key is not configured yet.' });
        return;
    }

    try {
        if (payload.operation === 'generateContent') {
            const model_name = typeof payload.model === 'string' ? payload.model.replace(/^models\//, '') : '';
            if (!ALLOWED_MODELS.has(model_name) || !F_Validate_Contents(payload.contents)) {
                F_Send_Json(response, 400, { error: 'Invalid generation request.' });
                return;
            }
            const generation_config = payload.generationConfig;
            if (generation_config !== undefined &&
                (!generation_config || typeof generation_config !== 'object' ||
                    Object.keys(generation_config).some((key) => key !== 'responseMimeType'))) {
                F_Send_Json(response, 400, { error: 'Invalid generation configuration.' });
                return;
            }

            const gen_ai = new GoogleGenerativeAI(api_key);
            const model = gen_ai.getGenerativeModel({ model: model_name, generationConfig: generation_config });
            const result = await model.generateContent(payload.contents);
            const provider_response = await result.response;
            let text = '';
            try { text = provider_response.text(); } catch { /* Image-only responses have no text. */ }
            const candidates = await F_Move_Inline_Images_To_Blob(provider_response.candidates || []);
            F_Send_Json(response, 200, { text, candidates });
            return;
        }

        if (payload.operation === 'generateImagen') {
            if (typeof payload.prompt !== 'string' || payload.prompt.trim().length === 0 ||
                payload.prompt.length > MAX_PROMPT_CHARS) {
                F_Send_Json(response, 400, { error: 'Invalid image prompt.' });
                return;
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
            if (!provider_response.ok) {
                F_Send_Json(response, 502, { error: 'Image provider request failed.' });
                return;
            }
            const data = await provider_response.json();
            const image_data = data.predictions?.[0]?.bytesBase64Encoded;
            if (typeof image_data !== 'string' || image_data.length > MAX_IMAGE_CHARS) {
                F_Send_Json(response, 502, { error: 'Image provider returned an invalid image.' });
                return;
            }
            const bytes = Buffer.from(image_data, 'base64');
            if (bytes.length > MAX_IMAGE_BYTES) {
                F_Send_Json(response, 413, { error: 'Generated image exceeds the storage limit.' });
                return;
            }
            const media = await F_Store_Media(bytes, 'image/jpeg', 'jpg');
            F_Send_Json(response, 200, media);
            return;
        }

        if (payload.operation === 'videoStart') {
            if (typeof payload.prompt !== 'string' || payload.prompt.trim().length === 0 ||
                payload.prompt.length > MAX_VIDEO_PROMPT_CHARS || typeof payload.imageBytes !== 'string' ||
                payload.imageBytes.length === 0 || payload.imageBytes.length > MAX_IMAGE_CHARS ||
                payload.mimeType !== 'image/jpeg') {
                F_Send_Json(response, 400, { error: 'Invalid video generation request.' });
                return;
            }
            const gen_ai = new GoogleGenAI({ apiKey: api_key });
            const operation = await gen_ai.models.generateVideos({
                model: 'veo-3.1-generate-preview',
                prompt: payload.prompt,
                image: { imageBytes: payload.imageBytes, mimeType: payload.mimeType },
                config: { aspectRatio: '9:16', resolution: '1080p' },
            });
            F_Send_Json(response, 200, { operationName: operation.name, done: operation.done === true });
            return;
        }

        if (payload.operation === 'videoPoll') {
            if (!F_Get_Operation_Name(payload.operationName)) {
                F_Send_Json(response, 400, { error: 'Invalid video operation.' });
                return;
            }
            const gen_ai = new GoogleGenAI({ apiKey: api_key });
            const operation = await gen_ai.operations.getVideosOperation({
                operation: { name: payload.operationName },
            });
            const uri = operation.response?.generatedVideos?.[0]?.video?.uri || '';
            F_Send_Json(response, 200, {
                done: operation.done === true,
                error: Boolean(operation.error),
                raiMediaFilteredReasons: operation.response?.raiMediaFilteredReasons || [],
                uri,
            });
            return;
        }

        F_Send_Json(response, 400, { error: 'Unsupported Gemini operation.' });
    } catch (error) {
        const message = error?.message || '';
        if (/blob|storage|oidc|store/i.test(message)) {
            F_Send_Json(response, 503, { error: 'Private media storage is not connected to this deployment.' });
            return;
        }
        F_Send_Json(response, 502, { error: 'Gemini provider request failed.' });
    }
}

export const config = {
    api: { bodyParser: false },
    maxDuration: 60,
};
