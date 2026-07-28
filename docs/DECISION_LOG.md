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

**Status:** Substituída pela ADR-023

Production permaneceu com `dataMode: local`, repositório Supabase desabilitado e ativação não aprovada durante o gate de pré-conexão.

Essa decisão cumpriu sua finalidade de proteção e deixou de representar o ambiente após a ativação controlada do Supabase Production.

---

## ADR-003 — Primeira conexão em Preview exclusivo

**Status:** Substituída pela ADR-023 quanto ao estágio operacional; preservada como regra histórica de ativação

A primeira conexão real ocorreu em ambiente isolado e não autorizava automaticamente Production. O requisito foi satisfeito durante a homologação e ativação controlada.

Para futuras mudanças de infraestrutura, Preview continua sendo o ambiente obrigatório de primeira validação.

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

`technical_admin` não é convertido em `federal_assistant`, não recebe identidade funcional da Assistente e não opera a Gestão de Equipe cotidiana. É papel de infraestrutura, perfis, escopos e auditoria.

Uma área administrativa visual própria poderá ser criada posteriormente, sem alterar essa separação.

---

## ADR-006 — Assistente lidera e administra plenamente a equipe da CRE

**Status:** Aprovada

A Assistente de Verbas Federais é a liderança operacional dos Controladores na GAD da CRE e possui permissão para:

- cadastrar, editar e desativar Controladores;
- distribuir e redistribuir escolas;
- cadastrar, editar e desativar integrantes de Inventário;
- produzir os efeitos autorizados em persistência, acesso e auditoria.

A decisão anterior que atribuía manutenção cotidiana dos diretórios à SME está **substituída**.

---

## ADR-007 — Cadastro de integrante inclui convite e conta

**Status:** Aprovada

Cadastrar Controlador ou integrante do Inventário deve:

- criar ou atualizar registro organizacional;
- enviar convite e criar conta Supabase Auth;
- criar ou reativar `user_profiles`;
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

A SME acompanha a situação operacional das CREs, consulta dados consolidados e mantém parâmetros institucionais autorizados. Não substitui a Assistente na gestão cotidiana dos Controladores e do Inventário da CRE.

---

## ADR-010 — Exclusão física é técnica e excepcional

**Status:** Aprovada

A ação visual de remover integrante executa desativação lógica, redistribuição quando necessária, bloqueio de acesso e auditoria. `DELETE` físico permanece restrito ao Administrador técnico.

---

## ADR-011 — Operações compostas são atômicas

**Status:** Aprovada

Mudanças interdependentes usam transação/RPC: exercício e competências, escola e programas, reanálise, efeitos de nota, Gestão de Equipe, importação, promoção e rollback.

Nenhum fluxo pode deixar estado parcialmente persistido após falha.

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

A major operacional do Node deve ser deliberada. Faixa que permita adoção automática de nova major em Production deve ser restringida antes do release oficial.

---

## ADR-021 — Carteira organiza responsabilidade, não restringe colaboração

**Status:** Aprovada

A carteira individual do Controlador define responsabilidade principal, filtro inicial, priorização e organização do trabalho. Não constitui fronteira de sigilo ou autorização entre Controladores da mesma CRE.

Todo Controlador autenticado pode consultar e executar ações operacionais nas escolas da própria `cre_scope`, inclusive para cobrir férias, licenças, ausências ou sobrecarga de colega.

Atuar fora da própria carteira:

- não altera automaticamente `schools.controller_id`;
- preserva a responsabilidade principal existente;
- registra a autoria do usuário executor em `created_by`, logs e auditoria;
- não concede acesso a escola de outra CRE sem exceção explícita.

A interpretação anterior que restringia Controladores à própria carteira está **substituída**.

---

## ADR-022 — Gestão SME separa consulta gerencial de operação

**Status:** Aprovada

Na visão da Gestão SME:

- a tela mensal e o prontuário exibem identificação da unidade e informações de bonificação, sem análise técnica nem controles operacionais;
- pendências, tentativas, contatos e detalhes permanecem consultáveis, mas novo envio, substituição, reanálise, contato, cancelamento, reabertura e criação de pendência são proibidos;
- Registros Internos exibem somente linhas cujo `actor_user_id` coincide com o `auth.uid()` autenticado;
- registros históricos sem UUID de autor não são exibidos à SME;
- Administrador técnico mantém leitura integral quando opera em sua visão técnica, mas a simulação visual SME reproduz o mesmo recorte somente leitura da interface.

A autorização de mutações de pendência é aplicada na política de capacidades, nos handlers, no serviço de aplicação e na RLS. Ocultar botões isoladamente não satisfaz esta decisão.

A modelagem e a configuração de programas por exercício não fazem parte desta decisão.

---

## ADR-023 — Production usa Supabase como persistência canônica

**Status:** Aprovada

Production opera com:

