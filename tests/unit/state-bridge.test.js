'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const bridge = require('../../src/data/state-bridge.js');
const snapshots = require('../../src/data/snapshot-tools.js');

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
        },
        dump() {
            return Object.fromEntries(values.entries());
        }
    };
}

function json(value) {
    return JSON.stringify(value);
}

function createOperationalStorage() {
    return createMemoryStorage({
        radar_pdde_config: json({
            exercicios: ['2026', '2027'],
            competenciaFechamento: '2027-04',
            prazoBonificacaoProrrogado: false,
            competencias: [
                {
                    key: '2026-05',
                    label: 'Maio 2026',
                    bonifPrazo: '2026-06-15'
                },
                {
                    key: '2027-04',
                    label: 'Abril 2027',
                    bonifPrazo: '2027-05-15'
                }
            ]
        }),
        radar_pdde_programas: json([
            { id: 'BASIC', name: 'PDDE Básico', desc: 'Recursos gerais.' },
            { id: 'ED_FAMILIA', name: 'Educação e Família', desc: 'Participação.' }
        ]),
        radar_pdde_controladores: json([
            { id: 'wilson_peixoto', name: 'Wilson Peixoto', email: 'wilson@example.test' }
        ]),
        radar_pdde_equipe_inventario: json([
            { id: 'aylane', name: 'Aylane', email: 'aylane@example.test' }
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
                    bonificacao: {
                        extCC: 'Sim',
                        notaFiscal: 'Sim',
                        consAssessoria: 'Não se aplica'
                    },
                    analise: {
                        extCC: 'Correto',
                        notaFiscal: 'Correto',
                        consAssessoria: 'Correto'
                    },
                    resultadoBonif: 'apta'
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
                responsavel: 'Escola',
                proximoAtor: 'Controlador',
                motivo: 'Documento ilegível',
                observacao: 'Reenviado.',
                dataAbertura: '2026-05-10T10:00:00.000Z',
                tentativas: [
                    {
                        id: 'tentativa-1',
                        numero: 1,
                        dataRegistro: '2026-05-11T12:00:00.000Z',
                        observacao: 'Arquivo corrigido.',
                        link: 'https://drive.example/file',
                        resultado: null,
                        errosEncontrados: []
                    }
                ]
            }
        ]),
        radar_pdde_contatos: json([
            {
                id: 'contato-1',
                escolaId: '04.31.001',
                pendenciaId: 'pend-1',
                tipo: 'E-mail',
                dataAtendimento: '2026-05-12',
                dataRegistro: '2026-05-12T12:00:00.000Z',
                desc: 'Orientação enviada pela interface.',
                cobrancaOficial: true
            }
        ]),
        radar_pdde_bens: json([
            {
                id: 'bem-1',
                escolaId: '04.31.001',
                competencia: '2026-05',
                item: 'Computador',
                tipo: 'permanente',
                notaFiscal: 'NF-1',
                valor: 2500,
                status: 'Inventariada',
                processoInventario: 'PROCESSO-1',
                observacoes: 'Tombado.',
                inventariadorId: 'aylane',
                dataInventariacao: '2026-05-20T13:00:00.000Z'
            }
        ]),
        radar_pdde_notas_registradas: json([
            {
                id: 'nota-1',
                escolaId: '04.31.001',
                compKey: '2026-05_ED_FAMILIA',
                desc: 'Computador',
                tipo: 'permanente',
                numero: 'NF-1',
                valor: 2500,
                bemId: 'bem-1',
                dataRegistro: '2026-05-15T14:00:00.000Z'
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
        ]),
        radar_pdde_data_version: 'operational-v1',
        radar_pdde_pendency_schema_version: '2'
    });
}

