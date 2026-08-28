# RADAR PDDE — Registro de decisões

**Atualizado em:** 27 de agosto de 2026

Este documento registra decisões duradouras. Não é diário de commits. Uma decisão somente é substituída por decisão expressa com impacto e status documentados.

## Convenções

- **Aprovada:** vigente;
- **Aprovada e implementada:** vigente e refletida no produto;
- **Cumprida:** gate ou condição já satisfeita;
- **Substituída:** outra decisão passou a prevalecer;
- **Revogada:** deixou de valer;
- **Proposta:** depende de decisão.

---

## ADR-001 — Contrato único de repositório

**Status:** Aprovada e implementada; contingência de Production refinada pela ADR-045

`LocalStorageRepository` e `SupabaseRepository` implementam o mesmo contrato. Interface e serviços não dependem do mecanismo concreto.

**Consequência atual:** Supabase é canônico em Production. LocalStorage permanece para desenvolvimento e testes explicitamente configurados; Production não usa fallback local silencioso.

---

## ADR-002 — Production permanece local

**Status:** Substituída pela ADR-023

Production permaneceu local durante o gate de pré-conexão. A decisão cumpriu sua finalidade de proteção e não representa o ambiente atual.

---

## ADR-003 — Primeira conexão em Preview exclusivo

**Status:** Substituída pela ADR-023 quanto ao estágio; vigente como regra de ativação

Mudança nova de infraestrutura deve ser validada primeiro em ambiente isolado. Preview aprovado não autoriza automaticamente Production.

---

## ADR-004 — Quatro perfis funcionais visíveis

**Status:** Aprovada e implementada

O seletor operacional apresenta Controlador, Assistente de Verbas Federais, SME (Gestão) e Equipe de Inventário. `technical_admin` não é quinto perfil funcional visível.

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

O cadastro cria ou atualiza diretório, conta Auth, perfil e vínculo funcional, impede duplicidade e registra auditoria. Desativação bloqueia acesso e preserva histórico. Falha parcial exige compensação.

---

## ADR-008 — Gestão de contas ocorre em backend protegido

**Status:** Aprovada e implementada

O navegador chama Edge Function autenticada. Auth Admin e RPCs privilegiadas permanecem server-side. `service_role` ou segredo equivalente nunca chega ao frontend.

---

## ADR-009 — SME exerce acompanhamento gerencial

**Status:** Aprovada

A SME acompanha CREs, dados consolidados e parâmetros autorizados. Não substitui a Assistente na gestão cotidiana da equipe da CRE. O recorte operacional é detalhado pela ADR-022.

---

## ADR-010 — Exclusão física é técnica e excepcional

**Status:** Aprovada e implementada

Remover integrante na interface significa desativação lógica, redistribuição quando necessária, bloqueio de acesso e auditoria. `DELETE` físico permanece excepcional e técnico.

---

## ADR-011 — Operações compostas são atômicas

**Status:** Aprovada e implementada

Mudanças interdependentes usam transação ou RPC: competências, escola e programas, verificação e log, reanálise, nota, bem, Gestão de Equipe, importação, promoção e rollback.

---

## ADR-012 — Migração de dados progressiva e reversível

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

## ADR-016 — Alterações acompanham todas as camadas

**Status:** Aprovada

Mudança de ação, perfil ou fluxo exige verificar interface, serviço, persistência, migration/RPC, Auth/RLS, auditoria, testes, documentação e implantação.

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

Cada sessão ou PR declara a tarefa como concluída, bloqueada, substituída ou parcialmente concluída, com itens restantes explícitos.

---

## ADR-020 — Dependências fixadas e atualizações intencionais

**Status:** Aprovada; risco conhecido atual refinado pela ADR-047

Versões permanecem fixadas e lockfile versionado. Nova biblioteca exige necessidade comprovada, análise de changelog e gates completos. A major operacional do Node deve ser deliberadamente fixada antes do release oficial.

---

## ADR-021 — Carteira organiza responsabilidade, não restringe colaboração

