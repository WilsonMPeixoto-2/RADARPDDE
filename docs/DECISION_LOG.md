# RADAR PDDE — Registro de decisões

**Atualizado em:** 3 de agosto de 2026

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

**Status:** Aprovada

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

**Aplicação ao Excel SME:** a abertura no Microsoft Excel desktop foi concluída em 1º de agosto de 2026, sem reparo ou aviso de conteúdo inválido, e a versão homologada foi publicada. O workflow permanece como proteção regressiva; não representa gate pendente do escopo já encerrado.

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

---

## ADR-032 — Disponibilização de competências reutiliza o contrato existente

**Status:** Aprovada e implementada

Quando as competências já existem e o requisito é alterar disponibilidade ou fechamento, reutilizar registros, `closing_competence`, datas e RPC/auditoria existentes. Migration adicional somente cabe quando houver mudança real de schema ou regra não representável.

**Aplicação em 2026:** `closing_competence` foi alterada de `2026-05` para `2026-12`, com `row_version = 5`, sem migration nova.

---

## ADR-033 — Divergência do histórico SME bloqueia nova migration

**Status:** Cumprida pela ADR-034

Enquanto os identificadores local e remoto da migration SME divergiam, novas migrations de Production ficaram bloqueadas. O SQL era idêntico e não podia ser reaplicado, renomeado ou mascarado por migration vazia.

A decisão protegeu o schema até a reconciliação suportada.

---

## ADR-034 — Histórico SME reconciliado sem reaplicação de SQL

**Status:** Aprovada e implementada

O histórico remoto foi reconciliado para o identificador canônico:

```text
GitHub e Supabase Production: 20260728182226_sme_access_governance
identificador derivado 20260728190344: ausente
SHA-256 do SQL: cddda35f4cc08b92093071f888cf958ae052ae82775c91366e4d729434427f0e
```

A operação usou o mecanismo oficial `migration repair` para alterar somente o histórico:

1. o identificador derivado foi marcado como `reverted`;
2. o identificador canônico foi marcado como `applied`;
3. o SQL funcional não foi executado, reaplicado ou revertido;
4. schema e políticas permaneceram inalterados;
5. `migration list` terminou com 25 versões correspondentes;
6. `db push --dry-run` ficou sem migration pendente;
7. `tests/unit/sme-migration-history-alignment.test.js` passou a proteger versão, ausência do identificador derivado e hash.

**Consequência permanente:** migration futura exige histórico alinhado, teste de regressão, reset local, pgTAP, lint, tipos, dry-run, backup e rollback. `migration repair` não é rollback funcional de SQL.

**Evidência:** `docs/audits/2026-07-29-reconciliacao-migration-sme-evidencias.md`.

---

## ADR-035 — Node 24 e gate remoto por papel/viewport

**Status:** Aprovada e implementada

Node.js permanece fixado em `24.x` no projeto, Vercel e workflows. O gate remoto sobe Supabase descartável, aplica migrations e valida os cinco papéis institucionais em Desktop Chrome, Pixel 7/Chromium e iPhone 15/WebKit, sem utilizar Production.

**Documento integral:** `docs/decisions/ADR-035-node24-e-gate-remoto.md`.

---

## ADR-036 — Backup restaurável e recurso pago do Supabase Auth

**Status:** Aprovada e implementada quanto ao gate disponível

Backup lógico e restauração são verificados em pilhas Supabase descartáveis, incluindo schema, dados, Auth e histórico de migrations. A proteção de senhas comprometidas não é requisito enquanto o projeto permanecer no plano Free e não houver autorização financeira.

**Documento integral:** `docs/decisions/ADR-036-backup-restauracao-e-recurso-pago-auth.md`.

---

## ADR-037 — Integridade de referências locais dos workflows

**Status:** Aprovada e implementada

Workflows devem falhar quando chamadas estáticas verificáveis apontarem para scripts, testes, configurações Playwright, scripts npm, diretórios de trabalho, cache manifests ou Actions locais inexistentes. Expressões dinâmicas, heredocs e artefatos gerados em runtime ficam fora desse verificador conservador.

O gate é executado pela validação principal e pela saúde das dependências, sem introduzir nova dependência npm.

**Documento integral:** `docs/decisions/ADR-037-integridade-de-referencias-dos-workflows.md`.

---

## ADR-038 — Atualizações devem produzir integração pertinente

**Status:** Aprovada e implementada

Atualizar biblioteca, ferramenta ou Action apenas para alterar número de versão não basta quando a versão oferece capacidade útil ao RADAR. Cada atualização deve registrar motivo, recursos relevantes, integração adotada, recursos adiados, itens não aplicáveis e evidências.

Não se deve forçar uso artificial de recurso novo. Atualização somente de versão é aceitável quando o ganho concreto for correção, segurança, compatibilidade, suporte ou manutenção e a ausência de integração adicional estiver justificada.

**Documento integral:** `docs/decisions/ADR-038-atualizacoes-com-integracao-pertinente.md`.

---

## ADR-039 — Evolução tecnológica proativa orientada ao melhor resultado

**Status:** Aprovada

Toda correção, melhoria de layout, mudança de fluxo ou nova capacidade deve avaliar se a tecnologia atual limita o resultado possível.

Quando nova biblioteca, atualização ou capacidade moderna puder melhorar materialmente acessibilidade, desempenho, segurança, consistência, manutenção ou experiência, a proposta deve ser apresentada antes de aceitar solução paliativa ou limitada.

A proposta deve informar:

1. limite observado;
2. tecnologia sugerida;
3. ganho concreto;
4. alternativa sem nova dependência;
5. custo e risco;
6. impacto em bundle, dados, permissões, LGPD e Production;
7. testes, rollback e evidências;
8. necessidade de Vercel, Supabase ou ambas.

Propor não significa instalar. Adoção continua dependente de aprovação, branch isolada, versão fixada, análise de segurança, gates completos e implantação controlada. A solução existente permanece preferível quando entrega resultado equivalente com menor custo.

**Documento integral:** `docs/decisions/ADR-039-evolucao-tecnologica-proativa.md`.