test('traduz campos reais da interface para colunas relacionais pesquisáveis', () => {
    const exported = bridge.exportLegacySnapshot(createOperationalStorage(), {
        importId: 'operational-export',
        exportedAt: '2026-07-14T00:00:00.000Z'
    });

    assert.deepEqual(exported.warnings, []);
    assert.deepEqual(exported.rejected, []);

    const contact = exported.snapshot.entities.pendencyContacts[0];
    assert.equal(contact.description, 'Orientação enviada pela interface.');
    assert.equal(contact.official_charge, true);

    const invoice = exported.snapshot.entities.registeredInvoices[0];
    assert.equal(invoice.competence_id, '2026-05');
    assert.equal(invoice.program_id, 'ED_FAMILIA');
    assert.equal(invoice.verification_id, '04.31.001::2026-05::ED_FAMILIA');
    assert.equal(invoice.source_context_key, '2026-05_ED_FAMILIA');
    assert.equal(invoice.description, 'Computador');
    assert.equal(invoice.linked_asset_id, 'bem-1');
    assert.equal(invoice.registered_at, '2026-05-15T14:00:00.000Z');

    const asset = exported.snapshot.entities.assets[0];
    assert.equal(asset.inventoried_by_member_id, 'aylane');
    assert.equal(asset.inventoried_at, '2026-05-20T13:00:00.000Z');

    const pendency = exported.snapshot.entities.pendencies[0];
    assert.equal(pendency.next_actor, 'Controlador');
});

test('restaura snapshot canônico em localStorage sem perder ações e campos derivados', () => {
    const sourceStorage = createOperationalStorage();
    const source = bridge.exportLegacySnapshot(sourceStorage, {
        importId: 'source',
        exportedAt: '2026-07-14T00:00:00.000Z'
    });
    const destinationStorage = createMemoryStorage();

    const restoration = bridge.restoreCanonicalSnapshotToLegacyStorage(
        source.snapshot,
        destinationStorage,
        {
            dataVersion: 'restored-v1',
            pendencySchemaVersion: '2'
        }
    );

    assert.equal(restoration.dryRun, false);
    assert.equal(destinationStorage.getItem('radar_pdde_data_version'), 'restored-v1');
    assert.equal(destinationStorage.getItem('radar_pdde_pendency_schema_version'), '2');

    const restoredContacts = JSON.parse(destinationStorage.getItem('radar_pdde_contatos'));
    assert.equal(restoredContacts[0].desc, 'Orientação enviada pela interface.');

    const restoredInvoices = JSON.parse(destinationStorage.getItem('radar_pdde_notas_registradas'));
    assert.equal(restoredInvoices[0].compKey, '2026-05_ED_FAMILIA');
    assert.equal(restoredInvoices[0].desc, 'Computador');
    assert.equal(restoredInvoices[0].bemId, 'bem-1');
    assert.equal(restoredInvoices[0].dataRegistro, '2026-05-15T14:00:00.000Z');

    const restoredAssets = JSON.parse(destinationStorage.getItem('radar_pdde_bens'));
    assert.equal(restoredAssets[0].inventariadorId, 'aylane');
    assert.equal(restoredAssets[0].dataInventariacao, '2026-05-20T13:00:00.000Z');

    const restoredConfig = JSON.parse(destinationStorage.getItem('radar_pdde_config'));
    assert.deepEqual(restoredConfig.exercicios, ['2026', '2027']);
    assert.equal(restoredConfig.competenciaFechamento, '2027-04');
    assert.equal(restoredConfig.competencias.length, 24);
});

test('ida e volta preserva o modelo canônico atual', () => {
    const original = bridge.exportLegacySnapshot(createOperationalStorage(), {
        importId: 'roundtrip-source',
        exportedAt: '2026-07-14T00:00:00.000Z'
    });
    const restoredStorage = createMemoryStorage();
    bridge.restoreCanonicalSnapshotToLegacyStorage(original.snapshot, restoredStorage, {
        dataVersion: 'roundtrip-restored'
    });
    const roundtrip = bridge.exportLegacySnapshot(restoredStorage, {
        importId: 'roundtrip-target',
        exportedAt: '2026-07-14T00:00:01.000Z'
    });

    const reconciliation = snapshots.reconcileSnapshots(original.snapshot, roundtrip.snapshot);
    assert.equal(reconciliation.ok, true, JSON.stringify(reconciliation.entities, null, 2));
});

test('simulação de restauração não altera o armazenamento', () => {
    const exported = bridge.exportLegacySnapshot(createOperationalStorage(), {
        importId: 'dry-run-source',
        exportedAt: '2026-07-14T00:00:00.000Z'
    });
    const storage = createMemoryStorage({ sentinel: 'preserve' });

    const result = bridge.restoreCanonicalSnapshotToLegacyStorage(
        exported.snapshot,
        storage,
        { dryRun: true }
    );

    assert.equal(result.dryRun, true);
    assert.equal(result.writes.length, 11);
    assert.deepEqual(storage.dump(), { sentinel: 'preserve' });
});
