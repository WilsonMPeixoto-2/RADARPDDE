const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function read(relativePath) {
    return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

test('configuração e carregador da exportação possuem sintaxe válida', () => {
    assert.doesNotThrow(() => new vm.Script(read('config.js'), { filename: 'config.js' }));
    assert.doesNotThrow(() => new vm.Script(
        read('src/integration/load-excel-export.js'),
        { filename: 'load-excel-export.js' }
    ));
});

test('carregador referencia as quatro camadas na ordem correta', () => {
    const source = read('src/integration/load-excel-export.js');
    const expected = [
        'src/domain/excel-export-model.js',
        'src/domain/excel-workbook-plan.js',
        'src/domain/excel-xlsx-renderer.js',
        'src/integration/excel-export-integration.js'
    ];

    let previousIndex = -1;
    expected.forEach(item => {
        const currentIndex = source.indexOf(item);
        assert.ok(currentIndex > previousIndex, `${item} deve ser carregado após a camada anterior.`);
        previousIndex = currentIndex;
    });
});
