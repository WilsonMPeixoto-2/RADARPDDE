'use strict';

// O config remoto do Playwright exige uma URL em runtime. Para a análise
// estática do Knip, uma origem local evita efeitos colaterais sem enfraquecer
// a validação fail-fast usada pelos workflows de homologação remota.
process.env.RADAR_DEPLOYMENT_URL ||= 'http://127.0.0.1:4175';

module.exports = Object.freeze({
    entry: Object.freeze([
        'app.js',
        'config.js',
        'config.runtime.js',
        'lighthouserc.cjs',
        'playwright*.config.js',
        'scripts/**/*.{js,mjs}',
        'src/vendor/*-entry.js',
        'supabase/functions/**/*.{ts,mjs}',
        'tests/**/*.{js,mjs}'
    ]),
    project: Object.freeze([
        '*.{js,cjs}',
        'scripts/**/*.{js,mjs}',
        'src/**/*.js',
        'supabase/functions/**/*.{ts,mjs}',
        'tests/**/*.{js,mjs}'
    ]),
    playwright: Object.freeze({
        config: Object.freeze([]),
        entry: Object.freeze(['tests/e2e/**/*.spec.js'])
    }),
    ignoreDependencies: Object.freeze(['jsr', 'npm']),
    ignore: Object.freeze([
        'artifacts/**',
        'dist/**',
        'node_modules/**',
        'playwright-report/**',
        'test-results/**',
        'vendor/**',
        'src/types/database.types.ts'
    ])
});
