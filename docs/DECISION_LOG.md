# RADAR PDDE — Registro de decisões

**Atualizado em:** 29 de julho de 2026

Este documento registra decisões duradouras. Não é diário de commits. Uma decisão somente é substituída por decisão expressa com impacto e status documentados.

## Convenções

- **Aprovada:** vigente;
- **Aprovada e implementada:** vigente e já refletida no produto;
- **Substituída:** outra decisão passou a prevalecer;
- **Revogada:** deixou de valer;
- **Proposta:** depende de decisão.

---

## ADR-001 — Contrato único de repositório

**Status:** Aprovada e implementada

`LocalStorageRepository` e `SupabaseRepository` implementam o mesmo contrato. Interface e serviços não dependem do mecanismo concreto.

**Consequência:** Supabase é canônico em Preview/Production; LocalStorage permanece para desenvolvimento e contingência, sem arquitetura paralela de negócio.

---

## ADR-002 — Production permanece local

**Status:** Substituída pela ADR-023

Production permaneceu local durante o gate de pré-conexão. A decisão cumpriu sua finalidade de proteção e não representa o ambiente atual.

---

## ADR-003 — Primeira conexão em Preview exclusivo

**Status:** Substituída pela ADR-023 quanto ao estágio; vigente como regra de ativação

Toda nova mudança de infraestrutura deve ser validada primeiro em ambiente isolado. Homologar Preview não autoriza automaticamente Production.

---

## ADR-004 — Quatro perfis funcionais visíveis

**Status:** Aprovada e implementada

O seletor operacional apresenta:

1. Controlador;
2. Assistente de Verbas Federais;
3. SME (Gestão);
4. Equipe de Inventário.

`technical_admin` não é quinto perfil funcional visível.

---

## ADR-005 — Administrador técnico separado da Assistente

**Status:** Aprovada e implementada

`technical_admin` opera infraestrutura, perfis, escopos, importações e auditoria. Não recebe identidade nem operação cotidiana da Assistente.

---

## ADR-006 — Assistente lidera e administra a equipe da CRE

**Status:** Aprovada e implementada

A Assistente pode cadastrar, editar, convidar, desativar e redistribuir Controladores e integrantes do Inventário dentro do escopo autorizado, com efeitos em persistência, Auth e auditoria.

A atribuição anterior de manutenção cotidiana à SME está substituída.

---

## ADR-007 — Cadastro de integrante inclui convite e conta

**Status:** Aprovada e implementada

O cadastro deve criar ou atualizar diretório, conta Auth, perfil e vínculo funcional, impedir duplicidade e registrar auditoria. Desativação bloqueia acesso e preserva histórico. Falha parcial exige compensação.

---

## ADR-008 — Gestão de contas ocorre em backend protegido

**Status:** Aprovada e implementada

O navegador chama Edge Function autenticada. Auth Admin e RPCs privilegiadas permanecem server-side. `service_role` ou segredo equivalente nunca chega ao frontend.

---

## ADR-009 — SME exerce acompanhamento gerencial

**Status:** Aprovada

A SME acompanha CREs, dados consolidados e parâmetros autorizados. Não substitui a Assistente na gestão cotidiana da equipe da CRE.

O recorte operacional é detalhado pela ADR-022.

---

## ADR-010 — Exclusão física é técnica e excepcional

**Status:** Aprovada e implementada

Remover integrante na interface significa desativação lógica, redistribuição quando necessária, bloqueio de acesso e auditoria. `DELETE` físico permanece excepcional e técnico.

---

## ADR-011 — Operações compostas são atômicas

**Status:** Aprovada e implementada

Mudanças interdependentes usam transação ou RPC: competências, escola e programas, verificação e log, reanálise, nota, bem, Gestão de Equipe, importação, promoção e rollback.

Nenhum fluxo pode deixar estado parcialmente persistido.

---

## ADR-012 — Migração progressiva e reversível

**Status:** Aprovada

Fluxo obrigatório:

```text
snapshot → validação → plano → dry-run → staging
         → retomada → reconciliação → promoção atômica
         → reconciliação do destino → rollback comprovado
```

Seed local não é dado institucional e não é aplicado implicitamente em ambiente remoto.

---

## ADR-013 — Concorrência otimista explícita

**Status:** Aprovada e implementada

