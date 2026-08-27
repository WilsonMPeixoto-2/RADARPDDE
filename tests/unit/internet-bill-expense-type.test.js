'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { InvoiceService } = require('../../src/application/invoice-service.js');
const { transformLegacyState } = require('../../src/data/legacy-state-adapter.js');

const MIGRATION_PATH = path.resolve(
    __dirname,
    '../../supabase/migrations/20260827130000_internet_bill_expense_type.sql'
);

function createHarness(programId = 'CONECTADA') {
    const compKey = `2026-05_${programId}`;
    const state = {
        schools: [{
            id: 'ESC-1',
            denominação: 'Escola Teste',
            processoInventario: '',
            programasIds: [programId]
        }],
        programs: [
            { id: 'CONECTADA', name: 'Educação Conectada' },
            { id: 'BASIC', name: 'PDDE Básico' }
        ],
        verifications: {
            'ESC-1': {
                [compKey]: {
                    bonificacao: {
                        notaFiscal: 'Sim',
                        consAssessoria: 'Não se aplica',
                        consEnviada: false,
                        boletoInternet: 'Não se aplica'
                    },
                    analise: {
                        notaFiscal: 'Não analisado',
                        consAssessoria: 'Correto',
                        boletoInternet: 'Não analisado'
                    },
                    resultadoBonif: ''
                }
            }
        },
        registeredInvoices: [],
        assets: [],
        logs: []
    };
    const calls = [];
    let sequence = 0;
    const service = new InvoiceService({
        dataService: {
            async execute(command) {
                calls.push(command);
                return { ok: true, value: await command.mutate() };
            }
        },
        getState: () => state,
        appendLog: (action, details) => {
            const log = { id: `log-${++sequence}`, action, details };
            state.logs.unshift(log);
            return log;
        },
        getCurrentProfile: () => 'controlador',
        createId: prefix => `${prefix}-${++sequence}`,
        now: () => '2026-08-27T13:00:00.000Z'
    });

    return { state, calls, service, compKey };
}

test('Boleto de pagamento de Internet é um tipo de gasto canônico apenas em Educação Conectada', async () => {
    const harness = createHarness('CONECTADA');

    const result = await harness.service.save({
        schoolId: 'ESC-1',
        compKey: harness.compKey,
        description: 'Pagamento de acesso à Internet',
        expenseType: 'boleto_internet',
        invoiceNumber: 'BOL-001',
        amount: 250,
        profile: 'controlador'
    });

    assert.equal(result.value.invoice.tipo, 'boleto_internet');
    assert.equal(result.value.invoice.numero, 'BOL-001');
    assert.equal(result.value.invoice.bemId, null);
    assert.equal(Object.hasOwn(result.value.invoice, 'consultaAssessoriaEnviada'), false);
    assert.equal(Object.hasOwn(result.value.invoice, 'analiseConsultaAssessoria'), false);
    assert.deepEqual(result.value.warnings, []);
    assert.equal(harness.state.assets.length, 0);
    assert.equal(
        harness.state.verifications['ESC-1'][harness.compKey].bonificacao.consAssessoria,
        'Não se aplica'
    );
    assert.equal(harness.state.logs.length, 1);
    assert.equal(harness.state.logs[0].action, 'Boleto de Internet Cadastrado');
});

test('Boleto de pagamento de Internet é rejeitado fora de Educação Conectada antes de DataService', async () => {
    const harness = createHarness('BASIC');

    await assert.rejects(
        () => harness.service.save({
            schoolId: 'ESC-1',
            compKey: harness.compKey,
            description: 'Pagamento de acesso à Internet',
            expenseType: 'boleto_internet',
            invoiceNumber: 'BOL-001',
            amount: 250,
            profile: 'controlador'
        }),
        error => error?.code === 'DOCUMENT_NOT_APPLICABLE'
    );

    assert.equal(harness.calls.length, 0);
    assert.equal(harness.state.registeredInvoices.length, 0);
});

test('modal declara a opção Boleto de pagamento de Internet como exclusiva de CONECTADA', () => {
    const html = fs.readFileSync(path.resolve(__dirname, '../../index.html'), 'utf8');

    assert.match(
        html,
        /<option[^>]+value="boleto_internet"[^>]+data-program-id="CONECTADA"[^>]*>\s*Boleto de pagamento de Internet\s*<\/option>/i
    );
});

test('migração permite boleto_internet e o restringe server-side a Educação Conectada', () => {
    const sql = fs.readFileSync(MIGRATION_PATH, 'utf8');

    assert.match(
        sql,
        /registered_invoices_expense_type_check[\s\S]*?'boleto_internet'/i
    );
    assert.match(
        sql,
        /registered_invoices_internet_bill_program_check[\s\S]*?expense_type[\s\S]*?'boleto_internet'[\s\S]*?program_id[\s\S]*?'CONECTADA'/i
    );
});


test('entidade canônica preserva program_id do boleto para a RPC atômica', () => {
    const transformed = transformLegacyState({
        registeredInvoices: [{
            id: 'BOL-ENTITY-1',
            escolaId: 'ESC-1',
            competencia: '2026-05',
            programaId: 'CONECTADA',
            compKey: '2026-05_CONECTADA',
            desc: 'Pagamento de Internet',
            tipo: 'boleto_internet',
            numero: 'BOL-001',
            valor: 250
        }]
    });

    assert.equal(transformed.entities.registeredInvoices.length, 1);
    assert.equal(
        transformed.entities.registeredInvoices[0].program_id,
        'CONECTADA'
    );
    assert.equal(
        transformed.entities.registeredInvoices[0].expense_type,
        'boleto_internet'
    );
});

test('contexto CONECTADA não basta quando a escola não possui o programa', async () => {
    const harness = createHarness('CONECTADA');
    harness.state.schools[0].programasIds = [];

    await assert.rejects(
        () => harness.service.save({
            schoolId: 'ESC-1',
            compKey: harness.compKey,
            description: 'Pagamento de acesso à Internet',
            expenseType: 'boleto_internet',
            invoiceNumber: 'BOL-SEM-PROGRAMA',
            amount: 250,
            profile: 'controlador'
        }),
        error => error?.code === 'DOCUMENT_NOT_APPLICABLE'
    );

    assert.equal(harness.calls.length, 0);
});
