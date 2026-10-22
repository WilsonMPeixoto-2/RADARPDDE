'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { fingerprint } = require('../../scripts/check-generated-database-types.js');

test('gerador Supabase aceita diferenças apenas de apresentação dos tipos', async () => {
  const formatted = 'export type T = { public: { Tables: { schools: { Row: { id: string[]; payload: NonNullable<Json> }; ComputedFields: never; Insert: { id?: string }; Update: {}; Relationships: [] } } } }; export type Json = string | null;';
  const generated = 'export type T={ "public":{ Tables:{ "schools":{Row:{"id":(string)[],"payload": NonNullable<Json>},ComputedFields:never,Insert:{"id"?:string},Update:{},Relationships:[]}}}};export type Json=string|null;';
  assert.equal(await fingerprint(formatted), await fingerprint(generated));
});

test('gerador Supabase reprova mudança real de tipo, nulabilidade ou campo', async () => {
  const baseline = 'export type T = { Row: { name: string; payload: NonNullable<Json>; id?: string } };';
  const candidates = [
    'export type T = { Row: { name: number; payload: NonNullable<Json>; id?: string } };',
    'export type T = { Row: { name: string; payload: Json; id?: string } };',
    'export type T = { Row: { name: string; payload: NonNullable<Json>; id: string } };',
    'export type T = { Row: { name: string; payload: NonNullable<Json> } };'
  ];
  const original = await fingerprint(baseline);
  for (const candidate of candidates) assert.notEqual(original, await fingerprint(candidate));
});

test('gerador Supabase rejeita sintaxe TypeScript inválida', async () => {
  await assert.rejects(fingerprint('export type T = { Row: { id: } };'));
});