**Status:** Aprovada e implementada

A carteira define responsável principal, filtro inicial e priorização. Controladores podem atuar nas escolas da mesma `cre_scope`, preservando `schools.controller_id` e autoria real. Outra CRE exige exceção explícita.

---

## ADR-022 — Gestão SME separa consulta gerencial de operação

**Status:** Aprovada e implementada

Na Gestão SME:

- visão mensal e Prontuário exibem identificação e bonificação, sem análise técnica ou controles operacionais;
- Pendências são consultáveis, mas mutações operacionais são proibidas;
- Registros Internos exibem somente `actor_user_id = auth.uid()`;
- registros sem UUID de autor não são exibidos;
- Administrador técnico mantém leitura integral em sua visão técnica;
- simulação SME reproduz o recorte visual, sem alterar JWT.

A restrição é cumulativa em capacidades, handlers, serviços e RLS. Programas por exercício não integram esta decisão e exigem confirmação funcional própria.

---

## ADR-023 — Production usa Supabase como persistência canônica

**Status:** Aprovada e implementada; contingência refinada pela ADR-045

Production opera com:

```text
environment: production
dataMode: supabase-production
supabaseRepositoryEnabled: true
productionActivationApproved: true
```

Projeto autorizado: `scnryinorqeucbfkioxo`.

Auth, RLS, auditoria, concorrência, reconciliação e rollback permanecem obrigatórios. LocalStorage não é fallback automático de Production; a regra fail-closed é definida pela ADR-045.

---

## ADR-024 — Documentação segue código e ambientes

**Status:** Aprovada; ampliada pela ADR-042

Após mudança material, atualizar READMEs, estágio, contexto, decisões, inventários e handoffs. Quando houver divergência:

1. verificar código, migrations, banco e deployment;
2. corrigir a documentação;
3. não modificar código apenas para coincidir com documento antigo;
4. preservar históricos com classificação explícita;
5. regenerar artefatos pelo script canônico.

---

## ADR-025 — Competência mensal é contexto global único

**Status:** Aprovada e implementada; refinada pela ADR-044

Dashboard, Carteira, Competências, Prontuário, alertas, timeline e exportações consomem uma única competência ativa. Pendências Operacionais preserva a competência global como contexto, porém não a utiliza como filtro implícito da fila; essa exceção é detalhada na ADR-044.

---

## ADR-026 — Competências restantes de 2026 devem ser operacionalizadas

**Status:** Aprovada e implementada; método esclarecido pela ADR-032

Janeiro a dezembro de 2026 estão disponíveis aos perfis conforme permissões, preservando registros anteriores.

O objetivo foi cumprido com as doze competências existentes e alteração transacional de `closing_competence` para `2026-12`. Não houve migration adicional.

---

## ADR-027 — Histórico cronológico é projeção

**Status:** Aprovada e implementada

A timeline consolida verificações, pendências, tentativas, contatos, logs, notas e bens em leitura cronológica. Não cria tabela paralela quando os eventos já possuem entidades canônicas.

---

## ADR-028 — Excel exige certificação de paridade integral

**Status:** Aprovada e implementada

Relatórios Excel são produtos finais institucionais. A certificação percorre:

```text
estado canônico → modelo → workbook/OOXML → célula XLSX
```

O botão principal institucional gera XLSX, o Excel SME possui botão próprio e o CSV permanece fallback. Cada mudança material do gerador exige proteção automatizada e homologação humana no Excel desktop antes da publicação.

**Aplicação atual ao Excel SME:** o produto público possui 27 colunas A:AA. O template-fonte de 30 colunas é projetado com remoção exclusiva das posições K, R e Y. A versão atual foi aberta no Microsoft Excel desktop sem reparo e publicada pelos PRs nº 136 e 137.

---

## ADR-029 — Navegação de retorno preserva contexto operacional

**Status:** Aprovada e implementada

Telas de aprofundamento usam retorno contextual com competência, rota, filtros, rolagem e foco. Telas raiz não recebem botão redundante e modais continuam com Fechar/Cancelar.

