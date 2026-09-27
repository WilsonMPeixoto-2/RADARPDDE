'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '../..');

function read(relativePath) {
    return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

test('Playwright MCP 0.0.82 está fixado fora do runtime da aplicação', () => {
    const config = JSON.parse(read('.mcp.json'));
    const pkg = JSON.parse(read('package.json'));

    assert.deepEqual(config.mcpServers.playwright, {
        command: 'npx',
        args: ['-y', '@playwright/mcp@0.0.82']
    });
    assert.deepEqual(config.mcpServers['playwright-session'], {
        command: 'npx',
        args: ['-y', '@playwright/mcp@0.0.82', '--extension']
    });
    assert.equal(pkg.dependencies?.['@playwright/mcp'], undefined);
    assert.equal(pkg.devDependencies?.['@playwright/mcp'], undefined);
});

test('runbook e AGENTS distinguem navegador isolado de sessão autenticada', () => {
    const runbook = read('docs/runbooks/AGENT_BROWSER_MCP.md');
    const agents = read('AGENTS.md');

    assert.match(runbook, /playwright-session/);
    assert.match(runbook, /SSO|2FA/);
    assert.match(runbook, /0\.0\.82/);
    assert.match(agents, /Navegador MCP para agentes/);
    assert.match(agents, /playwright-session/);
});
