import fs from 'node:fs';

const target = 'supabase/tests/database/operational-command-rpc.test.sql';
const source = fs.readFileSync(target, 'utf8');
const before = "jsonb_build_object('id','global','exercises',jsonb_build_array('2026','2035'),'closing_competence','2034-02','settings','{}'::jsonb),";
const after = "jsonb_build_object('id','global','exercises',jsonb_build_array('2026','2035'),'closing_competence','2035-01','settings','{}'::jsonb,'row_version',(select row_version from public.app_config where id='global')),";

if (!source.includes(before)) {
  throw new Error('Contrato antigo do teste de exercício não localizado.');
}
if ((source.match(new RegExp(before.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length !== 1) {
  throw new Error('Contrato antigo apareceu em quantidade inesperada.');
}

const next = source.replace(before, after);
fs.writeFileSync(target, next);
console.log('Teste operacional ajustado: configuração válida, log deliberadamente ausente.');
