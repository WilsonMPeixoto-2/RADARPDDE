'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { fingerprint } = require('../../scripts/check-generated-database-types.js');

test('typegen aceita separadores, aspas de chaves, união inicial, vírgula final e arrays equivalentes', async () => {
  const old = [
    'export type Json = | string | number | null;',
    'export type T = { public: { Tables: {',
    'schools: { Row: { id: string[]; payload: NonNullable<Json> };',
    'ComputedFields: never; Insert: { id?: string }; Update: {}; Relationships: [] }',
    '} } };',
    'export type Table<N extends keyof T,> = T[N];'
  ].join('\n');
  const generated = [
    'export type Json = string | number | null',
    'export type T = { "public": { Tables: {',
    '"schools": { Row: { "id": (string)[], "payload": NonNullable<Json> }',
    'ComputedFields: never, Insert: { "id"?: string }, Update: {}, Relationships: [] }',
    '} } };',
    'export type Table<N extends keyof T> = T[N]'
  ].join('\n');
  assert.deepEqual(await fingerprint(old), await fingerprint(generated));
});

test('typegen bloqueia diferenças reais de tipo, campo, nulabilidade, RPC e opcionalidade', async () => {
  const original = 'export type T = { Row: { name: string; payload: NonNullable<Json>; id?: string }; Args: { p_id: string }; Relationships: [] };';
  const different = [
    original.replace('name: string', 'name: number'),
    original.replace('NonNullable<Json>', 'Json'),
    original.replace('id?: string', 'id: string'),
    original.replace('name:', 'renamed:'),
    original.replace('p_id: string', 'p_id: number'),
    original.replace('Relationships: []', 'Relationships: [{ foreignKeyName: "other" }]'),
    original.replace('name: string;', '')
  ];
  const baseline = await fingerprint(original);
  for (const variant of different) assert.notDeepEqual(await fingerprint(variant), baseline);
});

test('typegen rejeita sintaxe TypeScript inválida', async () => {
  await assert.rejects(fingerprint('export type T = { Row: { id: } };'));
});
