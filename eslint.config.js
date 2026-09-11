'use strict';

const js = require('@eslint/js');
const noUnsanitized = require('eslint-plugin-no-unsanitized');
const playwright = require('eslint-plugin-playwright');

const STRUCTURAL_CORE_RULES = Object.freeze([
    'constructor-super',
    'for-direction',
    'getter-return',
    'no-async-promise-executor',
    'no-class-assign',
    'no-compare-neg-zero',
    'no-const-assign',
    'no-dupe-args',
    'no-dupe-class-members',
    'no-dupe-else-if',
    'no-dupe-keys',
    'no-duplicate-case',
    'no-ex-assign',
    'no-fallthrough',
    'no-func-assign',
    'no-import-assign',
    'no-loss-of-precision',
    'no-new-native-nonconstructor',
    'no-obj-calls',
    'no-promise-executor-return',
    'no-self-assign',
    'no-setter-return',
    'no-sparse-arrays',
    'no-this-before-super',
    'no-unexpected-multiline',
    'no-unmodified-loop-condition',
    'no-unreachable',
    'no-unreachable-loop',
    'no-unsafe-finally',
    'no-unsafe-negation',
    'no-unsafe-optional-chaining',
    'no-unused-private-class-members',
    'no-useless-backreference',
    'require-yield',
    'use-isnan',
    'valid-typeof'
]);

const coreRules = Object.fromEntries(
    STRUCTURAL_CORE_RULES
        .filter(ruleName => Object.prototype.hasOwnProperty.call(js.configs.recommended.rules, ruleName))
        .map(ruleName => [ruleName, js.configs.recommended.rules[ruleName]])
);

const playwrightRecommended = playwright.configs?.['flat/recommended']
    || playwright.configs?.recommended
    || { rules: {} };
const playwrightRules = Object.fromEntries(
    Object.keys(playwrightRecommended.rules || {}).map(ruleName => [ruleName, 'warn'])
);

[
    'playwright/missing-playwright-await',
    'playwright/no-focused-test',
    'playwright/valid-expect'
].forEach(ruleName => {
    if (Object.prototype.hasOwnProperty.call(playwrightRules, ruleName)) {
        playwrightRules[ruleName] = 'error';
    }
});

module.exports = [
    {
        ignores: [
            'artifacts/**',
            'dist/**',
            'node_modules/**',
            'playwright-report/**',
            'test-results/**',
            'vendor/**',
            'src/types/database.types.ts'
        ]
    },
    {
        name: 'radar/browser-security',
        files: ['app.js', 'config.js', 'src/**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'script'
        },
        linterOptions: {
            reportUnusedDisableDirectives: 'warn'
        },
        plugins: {
            nounsanitized: noUnsanitized
        },
        rules: {
            ...coreRules,
            'nounsanitized/method': 'warn',
            'nounsanitized/property': 'warn'
        }
    },
    {
        name: 'radar/vendor-esm-entrypoints',
        files: ['src/vendor/*-entry.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module'
        }
    },
    {
        name: 'radar/playwright',
        files: ['tests/e2e/**/*.spec.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'commonjs'
        },
        linterOptions: {
            reportUnusedDisableDirectives: 'warn'
        },
        plugins: {
            playwright
        },
        rules: playwrightRules
    }
];
