'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const APP = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
const INDEX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

function body(name) {
    const match = APP.match(new RegExp(`(?:async\\s+)?function\\s+${name}\\s*\\([^)]*\\)\\s*\\{([\\s\\S]*?)\\n\\}`, 'm'));
    assert.ok(match, `função ${name} deve existir`);
    return match[0];
}

test('carrega serviços de auditoria, notas e inventário antes do app principal', () => {
    const audit = INDEX.indexOf('src/application/audit-service.js');
    const invoice = INDEX.indexOf('src/application/invoice-service.js');
    const inventory = INDEX.indexOf('src/application/inventory-service.js');
    const app = INDEX.indexOf('src="app.js"');

    assert.ok(audit >= 0 && audit < app);
    assert.ok(invoice >= 0 && invoice < app);
    assert.ok(inventory >= 0 && inventory < app);
});

test('handlers de notas e inventário delegam ao gateway sem mutar raízes diretamente', () => {
    const delegated = [
        ['salvarDadosNota', /radarInvoiceService\.save\s*\(/],
        ['removerNotaRegistrada', /radarInvoiceService\.remove\s*\(/],
        ['salvarInventariacao', /radarInventoryService\.inventory\s*\(/],
        ['updateCapitalDoc', /radarInventoryService\.updateAsset\s*\(/],
        ['encaminharCapital', /radarInventoryService\.forward\s*\(/],
        ['openNovoCapitalModal', /radarInventoryService\.createAsset\s*\(/]
    ];

    delegated.forEach(([name, expected]) => {
        const source = body(name);
        assert.match(source, /async\s+function/);
        assert.match(source, expected);
        assert.doesNotMatch(source, /notasRegistradas\.(?:push|splice)\s*\(/);
        assert.doesNotMatch(source, /bens\.(?:push|splice)\s*\(/);
        assert.doesNotMatch(source, /\bbens\s*=\s*bens\.filter/);
        assert.doesNotMatch(source, /\bpersist\s*\(/);
        assert.doesNotMatch(source, /\bregisterLog\s*\(/);
    });
});

test('estado de aplicação expõe bens aos serviços e registerLog não persiste de forma aninhada', () => {
    assert.match(APP, /assets:\s*bens/);
    assert.match(APP, /radarAuditService\s*=\s*new\s+window\.RadarAuditService\.AuditService/);
    assert.match(APP, /radarInvoiceService\s*=\s*new\s+window\.RadarInvoiceService\.InvoiceService/);
    assert.match(APP, /radarInventoryService\s*=\s*new\s+window\.RadarInventoryService\.InventoryService/);
    assert.doesNotMatch(body('registerLog'), /persist\s*\(/);
});

