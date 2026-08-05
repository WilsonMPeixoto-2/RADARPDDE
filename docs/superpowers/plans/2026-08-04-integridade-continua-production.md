# Integridade Contínua de Production — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development and superpowers:verification-before-completion.

**Goal:** Detectar automaticamente inconsistências lógicas nos dados de Production antes que provoquem falhas de tela ou operações administrativas inválidas.

**Architecture:** Uma RPC `service_role`-only retorna exclusivamente contagens agregadas de invariantes. Um CLI Node.js consulta a RPC sem imprimir credenciais ou dados pessoais. Um workflow agendado executa a verificação a cada seis horas e manualmente. Nenhuma verificação altera dados.

**Tech Stack:** PostgreSQL/Supabase, pgTAP, Node.js 24, Fetch API nativa e GitHub Actions.

## Invariantes iniciais

### Identidade, equipe e acesso

1. controladores ativos precisam ter `user_id`;
2. integrantes ativos do Inventário precisam ter `user_id`;
3. escolas ativas precisam apontar para controlador ativo;
4. perfis ativos precisam apontar para usuário Auth existente e perfil de sistema ativo;
5. perfil de controlador precisa apontar para controlador ativo e para a mesma conta;
6. perfil de Inventário precisa apontar para integrante ativo e para a mesma conta;
7. controladores e integrantes ativos não podem compartilhar a mesma conta dentro do próprio diretório.

### Programas e escopos

8. vínculo escolar ativo não pode apontar para escola ou programa inativo;
9. escopo escolar precisa apontar para usuário Auth e escola existentes — a própria FK protege esse contrato, mas a auditoria registra a prova agregada.

### Pendências

10. pendência resolvida precisa ter `resolved_at`;
11. pendência cancelada precisa ter `canceled_at`;
12. pendência aberta ou aguardando reanálise não pode permanecer em escola ou programa inativo.

### Inventário e notas fiscais

13. bem inventariado precisa ter data e integrante responsável;
14. bem não inventariado não pode conservar metadados de inventariação;
15. nota permanente precisa apontar para o bem criado;
16. nota e bem vinculados precisam representar a mesma escola, competência e número da nota.

## Segurança

- a implementação privilegiada fica em `radar_private`;
- a RPC pública é `SECURITY INVOKER` e apenas encaminha para a função interna;
- `public`, `anon` e `authenticated` não recebem `EXECUTE`;
- somente `service_role` pode executar;
- retorno contém apenas `schemaVersion`, `status`, `totalIssues` e contagens por código;
- nenhuma identificação de usuário, escola, nota, pendência ou bem é retornada;
- o workflow usa os secrets já existentes `RADAR_SUPABASE_URL` e `RADAR_SUPABASE_SERVICE_ROLE_KEY`;
- tokens e respostas integrais não aparecem nos logs;
- nenhuma dependência é adicionada.

## Execução em fases

### Task 1 — Contratos e RED

- criar pgTAP exigindo funções, privilégios e resultado limpo;
- criar testes unitários para validar payload, falha quando uma contagem é positiva e sanitização;
- executar os testes antes da implementação e registrar a falha esperada.

### Task 2 — Migration

- criar `202608040001_production_integrity_monitor.sql`;
- implementar função interna `radar_private.production_integrity_check()`;
- implementar wrapper `public.production_integrity_check()`;
- revogar privilégios implícitos e conceder apenas a `service_role`;
- manter `search_path` explícito e retorno determinístico.

### Task 3 — CLI remoto

- criar `scripts/check-production-data-integrity.mjs`;
- exigir URL Supabase HTTPS e chave service-role por ambiente;
- chamar `/rest/v1/rpc/production_integrity_check` com timeout;
- validar estritamente o payload;
- imprimir somente resumo agregado;
- sair com código diferente de zero se houver qualquer inconsistência.

### Task 4 — Workflow

- criar `.github/workflows/production-data-integrity.yml`;
- executar a cada seis horas e manualmente;
- em pull request, executar somente os contratos locais quando os arquivos da auditoria mudarem;
- em schedule/manual, consultar Production com secrets;
- publicar resumo permanente;
- não instalar dependências e usar ações fixadas por SHA.

### Task 5 — Homologação e publicação

- executar readiness, pgTAP, migrations limpas e segurança;
- aplicar a migration em Production somente após todos os gates;
- confirmar retorno agregado com `totalIssues=0`;
- integrar por PR;
- executar manualmente o workflow publicado;
- verificar ausência de dados pessoais ou segredos nos logs.
