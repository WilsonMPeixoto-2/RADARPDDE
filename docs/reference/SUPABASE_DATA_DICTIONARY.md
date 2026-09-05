# Dicionário de dados — Supabase

**Estado:** referência vigente da baseline funcional do PR #260  
**Atualizado em:** 5 de setembro de 2026

> Para a baseline corrente, comece em [`../../START_HERE.md`](../../START_HERE.md) e [`../CURRENT_STATE.md`](../CURRENT_STATE.md). Tipos gerados, migrations do SHA analisado e schema remoto verificado prevalecem sobre este resumo.

## 1. Fontes exatas

```text
src/types/database.types.ts
supabase/migrations/
supabase/functions/
schema remoto verificado
```

A baseline funcional do PR #260 contém **46 migrations**. A mais recente desse checkpoint é `20260904040000_functional_reliability_inventory_sync.sql`.

## 2. Convenções

- SQL em `snake_case`;
- `row_version` controla concorrência otimista onde o contrato exige versão;
- `created_at`/`updated_at` são metadados técnicos;
- payload JSONB não substitui relacionamentos estruturais;
- `rowVersion`/`row_version` não devem permanecer dentro do payload funcional de `verifications`;
- Auth identifica o usuário;
- `user_profiles` define papel e escopo;
- RLS protege recursos expostos;
- `administrative_logs` preserva histórico funcional;
- `audit_events` é trilha técnica;
- operação composta usa transação/RPC ou compensação explícita conforme o domínio.

## 3. Tabelas principais

| Grupo | Tabelas |
|---|---|
| configuração | `app_config`, `competences`, `programs` |
| escolas | `schools`, `school_programs` |
| equipe/acesso | `controllers`, `inventory_team_members`, `profiles`, `user_profiles`, `user_school_scopes` |
| acompanhamento | `verifications`, `pendencies`, `pendency_attempts`, `pendency_contacts` |
| fiscal/patrimônio | `registered_invoices`, `assets` |
| logs | `administrative_logs`, `audit_events` |
| importação | `data_import_runs`, `data_import_staging` |

## 4. Configuração

### `app_config`

Contém exercícios, competência de fechamento, extensão excepcional de prazo/configurações adicionais e `row_version`.

### `competences`

Identidade mensal em `YYYY-MM`, com exercício, datas/prazo e versão. A criação de exercício vigente persiste configuração + doze competências + log na operação protegida correspondente.

### `programs`

Identificador, nome/descrição, vigência lógica e versão. O contrato atual permite manutenção pela Gestão SME e `technical_admin`.

## 5. Escolas

### `schools`

Campos estruturais incluem:

- `id` institucional;
- designação e denominação;
- INEP, CNPJ e SICI;
- CRE/RA;
- contatos e direção;
- `controller_id` como responsável principal;
- processo de inventário;
- competência inicial;
- vigência e `row_version`.

Nova escola exige identidade institucional real. O serviço rejeita dados obrigatórios ausentes e duplicidades; o banco mantém constraints/índices correspondentes para os identificadores protegidos.

`controller_id` não deve ser redistribuído por edição comum do Controlador.

### `school_programs`

Relaciona escola/programa e preserva vigência lógica/temporal e versão conforme schema.

## 6. Perfis e equipe

### `controllers` e `inventory_team_members`

Mantêm identidade do integrante, e-mail, vínculo opcional/efetivo com `auth.users`, atividade e versão.

### `profiles`

Papéis correntes:

```text
controller
federal_assistant
sme_management
inventory
technical_admin
```

### `user_profiles`

Liga usuário Auth a perfil/entidade/CRE e atividade. Um perfil institucional ativo por usuário permanece a regra funcional corrente.

### `user_school_scopes`

Registra exceções explícitas por escola e capacidade de escrita quando aplicável.

### Gestão de Equipe

A Edge Function `team-account-management` usa Auth Admin somente no backend e RPCs transacionais para coordenar conta, diretório, perfil e log. O lookup de e-mail é feito pela RPC restrita `resolve_team_auth_user_id_by_email` e não por varredura global de usuários.

## 7. Avaliação mensal

### `verifications`

Identidade lógica:

```text
school_id + competence_id + program_id
```

Armazena bonificação, análise técnica, `bonus_result`, payload de compatibilidade e versão.

Bonificação, análise e Pendência permanecem dimensões distintas. Projeções agregadas de Nota Fiscal, Assessoria e Inventário são derivadas de seus registros específicos quando o contrato assim determina.

### Limpeza de metadado técnico

A migration #46 remove e impede `rowVersion`/`row_version` dentro do payload de verificação, mantendo versão apenas na fronteira técnica adequada.

## 8. Pendências

### `pendencies`

Campos estruturais incluem escola, competência de origem, programa, documento, `registered_invoice_id` quando individual, status, responsável/próximo ator, motivo, datas, payload e versão.

Estados correntes:

```text
Aberta
Aguardando reanálise
Resolvida
Cancelada
```

`Aberta` e `Aguardando reanálise` são ativas.

