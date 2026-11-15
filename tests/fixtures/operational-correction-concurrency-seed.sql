-- RADAR PDDE — contrato de correção operacional (T2/T3).
-- Testes de referência elaborados pela auditoria independente do agente Manus
-- (15/11/2026). Cobrem capacidade, escopo exato, preservação de vizinhos e de
-- bonificação, guardas terminais, digest com versões e idempotência.
begin;
set local role postgres;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public, pg_catalog;



-- --------------------------------------------------------------- massa
insert into auth.users (id, email) values
    ('00000000-0000-0000-0000-00000000c001', 'occ-controller@example.test'),
    ('00000000-0000-0000-0000-00000000c002', 'occ-controller-outra-cre@example.test'),
    ('00000000-0000-0000-0000-00000000c003', 'occ-gestao@example.test');
insert into public.controllers (id, name, email, user_id) values
    ('OCC-CTRL-A', 'Controlador Correção A', 'occ-controller@example.test', '00000000-0000-0000-0000-00000000c001'),
    ('OCC-CTRL-B', 'Controlador Correção B', 'occ-controller-outra-cre@example.test', '00000000-0000-0000-0000-00000000c002');
insert into public.user_profiles (user_id, profile_id, controller_id, cre_scope) values
    ('00000000-0000-0000-0000-00000000c001', 'controller', 'OCC-CTRL-A', 'OCC-CRE-A'),
    ('00000000-0000-0000-0000-00000000c002', 'controller', 'OCC-CTRL-B', 'OCC-CRE-B'),
    ('00000000-0000-0000-0000-00000000c003', 'sme_management', null, null);

insert into public.programs (id, name) values ('OCC_BASIC', 'Programa Correção Operacional');
insert into public.competences (id, label, exercise) values ('2041-03', 'Março 2041', 2041);
insert into public.schools (id, designation, denomination, cre, inep, cnpj, sici) values
    ('OCC-SCHOOL', '04.98.001', 'Escola Correção', 'OCC-CRE-A', '33980001', '98.001.001/0001-01', 'SICI-OCC-1');

insert into public.verifications (id, school_id, competence_id, program_id, bonification, analysis, bonus_result, payload)
values (
    'OCC-SCHOOL::2041-03::OCC_BASIC', 'OCC-SCHOOL', '2041-03', 'OCC_BASIC',
    '{"notaFiscal":"Sim","extCC":"Sim","extINV":"Sim","declBBAgil":"Não"}'::jsonb,
    '{"notaFiscal":"Incorreto","extCC":"Incorreto","extINV":"Incorreto","declBBAgil":"Incorreto"}'::jsonb,
    'apta', '{}'::jsonb
);

insert into public.assets (id, school_id, competence_id, description, expense_type, invoice_number, amount, status)
values ('OCC-ASSET-3', 'OCC-SCHOOL', '2041-03', 'Projetor', 'permanente', 'OCC-3', 2400, 'Inventariada');

insert into public.registered_invoices (
    id, school_id, competence_id, program_id, verification_id, source_context_key,
    description, expense_type, invoice_number, amount, linked_asset_id, payload
) values
    ('OCC-NF-1', 'OCC-SCHOOL', '2041-03', 'OCC_BASIC', 'OCC-SCHOOL::2041-03::OCC_BASIC', '2041-03_OCC_BASIC',
     'Material lançado por engano', 'consumo', 'OCC-1', 480, null, '{"analiseDocumentoFiscal":"Incorreto"}'::jsonb),
    ('OCC-NF-2', 'OCC-SCHOOL', '2041-03', 'OCC_BASIC', 'OCC-SCHOOL::2041-03::OCC_BASIC', '2041-03_OCC_BASIC',
     'Material vizinho', 'consumo', 'OCC-2', 300, null, '{"analiseDocumentoFiscal":"Correto"}'::jsonb),
    ('OCC-NF-3', 'OCC-SCHOOL', '2041-03', 'OCC_BASIC', 'OCC-SCHOOL::2041-03::OCC_BASIC', '2041-03_OCC_BASIC',
     'Projetor', 'permanente', 'OCC-3', 2400, 'OCC-ASSET-3', '{"analiseDocumentoFiscal":"Correto"}'::jsonb),
    ('OCC-NF-4', 'OCC-SCHOOL', '2041-03', 'OCC_BASIC', 'OCC-SCHOOL::2041-03::OCC_BASIC', '2041-03_OCC_BASIC',
     'Despesa a identificar', 'a_identificar', null, 90, null, '{"analiseDocumentoFiscal":"Incorreto"}'::jsonb),
    ('OCC-NF-5', 'OCC-SCHOOL', '2041-03', 'OCC_BASIC', 'OCC-SCHOOL::2041-03::OCC_BASIC', '2041-03_OCC_BASIC',
     'Saída identificada do Qualidade', 'consumo', 'OCC-5', 150, null, '{"analiseDocumentoFiscal":"Correto"}'::jsonb);