---

## ADR-030 — Polimento visual preserva identidade e produto

**Status:** Aprovada

O acabamento pode melhorar hierarquia, espaçamento, legibilidade, ícones, botões, tabelas, cartões, estados e responsividade.

Não pode alterar paleta, logomarca, capacidades, nomenclatura canônica ou fluxos sem decisão específica.

---

## ADR-031 — Liberação oficial depende de gate cumulativo

**Status:** Aprovada

O sistema somente será declarado liberado após jornadas por perfil, avaliação mensal, timeline, exportações homologadas, desktop/mobile, segurança, backup/restauração, UAT, documentação e decisão formal.

A decisão final deve registrar: liberado, liberado com restrições ou não liberado com bloqueadores objetivos.

A ADR-041 esclarece que as jornadas devem provar o percurso ponta a ponta, não apenas telas ou camadas isoladas.

---

## ADR-032 — Disponibilização de competências reutiliza o contrato existente

**Status:** Aprovada e implementada

Quando as competências já existem e o requisito é alterar disponibilidade ou fechamento, reutilizar registros, `closing_competence`, datas e RPC/auditoria existentes. Migration adicional somente cabe quando houver mudança real de schema ou regra não representável.

**Aplicação histórica em 2026:** `closing_competence` foi alterada de `2026-05` para `2026-12`, quando o registro alcançou `row_version = 5`, sem migration nova. `row_version` é mutável e estava em 20 na consulta de 5 de agosto de 2026.

---

## ADR-033 — Divergência do histórico SME bloqueia nova migration

**Status:** Cumprida pela ADR-034

Enquanto os identificadores local e remoto da migration SME divergiam, novas migrations de Production ficaram bloqueadas. O SQL era idêntico e não podia ser reaplicado, renomeado ou mascarado por migration vazia.

---

## ADR-034 — Histórico SME reconciliado sem reaplicação de SQL

**Status:** Aprovada e implementada

O histórico remoto foi reconciliado para o identificador canônico:

```text
GitHub e Supabase Production: 20260728182226_sme_access_governance
identificador derivado 20260728190344: ausente
SHA-256 do SQL: cddda35f4cc08b92093071f888cf958ae052ae82775c91366e4d729434427f0e
```

A operação usou o mecanismo oficial `migration repair` para alterar somente o histórico. O SQL funcional não foi reaplicado. Production possuía 25 versões correspondentes em 5 de agosto de 2026.

**Evidência:** `docs/audits/2026-07-29-reconciliacao-migration-sme-evidencias.md`.

---

## ADR-035 — Node 24 e gate remoto por papel/viewport

**Status:** Aprovada e implementada

Node.js permanece fixado em `24.x` no projeto, Vercel e workflows. O gate remoto sobe Supabase descartável e valida os papéis institucionais em Desktop Chrome, Pixel 7/Chromium e iPhone 15/WebKit, sem utilizar Production.

**Documento integral:** `docs/decisions/ADR-035-node24-e-gate-remoto.md`.

---

## ADR-036 — Backup restaurável e recurso pago do Supabase Auth

**Status:** Aprovada e implementada quanto ao gate disponível

Backup lógico e restauração são verificados em pilhas Supabase descartáveis, incluindo schema, dados, Auth e histórico de migrations. A proteção de senhas comprometidas não é requisito enquanto o projeto permanecer no plano Free e não houver autorização financeira.

**Documento integral:** `docs/decisions/ADR-036-backup-restauracao-e-recurso-pago-auth.md`.

---

## ADR-037 — Integridade de referências locais dos workflows

**Status:** Aprovada e implementada

Workflows devem falhar quando chamadas estáticas verificáveis apontarem para scripts, testes, configurações Playwright, scripts npm, diretórios de trabalho, cache manifests ou Actions locais inexistentes.

**Documento integral:** `docs/decisions/ADR-037-integridade-de-referencias-dos-workflows.md`.

---