```text
environment: production
dataMode: supabase-production
supabaseRepositoryEnabled: true
productionActivationApproved: true
```

O projeto autorizado é `scnryinorqeucbfkioxo`. O `SupabaseRepository` é a persistência normal de Preview e Production. O `LocalStorageRepository` permanece somente como rollback emergencial acionado por build controlado.

A ativação de Production não autoriza relaxar Auth, RLS, auditoria, concorrência, reconciliação ou rollback.

---

## ADR-024 — Documentação segue código e ambientes, não o contrário

**Status:** Aprovada

READMEs, estágio atual, contexto, decisões, planos, inventários e handoffs devem ser atualizados após mudanças materiais.

Quando houver divergência:

1. verificar código, migrations, políticas, deployment e dados;
2. corrigir a documentação para representar o estado comprovado;
3. não modificar código apenas para fazê-lo coincidir com documento desatualizado;
4. preservar documentos históricos com classificação explícita.

Artefato gerado deve ser regenerado pelo script canônico; não deve ser editado manualmente para aparentar alinhamento.

---

## ADR-025 — Competência mensal é contexto global único

**Status:** Aprovada

A competência ativa deve ser uma única fonte de contexto consumida por Dashboard, Carteira, Competências, Prontuário, Pendências, alertas, timeline e exportações.

Requisitos:

- seletor mensal disponível em todas as superfícies e perfis aplicáveis;
- preservação da seleção durante navegação, retorno e recarga da sessão;
- nenhuma constante mensal fixa em `app.js`;
- funções de domínio recebem `competenceKey` explicitamente;
- controles locais não criam seleção concorrente.

Competência existente, disponível para lançamento e fechada são conceitos distintos. `closing_competence` não deve ser usado como filtro genérico para ocultar meses existentes.

---

## ADR-026 — Competências restantes de 2026 devem ser operacionalizadas

**Status:** Aprovada

As competências de junho a dezembro de 2026 devem ser disponibilizadas a todos os perfis conforme suas permissões, preservando janeiro a maio e sem apagar registros.

A abertura deve ser expressa em dado/regra canônica, com migration, contratos, testes e homologação. Não será implementada apenas por inclusão visual de opções.

---

## ADR-027 — Histórico cronológico é projeção, não nova fonte de verdade

**Status:** Aprovada

O histórico da unidade consolida verificações, pendências, tentativas, contatos, logs, notas e bens em uma projeção cronológica normalizada.

Não criar tabela paralela de timeline quando os eventos já possuem entidades canônicas. A projeção deve preservar autoria, data, competência, programa, vínculo e visibilidade por perfil, evitando duplicidade sem apagar eventos relevantes.

---

## ADR-028 — Excel exige certificação de paridade integral

**Status:** Aprovada

Os relatórios Excel são produtos finais institucionais. A liberação oficial exige reconciliação automatizada:

```text
Supabase → estado carregado → modelo de exportação → célula XLSX
```

O gate deve cobrir:

- modelo SME;
- modelo editorial RADAR;
- todas as colunas e linhas de massa representativa;
- isolamento entre competências;
- normalização de valores;
- abertura no Microsoft Excel desktop sem reparo;
- manifesto, hash e zero divergências.

Testes de estrutura OOXML selecionados são necessários, mas não suficientes para declarar correspondência absoluta.

---

## ADR-029 — Navegação de retorno preserva contexto operacional

**Status:** Aprovada

Botões de voltar devem ser implementados em telas secundárias e drill-downs quando houver origem contextual útil.

O retorno deve preservar competência, filtros, busca, paginação, escola, pendência, perfil efetivo e foco relevante. Não adicionar botão redundante em telas raiz nem substituir ações Fechar/Cancelar de modais.

---

## ADR-030 — Polimento visual preserva identidade e decisões de produto

**Status:** Aprovada

O ciclo de acabamento pode melhorar hierarquia tipográfica, espaçamento, legibilidade, ícones, botões, tabelas, cartões, estados e responsividade.

Não pode alterar paleta, logomarca, capacidades, nomenclatura canônica, fluxos ou decisões de produto sem decisão específica. Mensagens de infraestrutura não devem aparecer como conteúdo operacional ao usuário final.

---

## ADR-031 — Liberação oficial depende de gate cumulativo

**Status:** Aprovada

O sistema somente será declarado liberado para operação oficial após:

- competências autorizadas acessíveis;
- jornadas reais por perfil aprovadas;
- avaliação mensal persistente e coerente;
- timeline íntegra;
- exportações certificadas;
- desktop e mobile homologados;
- proteção contra senhas vazadas habilitada;
- backup e restauração testados;
- segurança, migrations, Auth/RLS e auditoria aprovados;
- documentação e evidências atualizadas.

A decisão final deve ser registrada como liberado, liberado com restrições expressas ou não liberado com bloqueadores objetivos.
