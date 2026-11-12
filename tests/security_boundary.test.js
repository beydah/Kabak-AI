// #region tests
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const F_Read_Client_Source = async (p_directory) => {
    const entries = await readdir(p_directory, { withFileTypes: true });
    const files = await Promise.all(entries.map(async (entry) => {
        const full_path = path.join(p_directory, entry.name);
        if (entry.isDirectory()) return F_Read_Client_Source(full_path);
        if (!/\.(ts|tsx|js|jsx)$/.test(entry.name)) return [];
        return [{ file: full_path, content: await readFile(full_path, 'utf8') }];
    }));
    return files.flat();
};

test('browser source has no Gemini SDK, key reference, or provider URL', async () => {
    const files = await F_Read_Client_Source(path.join(root, 'client', 'src'));
    const source = files.map(({ content }) => content).join('\n');
    assert.doesNotMatch(source, /VITE_GEMINI_API_KEY|GoogleGenerativeAI|GoogleGenAI/);
    assert.doesNotMatch(source, /generativelanguage\.googleapis\.com|\?key=/);
    assert.match(source, /\/api\/gemini/);
});

test('server proxy owns provider credentials and all production operations', async () => {
    const proxy = await readFile(path.join(root, 'netlify', 'functions', 'gemini.js'), 'utf8');
    assert.match(proxy, /process\.env\.GEMINI_API_KEY/);
    assert.doesNotMatch(proxy, /VITE_GEMINI_API_KEY/);
    for (const operation of ['generateContent', 'generateImagen', 'videoStart', 'videoPoll']) {
        assert.ok(proxy.includes(operation), `missing proxy operation ${operation}`);
    }
    assert.match(proxy, /path:\s*'\/api\/gemini'/);
});

test('environment template uses a server-only Gemini key name', async () => {
    const env_template = await readFile(path.join(root, '.env.example'), 'utf8');
    assert.match(env_template, /^GEMINI_API_KEY=/m);
    assert.doesNotMatch(env_template, /VITE_GEMINI_API_KEY/);
});
// #endregion
