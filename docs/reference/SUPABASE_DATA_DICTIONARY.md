# Dicionário de dados — Supabase

**Estado:** vigente em Preview e Production  
**Atualizado em:** 5 de agosto de 2026

## 1. Fontes exatas

```text
src/types/database.types.ts
supabase/migrations/
schema remoto verificado
```

Tipos gerados, migrations aplicadas e schema remoto prevalecem sobre este resumo.

## 2. Baseline

```text
projeto: scnryinorqeucbfkioxo
PostgreSQL: 17.6.1.147
migrations em Production: 25
app_config.id: global
closing_competence: 2026-12
app_config.row_version: 20
```

`row_version` é mutável e deve ser consultado novamente antes de escrita concorrente. O PR nº 141 permanece em rascunho e sua proposta de 26ª migration não integra Production.

## 3. Convenções

- SQL em `snake_case`;
- IDs funcionais legados podem permanecer `text`;
- `row_version` controla concorrência otimista;
- `created_at` e `updated_at` são técnicos;
- JSONB é usado para estruturas variáveis, não para substituir relacionamentos essenciais;
- Auth identifica o usuário;
- `user_profiles` define papel e escopo;
- RLS é obrigatória nas tabelas expostas;
- `administrative_logs` é histórico funcional;
- `audit_events` é trilha técnica.

## 4. Tabelas

| Grupo | Tabelas |
|---|---|
| configuração | `app_config`, `competences`, `programs` |
| escolas | `schools`, `school_programs` |
| equipe e acesso | `controllers`, `inventory_team_members`, `profiles`, `user_profiles`, `user_school_scopes` |
| acompanhamento | `verifications`, `pendencies`, `pendency_attempts`, `pendency_contacts` |
| financeiro e patrimônio | `registered_invoices`, `assets` |
| logs | `administrative_logs`, `audit_events` |
| importação | `data_import_runs`, `data_import_staging` |

## 5. Configuração

### `app_config`

| Campo | Regra |
|---|---|
| `id` | registro global |
| `exercises` | exercícios em JSONB |
| `closing_competence` | FK para competência |
| `bonus_deadline_extended` | prazo excepcional opcional |
| `settings` | parâmetros adicionais |
| `row_version` | concorrência |
| timestamps | controle técnico |

### `competences`

- `id` em `YYYY-MM`;
- rótulo e exercício;
- início, fim e prazo;
- fechamento formal opcional;
- `row_version`.

As doze competências de 2026 estão cadastradas.

### `programs`

- identificador, nome e descrição;
- `active` para vigência lógica;
- `row_version`.

Programas são globais no modelo atual. A regra de manutenção por Gestão SME deve ser confirmada antes de nova alteração funcional.

## 6. Escolas

### `schools`

Campos principais:

- `id`, `designation`, `denomination`;
- contatos institucionais;
- direção geral e adjunta;
- INEP, CNPJ e SICI;
- `cre` e `ra`;
- `controller_id` como responsável principal;
- processo patrimonial;
- competência inicial;
- `active` e `row_version`.

A carteira organiza responsabilidade, mas a regra vigente permite colaboração entre Controladores da mesma CRE.

### `school_programs`

Relação entre escola e programa:

- `school_id`;
- `program_id`;
- vigência lógica e temporal;
- `row_version`;
- unicidade conforme constraints do schema.

## 7. Equipe, Auth e escopos

### `controllers`

- `id`, `name`, `email`;
- `user_id` para `auth.users`;
- `active`;
- `row_version`.

### `inventory_team_members`

Estrutura equivalente para integrantes do Inventário.

### `profiles`

Papéis:

- `controller`;
- `federal_assistant`;
- `sme_management`;
- `inventory`;
- `technical_admin`.

Possui rótulo, descrição, prioridade, vigência e versão.

### `user_profiles`

- `user_id`;
- `profile_id`;
- `controller_id` opcional;
- `inventory_member_id` opcional;
- `cre_scope`;
- `active`;
- `row_version`.

Regra funcional: um perfil institucional ativo por usuário.

