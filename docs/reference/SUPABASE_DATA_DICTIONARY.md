# Dicionário de dados — Supabase

Este documento descreve o modelo preparado para futura persistência do RADAR PDDE. Os nomes SQL usam `snake_case`; os nomes atuais do frontend permanecem inalterados enquanto o sistema estiver no modo `local`.

## Convenções gerais

- Toda entidade exposta pelo contrato de repositório possui uma coluna `id`.
- Identificadores atuais de escolas, programas, controladores, pendências, tentativas, contatos, bens, notas e logs são preservados como `text`.
- Tabelas exclusivamente administrativas podem usar `uuid` ou identidade numérica.
- `payload jsonb` conserva atributos legados ainda não normalizados e viabiliza migração sem perda de informação.
- `row_version` é incrementado por trigger nas tabelas mutáveis para futuro controle de concorrência.
- `created_at` e `updated_at` são timestamps técnicos; campos de data do domínio permanecem separados.
- O repositório remoto pagina leituras, grava em lotes e oferece atualização otimista por `row_version`.

## Tabelas estruturais

### `app_config`

| Campo | Tipo | Origem atual | Regra |
|---|---|---|---|
| `id` | `text` | configuração global | chave primária; valor esperado: `global` |
| `exercises` | `jsonb` | `config.exercicios` | exercícios disponíveis |
| `closing_competence` | `text` | `config.competenciaFechamento` | FK para `competences.id` |
| `bonus_deadline_extended` | `date` | prazo excepcional, quando houver | nulo quando não configurado |
| `settings` | `jsonb` | demais parâmetros | preserva `prazoBonificacaoProrrogado` e extensões futuras |
| `row_version` | `integer` | novo | concorrência otimista |

### `programs`

| Campo | Tipo | Origem atual |
|---|---|---|
| `id` | `text` | `programa.id` |
| `name` | `text` | `programa.name` |
| `description` | `text` | `programa.desc` |
| `active` | `boolean` | novo |
| `row_version` | `integer` | novo |

### `controllers`

| Campo | Tipo | Origem atual |
|---|---|---|
| `id` | `text` | `controlador.id` |
| `name` | `text` | `controlador.name` |
| `email` | `text` | `controlador.email` |
| `user_id` | `uuid` | futuro vínculo único com `auth.users` |
| `active` | `boolean` | novo |
| `row_version` | `integer` | novo |

### `inventory_team_members`

Estrutura equivalente à de `controllers`, voltada à equipe patrimonial e com vínculo futuro opcional a `auth.users`.

### `competences`

| Campo | Tipo | Regra |
|---|---|---|
| `id` | `text` | chave no formato `AAAA-MM` |
| `label` | `text` | descrição exibida, como `Janeiro 2026` |
| `exercise` | `integer` | exercício de referência |
| `starts_on` / `ends_on` | `date` | janela operacional |
| `bonus_deadline` | `date` | prazo ordinário de bonificação da competência |
| `closed_at` | `timestamptz` | fechamento formal opcional |
| `row_version` | `integer` | concorrência otimista |

Para cada exercício válido de `app_config.exercises`, a ponte gera as doze competências mensais e preserva o prazo ordinário existente — dia 15 do mês seguinte. Competências adicionais referenciadas em escolas, verificações, pendências, bens ou notas também são incluídas.

## Escolas e programas

### `schools`

| Campo SQL | Campo atual do frontend | Observação |
|---|---|---|
| `id` | `id` | designação usada como identificador atual |
| `designation` | `designação` | único |
| `denomination` | `denominação` | nome da unidade |
| `phone` | `telefone` | texto livre preservado |
| `institutional_mobile` | `telefoneCelularInstitucional` | texto livre preservado |
| `email` | `email` | contato institucional |
| `director_name` | `diretor` | direção geral |
| `director_phone` | `telefoneDiretor` | contato da direção |
| `deputy_director_name` | `diretorAdjunto` | pode ser vazio |
| `deputy_director_phone` | `telefoneDiretorAdjunto` | pode ser vazio |
| `inep` | `inep` | indexado |
| `cnpj` | `cnpj` | preservado com máscara |
| `cre` | `cre` | escopo organizacional |
| `ra` | `ra` | região administrativa |
| `sici` | `sici` | código interno |
| `controller_id` | `controladorId` | FK para `controllers` |
| `inventory_process` | `processoInventario` | processo administrativo |
| `initial_competence` | `competenciaInicial` | FK para `competences` |
| `active` | novo | desativação lógica |
| `row_version` | novo | concorrência otimista |