### `pendency_attempts`

Registra número da tentativa, conteúdo/arquivo disponibilizado, datas, resultado/análise, observação, erros, autoria, payload e versão.

Novo envio/substituição cria uma nova tentativa e preserva a anterior. Reanálise altera o estado analítico da tentativa real correspondente, não reescreve o documento enviado.

### `pendency_contacts`

Registra contato/cobrança associado à escola/Pendência, data, canal, descrição, autoria e `operation_id` para a idempotência definida no contrato.

## 9. Notas Fiscais

### `registered_invoices`

Campos estruturais incluem:

- escola, competência, programa e verificação;
- número/referência, descrição, natureza e valor;
- data;
- `linked_asset_id` opcional;
- contexto de origem;
- payload de análise individual/Assessoria quando aplicável;
- `row_version`.

Tipos de gasto reconhecidos pelo serviço atual:

```text
consumo
permanente
servico
a_identificar
boleto_internet
```

`boleto_internet` é exclusivo de Educação Conectada e continua dentro de Notas Fiscais.

Análise fiscal individual e Pendência usam `registered_invoice_id`. Consulta Assessoria de serviço também é individual por invoice.

O histórico individual bloqueia exclusão/alteração que destruiria rastreabilidade conforme os serviços/triggers vigentes.

## 10. Patrimônio

### `assets`

Contém escola, competência, descrição, natureza, valor, número fiscal, processo, status, data/responsável da inventariação, observações, payload e versão.

Para bem derivado de NF permanente:

- a invoice aponta para o bem por `linked_asset_id`/vínculo correspondente;
- com número da NF + processo de inventário já disponível, o bem novo nasce `Encaminhada`;
- sem processo, nasce `Não encaminhada`;
- `Inventariada` só pode ser alcançada a partir de `Encaminhada`;
- o número fiscal do bem derivado não é editado isoladamente no cadastro patrimonial.

### RPC patrimonial do PR #260

`save_asset_with_verification_and_log` persiste atomicamente, quando necessário:

```text
asset
+ verification sincronizada
+ administrative_log
```

Ela é usada no encaminhamento posterior de bem permanente vinculado para manter Capital/Inventário e `encampInventario` coerentes na mesma gravação.

## 11. Logs

### `administrative_logs`

Histórico funcional com ação, instante, escola opcional, ator/perfil e detalhes.

### `audit_events`

Trilha técnica de tabela/registro/ação e alterações. Usuário operacional não escreve diretamente nessa tabela.

## 12. Importação

`data_import_runs` acompanha execução, hash/formato, contagens, reconciliação, rollback, estado e autoria.

`data_import_staging` guarda registros antes da promoção. Operação real continua condicionada ao procedimento/autorização aplicável e não faz parte da fila funcional atual apenas porque as tabelas existem.

## 13. RPCs/funções relevantes

O schema inclui contratos para:

- papel e acesso escolar;
- verificação mensal + log;
- Pendências/tentativas/contatos/reanálise;
- análise fiscal/Assessoria individual;
- Nota Fiscal e efeitos derivados;
- bem + verificação + log;
- exercício/competências/configuração;
- programas;
- atribuição de Controlador;
- Gestão de Equipe;
- lookup Auth restrito;
- importação/rollback;
- auditoria de integridade.

Assinaturas exatas devem ser lidas nas migrations/tipos do SHA analisado. Não copiar assinatura deste resumo para implementação sem conferência.

## 14. Edge Function

`team-account-management` exige sessão/JWT, papel autorizado e CORS fail-closed, usa credencial administrativa somente no servidor e possui compensação quando uma alteração em Auth precede falha no banco.

A versão efetivamente publicada deve ser reconsultada quando a tarefa depender de Production.

## 15. Concorrência e atomicidade

- versão esperada é verificada onde o contrato usa optimistic concurrency;
- conflito não é sobrescrito silenciosamente;
- operação composta usa RPC/transação;
- falha parcial entre Auth e banco exige compensação;
- repetir conteúdo não é motivo para deduplicar uma NF legítima;
- guard contra clique repetido durante chamada em andamento não equivale a idempotência durável para retry ambíguo.

## 16. RLS

A autorização combina papel ativo, `auth.uid()`, escopo de CRE, carteira/escopos escolares e políticas específicas da entidade. Consulte [`SUPABASE_PERMISSIONS_MATRIX.md`](SUPABASE_PERMISSIONS_MATRIX.md) e o SQL do SHA corrente.

## 17. Manutenção

Após mudança real de schema/contrato:

1. migration nova, sem editar histórico;
2. reset/pgTAP/lint em ambiente isolado;
3. regeneração de tipos;
4. confirmação de artefatos reproduzíveis;
5. atualização deste dicionário e da matriz de permissões/funcional quando afetadas;
6. backup/restauração e gates proporcionais;
7. atualização de `CURRENT_STATE.md` e `PLAN_TRACEABILITY.md` quando a mudança impactar continuidade;
8. Production somente dentro da autorização correspondente.
