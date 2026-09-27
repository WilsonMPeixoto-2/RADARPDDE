#!/usr/bin/env node

import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
export const repositoryRoot = path.resolve(path.dirname(__filename), '..');

export const MIME_TYPES = Object.freeze({
    '.avif': 'image/avif',
    '.css': 'text/css; charset=utf-8',
    '.gif': 'image/gif',
    '.html': 'text/html; charset=utf-8',
    '.ico': 'image/x-icon',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain; charset=utf-8',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.xml': 'application/xml; charset=utf-8'
});

const STATIC_APPLICATION_ROUTES = new Set([
    '/dashboard',
    '/carteira',
    '/competencias',
    '/pendencias',
    '/inventario',
    '/auditoria',
    '/equipe',
    '/gestao-sme'
]);

export function isApplicationRoute(pathname) {
    if (pathname === '/') return true;
    if (STATIC_APPLICATION_ROUTES.has(pathname)) return true;
    return /^\/escolas\/[^/]+(?:\/pendencias(?:\/.*)?)?$/.test(pathname);
}

export function resolveDeepAsset(pathname) {
    const directoryAsset = pathname.match(
        /^\/escolas\/(?:[^/]+\/)?(src|vendor|assets)\/(.+)$/
    );
    if (directoryAsset) return `/${directoryAsset[1]}/${directoryAsset[2]}`;

    const rootAsset = pathname.match(
        /^\/escolas\/(?:[^/]+\/)?(styles\.css|app\.js|config\.js|config\.runtime\.js|excel-sme-assets\.json)$/
    );
    return rootAsset ? `/${rootAsset[1]}` : null;
}

export function resolveServeRoot(
    requestedRoot = process.env.RADAR_SERVE_ROOT || process.env.RADAR_E2E_ROOT || '.',
    repoRoot = repositoryRoot
) {
    const candidate = path.resolve(repoRoot, requestedRoot);
    const relative = path.relative(repoRoot, candidate);
    if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
        throw new Error('RADAR_SERVE_ROOT/RADAR_E2E_ROOT deve permanecer dentro do repositório.');
    }
    return candidate;
}

export function safeFilePath(root, requestPath) {
    const normalized = path.posix.normalize(requestPath).replace(/^\/+/, '');
    const candidate = path.resolve(root, normalized || 'index.html');
    const relative = path.relative(root, candidate);
    if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) return null;
    return candidate;
}

async function serveFile(response, filePath, method) {
    const metadata = await fs.stat(filePath).catch(() => null);
    if (!metadata?.isFile()) return false;

    const extension = path.extname(filePath).toLowerCase();
    response.writeHead(200, {
        'content-type': MIME_TYPES[extension] || 'application/octet-stream',
        'cache-control': 'no-store'
    });
    if (method === 'HEAD') {
        response.end();
        return true;
    }
    response.end(await fs.readFile(filePath));
    return true;
}

export function createRadarRequestHandler({ root }) {
    return async (request, response) => {
        try {
            const url = new URL(request.url || '/', 'http://radar.local');
            let requestPath = decodeURIComponent(url.pathname);
            const deepAsset = resolveDeepAsset(requestPath);
            if (deepAsset) requestPath = deepAsset;
            else if (isApplicationRoute(requestPath)) requestPath = '/index.html';

            const filePath = safeFilePath(root, requestPath);
            if (filePath && await serveFile(response, filePath, request.method)) return;

            response.writeHead(404, {
                'content-type': 'text/plain; charset=utf-8',
                'cache-control': 'no-store'
            });
            response.end('Not Found');
        } catch (error) {
            response.writeHead(500, {
                'content-type': 'text/plain; charset=utf-8',
                'cache-control': 'no-store'
            });
            response.end(error instanceof Error ? error.message : String(error));
        }
    };
}

export async function startRadarServer({
    root = resolveServeRoot(),
    port = Number(process.env.PORT || 4175),
    host = process.env.HOST || '127.0.0.1',
    log = true
} = {}) {
    if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error(`PORT inválida: ${port}`);

    const server = http.createServer(createRadarRequestHandler({ root }));
    await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, host, resolve);
    });

    if (log) {
        const address = server.address();
        const actualPort = typeof address === 'object' && address ? address.port : port;
        console.log(`RADAR SPA server listening at http://${host}:${actualPort} from ${root}`);
    }
    return server;
}

export async function runRadarServerCli() {
    const server = await startRadarServer();
    for (const signal of ['SIGINT', 'SIGTERM']) {
        process.on(signal, () => server.close(() => process.exit(0)));
    }
    return server;
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : null;
if (invokedPath === import.meta.url) {
    runRadarServerCli().catch(error => {
        console.error(error);
        process.exitCode = 1;
    });
}
