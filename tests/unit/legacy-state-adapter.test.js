'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    readLegacyState,
    transformLegacyState,
    exportLegacySnapshot
} = require('../../src/data/legacy-state-adapter.js');
const { RepositoryError } = require('../../src/data/repository-contract.js');
const { validateSnapshot } = require('../../src/data/snapshot-tools.js');

function createMemoryStorage(seed = {}) {
    const values = new Map(Object.entries(seed));
    return {
        getItem(key) {
            return values.has(key) ? values.get(key) : null;
        },
        setItem(key, value) {
            values.set(key, String(value));
        },
        removeItem(key) {
            values.delete(key);
        }
    };
}

function json(value) {
    return JSON.stringify(value);
}

function createLegacyStorage() {
    return createMemoryStorage({
        radar_pdde_config: json({
            exercicios: ['2026'],
            competenciaFechamento: '2026-05',
            prazoBonificacaoProrrogado: false
        }),
        radar_pdde_programas: json([
            { id: 'BASIC', name: 'PDDE Básico', desc: 'Recursos gerais.' },
            { id: 'ED_FAMILIA', name: 'Educação e Família', desc: 'Participação.' }
        ]),
        radar_pdde_controladores: json([
            { id: 'wilson_peixoto', name: 'Wilson Peixoto', email: '' }
        ]),
        radar_pdde_equipe_inventario: json([
            { id: 'aylane', name: 'Aylane', email: '' }
        ]),
        radar_pdde_escolas: json([
            {
                id: '04.31.001',
                designação: '04.31.001',
                denominação: 'Escola Municipal Ary Barroso',
                telefone: '0000-0000',
                telefoneCelularInstitucional: '21999999999',
                email: 'escola@rioeduca.net',
                diretor: 'Diretora',
                telefoneDiretor: '99999-9999',
                diretorAdjunto: 'Adjunta',
                telefoneDiretorAdjunto: '98888-8888',
                inep: '33000000',
                cnpj: '00.000.000/0001-00',
                cre: '4ª CRE',
                ra: '31ª R.A.',
                sici: '11351',
                controladorId: 'wilson_peixoto',
                processoInventario: 'PROCESSO-1',
                programasIds: ['BASIC', 'ED_FAMILIA'],
                competenciaInicial: '2026-01'
            }
        ]),
        radar_pdde_verificacoes: json({
            '04.31.001': {
                '2026-05_ED_FAMILIA': {
                    bonificacao: { extrato: true },
                    analise: { extrato: 'Correto' },
                    resultadoBonif: 'apta',
                    retificacoes: [{ id: 'ret-1', justificativa: 'Correção auditada.' }]
                }
            }
        }),
        radar_pdde_pendencias: json([
            {
                id: 'pend-1',
                escolaId: '04.31.001',
                competenciaOrigem: '2026-05',
                programaId: 'ED_FAMILIA',
                documentoKey: 'extrato',
                item: 'Extrato',
                status: 'Aguardando reanálise',
                responsavel: 'Controlador',
                motivo: 'Documento ilegível',
                observacao: 'Reenviado.',
                dataAbertura: '2026-05-10',
                dataResolucao: null,
                tentativas: [
                    {
                        id: 'tentativa-1',
                        numero: 1,
                        dataDisponibilizacao: '2026-05-11',
                        dataRegistro: '2026-05-11T12:00:00.000Z',
                        observacao: 'Arquivo corrigido.',
                        link: 'https://drive.example/file',
                        status: 'aguardando',
                        resultado: null,
                        errosEncontrados: []
                    }
                ],
                historico: []
            }
        ]),
        radar_pdde_contatos: json([
            {
                id: 'contato-1',
                escolaId: '04.31.001',
                pendenciaId: 'pend-1',
                tipo: 'E-mail',
                dataAtendimento: '2026-05-12',
                descricao: 'Orientação enviada.',
                cobrancaOficial: true
            }
        ]),
        radar_pdde_bens: json([
            {
                id: 'bem-1',
                escolaId: '04.31.001',
                competencia: '2026-05',
                descricao: 'Computador',
                tipo: 'permanente',
                notaFiscal: 'NF-1',
                valor: 2500,
                status: 'Não encaminhada',
                processoInventario: 'PROCESSO-1',
                observacoes: 'Aguardando inventário.'
            }
        ]),
        radar_pdde_notas_registradas: json([
            {
                id: 'nota-1',
                escolaId: '04.31.001',
                competencia: '2026-05',
                descricao: 'Computador',
                tipo: 'permanente',
                numero: 'NF-1',
                valor: 2500
            }
        ]),
        radar_pdde_logs: json([
            {
                id: 'log-1',
                escolaId: '04.31.001',
                usuario: 'Wilson Peixoto',
                perfil: 'Controlador',
                acao: 'Atualização',
                detalhes: 'Registro alterado.',
                dataHora: '2026-05-12T13:00:00.000Z'
            }
        ])
    });
}

