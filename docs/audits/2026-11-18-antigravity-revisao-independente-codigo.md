# RADAR PDDE — auditoria independente do trabalho Antigravity, 18/11/2026

**Escopo de auditoria:** trabalho da branch `audit/antigravity-argon-prontuario-20261115@864b93caa4b19ae31a80e2a03e14ef0a2facc38b`, comparado com a branch oficial `fix/prontuario-integrado-validado-20261115@20409c12591090b3b422ae014afb8cdf880bd387` e `main@58ca0c0a507fb42ee512ace95ab766edaa1f2243`. **Origem desta candidata de revisão:** exclusivamente a branch oficial `20409c12`. Esta auditoria não altera `main`, Vercel ou Supabase de Produção.

## 1. Método e distinção de evidências

1. Comparação efetiva por arquivo, função, patch e relação de commits; não usar a quantidade de commits como medida de desenvolvimento original.
2. Leitura integral dos módulos de Assessoria, reconciliador, diálogo, CSS, testes novos e pontos de entrada em `app.js`; inspeção dos contratos de correção SQL/RLS, idempotência e projeções para detectar efeitos cruzados.
3. Leitura dos logs versionados de `test:readiness` e Playwright e comparação das promessas do relatório com o que cada teste realmente observa.
4. Reproduções isoladas executáveis dos módulos reais (sem banco) para transições do estado de Assessoria, com teste RED na versão Antigravity original e GREEN no código corrigido.
5. Implementação seletiva numa branch de revisão, preservando a branch de auditoria e sem misturar atualização de dependências ou documentação de outra frente.

**Limite probatório:** não há nesta auditoria execução integral do repositório, PostgreSQL Docker, 74 pgTAP, browser autenticado com Supabase real, screenshots revisadas nem aprovação do operador. A revisão local de funções JS e os logs do Antigravity não substituem esses gates.

## 2. Autoria funcional e integração

A comparação direta de `20409c12` para `864b93ca` possui 14 commits à frente e nenhum atrás, porém **a maior parte advém dos merges da integração oficial e das duas atualizações de ferramentas já mescladas na `main`**. Não houve nova migration operacional nesta diferença.

Os seis reparos prévios do Antigravity `1cb118fd` **já estão na branch oficial**: (1) seleção de Pendências candidatas persistente; (2) retorno para tela de Pendências após confirmação; (3) primeira análise de NF/Assessoria sem abrir modal corretivo; (4) projeção da identificação atual da NF vinculada por ID sem substituir texto histórico; (5) ordenação Editar lançamento antes de Excluir; (6) inclusão de versões das NFs irmãs e `FOR UPDATE` nas tentativas, com a 74ª asserção pgTAP escrita. **Não reaplicar** tais mudanças.

O desenvolvimento novo relevante é o chamado **7º reparo**, focado em `consAssessoria` e em acessibilidade:
- O wrapper `changeInvoiceAdvisoryAnalysis` passa a encaminhar **retificações de resultado anterior** (exceto a criação genuína de Pendência ao selecionar `Incorreto`) para `openInvoiceOperationalCorrection` sob `RadarOperationalCorrectionDialog.canUse`.
- Mantém a **primeira análise** em fluxo direto; o fallback do agregado para o único documento de serviço é considerado antes de decidir se a análise é inicial ou retificação.
- Adiciona botão `Editar análise` nas linhas da Assessoria e atualização incremental do botão e classes de estado; `aria-describedby` associa ações ao título específico da NF.
- Adiciona foco inicial em `Cancelar` para exclusões e contém scroll em modais; amplia o seletor de controles focáveis para `input:not(:disabled)`.
- Amplia dois testes unitários e um teste Playwright do fluxo de Assessoria.

**Juízo funcional:** correção de rota importante, com incremento localizado e coerente com o contrato T2; alterações de acessibilidade são promissoras, mas **não são certificação WCAG ou homologação visual**. O seletor que escolhe `Incorreto` continua no fluxo de abertura de Pendência, como exige a invariante do produto.

## 3. Falha nova e reprodução independentemente confirmada