### `school_programs`

Substitui futuramente o array `programasIds` por relação N:N.

| Campo | Regra |
|---|---|
| `id` | identificador determinístico `school_id::program_id` |
| `school_id` | FK para escola |
| `program_id` | FK para programa |
| `active` | vínculo vigente |
| `starts_on` / `ends_on` | vigência opcional |
| `row_version` | concorrência otimista |

A combinação `(school_id, program_id)` é única.

## Acompanhamento documental

### `verifications`

| Campo | Origem atual |
|---|---|
| `id` | `school_id::competence_id::program_id` |
| `school_id` | escola |
| `competence_id` | competência extraída da chave atual |
| `program_id` | programa extraído da chave atual |
| `bonification` | objeto `bonificacao` em JSONB |
| `analysis` | objeto `analise` em JSONB |
| `bonus_result` | `resultadoBonif` |
| `row_version` | novo |

Os objetos de bonificação e análise permanecem em JSONB na primeira versão para preservar fielmente o contrato atual.

### `pendencies`

| Campo | Descrição |
|---|---|
| `id` | identificador canônico atual |
| `school_id` | unidade escolar |
| `competence_origin` | competência em que surgiu |
| `program_id` | programa associado, quando aplicável |
| `document_key` | documento ou item |
| `status` | `Aberta`, `Aguardando reanálise`, `Resolvida` ou `Cancelada` |
| `responsible_area` | responsável registrado |
| `next_actor` | próximo ator operacional |
| `reason` | motivo |
| `notes` | observações |
| `opened_at`, `resolved_at`, `canceled_at` | marcos temporais |
| `payload` | registro legado completo |
| `row_version` | concorrência otimista |

### `pendency_attempts`

| Campo | Descrição |
|---|---|
| `id` | identificador textual da tentativa atual; determinístico apenas quando ausente |
| `pendency_id` | FK para pendência |
| `attempt_number` | sequência positiva e única por pendência |
| `submitted_at` / `analyzed_at` | envio e análise |
| `result` | `correto`, `incorreto` ou `arquivo_indisponivel` |
| `observation`, `drive_url`, `errors` | dados da tentativa |
| `payload` | tentativa legada completa |
| `created_by` | futuro usuário autenticado |

### `pendency_contacts`

| Campo | Origem atual |
|---|---|
| `id` | `contato.id` |
| `school_id` | `escolaId` |
| `pendency_id` | `pendenciaId`, quando houver |
| `contact_type` | `tipo` |
| `contact_date` | `dataAtendimento` |
| `description` | `desc`, `descricao` ou `description` |
| `official_charge` | `cobrancaOficial` |
| `created_by` | futuro usuário autenticado |
| `payload` | registro original integral |
| `row_version` | concorrência otimista |

O campo `desc`, efetivamente usado pela interface atual, é traduzido explicitamente. Isso evita que o texto do contato exista apenas no `payload`.

## Patrimônio e despesas

### `assets`

| Campo | Origem atual |
|---|---|
| `id` | `bem.id` |
| `school_id` | `escolaId` |
| `competence_id` | `competencia` |
| `description` | `item`, `descricao` ou `description` |
| `expense_type` | `tipo` |
| `invoice_number` | `notaFiscal` |
| `amount` | `valor` |
| `status` | situação patrimonial |
| `inventory_process` | `processoInventario` |
| `notes` | `observacoes` |
| `inventoried_by_member_id` | `inventariadorId` ou responsável registrado |
| `inventoried_at` | `dataInventariacao` |
| `payload` | bem legado integral |
| `row_version` | concorrência otimista |

