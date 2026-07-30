# Dicionário de dados — Supabase

**Estado:** vigente em Preview e Production  
**Atualizado em:** 29 de julho de 2026

## 1. Fonte canônica

Este documento resume o schema efetivo do RADAR PDDE. A fonte exata de tipos é:

```text
src/types/database.types.ts
```

A fonte da evolução é:

```text
supabase/migrations/
```

Em caso de divergência, migrations aplicadas, schema remoto verificado e tipos regenerados prevalecem sobre este resumo.

## 2. Convenções

- nomes SQL em `snake_case`;
- IDs funcionais legados preservados como `text` quando necessário;
- IDs técnicos podem usar UUID, identidade ou chave composta;
- `row_version` controla concorrência otimista nas tabelas mutáveis;
- `created_at` e `updated_at` são timestamps técnicos;
- datas do domínio permanecem em colunas próprias;
- `payload jsonb` preserva atributos variáveis ou compatibilidade sem substituir campos relacionais essenciais;
- Auth identifica o usuário; `user_profiles` define papel e escopo;
- RLS é obrigatória nas tabelas expostas;
- `audit_events` e `administrative_logs` cumprem finalidades diferentes.

## 3. Visão geral das tabelas

| Grupo | Tabelas |
|---|---|
| configuração | `app_config`, `competences`, `programs` |
| escolas | `schools`, `school_programs` |
| equipe e acesso | `controllers`, `inventory_team_members`, `profiles`, `user_profiles`, `user_school_scopes` |
| acompanhamento | `verifications`, `pendencies`, `pendency_attempts`, `pendency_contacts` |
| financeiro/patrimonial | `registered_invoices`, `assets` |
| logs e auditoria | `administrative_logs`, `audit_events` |
| importação | `data_import_runs`, `data_import_staging` |

## 4. Configuração

### 4.1 `app_config`

Registro global da aplicação.

| Campo | Tipo | Regra |
|---|---|---|
| `id` | `text` | chave primária; valor canônico `global` |
| `exercises` | `jsonb` | exercícios disponíveis |
| `closing_competence` | `text` | FK para `competences.id` |
| `bonus_deadline_extended` | `date` | prazo excepcional opcional |
| `settings` | `jsonb` | demais parâmetros autorizados |
| `row_version` | `integer` | concorrência otimista |
| `created_at`, `updated_at` | `timestamptz` | controle técnico |

Estado de referência de 29/07/2026:

```text
id = global
closing_competence = 2026-12
row_version = 5
```

### 4.2 `competences`

| Campo | Tipo | Regra |
|---|---|---|
| `id` | `text` | `YYYY-MM` |
| `label` | `text` | rótulo mensal |
| `exercise` | `integer` | exercício |
| `starts_on`, `ends_on` | `date` | janela opcional |
| `bonus_deadline` | `date` | prazo da bonificação |
| `closed_at` | `timestamptz` | fechamento formal opcional |
| `row_version` | `integer` | concorrência |

As doze competências de 2026 estão cadastradas.

### 4.3 `programs`

| Campo | Tipo | Regra |
|---|---|---|
| `id` | `text` | identificador funcional |
| `name` | `text` | nome |
| `description` | `text` | descrição |
| `active` | `boolean` | vigência lógica |
| `row_version` | `integer` | concorrência |

Programas são globais. Configuração por exercício permanece frente futura e não deve ser inferida desta tabela sem contrato adicional.

## 5. Escolas e vínculos

### 5.1 `schools`

| Campo | Finalidade |
|---|---|
| `id` | identificador funcional da unidade |
| `designation` | designação única |
| `denomination` | nome da unidade |
| `phone`, `institutional_mobile`, `email` | contatos institucionais |
| `director_name`, `director_phone` | direção geral |
| `deputy_director_name`, `deputy_director_phone` | direção adjunta |
| `inep`, `cnpj`, `sici` | identificadores administrativos |
| `cre`, `ra` | escopo organizacional |
| `controller_id` | responsável principal; FK para `controllers` |
| `inventory_process` | processo patrimonial |
| `initial_competence` | FK para `competences` |
| `active` | desativação lógica |
| `row_version` | concorrência |

