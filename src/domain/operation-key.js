(function installRadarOperationKey(root, factory) {
    'use strict';

    const api = factory(root);
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) root.RadarOperationKey = Object.freeze(api);
}(typeof window !== 'undefined' ? window : globalThis, function createOperationKeyApi(root) {
    'use strict';

    const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    function normalize(value) {
        const key = value == null ? '' : String(value).trim().toLowerCase();
        if (!UUID_V4.test(key)) throw new Error('OPERATION_KEY_INVALID: chave de intenção inválida.');
        return key;
    }

    function fallbackUuid(cryptoRef) {
        if (!cryptoRef || typeof cryptoRef.getRandomValues !== 'function') {
            throw new Error('SECURE_RANDOM_UNAVAILABLE: não há fonte criptográfica segura para a intenção.');
        }
        const bytes = new Uint8Array(16);
        cryptoRef.getRandomValues(bytes);
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        const hex = [...bytes].map(value => value.toString(16).padStart(2, '0'));
        return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10).join('')}`;
    }

    function create(cryptoOverride = null) {
        const cryptoRef = cryptoOverride || root?.crypto || globalThis.crypto;
        if (cryptoRef && typeof cryptoRef.randomUUID === 'function') {
            return normalize(cryptoRef.randomUUID());
        }
        return normalize(fallbackUuid(cryptoRef));
    }

    function reuse(value) {
        return normalize(value);
    }

    function persistentId(prefix, operationKey) {
        const safePrefix = prefix == null ? '' : String(prefix).trim();
        if (!safePrefix || !/^[a-z0-9_-]+$/i.test(safePrefix)) {
            throw new Error('PERSISTENT_ID_PREFIX_INVALID: prefixo de identidade inválido.');
        }
        return `${safePrefix}-${normalize(operationKey)}`;
    }

    return Object.freeze({ create, reuse, normalize, persistentId });
}));
