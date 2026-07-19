# RADAR PDDE — Registro de decisões

Este documento registra decisões duradouras. Não é diário de commits. Uma decisão só deve ser substituída por nova decisão expressa, com impacto analisado e registro do status anterior.

## Convenções

- **Aprovada:** vigente;
- **Substituída:** outra decisão passou a prevalecer;
- **Revogada:** deixou de valer;
- **Proposta:** ainda depende de decisão.

---

## ADR-001 — Contrato único de repositório

**Status:** Aprovada

Manter `LocalStorageRepository` e `SupabaseRepository` sob o mesmo contrato. Frontend e serviços não dependem diretamente do mecanismo concreto de persistência.

**Consequências:** transição progressiva, equivalência testável e rollback; nenhuma arquitetura concorrente sem limitação comprovada.

---

## ADR-002 — Production permanece local

**Status:** Aprovada

Production permanece com `dataMode: local`, repositório Supabase desabilitado, URL/chave vazias e ativação não aprovada até homologação e autorização específicas.

---

## ADR-003 — Primeira conexão em Preview exclusivo

**Status:** Aprovada

A primeira conexão real ocorre em projeto `radar-pdde-preview` ou branch isolada. Projetos de outras aplicações não são reutilizados.

A criação do projeto não autoriza migrations, importação, Preview Vercel ou Production.

---

## ADR-004 — Quatro perfis funcionais visíveis

**Status:** Aprovada

O seletor operacional apresenta exatamente:

1. Controlador;
2. Assistente de Verbas Federais;
3. SME (Gestão);
4. Equipe de Inventário.

`technical_admin` não é um quinto perfil visual.

---

## ADR-005 — Administrador técnico separado da Assistente

**Status:** Aprovada

`technical_admin` não é convertido em `assistente`, não recebe a identidade de Luísa Ferreira e não opera a Gestão de Equipe cotidiana. É papel de infraestrutura, perfis, escopos e auditoria.

Uma área administrativa visual própria poderá ser criada posteriormente, sem bloquear a conexão inicial.

---

## ADR-006 — Assistente lidera e administra plenamente a equipe da CRE

**Status:** Aprovada

A Assistente de Verbas Federais é a liderança direta dos controladores na GAD da 4ª CRE e possui permissão para:

- cadastrar, editar e desativar controladores;
- distribuir e redistribuir escolas;
- cadastrar, editar e desativar integrantes de Inventário;
- produzir todos os efeitos em persistência, acesso e auditoria.

A decisão anterior que atribuía manutenção dos diretórios à SME está **substituída**.

---

## ADR-007 — Cadastro de integrante inclui convite e conta

**Status:** Aprovada

Cadastrar controlador ou integrante do Inventário deve:

- criar ou atualizar registro organizacional;
- enviar convite e criar conta Supabase Auth;
- criar/reativar `user_profiles`;
- vincular `user_id` ao integrante;
- registrar a operação;
- impedir duplicidade.

Desativação bloqueia o acesso e preserva histórico. Falha parcial deve ser compensada.

---

## ADR-008 — Gestão de contas ocorre em backend protegido

**Status:** Aprovada

O navegador chama Edge Function autenticada. Auth Admin e RPCs administrativas permanecem server-side. Chave secreta ou `service_role` nunca chegam ao frontend.

RPCs de provisionamento/desativação são restritas ao `service_role`; a Edge Function valida JWT e papel `federal_assistant` ou `technical_admin`.

---

## ADR-009 — SME exerce acompanhamento gerencial

**Status:** Aprovada

A SME acompanha a situação operacional das CREs, consulta dados consolidados e mantém parâmetros institucionais autorizados. Não substitui a Assistente na gestão cotidiana dos controladores e do Inventário da 4ª CRE.

---

## ADR-010 — Exclusão física é técnica e excepcional

**Status:** Aprovada

A ação visual de remover integrante executa desativação lógica, redistribuição quando necessária, bloqueio de acesso e auditoria. `DELETE` físico permanece restrito ao Administrador técnico.

---

## ADR-011 — Operações compostas são atômicas

**Status:** Aprovada

Mudanças interdependentes usam transação/RPC: exercício e competências, escola e programas, reanálise, efeitos de nota, Gestão de Equipe, importação, promoção e rollback.

---

## ADR-012 — Migração progressiva e reversível

**Status:** Aprovada

Fluxo obrigatório: snapshot, validação, plano, dry-run, staging, retomada, reconciliação, promoção atômica e rollback comprovado.

Seed local não é dado institucional e não é aplicado implicitamente em ambiente remoto.

---

## ADR-013 — Concorrência otimista explícita

**Status:** Aprovada

Registros mutáveis usam `row_version`. Conflito não é sobrescrito silenciosamente; o usuário deve ser informado e reavaliar a versão atual.

---

## ADR-014 — Vercel Preview usa build prebuilt verificado

**Status:** Aprovada

Preview conectado deve executar `vercel build`, confirmar `radar-build-manifest.json` e publicar com `vercel deploy --prebuilt`. O workflow não aceita `--prod`.

Production e Preview são builds independentes do mesmo código.

---

## ADR-015 — GitHub, Vercel e Supabase são fontes operacionais

**Status:** Aprovada

O estado atual é determinado por código remoto, deployment real e infraestrutura efetivamente existente. Memória de chat e documentos históricos ajudam, mas não substituem verificação.

---

## ADR-016 — Alterações devem acompanhar todas as camadas

**Status:** Aprovada

Mudança de ação, perfil ou fluxo exige verificar frontend, serviço, persistência, migration/RPC, Auth/RLS, auditoria, testes, documentação e implantação. Alterar apenas uma camada não conclui a tarefa.

---

## ADR-017 — Mobile preserva conteúdo e capacidade

**Status:** Aprovada

Responsividade pode reorganizar tabelas em cartões, mas não remover informações, filtros ou ações essenciais.

---

## ADR-018 — Correções pontuais não redefinem o estágio principal

**Status:** Aprovada

Ajustes visuais, textuais ou pequenos hotfixes não substituem automaticamente a tarefa estrutural em andamento. `docs/CURRENT_STAGE.md` registra a sequência vigente.

---

## ADR-019 — Não iniciar nova frente sem encerrar a anterior

**Status:** Aprovada

Ao finalizar uma sessão ou PR, declarar explicitamente se a tarefa foi:

- concluída;
- bloqueada;
- substituída;
- parcialmente concluída, com itens restantes.

Não iniciar novo ciclo deixando o status anterior implícito.

---

## ADR-020 — Dependências fixadas e atualizações intencionais

**Status:** Aprovada

Versões permanecem fixadas e lockfile versionado. Não instalar ORM, biblioteca paralela de schemas, cache ou estado apenas por preferência tecnológica. Atualizações exigem necessidade, changelog e gates completos.