`controller_id` organiza responsabilidade principal, mas não impede colaboração de Controladores da mesma CRE.

### 5.2 `school_programs`

Relação N:N entre escola e programa.

| Campo | Regra |
|---|---|
| `id` | identificador funcional do vínculo |
| `school_id` | FK para escola |
| `program_id` | FK para programa |
| `active` | vínculo vigente |
| `starts_on`, `ends_on` | vigência opcional |
| `row_version` | concorrência |

A combinação escola–programa é única segundo as constraints do schema.

## 6. Equipe, Auth e escopos

### 6.1 `controllers`

| Campo | Regra |
|---|---|
| `id` | identificador funcional |
| `name`, `email` | diretório |
| `user_id` | vínculo opcional com `auth.users` |
| `active` | desativação lógica |
| `row_version` | concorrência |

### 6.2 `inventory_team_members`

Estrutura equivalente à de Controladores para integrantes do Inventário, com `user_id`, `active` e `row_version`.

### 6.3 `profiles`

Catálogo de papéis institucionais.

| Campo | Regra |
|---|---|
| `id` | `controller`, `federal_assistant`, `sme_management`, `inventory` ou `technical_admin` |
| `label`, `description` | apresentação |
| `priority` | precedência técnica |
| `active` | vigência |
| `row_version` | concorrência |

### 6.4 `user_profiles`

Vínculo entre Auth e papel institucional.

| Campo | Regra |
|---|---|
| `user_id` | UUID de `auth.users` |
| `profile_id` | FK para `profiles` |
| `controller_id` | FK opcional |
| `inventory_member_id` | FK opcional |
| `cre_scope` | CRE padrão |
| `active` | perfil ativo |
| `row_version` | concorrência |

Regra funcional: um perfil institucional ativo por usuário.

### 6.5 `user_school_scopes`

Exceções explícitas por escola.

| Campo | Regra |
|---|---|
| `user_id` | usuário Auth |
| `school_id` | escola |
| `can_write` | distingue leitura e escrita |

Não substitui o escopo padrão por CRE; complementa-o.

## 7. Acompanhamento mensal

### 7.1 `verifications`

Identidade lógica:

```text
school_id + competence_id + program_id
```

| Campo | Regra |
|---|---|
| `id` | identificador canônico |
| `school_id` | FK para escola |
| `competence_id` | FK para competência |
| `program_id` | FK para programa |
| `bonification` | JSON validado |
| `analysis` | JSON validado |
| `bonus_result` | resultado consolidado ou nulo |
| `payload` | compatibilidade/extensões |
| `row_version` | concorrência |

A regra APTA/INAPTA pertence ao domínio e deve coincidir com `bonus_result` persistido.

### 7.2 `pendencies`

| Campo | Regra |
|---|---|
| `id` | identificador |
| `school_id` | escola |
| `competence_origin` | FK para competência de origem |
| `program_id` | FK opcional |
| `document_key` | documento/item |
| `status` | Aberta, Aguardando reanálise, Resolvida ou Cancelada |
| `responsible_area`, `next_actor` | responsabilidade operacional |
| `reason`, `notes` | motivação e observações |
| `opened_at`, `resolved_at`, `canceled_at` | marcos |
| `payload` | extensões |
| `row_version` | concorrência |

### 7.3 `pendency_attempts`

| Campo | Regra |
|---|---|
| `pendency_id` | FK para pendência |
| `attempt_number` | sequência |
| `submitted_at` | envio |
| `analyzed_at` | análise opcional |
| `result` | resultado da tentativa |
| `drive_url` | referência documental autorizada |
| `observation`, `errors` | contexto |
| `created_by` | autoria |
| `row_version` | concorrência |

### 7.4 `pendency_contacts`

| Campo | Regra |
|---|---|
| `school_id` | escola |
| `pendency_id` | pendência opcional |
| `contact_date`, `contact_type` | ocorrência |
| `description` | registro |
| `official_charge` | cobrança oficial |
| `created_by` | autoria |
| `operation_id` | correlação opcional |
| `row_version` | concorrência |

## 8. Financeiro e patrimônio

### 8.1 `registered_invoices`

