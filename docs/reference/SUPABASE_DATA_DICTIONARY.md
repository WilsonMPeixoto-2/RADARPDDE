# Dicionário de dados — Supabase

Este documento descreve o modelo preparado para futura persistência do RADAR PDDE. Os nomes SQL usam `snake_case`; os nomes atuais do frontend permanecem inalterados até a etapa de adaptação.

## Tabelas estruturais

### `app_config`

| Campo | Tipo | Origem atual | Regra |
|---|---|---|---|
| `id` | `text` | configuração global | chave primária; valor futuro esperado: `global` |
| `exercises` | `jsonb` | `config.exercicios` | lista de exercícios disponíveis |
| `closing_competence` | `text` | `config.competenciaFechamento` | competência global vigente |
| `bonus_deadline_extended` | `date` | `config.prazoBonificacaoProrrogado` | prazo excepcional |
| `settings` | `jsonb` | demais parâmetros | extensão controlada |
| `row_version` | `integer` | novo | controle otimista |

### `programs`

| Campo | Tipo | Origem atual |
|---|---|---|
| `id` | `text` | `programa.id` |
| `name` | `text` | `programa.name` |
| `description` | `text` | `programa.desc` |
| `active` | `boolean` | novo |

### `controllers`

| Campo | Tipo | Origem atual |
|---|---|---|
| `id` | `text` | `controlador.id` |
| `name` | `text` | `controlador.name` |
| `email` | `text` | `controlador.email` |
| `user_id` | `uuid` | futuro vínculo com `auth.users` |

### `inventory_team_members`

Estrutura equivalente à de controladores, voltada à equipe patrimonial.

### `competences`

| Campo | Tipo | Regra |
|---|---|---|
| `key` | `text` | formato `AAAA-MM` |
| `label` | `text` | descrição exibida |
| `exercise` | `integer` | exercício de referência |
| `starts_on` / `ends_on` | `date` | janela operacional opcional |
| `closed_at` | `timestamptz` | fechamento formal opcional |

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
| `row_version` | novo | concorrência otimista |

### `school_programs`

Substitui futuramente o array `programasIds` por relação N:N entre escola e programa. A chave composta é `(school_id, program_id)`.

## Acompanhamento documental

### `verifications`

| Campo | Origem atual |
|---|---|
| `id` | chave composta serializada |
| `school_id` | escola |
| `competence_key` | competência |
| `program_id` | programa |
| `bonification` | objeto `bonificacao` em JSONB |
| `analysis` | objeto `analise` em JSONB |
| `bonus_result` | `resultadoBonif` |
| `row_version` | novo |

Os objetos de bonificação e análise permanecem em JSONB na primeira versão para preservar fielmente o contrato atual. Uma normalização adicional só poderá ocorrer após inventário completo dos documentos e estados.

### `pendencies`

| Campo | Descrição |
|---|---|
| `id` | identificador canônico |
| `school_id` | unidade escolar |
| `competence_origin` | competência em que surgiu |
| `program_id` | programa associado, quando aplicável |
| `document_key` | documento ou item |
| `status` | `Aberta`, `Aguardando reanálise`, `Resolvida` ou `Cancelada` |
| `responsible_area` | responsável pela providência |
| `next_actor` | próximo ator operacional |
| `reason` | motivo |
| `notes` | observações |
| `payload` | atributos legados ainda não normalizados |
| `row_version` | concorrência otimista |

### `pendency_attempts`

Registra cada novo envio e respectiva reanálise. A combinação `(pendency_id, attempt_number)` é única.

### `pendency_contacts`

Registra contatos, atendimentos e cobranças vinculados à escola e, opcionalmente, à pendência.

## Patrimônio e despesas

### `assets`

Representa bens e obrigações de inventário. O tipo de despesa aceita `consumo`, `permanente` ou `servico`; a situação aceita `Não encaminhada`, `Encaminhada` ou `Inventariada`.

### `registered_invoices`

Preserva os registros de notas e despesas atualmente mantidos em `notasRegistradas`.

## Segurança e perfis

### `profiles`

Catálogo estrutural:

- `controller`;
- `federal_assistant`;
- `inventory`;
- `sme_management`;
- `technical_admin`.

### `user_profiles`

Vincula `auth.users` a um perfil e, quando necessário, a controlador ou integrante do inventário.

### `user_school_scopes`

Exceções explícitas de acesso por escola, com indicação separada de permissão de escrita.

## Auditoria e migração

### `administrative_logs`

Mantém os registros operacionais já existentes no sistema.

### `data_import_runs`

Controla cada importação por `import_id` único, versão do snapshot, contagens, estado e relatório de reconciliação.

### `audit_events`

Trilha imutável de inserções, alterações e exclusões nas entidades críticas. Guarda registro anterior, novo registro, campos alterados, usuário e horário.

## Campos transversais

- `created_at`: criação do registro;
- `updated_at`: última alteração;
- `row_version`: incrementado em alterações nas tabelas críticas;
- `created_by`: usuário autenticado responsável, quando aplicável.
