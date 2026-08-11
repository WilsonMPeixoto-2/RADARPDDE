# Dicionário de dados — Supabase

**Estado:** referência vigente em Preview e Production  
**Atualizado em:** 7 de agosto de 2026

## 1. Fontes exatas

```text
src/types/database.types.ts
supabase/migrations/
schema remoto verificado
```

Tipos gerados, migrations aplicadas e schema remoto prevalecem sobre este resumo. O baseline mutável fica em [`../CURRENT_STAGE.md`](../CURRENT_STAGE.md).

## 2. Convenções

- SQL em `snake_case`;
- IDs funcionais legados podem permanecer `text`;
- `row_version` controla concorrência otimista;
- `created_at` e `updated_at` são técnicos;
- JSONB é usado para estruturas variáveis, não para substituir relacionamentos essenciais;
- Auth identifica o usuário;
- `user_profiles` define papel e escopo;
- RLS é obrigatória nas tabelas expostas;
- `administrative_logs` é histórico funcional;
- `audit_events` é trilha técnica;
- operação composta deve preservar atomicidade ou compensação explícita.

## 3. Tabelas principais

| Grupo | Tabelas |
|---|---|
| configuração | `app_config`, `competences`, `programs` |
| escolas | `schools`, `school_programs` |
| equipe e acesso | `controllers`, `inventory_team_members`, `profiles`, `user_profiles`, `user_school_scopes` |
| acompanhamento | `verifications`, `pendencies`, `pendency_attempts`, `pendency_contacts` |
| financeiro e patrimônio | `registered_invoices`, `assets` |
| logs | `administrative_logs`, `audit_events` |
| importação | `data_import_runs`, `data_import_staging` |

## 4. Configuração

### `app_config`

Campos centrais:

- `id` — registro global;
- `exercises` — exercícios;
- `closing_competence` — competência de fechamento;
- `bonus_deadline_extended` — prazo excepcional opcional;
- `settings` — parâmetros adicionais;
- `row_version` — concorrência;
- timestamps.

`row_version` é mutável e deve ser relido antes de operação concorrente.

### `competences`

- `id` em `YYYY-MM`;
- rótulo e exercício;
- início, fim e prazo;
- fechamento formal opcional;
- `row_version`.

`save_exercise_with_competences` exige:

- papel `sme_management` ou `technical_admin`;
- `row_version` positivo da configuração;
- exatamente doze competências;
- um único exercício;
- IDs de janeiro a dezembro;
- exercício contido em `app_config.exercises`;
- competência inicial pertencente ao novo exercício;
- log global obrigatório;
- conflito otimista se a versão divergir.

### `programs`

- identificador;
- nome e descrição;
- `active` para vigência lógica;
- `row_version`.

O contrato atualmente implementado permite manutenção pela Gestão SME e administrador técnico. Futuras restrições exigem decisão funcional e atualização coordenada das camadas.

## 5. Escolas

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

### Integridade institucional

A migration `202608060003_school_institutional_identity` estabelece:

- `designation`, `denomination`, `inep`, `cnpj` e `sici` não vazios;
- índice único normalizado de INEP;
- índice único normalizado de CNPJ;
- índice único normalizado de SICI.

O serviço também exige, para nova escola, código institucional, designação, denominação, INEP, CNPJ e SICI e bloqueia duplicidades antes da persistência.

Identidade institucional não pode ser preenchida por geradores artificiais.

### `school_programs`

Relação entre escola e programa:

- `school_id`;
- `program_id`;
- vigência lógica e temporal;
- `row_version`;
- unicidade conforme constraints do schema.

### Carteira

`schools.controller_id` representa responsável principal. A alteração é protegida por autorização também no banco; Controlador não redistribui carteira pela edição cadastral.

## 6. Equipe, Auth e escopos

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

### Lookup Auth da equipe

`public.resolve_team_auth_user_id_by_email(text)`:

- normaliza o e-mail;
- retorna uma conta única quando existente;
- rejeita múltiplas contas para o mesmo e-mail;
- é `SECURITY DEFINER` com `search_path` restrito;
- não concede `EXECUTE` a `anon` nem `authenticated`;
- concede execução somente a `service_role`.

A Edge Function usa essa RPC e depois `getUserById`, evitando varredura global do catálogo Auth.

## 7. Acompanhamento mensal

### `verifications`

Identidade lógica:

```text
school_id + competence_id + program_id
```

Campos centrais:

- bonificação;
- análise técnica;
- `bonus_result`;
- payload de compatibilidade;
- `row_version`.

### `pendencies`

