# Cobertura funcional — Supabase

## Situação

O RADAR PDDE possui contrato único de persistência e dois adaptadores:

- `LocalStorageRepository` — backend vigente em Production;
- `SupabaseRepository` — backend conectado ao Preview e preparado para futura ativação controlada.

A conexão de Preview permanece separada de Production. O conjunto contém **20 migrations** e uma Edge Function protegida para o ciclo de contas da equipe.

## Matriz de cobertura

| Domínio ou fluxo | Modo local | Supabase local/Preview | Evidência principal |
|---|---:|---:|---|
| Bootstrap e hidratação canônica | Sim | Sim | serviços de dados e E2E |
| Configuração, exercícios e competências | Sim | Sim | serviço + RPC transacional |
| Escolas, programas e controlador | Sim | Sim | serviço + RLS/RPC |
| Carteira como filtro e responsabilidade | Sim | Sim | Dashboard e E2E |
| Colaboração entre Controladores da mesma CRE | Sim | Sim | migration 16, smoke e E2E |
| Capital e Inventário da própria CRE | Sim | Sim | migrations 17–20 e pgTAP |
| Gestão de controladores pela Assistente | Sim | Sim | gateway, RLS e RPCs |
| Gestão da Equipe de Inventário | Sim | Sim | serviço, Edge Function e RPCs |
| Convite e conta Auth | Não aplicável | Sim | Edge Function + Auth Admin |
| Bonificação e análise técnica | Sim | Sim | serviço de verificações |
| Pendências, tentativas e contatos | Sim | Sim | serviços e histórico |
| Notas e bens derivados | Sim | Sim | RPCs atômicas e inventário |
| Auditoria | Sim | Sim | unidade de trabalho + triggers |
| Concorrência otimista | Não aplicável | Sim | `row_version` |
| Importação, reconciliação e rollback | Sim | Sim | coordenador + RPCs |
| Desktop, Android e iPhone | Sim | Sim | Playwright |
| Acessibilidade automatizada | Sim | Sim | axe, foco e teclado |

## Perfis

A interface possui quatro perfis funcionais:

1. `controller` — Controlador;
2. `federal_assistant` — Assistente de Verbas Federais;
3. `sme_management` — SME (Gestão);
4. `inventory` — Equipe de Inventário.

`technical_admin` é um papel técnico separado do seletor operacional.

### Controlador

A carteira personaliza o Dashboard e identifica o responsável principal. O perfil pode operar as escolas da mesma `cre_scope`, preservando autoria e responsabilidade, sem acessar outra CRE sem exceção explícita.

### Capital e Inventário

O perfil `inventory` é direcionado à interface Equipe de Inventário e à seção **Capital e Inventário**.

O contrato permite:

- leitura das escolas da própria `cre_scope`, inclusive sem bem cadastrado;
- leitura dos vínculos escola–programa necessários ao painel;
- leitura, criação e atualização dos bens da própria CRE;
- conclusão da inventariação de bem encaminhado;
- bloqueio da escrita cadastral das escolas;
- bloqueio dos módulos não patrimoniais;
- bloqueio de escolas e bens de outra CRE.

As migrations 17 e 18 registram etapas intermediárias do ajuste remoto. A migration 19 consolida as políticas patrimoniais e remove a função auxiliar transitória. A migration 20 corrige o predicado genérico legado para exigir correspondência entre a CRE da escola com bem e a `cre_scope` do integrante.

## Gestão de Equipe

A Assistente cadastra, convida, edita e desativa Controladores e integrantes do Inventário. No modo Supabase, o `TeamAccountGateway` chama Edge Function autenticada, que valida o JWT, usa Auth Admin e RPCs restritas ao `service_role`.

## Contratos de dados

A validação ocorre em camadas:

- navegador: Ajv;
- domínio da Edge Function;
- PostgreSQL: tipos, constraints, `pg_jsonschema`, RLS e pgTAP.

Gravações não são repetidas automaticamente. Operações de conta usam idempotência e compensação explícita.

## Migração operacional

```text
exportar → validar → planejar → staging
        → retomar lotes → reconciliar
        → promover atomicamente → rollback controlado
```

## Fora do escopo deste pacote

- ativação do Supabase em Production;
- alteração visual ou de navegação;
- redefinição das permissões dos demais perfis;
- backup, restauração e MFA de Production.