Registros mutáveis usam `row_version`. Conflitos não são sobrescritos silenciosamente; o usuário deve reavaliar o estado atual.

---

## ADR-014 — Vercel Preview usa build prebuilt verificado

**Status:** Aprovada

Preview conectado deve usar build verificado e manifesto próprio. Preview não usa `--prod` e não é promovido como artefato de Production.

---

## ADR-015 — GitHub, Vercel e Supabase são fontes operacionais

**Status:** Aprovada

O estado atual é determinado por código remoto, banco/autorização efetivos e deployment real. Memória de chat e documentos históricos não substituem verificação.

---

## ADR-016 — Alterações devem acompanhar todas as camadas

**Status:** Aprovada

Mudança de ação, perfil ou fluxo exige verificar interface, serviço, persistência, migration/RPC, Auth/RLS, auditoria, testes, documentação e implantação. Alterar apenas uma camada não conclui a tarefa.

---

## ADR-017 — Mobile preserva conteúdo e capacidade

**Status:** Aprovada

Responsividade pode reorganizar tabelas em cartões, mas não remover informações, filtros ou ações essenciais.

---

## ADR-018 — Correções pontuais não redefinem o estágio principal

**Status:** Aprovada

Hotfix visual ou textual não substitui automaticamente a frente estrutural vigente. `CURRENT_STAGE.md` controla a sequência operacional.

---

## ADR-019 — Não iniciar nova frente sem encerrar a anterior

**Status:** Aprovada

Cada sessão ou PR deve declarar a tarefa como concluída, bloqueada, substituída ou parcialmente concluída, com itens restantes explícitos.

---

## ADR-020 — Dependências fixadas e atualizações intencionais

**Status:** Aprovada

Versões permanecem fixadas e lockfile versionado. Nova biblioteca exige necessidade comprovada, análise de changelog e gates completos. A major operacional do Node deve ser deliberadamente fixada antes do release oficial.

---

## ADR-021 — Carteira organiza responsabilidade, não restringe colaboração

**Status:** Aprovada e implementada

A carteira define responsável principal, filtro inicial e priorização. Controladores podem atuar nas escolas da mesma `cre_scope`, preservando `schools.controller_id` e autoria real. Outra CRE exige exceção explícita.

A interpretação que isolava Controladores à própria carteira está substituída.

---

## ADR-022 — Gestão SME separa consulta gerencial de operação

**Status:** Aprovada e implementada

Na Gestão SME:

- visão mensal e Prontuário exibem identificação e bonificação, sem análise técnica ou controles operacionais;
- Pendências são consultáveis, mas novo envio, substituição, reanálise, contato, cancelamento, reabertura e criação são proibidos;
- Registros Internos exibem somente `actor_user_id = auth.uid()`;
- registros sem UUID de autor não são exibidos;
- Administrador técnico mantém leitura integral em sua visão técnica;
- simulação SME reproduz o recorte visual, sem alterar JWT.

A restrição é cumulativa em capacidades, handlers, serviços e RLS. Programas por exercício não integram esta decisão.

---

## ADR-023 — Production usa Supabase como persistência canônica

**Status:** Aprovada e implementada

Production opera com:

```text
environment: production
dataMode: supabase-production
supabaseRepositoryEnabled: true
productionActivationApproved: true
```

Projeto autorizado: `scnryinorqeucbfkioxo`.

`LocalStorageRepository` permanece somente como contingência por build controlado. Ativação não relaxa Auth, RLS, auditoria, concorrência, reconciliação ou rollback.

---

## ADR-024 — Documentação segue código e ambientes

**Status:** Aprovada

Após mudança material, atualizar READMEs, estágio, contexto, decisões, inventários e handoffs. Quando houver divergência:

1. verificar código, migrations, banco e deployment;
2. corrigir a documentação;
3. não modificar código apenas para coincidir com documento antigo;
4. preservar históricos com classificação explícita;
5. regenerar artefatos pelo script canônico.

---

## ADR-025 — Competência mensal é contexto global único

**Status:** Aprovada e implementada

Dashboard, Carteira, Competências, Prontuário, Pendências, alertas, timeline e exportações consomem uma única competência ativa.

Requisitos:

