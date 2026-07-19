# Cobertura funcional — Gate de Pré-conexão Supabase

## Situação

O RADAR PDDE possui contrato único de persistência e dois adaptadores:

- `LocalStorageRepository` — backend vigente em Production;
- `SupabaseRepository` — backend preparado e comprovado na pilha local.

A conexão remota permanece desativada. O gate final acrescenta a equivalência que faltava entre a Gestão de Equipe aprovada no frontend e os efeitos necessários em Auth, RLS, banco e implantação.

O conjunto contém **13 migrations** e uma Edge Function protegida para o ciclo de contas da equipe.

## Matriz de cobertura

| Domínio ou fluxo | Modo local | Supabase local/preparado | Evidência principal |
|---|---:|---:|---|
| Bootstrap e hidratação canônica | Sim | Sim | serviços de dados e E2E |
| Configuração, exercícios e 12 competências | Sim | Sim | serviço + RPC transacional |
| Programas e cadastros estruturais | Sim | Sim | serviços e RLS |
| Escolas, programas e atribuição de controlador | Sim | Sim | serviço + RPC transacional |
| Gestão plena de controladores pela Assistente | Sim | Sim | `DirectoryService`, gateway, RLS e RPCs |
| Gestão plena da Equipe de Inventário pela Assistente | Sim | Sim | serviço, Edge Function e RPCs |
| Convite e criação de conta Auth | Não aplicável | Sim | Edge Function autenticada + Auth Admin |
| Edição e bloqueio de acesso | Não aplicável | Sim | Edge Function com compensação |
| Bonificação e análise técnica | Sim | Sim | serviço de verificações |
| Abertura e ciclo completo de pendências | Sim | Sim | serviço + RPC de reanálise |
| Tentativas, contatos, cancelamento e reabertura | Sim | Sim | serviços e histórico auditável |
| Retificação administrativa | Sim | Sim | fluxo funcional preservado |
| Notas de consumo, serviço e permanente | Sim | Sim | RPCs atômicas de notas |
| Bem derivado, encaminhamento e inventariação | Sim | Sim | serviço de inventário |
| Auditoria administrativa e técnica | Sim | Sim | unidade de trabalho + triggers |
| Concorrência otimista | Não aplicável | Sim | `row_version` e testes de conflito |
| Sessão expirada e autorização negada | Não aplicável | Sim | Auth, RLS e UX de falhas |
| Rede e indisponibilidade remota | Não aplicável | Simulada | retry apenas de leitura e E2E |
| Exportação, staging, retomada e idempotência | Sim | Sim | coordenador e RPCs de importação |
| Promoção atômica, reconciliação e rollback | Sim | Sim | integração e E2E local |
| Build Vercel versionado de Preview | Não aplicável | Sim | workflow prebuilt e manifesto |
| Desktop, Android e iPhone | Sim | Sim nos fluxos do gate | Playwright |
| Acessibilidade automatizada e teclado | Sim | Sim | axe, foco, Escape e retorno ao acionador |

## Perfis funcionais e papel técnico

A interface possui quatro perfis funcionais:

1. `controller` — Controlador;
2. `federal_assistant` — Assistente de Verbas Federais;
3. `sme_management` — SME (Gestão);
4. `inventory` — Equipe de Inventário.

`technical_admin` é um quinto papel de autorização, porém técnico e separado do seletor operacional. Ele não é convertido em Assistente e recebe uma superfície neutra até existir administração visual própria.

Também são testados usuário inativo, usuário sem perfil, escopo somente leitura e escopo com escrita.

## Gestão de Equipe

O contrato aprovado estabelece que a Assistente:

- cadastra e edita controlador;
- envia convite e cria conta Auth;
- cria e mantém `user_profiles`;
- distribui e redistribui escolas;
- desativa controlador e acesso sem apagar histórico;
- realiza o mesmo ciclo para a Equipe de Inventário.

A SME acompanha a situação operacional e consulta a equipe, mas não mantém os diretórios da CRE.

No modo Supabase, `DirectoryService` encaminha a persistência composta ao `TeamAccountGateway`. A Edge Function valida o JWT e o papel, executa Auth Admin e chama RPCs restritas ao `service_role`. Falhas compensam convite, alteração ou bloqueio para impedir contas órfãs.

## Contratos de dados

A validação ocorre em camadas coordenadas:

- navegador: Ajv `8.20.0`;
- domínio da Edge Function: normalização de comandos, e-mails, papéis e metadados;
- PostgreSQL: tipos, constraints, `pg_jsonschema`, RLS e pgTAP.

Os contratos abrangem bonificação, análise, pendências, tentativas, erros, cancelamento, resolução, retificação, auditoria, compatibilidade legada e Gestão de Equipe.

## Resiliência

Categorias públicas relevantes:

- `NETWORK_UNAVAILABLE`;
- `SESSION_EXPIRED`;
- `PERMISSION_DENIED`;
- `ACCOUNT_CONFLICT`;
- `OPTIMISTIC_CONFLICT`;
- `VALIDATION_FAILED`;
- `TRANSACTION_FAILED`;
- `REMOTE_UNAVAILABLE`;
- `IMPORT_RECONCILIATION_FAILED`.

Gravações não são repetidas automaticamente. Operações de conta utilizam idempotência pelo registro e compensação explícita de falha.

## Migração operacional

```text
exportar → validar → planejar → staging por importId
        → retomar lotes → reconciliar staging
        → promover atomicamente → reconciliar destino
        → concluir ou executar rollback controlado
```

O relatório contém hash SHA-256, contagens, estado dos lotes e diferenças resumidas, sem dados integrais ou credenciais.

## Fora do escopo deste gate

Dependem do projeto remoto e de autorização própria:

- criação do `radar-pdde-preview`;
- obtenção de `project_ref`, URL e chave publicável;
- aplicação remota das 13 migrations;
- implantação remota da Edge Function;
- identidades reais de homologação;
- Advisors, backup, restauração e MFA;
- importação controlada dos dados;
- ativação do Supabase em Production.
