'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const modulePath = path.resolve(__dirname, '../../src/domain/competence-context.js');

function createMemoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
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

function loadApi() {
  assert.equal(
    fs.existsSync(modulePath),
    true,
    'O módulo src/domain/competence-context.js deve existir.'
  );
  delete require.cache[modulePath];
  return require(modulePath);
}

const competences2026 = Array.from({ length: 12 }, (_, index) => {
  const month = String(index + 1).padStart(2, '0');
  return { key: `2026-${month}`, label: `Mês ${month}` };
});

test('inicializa pela seleção válida da sessão antes da competência de fechamento', () => {
  const api = loadApi();
  const storage = createMemoryStorage({ radar_pdde_active_competence: '2026-08' });
  const context = api.createCompetenceContext({
    competences: competences2026,
    currentExercise: '2026',
    closingCompetence: '2026-05',
    storage
  });

  assert.deepEqual(context.getState(), {
    exercise: '2026',
    activeKey: '2026-08',
    availableKeys: competences2026.map(item => item.key),
    closingKey: '2026-05'
  });
});

test('competência inicial explícita prevalece sobre seleção antiga da sessão', () => {
  const api = loadApi();
  const storage = createMemoryStorage({ radar_pdde_active_competence: '2026-12' });
  const context = api.createCompetenceContext({
    competences: competences2026,
    currentExercise: '2026',
    closingCompetence: '2026-12',
    initialCompetence: '2026-08',
    storage
  });

  assert.equal(context.getState().activeKey, '2026-08');
});

test('usa a competência de fechamento quando não existe seleção de sessão', () => {
  const api = loadApi();
  const context = api.createCompetenceContext({
    competences: competences2026,
    currentExercise: '2026',
    closingCompetence: '2026-05',
    storage: createMemoryStorage()
  });

  assert.equal(context.getState().activeKey, '2026-05');
});

test('usa a competência mais recente quando o fechamento não pertence ao exercício', () => {
  const api = loadApi();
  const context = api.createCompetenceContext({
    competences: competences2026,
    currentExercise: '2026',
    closingCompetence: '2025-12',
    storage: createMemoryStorage()
  });

  assert.equal(context.getState().activeKey, '2026-12');
});

test('seleciona, persiste e notifica apenas quando a competência realmente muda', () => {
  const api = loadApi();
  const storage = createMemoryStorage();
  const context = api.createCompetenceContext({
    competences: competences2026,
    currentExercise: '2026',
    closingCompetence: '2026-05',
    storage
  });
  const notifications = [];
  const unsubscribe = context.subscribe(state => notifications.push(state.activeKey));

  assert.equal(context.select('2026-08', { source: 'test' }).activeKey, '2026-08');
  assert.equal(storage.getItem('radar_pdde_active_competence'), '2026-08');
  context.select('2026-08', { source: 'test-repeat' });
  unsubscribe();
  context.select('2026-09', { source: 'after-unsubscribe' });

  assert.deepEqual(notifications, ['2026-08']);
});

test('recusa competência inexistente ou pertencente a outro exercício', () => {
  const api = loadApi();
  const context = api.createCompetenceContext({
    competences: competences2026,
    currentExercise: '2026',
    closingCompetence: '2026-05',
    storage: createMemoryStorage()
  });

  assert.throws(
    () => context.select('2027-01'),
    error => error && error.code === 'INVALID_COMPETENCE_SELECTION'
  );
  assert.throws(
    () => context.select('2026-13'),
    error => error && error.code === 'INVALID_COMPETENCE_SELECTION'
  );
});

test('troca o exercício e escolhe o fechamento ou a competência mais recente correspondente', () => {
  const api = loadApi();
  const allCompetences = [
    ...competences2026,
    { key: '2027-01', label: 'Janeiro 2027' },
    { key: '2027-04', label: 'Abril 2027' }
  ];
  const context = api.createCompetenceContext({
    competences: allCompetences,
    currentExercise: '2026',
    closingCompetence: '2027-04',
    storage: createMemoryStorage()
  });

  const next = context.selectExercise('2027');
  assert.equal(next.exercise, '2027');
  assert.equal(next.activeKey, '2027-04');
  assert.deepEqual(next.availableKeys, ['2027-01', '2027-04']);
});

test('replaceConfiguration preserva a competência ativa válida ao alterar o fechamento', () => {
  const context = loadApi().createCompetenceContext({
    competences: competences2026,
    currentExercise: '2026',
    closingCompetence: '2026-05',
    initialCompetence: '2026-08',
    storage: createMemoryStorage()
  });

  const next = context.replaceConfiguration({
    competences: competences2026,
    currentExercise: '2026',
    closingCompetence: '2026-09',
    source: 'calendar-saved'
  });

  assert.equal(next.activeKey, '2026-08');
  assert.equal(next.closingKey, '2026-09');
});

test('replaceConfiguration usa o novo fechamento quando a competência ativa deixa de existir', () => {
  const context = loadApi().createCompetenceContext({
    competences: competences2026,
    currentExercise: '2026',
    closingCompetence: '2026-05',
    initialCompetence: '2026-08',
    storage: createMemoryStorage()
  });

  const next = context.replaceConfiguration({
    competences: [
      { key: '2026-05', label: 'Maio 2026' },
      { key: '2026-09', label: 'Setembro 2026' }
    ],
    currentExercise: '2026',
    closingCompetence: '2026-09',
    source: 'calendar-saved'
  });

  assert.equal(next.activeKey, '2026-09');
  assert.equal(next.closingKey, '2026-09');
});