`inventoried_by_member_id` referencia `inventory_team_members` e permite recuperar quem realizou a inventariação sem depender de texto livre.

### `registered_invoices`

| Campo | Origem atual | Finalidade |
|---|---|---|
| `id` | `nota.id` | identificador |
| `school_id` | `escolaId` | unidade |
| `competence_id` | parte de `compKey` | competência |
| `program_id` | parte de `compKey` | programa |
| `verification_id` | escola + competência + programa | contexto documental exato |
| `source_context_key` | `compKey` | preservação do identificador atual |
| `description` | `desc`, `descricao` ou `description` | descrição do gasto |
| `expense_type` | `tipo` | consumo, permanente ou serviço |
| `invoice_number` | `numero` ou `notaFiscal` | número fiscal |
| `amount` | `valor` | valor monetário |
| `linked_asset_id` | `bemId` | vínculo com o bem criado pela nota |
| `registered_at` | `dataRegistro` | horário de registro |
| `payload` | nota original integral | rastreabilidade |
| `row_version` | novo | concorrência otimista |

A decomposição de `compKey` permite consultar notas por competência e programa e também reconstruir exatamente o prontuário local.

## Segurança e perfis

### `profiles`

Catálogo estrutural:

- `controller`;
- `federal_assistant`;
- `inventory`;
- `sme_management`;
- `technical_admin`.

### `user_profiles`

| Campo | Regra |
|---|---|
| `id` | UUID primário |
| `user_id` | FK para `auth.users` |
| `profile_id` | FK para `profiles` |
| `controller_id` | obrigatório para perfil Controlador |
| `inventory_member_id` | obrigatório para perfil Inventário |
| `cre_scope` | restrição organizacional futura |
| `active` | vínculo ativo |

A combinação `(user_id, profile_id)` é única.

### `user_school_scopes`

| Campo | Regra |
|---|---|
| `id` | UUID primário |
| `user_id` | usuário autenticado |
| `school_id` | escola concedida |
| `can_write` | diferencia leitura de escrita |

A combinação `(user_id, school_id)` é única.

## Auditoria e migração

### `administrative_logs`

Mantém os registros operacionais já existentes, com `details` em JSONB e vínculo opcional a escola e usuário autenticado.

### `data_import_runs`

Controla cada importação por `import_id` único, versão do snapshot, contagens, estado, relatório de reconciliação, erro e autoria.

### `audit_events`

Trilha imutável de inserções, alterações e exclusões nas entidades críticas. Guarda registro anterior, novo registro, campos alterados, usuário, requisição e horário.

## Transformação e restauração

A camada é composta por:

1. `legacy-state-adapter.js` — leitura e transformação básica das chaves `radar_pdde_*`;
2. `state-bridge.js` — enriquecimento semântico e conversão bidirecional;
3. `snapshot-tools.js` — validação, lotes e reconciliação;
4. `supabase-repository.js` — paginação, escrita em lotes, restauração por ordem de FK e concorrência otimista.

A ponte bidirecional:

- não modifica o navegador durante a exportação;
- converte campos em português para o modelo SQL;
- separa `programasIds`, verificações e tentativas em coleções relacionais;
- gera as doze competências de cada exercício configurado;
- preserva contatos, contexto de notas e inventariação;
- gera advertências e rejeições;
- restaura snapshot canônico nas chaves locais;
- permite `dryRun` antes do rollback;
- viabiliza teste canônico → local → canônico.

## Campos transversais

- `created_at`: criação técnica do registro;
- `updated_at`: última alteração;
- `row_version`: incrementado por trigger nas tabelas mutáveis;
- `created_by` ou `actor_user_id`: usuário autenticado responsável, quando aplicável;
- `payload`: cópia dos atributos legados necessários à rastreabilidade.
