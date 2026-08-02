#!/usr/bin/env node

// Script temporário executado apenas pelo runner da branch da Rodada 2.
import fs from 'node:fs/promises';

const packagePath = new URL('../package.json', import.meta.url);
const indexPath = new URL('../index.html', import.meta.url);

const packageJson = JSON.parse(await fs.readFile(packagePath, 'utf8'));
packageJson.devDependencies['@floating-ui/dom'] = '1.8.0';
packageJson.devDependencies['fuse.js'] = '7.5.0';
packageJson.devDependencies = Object.fromEntries(
    Object.entries(packageJson.devDependencies).sort(([left], [right]) => left.localeCompare(right))
);
packageJson.scripts['build:search-ui-vendors'] = 'node scripts/build-search-ui-vendors.mjs';
packageJson.scripts['check:search-ui-vendors'] = 'node scripts/build-search-ui-vendors.mjs --check';

const syntaxChecks = [
    'src/domain/global-search-index.js',
    'src/integration/global-search.js',
    'src/integration/floating-ui-bootstrap.js',
    'src/integration/view-transitions.js',
    'src/vendor/fuse-entry.js',
    'src/vendor/floating-ui-entry.js',
    'scripts/build-search-ui-vendors.mjs'
];
syntaxChecks.forEach(file => {
    const command = `node --check ${file}`;
    if (!packageJson.scripts.check.includes(command)) {
        packageJson.scripts.check += ` && ${command}`;
    }
});
if (!packageJson.scripts['test:readiness'].includes('npm run check:search-ui-vendors')) {
    packageJson.scripts['test:readiness'] = packageJson.scripts['test:readiness'].replace(
        'npm run check:workflow-references &&',
        'npm run check:workflow-references && npm run check:search-ui-vendors &&'
    );
}
await fs.writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);

let html = await fs.readFile(indexPath, 'utf8');
const styleAnchor = '    <link rel="stylesheet" href="src/styles/shared-interactions.css">';
const styleBlock = [
    styleAnchor,
    '    <link rel="stylesheet" href="src/styles/global-search.css">',
    '    <link rel="stylesheet" href="src/styles/floating-ui.css">',
    '    <link rel="stylesheet" href="src/styles/view-transitions.css">'
].join('\n');
if (!html.includes('src/styles/global-search.css')) {
    if (!html.includes(styleAnchor)) throw new Error('Âncora de estilos não encontrada no index.html.');
    html = html.replace(styleAnchor, styleBlock);
}

const domainAnchor = '    <script src="src/domain/access-policy.js"></script>';
if (!html.includes('src/domain/global-search-index.js')) {
    if (!html.includes(domainAnchor)) throw new Error('Âncora de domínio não encontrada no index.html.');
    html = html.replace(domainAnchor, [
        domainAnchor,
        '    <script src="src/domain/global-search-index.js"></script>'
    ].join('\n'));
}

const vendorAnchor = '    <script src="vendor/ajv.js"></script>';
if (!html.includes('vendor/fuse.js')) {
    if (!html.includes(vendorAnchor)) throw new Error('Âncora de vendors não encontrada no index.html.');
    html = html.replace(vendorAnchor, [
        vendorAnchor,
        '    <script src="vendor/fuse.js"></script>',
        '    <script src="vendor/floating-ui.js"></script>'
    ].join('\n'));
}

const appAnchor = '    <script src="app.js"></script>';
if (!html.includes('src/integration/global-search.js')) {
    if (!html.includes(appAnchor)) throw new Error('Âncora do app principal não encontrada no index.html.');
    html = html.replace(appAnchor, [
        appAnchor,
        '    <script src="src/integration/view-transitions.js"></script>',
        '    <script src="src/integration/global-search.js"></script>',
        '    <script src="src/integration/floating-ui-bootstrap.js"></script>'
    ].join('\n'));
}

await fs.writeFile(indexPath, html);
console.log('Ligação da Rodada 2 aplicada ao package.json e index.html.');