insert into public.quality_provisional_movements (
    id, school_id, competence_id, debit_date, description, amount, status, registered_invoice_id, identification_operation_key, created_by, updated_by
) values (
    '00000000-0000-0000-0000-00000000c501', 'OCC-SCHOOL', '2041-03', '2041-03-05', 'Saída provisória', 150,
    'identified', 'OCC-NF-5', '00000000-0000-0000-0000-00000000c502', '00000000-0000-0000-0000-00000000c001', '00000000-0000-0000-0000-00000000c001'
);

insert into public.pendencies (id, school_id, competence_origin, program_id, document_key, status, next_actor, registered_invoice_id, resolved_at)
values
    ('OCC-P-NF1', 'OCC-SCHOOL', '2041-03', 'OCC_BASIC', 'notaFiscal', 'Aberta', 'Escola', 'OCC-NF-1', null),
    ('OCC-P-NF1-OLD', 'OCC-SCHOOL', '2041-03', 'OCC_BASIC', 'notaFiscal', 'Resolvida', 'Escola', 'OCC-NF-1', now()),
    ('OCC-P-NF2', 'OCC-SCHOOL', '2041-03', 'OCC_BASIC', 'notaFiscal', 'Resolvida', 'Escola', 'OCC-NF-2', now()),
    ('OCC-P-NF4', 'OCC-SCHOOL', '2041-03', 'OCC_BASIC', 'notaFiscal', 'Aberta', 'Escola', 'OCC-NF-4', null),
    ('OCC-P-EXTCC', 'OCC-SCHOOL', '2041-03', 'OCC_BASIC', 'extCC', 'Aguardando reanálise', 'Controlador', null, null),
    ('OCC-P-EXTINV-1', 'OCC-SCHOOL', '2041-03', 'OCC_BASIC', 'extINV', 'Aberta', 'Escola', null, null),
    ('OCC-P-EXTINV-2', 'OCC-SCHOOL', '2041-03', 'OCC_BASIC', 'extINV', 'Cancelada', 'Escola', null, null),
    ('OCC-P-BB', 'OCC-SCHOOL', '2041-03', 'OCC_BASIC', 'declBBAgil', 'Aberta', 'Escola', null, null);

insert into public.pendency_attempts (id, pendency_id, attempt_number, submitted_at) values
    ('OCC-A-1', 'OCC-P-NF1', 1, now()),
    ('OCC-A-EXTCC', 'OCC-P-EXTCC', 1, now());

insert into public.pendency_contacts (id, school_id, pendency_id, contact_type, contact_date, description) values
    ('OCC-C-1', 'OCC-SCHOOL', 'OCC-P-NF1', 'email', current_date, 'Cobrança da NF 1'),
    ('OCC-C-2', 'OCC-SCHOOL', 'OCC-P-NF1-OLD', 'email', current_date, 'Cobrança antiga da NF 1'),
    ('OCC-C-3', 'OCC-SCHOOL', 'OCC-P-NF2', 'email', current_date, 'Cobrança da NF 2'),
    ('OCC-C-FREE', 'OCC-SCHOOL', null, 'telefone', current_date, 'Contato geral sem Pendência');
COMMIT;