| Campo | Regra |
|---|---|
| `school_id` | escola |
| `competence_id` | competência opcional |
| `program_id` | programa opcional |
| `verification_id` | verificação opcional |
| `invoice_number` | número da nota |
| `description`, `expense_type`, `amount` | conteúdo financeiro |
| `registered_at` | data de registro |
| `linked_asset_id` | bem derivado opcional |
| `source_context_key` | rastreabilidade |
| `row_version` | concorrência |

### 8.2 `assets`

| Campo | Regra |
|---|---|
| `school_id` | escola |
| `competence_id` | competência opcional |
| `description`, `expense_type`, `amount` | identificação do bem |
| `invoice_number` | origem financeira |
| `inventory_process` | processo |
| `status` | estado patrimonial |
| `inventoried_at` | conclusão opcional |
| `inventoried_by_member_id` | integrante responsável |
| `notes`, `payload` | contexto |
| `row_version` | concorrência |

## 9. Logs e auditoria

### 9.1 `administrative_logs`

Registro funcional legível pela aplicação.

| Campo | Regra |
|---|---|
| `action` | ação de domínio |
| `event_at` | instante |
| `school_id` | escola opcional |
| `actor_user_id` | UUID Auth opcional |
| `user_identifier`, `profile_name` | contexto legado/funcional |
| `details` | JSON do evento |

A Gestão SME somente consulta linhas de própria autoria por UUID. Registros antigos sem UUID não são expostos a esse perfil.

### 9.2 `audit_events`

Trilha técnica gerada por triggers e mecanismos internos.

| Campo | Regra |
|---|---|
| `table_name`, `record_id`, `action` | alvo |
| `actor_user_id` | autoria |
| `old_record`, `new_record` | estados |
| `changed_fields` | campos alterados |
| `request_id` | correlação |
| `occurred_at` | instante |

Usuários autenticados não inserem, alteram ou excluem diretamente essa tabela.

## 10. Importação

### 10.1 `data_import_runs`

Controla execução, fonte, hashes, lotes, reconciliação e snapshot de rollback.

Campos centrais:

- `import_id`;
- `source_hash`;
- `snapshot_format` e `snapshot_version`;
- `entity_counts`;
- `completed_batches`;
- `reconciliation_report`;
- `rollback_snapshot`;
- `status`, `started_at`, `completed_at`;
- `created_by`, `error_message`.

### 10.2 `data_import_staging`

Armazena lotes idempotentes antes da promoção.

Identidade prática:

```text
import_id + entity + record_id
```

Campos: `batch_index`, `source_hash`, `payload`, timestamps e FK para `data_import_runs.import_id`.

## 11. Funções e RPCs

O schema expõe funções para:

- verificar papel e acesso escolar;
- salvar verificação com log;
- reanalisar pendência com efeitos;
- salvar e excluir nota com efeitos;
- salvar bem com log;
- registrar contatos e pendências;
- criar exercício e competências;
- atribuir Controlador;
- administrar contas da equipe;
- iniciar, carregar, promover, reconciliar e reverter importação;
- capturar e aplicar snapshot;
- validar contratos JSON.

A lista exata e as assinaturas devem ser consultadas em `src/types/database.types.ts` e nas migrations.

## 12. Concorrência e transações

- tabelas mutáveis usam `row_version`;
- operações compostas usam RPC/transação;
- versão esperada divergente gera conflito;
- interface não deve sobrescrever silenciosamente;
- retry automático de escrita é proibido.

## 13. RLS

RLS combina:

- `auth.uid()`;
- papel ativo;
- `cre_scope`;
- responsável principal;
- exceção em `user_school_scopes`;
- natureza do recurso;
- leitura versus escrita;
- governança específica da Gestão SME;
- acesso técnico excepcional.

Matriz: [`SUPABASE_PERMISSIONS_MATRIX.md`](SUPABASE_PERMISSIONS_MATRIX.md).

## 14. Atualização do dicionário

Após mudança de schema:

1. aplicar migrations localmente;
2. executar pgTAP e lint;
3. regenerar tipos;
4. atualizar este documento;
5. atualizar matriz de permissões quando necessário;
6. verificar Advisors;
7. registrar evidência no mesmo SHA.

Nenhuma nova migration de Production pode ser aplicada antes da reconciliação do identificador SME descrita em [`../runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md`](../runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md).
