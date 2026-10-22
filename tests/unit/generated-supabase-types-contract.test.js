'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { fingerprint } = require('../../scripts/check-generated-database-types.js');

test('gerador Supabase aceita diferenças apenas de apresentação dos tipos', () => {
  const formatted = 'export type T = { public: { Tables: { schools: { Row: { id: string[]; payload: NonNullable<Json> }; ComputedFields: never; Insert: { id?: string }; Update: {}; Relationships: [] } } } }; export type Json = string | null;';
  const generated = 'export type T={ "public":{ Tables:{ "schools":{Row:{"id":(string)[],"payload": NonNullable<Json>},ComputedFields:never,Insert:{"id"?:string},Update:{},Relationships:[]}}}};export type Json=string|null;';
  assert.equal(fingerprint(formatted), fingerprint(generated));
});

test('gerador Supabase reprova mudança real de tipo, nulabilidade ou campo', () => {
  const baseline = 'export type T = { Row: { name: string; payload: NonNullable<Json>; id?: string } };';
  const typeChanged = 'export type T = { Row: { name: number; payload: NonNullable<Json>; id?: string } };';
  const nullabilityChanged = 'export type T = { Row: { name: string; payload: Json; id?: string } };';
  const requiredChanged = 'export type T = { Row: { name: string; payload: NonNullable<Json>; id: string } };';
  const removed = 'export type T = { Row: { name: string; payload: NonNullable<Json> } };';
  for (const candidate of [typeChanged, nullabilityChanged, requiredChanged, removed]) {
    assert.notEqual(fingerprint(baseline), fingerprint(candidate));
  }
});

test('gerador Supabase rejeita sintaxe TypeScript inválida', () => {
  assert.throws(() => fingerprint('export type T = { Row: { id: } };'), /TypeScript inválido/);
});
