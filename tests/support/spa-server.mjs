#!/usr/bin/env node

import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repositoryRoot = path.resolve(path.dirname(__filename), '../..');
const requestedRoot = process.env.RADAR_E2E_ROOT
    ? path.resolve(repositoryRoot, process.env.RADAR_E2E_ROOT)
    : repositoryRoot;
const requestedRootRelative = path.relative(repositoryRoot, requestedRoot);
if (requestedRootRelative.startsWith('..') || path.isAbsolute(requestedRootRelative)) {
    throw new Error('RADAR_E2E_ROOT deve permanecer dentro do repositório.');
}
const root = requestedRoot;
const port = Number(process.env.PORT || 4175);
const host = process.env.HOST || '127.0.0.1';

const MIME_TYPES = Object.freeze({
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
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

function isApplicationRoute(pathname) {
    if (pathname === '/') return true;
    if (STATIC_APPLICATION_ROUTES.has(pathname)) return true;
    return /^\/escolas\/[^/]+(?:\/pendencias(?:\/.*)?)?$/.test(pathname);
}

function resolveDeepAsset(pathname) {
    const directoryAsset = pathname.match(
        /^\/escolas\/(?:[^/]+\/)?(src|vendor|assets)\/(.+)$/
    );
    if (directoryAsset) {
        return `/${directoryAsset[1]}/${directoryAsset[2]}`;
    }

    const rootAsset = pathname.match(
        /^\/escolas\/(?:[^/]+\/)?(styles\.css|app\.js|config\.js|config\.runtime\.js|excel-sme-assets\.json)$/
    );
    return rootAsset ? `/${rootAsset[1]}` : null;
}

function safeFilePath(requestPath) {
    const normalized = path.posix.normalize(requestPath).replace(/^\/+/, '');
    const candidate = path.resolve(root, normalized || 'index.html');
    const relative = path.relative(root, candidate);
    if (relative.startsWith('..') || path.isAbsolute(relative)) return null;
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

const server = http.createServer(async (request, response) => {
    try {
        const url = new URL(request.url || '/', `http://${host}:${port}`);
        let requestPath = decodeURIComponent(url.pathname);
        const deepAsset = resolveDeepAsset(requestPath);
        if (deepAsset) requestPath = deepAsset;
        else if (isApplicationRoute(requestPath)) requestPath = '/index.html';

        const filePath = safeFilePath(requestPath);
        if (filePath && await serveFile(response, filePath, request.method)) return;

        response.writeHead(404, {
            'content-type': 'text/plain; charset=utf-8',
            'cache-control': 'no-store'
        });
        response.end('Not Found');
    } catch (error) {
        response.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
        response.end(error.message);
    }
});

server.listen(port, host, () => {
    console.log(`RADAR SPA test server listening at http://${host}:${port} from ${root}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => server.close(() => process.exit(0)));
}
