const BUILTIN_ALLOWED_ORIGINS = Object.freeze([
    'https://radarpdde-fix.vercel.app',
    'https://radarpdde-fix-wilson-m-peixotos-projects.vercel.app',
    'https://radarpdde-fix-git-main-wilson-m-peixotos-projects.vercel.app'
]);

function text(value) {
    return value == null ? '' : String(value).trim();
}

export function normalizeOrigin(value) {
    const candidate = text(value);
    if (!candidate || candidate === '*' || candidate.toLowerCase() === 'null') return '';

    try {
        const url = new URL(candidate);
        if (!['http:', 'https:'].includes(url.protocol)) return '';
        if (url.username || url.password) return '';
        if ((url.pathname && url.pathname !== '/') || url.search || url.hash) return '';
        return url.origin;
    } catch (_error) {
        return '';
    }
}

export function configuredOrigins(value) {
    return text(value)
        .split(/[\s,]+/)
        .map(normalizeOrigin)
        .filter(Boolean);
}

export function allowedOrigins(value = '') {
    return new Set([
        ...BUILTIN_ALLOWED_ORIGINS,
        ...configuredOrigins(value)
    ]);
}

export function corsHeadersForOrigin(requestOrigin, configuredValue = '') {
    const origin = normalizeOrigin(requestOrigin);
    if (!origin || !allowedOrigins(configuredValue).has(origin)) {
        throw new Error('ORIGIN_DENIED: origem não autorizada');
    }

    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Max-Age': '86400',
        'Vary': 'Origin'
    };
}

export { BUILTIN_ALLOWED_ORIGINS };