## ADR-038 — Atualizações devem produzir integração pertinente

**Status:** Aprovada e implementada

Atualizar biblioteca, ferramenta ou Action apenas para alterar número de versão não basta quando a versão oferece capacidade útil ao RADAR. Cada atualização deve registrar motivo, recursos relevantes, integração adotada, recursos adiados, itens não aplicáveis e evidências.

Atualização somente de versão é aceitável quando o ganho concreto for correção, segurança, compatibilidade, suporte ou manutenção e a ausência de integração adicional estiver justificada.

**Documento integral:** `docs/decisions/ADR-038-atualizacoes-com-integracao-pertinente.md`.

---

## ADR-039 — Evolução tecnológica proativa orientada ao melhor resultado

**Status:** Aprovada

Toda correção, melhoria de layout, mudança de fluxo ou nova capacidade deve avaliar se a tecnologia atual limita o resultado possível.

Propor não significa instalar. Adoção depende de aprovação, branch isolada, versão fixada, análise, gates completos e implantação controlada.

**Documento integral:** `docs/decisions/ADR-039-evolucao-tecnologica-proativa.md`.

---

## ADR-040 — Garantia operacional contínua de Production

**Status:** Aprovada e implementada quanto às fases 1 e 2

Production possui monitor recorrente de commit, manifesto, shell, assets, gate de autenticação, bloqueio anônimo e preflight das Edge Functions. Falha confirmada cria ou atualiza incidente automático; recuperação confirmada encerra o incidente.

Integrada pelos PRs nº 139 e 140.

**Documento integral:** `docs/decisions/ADR-040-garantia-operacional-contínua.md`.

---

## ADR-041 — Confiabilidade funcional ponta a ponta

**Status:** Aprovada

Função crítica somente é considerada concluída quando interface, evento, serviço, repositório, backend, Auth/RLS, persistência, retorno, renderização, releitura e compensação forem comprovados.

A próxima frente deve criar matriz `perfil × tela × ação × backend × permissão × evidência`, seguida de smoke autenticado e provas controladas de escrita.

**Documento integral:** `docs/decisions/ADR-041-confiabilidade-funcional-ponta-a-ponta.md`.

---

## ADR-042 — Reconciliação documental baseada nas fontes remotas

**Status:** Aprovada

Documentação corrente deve ser reconciliada com código, Supabase, Vercel, PRs e evidências. PR aberto não é integrado; Preview não é Production; migration em branch não altera a contagem remota; evidência datada não substitui estado atual.

**Documento integral:** `docs/decisions/ADR-042-reconciliacao-documental-remota.md`.

---

## ADR-043 — Desativação de Controlador exige carteira previamente zerada

**Status:** Aprovada e implementada

A Gestão de Equipe adota sequência obrigatória em duas etapas: as escolas são primeiro transferidas para outro Controlador pelos recursos de alocação individual ou em lote; somente após a carteira atingir zero o comando de desativação é habilitado.

A desativação não redistribui escolas. Ela desativa o acesso e remove a pessoa dos diretórios operacionais, preservando os registros históricos. A regra é protegida na interface, no serviço de aplicação, na Edge Function e na RPC transacional.

---

## ADR-044 — Pendências Operacionais usa visão transversal entre competências

**Status:** Aprovada, implementada e publicada em Production

A competência mensal continua sendo o contexto global único do RADAR PDDE e permanece visível durante a navegação, porém **não limita implicitamente a fila de Pendências Operacionais**.

Por padrão, a página apresenta o passivo de todas as competências e o filtro local inicia em `Todas as competências`. Pendências ativas priorizam as mais antigas; estados encerrados priorizam os acontecimentos mais recentes.

Abrir o detalhe não altera a competência global. Ao seguir para o Prontuário, a competência de origem da pendência volta a ser aplicada.

**Documento integral:** `docs/decisions/ADR-044-pendencias-passivo-transversal.md`.

---

## ADR-045 — Production é fail-closed e não publica seed institucional