**Achado A-01 — ação obsoleta após Pendência ativa (confirmado):**
- Local original: `src/integration/prontuario-conditional-reconciler.js`, `syncServicePendencyControls`, condição `if (actionCell && !active)`.
- Estado 1: NF de serviço com `Correto` e sem Pendência → criação de `Editar análise` (correto).
- Estado 2: a mesma NF recebe Pendência `Aberta` → o seletor é desabilitado, mas o reconciliador pula a célula de ações e conserva o botão antigo (incorreto).
- Impacto: interface oferece uma ação de correção desatualizada ao lado de estado de Pendência. Não é prova de violação de RLS: servidor continua autoridade.
- Cobertura Antigravity antes da revisão: verifica que o botão nasce após a análise; **não prova a remoção/substituição durante a transição**.

**Teste de regressão RED/GREEN:** acrescentado em `tests/unit/prontuario-conditional-reconciler.test.js` um caso que percorre `sem Pendência → Pendência Aberta → Pendência Resolvida → SME somente leitura`. Sua execução isolada contra a função original do Antigravity **FALHA** no botão obsoleto. O mesmo teste contra a correção desta candidata **PASSA**. Outras provas isoladas confirmaram: restauração de edição após resolver, ausência de edição para SME, desaparecimento ao desativar o piloto, visualização de Pendência legada e atualização quando o ID da Pendência muda.

**Correção proposta:** no reconciliador incremental, sempre compatibilizar a ação visível com o estado: `Editar análise` quando autorizada e sem Pendência; `Visualizar pendência` quando existe Pendência ativa e a gaveta está disponível; estado neutro quando não cabe ação. Conservar `aria-describedby` e identidade da Pendência. Nunca gravar ou desativar permissão no frontend como substituto do banco.

## 4. Testes versus evidência

- Log Antigravity de 17/11 apresenta **1.418/1.418** unitários, **8/8** integrações e **45/45** Playwright Chromium em 10 suítes, das quais **19** são do diálogo operacional. O `npm-audit.json` versionado registra 0 vulnerabilidades no snapshot da branch.
- O novo teste Playwright de Assessoria prova primeira análise, surgimento do botão e duas formas de abrir a janela; **não confirma aplicação de retificação em PostgreSQL, pós-F5 ou segunda sessão**. O teste injeta `repository.executeRpc` simulado.
- A avaliação de CSS, `autofocus`, `aria-describedby` e controles Tab é inspeção estática mais testes DOM/Chromium declarados. Falta verificar visualmente navegadores/temas, foco em sucesso e rolamento da página real.
- A branch Antigravity não tinha uma bateria de GitHub Actions comprovando todas essas jornadas em seu HEAD; constavam somente verificações auxiliares de Preview Comments e Supabase Preview ignorado. Logs locais do Antigravity são evidência útil, mas não green gate remoto na branch de destino.
- **No relatório original Antigravity, 74 asserções pgTAP estavam escritas mas não executadas; na execução posterior do PR #532, o arquivo de 74 asserções PASSOU em PostgreSQL Docker.** Isso não equivale a Auth/RLS real, concorrência com writers antigos, idempotência/rollback em duas sessões e aceite humano, ainda pendentes.

## 5. Fragilidades residuais a testar, sem extrapolar

- A exclusão de NF com Pendências/tentativas depende de FKs, triggers, estado patrimonial e atualização dos demais consumidores. O código SQL está na integração oficial antes deste 7º reparo e **não recebeu mudança neste pacote**. Seu comportamento em banco real não deve ser declarado aprovado.
- Duas NFs de Assessoria versus uma NF com campos herdados da verificação são caminhos distintos; validar cada um com dados persistidos e notas vizinhas intocadas.
- Ações inline após recebimento de Pendência, mudança de perfil, competência futura, mudança de programa e desativação da feature flag exigem a mesma revisão incremental; a cobertura unitária nova demonstra parte delas, não toda a experiência no navegador.
- Verificar se o overlay modal realmente contém a rolagem e o foco em Chromium/teclado e após atualização da página. `overscroll-behavior` sozinho não demonstra bloqueio total do scroll do documento.
- **Hipótese para teste de SQL futuro:** a lista enviada em `selectedPendencyIds` é acumulada com `array_agg` sem `DISTINCT` antes de ser usada para planejar exclusões. Um payload externo que repete um ID poderia passar pelas verificações de conjunto e duplicar o mesmo alvo no plano, gerando falha transacional ao aplicar. Não há evidência de exploração ou perda de dados, e a UI usa `Set`; exigir pgTAP negativo antes de qualquer mudança em migration.
- Não confundir o aviso de lentidão Realtime ou os timeouts operacionais da Produção com falhas T2/T3, pois essa candidata ainda não foi publicada.

