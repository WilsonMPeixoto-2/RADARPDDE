import fs from 'node:fs';

const filePath = 'src/data/snapshot-tools.js';
const source = fs.readFileSync(filePath, 'utf8');
const oldBlock = `    function sortObjectKeys(value) {
        if (Array.isArray(value)) return value.map(sortObjectKeys);
        if (!value || typeof value !== 'object') return value;
        return Object.keys(value)
            .sort()
            .reduce((accumulator, key) => {
                accumulator[key] = sortObjectKeys(value[key]);
                return accumulator;
            }, {});
    }
`;
const newBlock = `    const ISO_INSTANT_PATTERN = /^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d{1,6})?(?:Z|[+-]\\d{2}:\\d{2})$/;

    function normalizeCanonicalPrimitive(value) {
        if (typeof value !== 'string' || !ISO_INSTANT_PATTERN.test(value)) return value;
        const timestamp = Date.parse(value);
        return Number.isNaN(timestamp) ? value : new Date(timestamp).toISOString();
    }

    function sortObjectKeys(value) {
        if (Array.isArray(value)) return value.map(sortObjectKeys);
        if (!value || typeof value !== 'object') return normalizeCanonicalPrimitive(value);
        return Object.keys(value)
            .sort()
            .reduce((accumulator, key) => {
                accumulator[key] = sortObjectKeys(value[key]);
                return accumulator;
            }, {});
    }
`;

if (!source.includes(oldBlock)) {
    throw new Error('Bloco canônico de ordenação não localizado.');
}
fs.writeFileSync(filePath, source.replace(oldBlock, newBlock));