- seletor transversal;
- preservação entre navegação e recarga;
- funções de domínio com `competenceKey` explícita;
- ausência de seletores concorrentes;
- distinção entre competência existente, disponível e fechada.

---

## ADR-026 — Competências restantes de 2026 devem ser operacionalizadas

**Status:** Aprovada e implementada; método esclarecido pela ADR-032

Janeiro a dezembro de 2026 devem estar disponíveis aos perfis conforme permissões, preservando registros anteriores.

O objetivo foi cumprido com as doze competências canônicas já existentes e alteração transacional de `closing_competence` para `2026-12`. Não houve necessidade de migration adicional.

---

## ADR-027 — Histórico cronológico é projeção

**Status:** Aprovada e implementada

A timeline consolida verificações, pendências, tentativas, contatos, logs, notas e bens em leitura cronológica. Não cria tabela paralela quando os eventos já possuem entidades canônicas.

A projeção preserva autoria, data, competência, programa, vínculo e visibilidade, evitando duplicidade sem apagar fatos legítimos.

---

## ADR-028 — Excel exige certificação de paridade integral

**Status:** Aprovada e implementada quanto ao gate automatizado

Relatórios Excel são produtos finais institucionais. A certificação percorre:

```text
estado canônico → modelo → workbook/OOXML → célula XLSX
```

Cobre modelo SME, modelo institucional, colunas, linhas, escopo temporal, normalização, hashes e zero divergências.

Abertura manual no Microsoft Excel desktop permanece gate de liberação oficial.

---

## ADR-029 — Navegação de retorno preserva contexto operacional

**Status:** Aprovada e implementada

Telas de aprofundamento usam retorno contextual com competência, rota, filtros, rolagem e foco. Telas raiz não recebem botão redundante e modais continuam com Fechar/Cancelar.

---

## ADR-030 — Polimento visual preserva identidade e produto

**Status:** Aprovada

O acabamento pode melhorar hierarquia, espaçamento, legibilidade, ícones, botões, tabelas, cartões, estados e responsividade.

Não pode alterar paleta, logomarca, capacidades, nomenclatura canônica ou fluxos sem decisão específica. Mensagens de infraestrutura não devem aparecer como conteúdo operacional.

---

## ADR-031 — Liberação oficial depende de gate cumulativo

**Status:** Aprovada

O sistema somente será declarado liberado após:

- competências autorizadas acessíveis;
- jornadas reais por perfil aprovadas;
- avaliação mensal coerente;
- timeline íntegra;
- exportações certificadas e homologadas;
- desktop e mobile aprovados;
- proteção contra senhas vazadas habilitada;
- backup e restauração testados;
- segurança, migrations, Auth/RLS e auditoria aprovados;
- documentação e evidências atualizadas.

A decisão final deve registrar: liberado, liberado com restrições ou não liberado com bloqueadores objetivos.

---

## ADR-032 — Disponibilização de competências reutiliza o contrato existente

**Status:** Aprovada e implementada

Quando as competências já existem canonicamente no banco e o requisito é alterar disponibilidade ou fechamento, reutilizar:

- registros de competência existentes;
- `closing_competence`;
- datas e `closed_at` já modelados;
- RPC e auditoria existentes.

Não criar migration ou nova coluna apenas para representar estado já suportado. Migration adicional somente é cabível quando houver mudança real de schema ou regra não representável.

**Aplicação em 2026:** `closing_competence` foi alterada de `2026-05` para `2026-12`, com `row_version = 5`, sem migration nova.

---

## ADR-033 — Divergência do histórico da migration SME bloqueia nova migration

**Status:** Aprovada

Existe divergência entre:

```text
local: 20260728182226_sme_access_governance.sql
remoto: 20260728190344_sme_access_governance
```

O SQL é idêntico em comprimento e SHA-256, portanto não há divergência funcional identificada. O problema é de rastreabilidade.

Até a reconciliação:

- não renomear ou reaplicar o SQL;
- não editar diretamente a tabela de histórico;
- não criar migration compensatória vazia;
- não executar nova migration em Production.

O reparo deve usar mecanismo suportado pelo Supabase para histórico, primeiro em ambiente descartável, com backup, dry-run, hashes, rollback e evidência. `migration repair` altera o histórico e não substitui rollback funcional de SQL.

Runbook: [`runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md`](runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md).