**Status:** Aprovada e implementada

Production opera exclusivamente com a configuração remota autorizada. Falha, ausência ou inconsistência de configuração Supabase não pode ativar fallback silencioso para LocalStorage/seed.

O build de Production sanitiza os dados iniciais de escolas/controladores usados no desenvolvimento para que eles não façam parte do bundle público institucional.

LocalStorage, fixtures e seeds descartáveis permanecem disponíveis apenas para desenvolvimento/testes explicitamente configurados.

**Documento integral:** `docs/decisions/ADR-045-production-fail-closed.md`.

---

## ADR-046 — Escritas operacionais usam retorno autoritativo, reconciliação incremental e diagnóstico local

**Status:** Aprovada; implementada parcialmente nos PRs #190–#194; lacunas específicas de `invoice:save` consolidadas no plano pós-PR #200

O caminho normal das escritas inline bem-sucedidas usa feedback imediato, persistência/RPC, retorno autoritativo, incorporação incremental e reconciliação localizada. `renderProntuario()` integral permanece fallback para bootstrap, navegação, erro, retorno incompleto ou inconsistência não reconciliável.

Operações semanticamente idênticas são idempotentes e não devem gerar nova persistência, `row_version` ou log sem mudança real.

O diagnóstico iniciado em 24/08 e consolidado depois do PR #200 confirmou que esse contrato permanece a direção correta, mas não está integralmente coberto em `invoice:save`: submit repetido pode criar duas inclusões, a edição não possui no-op baseado em todos os efeitos derivados, a dispensa de refresh de históricos depende da extensão opcional e ainda não existe chave idempotente de servidor para retry/perda de resposta. A correção está sequenciada em PR1, PR2, PR5, PR8A e PR8B do plano mestre pós-auditoria; não considerar a lacuna resolvida apenas pela formulação desta ADR.

A instrumentação local pode medir `click`, `feedback`, RPC, aplicação e estabilização por probe limitada em memória, sem telemetria externa nem dados de negócio. Falha do diagnóstico é fail-open.

`fast-check`, MSW e `dependency-cruiser` permanecem ferramentas de desenvolvimento/teste; Performance API/PerformanceObserver nativos sustentam a medição local.

**Documento integral:** `docs/decisions/ADR-046-escritas-operacionais-incrementais-e-observaveis.md`.

---

## ADR-047 — Vulnerabilidades conhecidas são acompanhadas sem atualização forçada

**Status:** Aprovada

As duas vulnerabilidades moderadas conhecidas na cadeia transitiva ExcelJS/UUID são risco conscientemente aceito no estado de 23/08/2026.

Não executar `npm audit fix --force`, alteração rompente de ExcelJS ou troca oportunista de biblioteca apenas para zerar o relatório. O gate continua bloqueando severidade `high` ou superior.

Reavaliar quando houver correção compatível, aumento de severidade/exposição, caminho materialmente explorável, mudança do contrato Excel ou nova exigência institucional de segurança.

**Documento integral:** `docs/decisions/ADR-047-vulnerabilidades-conhecidas-acompanhamento-sem-atualizacao-forcada.md`.

---

## ADR-048 — Plano pós-PR #200 usa execução incremental e revisão adversarial

**Status:** Aprovada

O plano de 26/08/2026 substitui o plano de 24/08 como referência operacional das correções restantes. O PR #199 permanece como registro histórico do planejamento inicial e o PR #200 como primeiro hotfix funcional já integrado.

A ordem aprovada é:

```text
G0 → PR1 → PR2 → PR3.1 → PR3.2 → PR3.3 → PR4 → PR5
→ PR6 → PR6B → PR7A → PR7B → PR8A → PR8B
→ PR9A → PR9B → PR9C → encerramento
```

Cada entrega deve revalidar a premissa, demonstrar RED, implementar a menor correção suficiente, buscar consumidores fora dos arquivos previstos, passar por revisão adversarial independente, cumprir gates proporcionais e registrar publicação/reversão antes da próxima entrega.