## 6. Decisão de aproveitamento

**Aproveitado seletivamente nesta branch:** código funcional de Assessoria, novo fluxo de botão, acesso por teclado, melhorias de modais e 3 arquivos de testes do 7º reparo. **Corrigida a regressão A-01, com teste RED/GREEN adicional.** `app.js` e os módulos de interface foram copiados somente após revisão do diff, sem adotar toda a branch Antigravity.

**Expressamente não incorporados:** documentação da auditoria como novo ponto de execução, `package.json` / `package-lock.json` e ferramentas já atualizadas na `main`, migration/RLS institucional e qualquer ajuste não testado em Produção. Sincronizar as atualizações da `main` na branch oficial por decisão separada.

**Gate para incorporação na branch oficial:** CI automatizado para o SHA desta candidata, teste de transição no navegador, contraprova de perfil e estado de Pendência, compatibilidade de estilo, e posterior Auth/RLS em PostgreSQL local antes de declarar T2/T3 homologado. Não realizar merge para `main` nem deploy como parte deste trabalho.

## 7. Revalidação dinâmica posterior à abertura do PR #532 (18/11/2026)

O [workflow Supabase readiness #44308853610](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/44308853610), disparado pelo PR #532 contra a branch oficial, iniciou Supabase local em Docker, executou `supabase reset` com todas as migrations e iniciou a suíte real de pgTAP.

**Evidência nova importante:** `supabase/tests/database/operational-correction.test.sql` passou integralmente no PostgreSQL local com as **74 asserções**. Todos os demais arquivos pgTAP listados no log passaram, **exceto** `schema.test.sql`, que continha `count(*) = 62` apesar de a migration candidata `20261114000100` elevar a quantidade versionada para 63. A falha bloqueou os testes Auth/RLS/Playwright locais restantes. **Correção no PR:** `schema.test.sql` agora exige pelo menos 63 e a presença específica da migration `20261114000100`, evitando falsos vermelhos em futuras migrations. **Aguardar nova execução verde antes de certificar o gate.**

**Outro bloqueio externo independente:** o job de sintaxe/auditoria do PR interrompeu-se em `npm audit`: 3 advisories moderados e sete ocorrências altas de **um mesmo advisory upstream** `GHSA-fc5q-39xc-vjpf` / CVE-2026-112366 (ReDoS em `picomatch`, revisado em 17/11/2026). Os pacotes indiretos afetados incluem `dependency-cruiser`, `fdir`, `knip`, `picomatch`, `stylelint`, `stylelint-config-recommended` e `tinyglobby`. A política rejeita essas ocorrências, sem vulnerabilidades bloqueantes de **runtime** apontadas pelo controle atual. O pacote de revisão **não alterou** `package.json` nem `package-lock.json`. Não remover o controle de segurança nem usar `npm audit fix --force` como atalho; enfrentar a questão na frente dedicada #528, respeitando mudanças de advisories.

**Gate ainda aberto:** esta execução do pgTAP demonstra os testes SQL já implementados, não fecha a prova Auth/RLS das operações T2/T3, nem a reprodução E2E com banco real, F5 e segunda sessão. O CI Playwright dirigido e a readiness geral são provas complementares e não substituem a homologação com o proprietário.

---

## 7. Arquivos efetivamente alterados nesta candidata

`app.js`, `src/integration/{service-advisory-pendency,prontuario-conditional-reconciler,operational-correction-dialog,auditable-retification}.js`, `src/styles/{evaluation-retification-ui,unidentified-expense-ux}.css`, `tests/unit/{service-advisory-pendency,prontuario-conditional-reconciler}.test.js`, `tests/e2e/operational-correction-dialog.spec.js`, `supabase/tests/database/schema.test.sql` (teste de migrações atualizado após contraprova do CI), mais **este relatório de auditoria**. Nenhuma migration SQL, dependência ou script de build foi alterado.