- escola e competência de origem;
- programa/documento;
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
- payload e versão.

O trigger `pendencies_sync_attempt_statuses`, instalado pela remediação funcional, sincroniza `payload.status` da tentativa com o agregado canônico em `pendencies.payload.tentativas`. A mesma migration executou reconciliação idempotente dos registros existentes.

### `pendency_contacts`

- escola e pendência opcional;
- data, canal e descrição;
- cobrança oficial;
- autoria;
- `operation_id` para idempotência;
- versão.

## 8. Financeiro e patrimônio

### `registered_invoices`

- escola, competência, programa e verificação;
- número, descrição, natureza e valor;
- data de registro;
- bem vinculado opcional;
- chave de contexto;
- para NFs de serviço, `payload.consultaAssessoriaEnviada` e `payload.analiseConsultaAssessoria` mantêm a avaliação individual da consulta contábil;
- versão.

O trigger `registered_invoices_delete_unlinked_asset` executa `delete_unlinked_invoice_asset()` quando `linked_asset_id` muda. A função remove apenas o bem anteriormente vinculado à mesma escola e bloqueia conflito quando outro documento ainda o referencia.

Para `expense_type = 'servico'`, `consultaAssessoriaEnviada` é booleano e `analiseConsultaAssessoria` admite `Não analisado`, `Correto`, `Correto (Atrasado)` ou `Incorreto`. `verifications.bonification.consAssessoria`, `consEnviada` e `verifications.analysis.consAssessoria` são projeções mensais derivadas de todas as NFs de serviço do contexto; não constituem avaliação compartilhada entre notas.

### `assets`

- escola e competência;
- descrição, natureza, valor e nota;
- processo e status;
- data e responsável pela inventariação;
- observações e payload;
- versão.

Nota permanente e bem vinculado devem manter contexto coerente.

Edição rápida patrimonial não usa mais persistência genérica: `InventoryService.updateAsset` admite somente o campo expressamente autorizado e persiste pelo contrato `saveAssetWithLog` com `expectedVersion` e `administrativeLog`.

## 9. Logs

### `administrative_logs`

- ação de domínio;
- instante;
- escola opcional;
- `actor_user_id`;
- identificador, perfil e detalhes.

### `audit_events`

- tabela, registro e ação;
- ator;
- estado anterior e posterior;
- campos alterados;
- correlação e instante.

Usuários operacionais não escrevem diretamente nessa tabela.

Exportações usam `AuditService.record` como trilha administrativa. O início deve ser confirmado antes do download.

## 10. Importação

### `data_import_runs`

Controla identificador, hash/formato da fonte, contagens, lotes, reconciliação, snapshot de rollback, estado, datas, autor e erro.

### `data_import_staging`

Identidade prática:

```text
import_id + entity + record_id
```

Armazena lotes idempotentes antes da promoção.

## 11. Funções/RPCs relevantes

O schema contém funções para:

- papel atual e acesso escolar;
- verificação e log;
- pendências, tentativas, contatos e reanálise;
- notas e bens com efeitos compostos;
- exercício, competências e configurações;
- programas e log;
- atribuição de Controlador;
- Gestão de Equipe;
- resolução segura de conta Auth por e-mail;
- importação, promoção, reconciliação e rollback;
- contratos JSON e snapshots;
- auditoria agregada de integridade.

Assinaturas exatas devem ser consultadas nos tipos e migrations da versão analisada.

## 12. Edge Function

`team-account-management` administra contas Auth da equipe e chama RPCs server-side. Não substitui RLS.

A versão efetiva fica em `CURRENT_STAGE.md` e deve ser confirmada remotamente.

Contratos:

- JWT obrigatório;
- papel autorizado;
- CORS fail-closed;
- lookup exato de conta;
- reutilização controlada;
- compensação;
- resposta funcional sanitizada.

## 13. Concorrência

- escrita usa versão esperada quando o contrato exigir;
- divergência gera conflito;
- interface não sobrescreve silenciosamente;
- operação composta usa RPC/transação;
- repetição automática de escrita é proibida;
- compensação é obrigatória quando Auth e banco participam de etapas diferentes.

## 14. RLS

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

## 15. Atualização do dicionário

Após mudança de schema ou contrato de persistência:

1. aplicar/testar em ambiente isolado;
2. executar pgTAP e lint;
3. regenerar tipos;
4. atualizar este documento quando o contrato estável mudar;
5. atualizar permissões e matriz funcional;
6. executar backup/restauração;
7. validar dry-run remoto;
8. registrar evidência no mesmo SHA;
9. aplicar em Production somente dentro do escopo autorizado.