Decisões específicas incorporadas:

- PR5 fortalece IDs persistentes sem atribuir a duplicidade atual ao fallback de `InvoiceService`; produtores dependentes exclusivamente de `Date.now()` serão eliminados após inventário, incluindo `DirectoryService`;
- PR3 é dividido em PR3.1, PR3.2 e PR3.3, com gates próprios;
- PR8 é dividido em PR8A e PR8B;
- PR9C só define orçamento por hipótese depois do baseline e do ruído medidos em PR9A/PR9B;
- `web-vitals` e `Server-Timing` são possibilidades condicionais posteriores ao PR9A, não tarefas antecipadas, e não autorizam telemetria externa.

Exclusões definitivas desta frente:

- antigo item 20 da auditoria, sobre autoridade server-side mais ampla;
- proteção de senhas vazadas no Supabase Auth;
- PR #195;
- deduplicação de NF por conteúdo.

**Documentos integrais:** `docs/handoff/2026-08-26-retomada-plano-mestre-pos-pr200.md` e `docs/superpowers/plans/2026-08-26-plano-mestre-correcoes-pos-auditoria.md`.

---

## ADR-049 — Boleto de pagamento de Internet é documento exclusivo de Educação Conectada

**Status:** Aprovada; implementação rastreada no PR #203, com publicação ainda condicionada ao gate de merge

`boletoInternet` integra a bonificação e a análise técnica somente em `CONECTADA`. A categoria aceita `Sim`, `Não` e `Não se aplica`; `Incorreto` usa a Pendência documental atômica existente. Ela não cria Nota Fiscal, bem, efeito financeiro ou Consulta Assessoria.

Todos os caminhos públicos de escrita devem rejeitar a chave fora de Educação Conectada, inclusive bonificação, análise, retificação e abertura de Pendência.

Consolidações conectadas anteriores à chave permanecem válidas por projeção `Não se aplica / Correto`, sem backfill nem materialização durante a leitura. Registros ainda não consolidados precisam avaliar a categoria explicitamente. O Excel SME permanece com 27 colunas.

**Documentos:** `docs/architecture/avaliacao-mensal.md` e `docs/handoff/2026-08-27-hotfix-boleto-internet.md`.

## ADR-050 — Análise e Pendência individual por registro de Notas Fiscais

**Status:** Aprovada; implementação funcional estabilizada no PR #211, ainda em Draft

`notaFiscal` permanece agregada para bonificação, mas cada `registered_invoice` possui análise técnica própria. O resumo técnico agregado é derivado e não aceita edição direta.

Toda nova Pendência de Notas Fiscais precisa de `registered_invoice_id`. Invoices diferentes podem possuir Pendências simultâneas; a mesma invoice não pode duplicar Pendência ativa.

`a_identificar` nasce obrigatoriamente `Incorreto + Pendência` na mesma operação. A identificação posterior ocorre em **Registrar novo envio**, preserva o mesmo ID e pode produzir, de forma separada, Consulta Assessoria ou registro patrimonial conforme o tipo efetivamente identificado.

O Prontuário avalia documentos e permite visualizar a Pendência; novo envio e reanálise permanecem na tela de Pendências. O layout desktop aprovado usa quatro áreas: Documento, Tipo · Valor, Situação técnica e Ação.

Os 20 registros históricos `a_identificar` não recebem Pendências retroativas. O reparo conhecido do Boleto 1234 continua cirúrgico e condicionado a preflight fail-closed.

As regras de negócio permanecem sob domínio/serviços de aplicação. O PostgreSQL valida identidade, contexto, transição, concorrência e atomicidade, sem se tornar um segundo motor completo de regras.

Mobile não é gate bloqueante deste hotfix; desktop é o alvo da homologação visual.

O PR #211 é prioritário, mas não substitui o plano mestre. Após eventual publicação, é obrigatório re-baseline antes de PR3.1.

**Documento integral:** `docs/decisions/ADR-050-analise-pendencia-individual-notas-fiscais.md`.
