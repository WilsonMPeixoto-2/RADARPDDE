'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    decideInvalidationAction
} = require('../../src/integration/operational-realtime-invalidation.js');

const prontuario = schoolId => ({ view: 'prontuario', param: schoolId });

const payload = (entity, schoolId) => ({ entity, operation: 'UPDATE', schoolId });

test('mesma escola no Prontuário usa reconciliação escolar', () => {
    assert.equal(
        decideInvalidationAction({
            route: prontuario('school-a'),
            payload: payload('verifications', 'school-a')
        }),
        'school'
    );
});

test('outra escola no Prontuário é adiada sem reconstruir a tela atual', () => {
    assert.equal(
        decideInvalidationAction({
            route: prontuario('school-a'),
            payload: payload('assets', 'school-b')
        }),
        'defer'
    );
});

test('visão global continua conservadora mesmo quando o Broadcast conhece a escola', () => {
    assert.equal(
        decideInvalidationAction({
            route: { view: 'dashboard', param: null },
            payload: payload('pendencies', 'school-a')
        }),
        'global'
    );
});

test('evento sem schoolId continua no fallback global', () => {
    assert.equal(
        decideInvalidationAction({
            route: prontuario('school-a'),
            payload: { entity: 'registered_invoices', operation: 'DELETE' }
        }),
        'global'
    );
});

test('contatos gerais continuam globais até existir contrato escolar próprio', () => {
    assert.equal(
        decideInvalidationAction({
            route: prontuario('school-a'),
            payload: payload('pendency_contacts', 'school-a')
        }),
        'global'
    );
});

test('entidade desconhecida não é otimizada por escola', () => {
    assert.equal(
        decideInvalidationAction({
            route: prontuario('school-a'),
            payload: payload('future_entity', 'school-a')
        }),
        'global'
    );
});

test('entidades escolares explicitamente suportadas compartilham a mesma regra', () => {
    for (const entity of [
        'verifications',
        'registered_invoices',
        'pendencies',
        'pendency_attempts',
        'assets'
    ]) {
        assert.equal(
            decideInvalidationAction({
                route: prontuario('school-a'),
                payload: payload(entity, 'school-a')
            }),
            'school',
            entity
        );
    }
});
