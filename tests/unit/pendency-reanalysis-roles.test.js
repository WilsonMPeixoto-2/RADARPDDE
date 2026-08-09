'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const pendencias = require('../../src/domain/pendencias.js');

function awaitingPendency() {
    return {
        id: 'P-ROLE',
        status: pendencias.PENDENCY_STATUS.AWAITING_REVIEW,
        errosAtuais: ['Sem assinatura'],
        motivo: 'Sem assinatura',
        tentativas: [{
            id: 'A-ROLE',
            numero: 1,
            status: 'aguardando',
            dataDisponibilizacao: '2026-08-09',
            observacao: 'Documento corrigido',
            dataAnalise: null,
            analisadoPor: null,
            resultado: null,
            errosEncontrados: [],
            observacaoAnalise: null
        }],
        historico: []
    };
}

function audit(perfil) {
    return {
        eventId: `event-${perfil}`,
        at: '2026-08-09T15:00:00.000Z',
        usuario: 'Usuário de teste',
        perfil
    };
}

for (const perfil of [
    'Controlador',
    'Assistente de Verbas Federais',
    'federal_assistant',
    'Administrador técnico',
    'technical_admin'
]) {
    test(`reanálise aceita perfil autorizado: ${perfil}`, () => {
        const result = pendencias.recordReanalysis(
            awaitingPendency(),
            { resultado: 'correto', observacao: 'Conferido e regularizado.' },
            audit(perfil)
        );

        assert.equal(result.status, pendencias.PENDENCY_STATUS.RESOLVED);
        assert.equal(result.tentativas[0].status, 'analisada');
        assert.equal(result.tentativas[0].resultado, 'correto');
        assert.equal(result.tentativas[0].observacaoAnalise, 'Conferido e regularizado.');
        assert.equal(result.historico.at(-1).perfil, perfil);
    });
}

for (const perfil of ['Gestão SME', 'Equipe de Inventário', 'sme_management', 'inventory']) {
    test(`reanálise rejeita perfil sem autoridade: ${perfil}`, () => {
        assert.throws(
            () => pendencias.recordReanalysis(
                awaitingPendency(),
                { resultado: 'correto', observacao: 'Tentativa indevida.' },
                audit(perfil)
            ),
            /perfis operacionais autorizados/
        );
    });
}
