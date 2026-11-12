import { Readable } from 'node:stream';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import handler, { F_Get_Validated_Video_Uri, F_Validate_Contents } from '../../api/gemini.js';

const F_Invoke = async ({ method = 'GET', url = '/', body = '' } = {}) => {
    const request = Readable.from(body ? [Buffer.from(body)] : []);
    request.method = method;
    request.url = url;
    request.headers = {};
    const response = {
        headers: {},
        setHeader(name, value) { this.headers[name] = value; },
        end(value = '') { this.body = value; },
    };
    await handler(request, response);
    return response;
};

test('accepts text and supported inline images within the request contract', () => {
    assert.equal(F_Validate_Contents([{ text: 'Describe this garment.' }, {
        inlineData: { data: 'aGVsbG8=', mimeType: 'image/jpeg' },
    }]), true);
});

test('rejects unsupported inline image types', () => {
    assert.equal(F_Validate_Contents([{ inlineData: { data: 'aGVsbG8=', mimeType: 'image/svg+xml' } }]), false);
});

test('rejects provider URLs outside the validated video download path', () => {
    assert.equal(F_Get_Validated_Video_Uri('https://example.com/file'), null);
    assert.equal(F_Get_Validated_Video_Uri('https://generativelanguage.googleapis.com/v1beta/files/abc:download?key=secret'), null);
});

test('returns no-store JSON for unsupported methods', async () => {
    const response = await F_Invoke({ method: 'PUT' });
    assert.equal(response.statusCode, 405);
    assert.equal(response.headers.allow, 'GET, POST, OPTIONS');
    assert.equal(response.headers['cache-control'], 'no-store');
});

test('rejects request bodies above the configured function-safe limit', async () => {
    const response = await F_Invoke({ method: 'POST', body: ' '.repeat(4_000_001) });
    assert.equal(response.statusCode, 413);
});

test('returns a clean unavailable response when Gemini is not configured', async () => {
    delete process.env.GEMINI_API_KEY;
    const response = await F_Invoke({ method: 'GET', url: '/api/gemini?videoUri=https%3A%2F%2Fgenerativelanguage.googleapis.com%2Fv1beta%2Ffiles%2Fabc%3Adownload' });
    assert.equal(response.statusCode, 503);
    assert.match(response.body, /not configured yet/i);
});