test('lê o estado legado sem alterar o armazenamento', () => {
    const storage = createLegacyStorage();
    const state = readLegacyState(storage);

    assert.equal(state.schools[0].id, '04.31.001');
    assert.equal(state.config.competenciaFechamento, '2026-05');
    assert.equal(storage.getItem('radar_pdde_escolas').includes('Ary Barroso'), true);
});

test('transforma o estado atual em entidades relacionais com IDs canônicos', () => {
    const state = readLegacyState(createLegacyStorage());
    const result = transformLegacyState(state);

    assert.deepEqual(result.warnings, []);
    assert.deepEqual(result.entities.appConfig, [{
        id: 'global',
        exercises: ['2026'],
        closing_competence: '2026-05',
        bonus_deadline_extended: null,
        settings: { prazoBonificacaoProrrogado: false }
    }]);
    assert.equal(result.entities.schools[0].designation, '04.31.001');
    assert.deepEqual(result.entities.schoolPrograms.map(item => item.id), [
        '04.31.001::BASIC',
        '04.31.001::ED_FAMILIA'
    ]);
    assert.equal(result.entities.competences.length, 12);
    assert.deepEqual(result.entities.competences[0], {
        id: '2026-01',
        label: 'Janeiro 2026',
        exercise: 2026,
        starts_on: '2026-01-01',
        ends_on: '2026-01-31',
        bonus_deadline: '2026-02-15',
        closed_at: null
    });
    assert.equal(result.entities.competences[11].id, '2026-12');
    assert.equal(result.entities.competences[11].bonus_deadline, '2027-01-15');
    assert.deepEqual(result.entities.verifications[0], {
        id: '04.31.001::2026-05::ED_FAMILIA',
        school_id: '04.31.001',
        competence_id: '2026-05',
        program_id: 'ED_FAMILIA',
        bonification: { extrato: true },
        analysis: { extrato: 'Correto' },
        bonus_result: 'apta',
        payload: {
            retificacoes: [{ id: 'ret-1', justificativa: 'Correção auditada.' }]
        }
    });
    assert.equal(result.entities.pendencies[0].payload.item, 'Extrato');
    assert.equal(result.entities.pendencyAttempts[0].id, 'tentativa-1');
    assert.equal(result.entities.pendencyContacts[0].id, 'contato-1');
    assert.equal(result.entities.assets[0].id, 'bem-1');
    assert.equal(result.entities.registeredInvoices[0].invoice_number, 'NF-1');
    assert.deepEqual(result.entities.administrativeLogs[0].details, {
        text: 'Registro alterado.'
    });
});

test('exporta snapshot legado válido e reconciliável', () => {
    const result = exportLegacySnapshot(createLegacyStorage(), {
        version: '1',
        importId: 'legacy-001',
        exportedAt: '2026-07-13T12:00:00.000Z'
    });

    assert.deepEqual(result.warnings, []);
    assert.equal(result.snapshot.importId, 'legacy-001');
    assert.deepEqual(validateSnapshot(result.snapshot), { ok: true, errors: [] });
});

test('interrompe exportação quando um JSON legado está corrompido', () => {
    const storage = createMemoryStorage({
        radar_pdde_escolas: '{json-invalido'
    });

    assert.throws(
        () => readLegacyState(storage),
        error => error instanceof RepositoryError
            && error.code === 'LEGACY_DESERIALIZATION_FAILED'
            && error.entity === 'schools'
    );
});