### `user_school_scopes`

Exceções por escola:

- usuário;
- escola;
- `can_write`.

Complementa o escopo por CRE.

## 8. Acompanhamento mensal

### `verifications`

Identidade lógica:

```text
school_id + competence_id + program_id
```

Campos centrais:

- bonificação e análise validadas;
- `bonus_result`;
- payload de compatibilidade;
- `row_version`.

O resultado persistido deve coincidir com a regra canônica do domínio.

### `pendencies`

- escola e competência de origem;
- programa e documento opcionais;
- estados Aberta, Aguardando reanálise, Resolvida e Cancelada;
- responsável e próximo ator;
- motivo e observações;
- datas de abertura, resolução e cancelamento;
- payload e versão.

### `pendency_attempts`

- pendência e número da tentativa;
- envio e análise;
- resultado;
- referência documental;
- observação, erros e autoria;
- versão.

### `pendency_contacts`

- escola e pendência opcional;
- data, canal e descrição;
- indicador de cobrança oficial;
- autoria e correlação;
- versão.

## 9. Financeiro e patrimônio

### `registered_invoices`

- escola, competência, programa e verificação;
- número, descrição, natureza e valor;
- data de registro;
- bem vinculado opcional;
- chave de contexto;
- versão.

### `assets`

- escola e competência;
- descrição, natureza, valor e nota;
- processo e status;
- data e responsável pela inventariação;
- observações e payload;
- versão.

Nota permanente e bem vinculado devem manter escola, competência e número da nota coerentes.

## 10. Logs

### `administrative_logs`

- ação de domínio;
- instante;
- escola opcional;
- `actor_user_id`;
- identificador, perfil e detalhes.

Gestão SME consulta somente registros da própria autoria por UUID.

### `audit_events`

- tabela, registro e ação;
- ator;
- estado anterior e posterior;
- campos alterados;
- correlação e instante.

Usuários operacionais não escrevem diretamente nessa tabela.

## 11. Importação

### `data_import_runs`

Controla:

- `import_id`;
- hash e formato da fonte;
- contagens;
- lotes concluídos;
- reconciliação;
- snapshot de rollback;
- estado, datas, autor e erro.

### `data_import_staging`

Identidade prática:

```text
import_id + entity + record_id
```

Armazena lotes idempotentes antes da promoção.

## 12. Funções e RPCs

O schema contém funções para:

- papel atual e acesso escolar;
- verificação e log;
- pendências, tentativas, contatos e reanálise;
- notas e bens com efeitos compostos;
- exercício, competências e configurações;
- atribuição de Controlador;
- Gestão de Equipe;
- importação, promoção, reconciliação e rollback;
- contratos JSON e snapshots.

Assinaturas exatas devem ser consultadas nos tipos e migrations.

## 13. Edge Function

```text
slug: team-account-management
version: 95
status: ACTIVE
verify_jwt: true
```

Ela administra contas Auth da equipe e chama RPCs server-side. Não é tabela nem substitui RLS.

## 14. Concorrência

- escrita usa versão esperada quando o contrato exigir;
- divergência gera conflito;
- interface não sobrescreve silenciosamente;
- operação composta usa RPC/transação;
- repetição automática de escrita é proibida;
- compensação é obrigatória quando Auth e banco participam de etapas diferentes.

## 15. RLS

A autorização combina:

- `auth.uid()`;
- papel ativo;
- `cre_scope`;
- carteira principal;
- exceção escolar;
- leitura versus escrita;
- políticas específicas de Inventário e SME;
- privilégios técnicos.

Consultar [`SUPABASE_PERMISSIONS_MATRIX.md`](SUPABASE_PERMISSIONS_MATRIX.md).

## 16. Atualização do dicionário

Após mudança de schema:

1. aplicar localmente;
2. executar pgTAP e lint;
3. regenerar tipos;
4. atualizar este documento;
5. atualizar permissões e cobertura;
6. executar backup/restauração;
7. validar dry-run remoto;
8. registrar evidência no mesmo SHA;
9. aplicar em Production somente com autorização.
