# Ciclo B1 — Grafo de carregamento e precedência do frontend Implementation Plan

> **Execução:** usar `superpowers:executing-plans`, pelo agente principal, tarefa por tarefa e com checkpoints no remoto. Não usar subagentes neste projeto.

**Goal:** documentar e testar a ordem efetiva de CSS e JavaScript do RADAR antes de qualquer consolidação do frontend, sem alterar comportamento ou aparência.

**Architecture:** um analisador ESM lê HTML, loaders, JavaScript e CSS e produz um manifesto determinístico. Um teste Playwright instrumenta somente as respostas locais durante a execução e compara a ordem observada com o contrato estático. Documentação traduz as relações em grafo, preservações e limites seguros para o pacote seguinte.

**Tech Stack:** Node.js 24; JavaScript ESM e CommonJS; Acorn 8; Playwright 1.61; HTML; CSS; JSON; Markdown; nenhuma dependência nova.

## Status de execução

| Tarefa | Estado |
|---|---|
| 1 — Congelar escopo e publicar o plano | concluída |
| 2 — Escrever testes do analisador | concluída |
| 3 — Implementar o analisador estático | concluída |
| 4 — Comprovar a ordem no navegador | concluída |
| 5 — Produzir grafo e diagnóstico | concluída |
| 6 — Validar ausência de regressão e salvar o checkpoint | em execução |

## Restrições globais

- Partir de `ad0513299c9f4e10b08d6f1cedacb970adbc6ec8`, merge do Ciclo A.
- Não modificar `app.js`, `index.html`, `styles.css`, `config.js`, `config.runtime.js`, `src/**`, `supabase/**`, `vercel.json` ou workflows permanentes.
- Não reordenar, fundir, excluir ou renomear extensões.
- Não alterar layout, conteúdo, regras, dados, persistência ou produção.
- Não tratar nome histórico como prova de obsolescência.
- Não registrar dados pessoais, segredos ou caminhos absolutos no manifesto.
- Usar TDD para parser, classificação e modo `--check`.
- Salvar cada entrega significativa no branch remoto.

## Mapa de arquivos

### Criar

- `docs/superpowers/specs/2026-07-15-frontend-precedencia-design.md`
- `docs/superpowers/plans/2026-07-15-frontend-precedencia.md`
- `scripts/audit/analyze-frontend-precedence.mjs`
- `tests/unit/frontend-precedence-audit.test.js`
- `tests/audit/frontend-precedence.spec.js`
- `playwright.frontend-audit.config.js`
- `docs/evidence/frontend-precedence/manifest.json`
- `docs/architecture/frontend-load-order.md`
- `docs/audits/2026-07-15-frontend-precedencia-estado-atual.md`

### Modificar

- `package.json` — adicionar comandos da auditoria.
- `docs/README.md` — indexar os novos artefatos.

---

## Task 1 — Congelar escopo e publicar o plano

- [ ] Confirmar branch `docs/ciclo-b-precedencia-frontend`, status limpo e base exata.
- [ ] Executar `npm ci` e `npm run check`.
- [ ] Revisar `config.js`, `index.html`, `load-excel-export.js`, as nove folhas de extensão e os módulos de integração.
- [ ] Criar especificação e plano com estado atual, preservações, arquivos e gates.
- [ ] Executar `git diff --check`.
- [ ] Commitar como `docs: planejar auditoria de precedência do frontend`.
- [ ] Publicar o branch e abrir PR em rascunho antes da implementação da ferramenta.

## Task 2 — Escrever testes do analisador

- [ ] Criar `tests/unit/frontend-precedence-audit.test.js` com fixture mínima de HTML, loaders e CSS.
- [ ] Exigir extração ordenada de scripts estáticos, extensões, item deduplicado e módulos encadeados.
- [ ] Exigir que seletores iguais em contextos diferentes não virem colisão na mesma condição.
- [ ] Exigir detecção de propriedades divergentes para seletor e contexto idênticos.
- [ ] Exigir contagem de `!important`.
- [ ] Exigir detecção de escritores globais múltiplos entre extensões.
- [ ] Exigir saída determinística e livre de caminhos absolutos.
- [ ] Executar `node --test tests/unit/frontend-precedence-audit.test.js` e confirmar falha por módulo ausente.

## Task 3 — Implementar o analisador estático

- [ ] Criar `scripts/audit/analyze-frontend-precedence.mjs`.
- [ ] Exportar `analyzeFrontendPrecedence(rootDir)` e funções puras necessárias aos testes.
- [ ] Extrair estilos e scripts de `index.html`, `config.js` e do loader Excel.
- [ ] Aplicar a deduplicação por `data-radar-extension`.
- [ ] Analisar globais com Acorn, sem executar os módulos.
- [ ] Analisar CSS por contexto condicional e ordem da folha.
- [ ] Gerar `docs/evidence/frontend-precedence/manifest.json` com ordenação estável.
- [ ] Implementar `--check` sem escrever arquivos.
- [ ] Executar os testes até passarem.
- [ ] Gerar o manifesto duas vezes e comparar os resultados.

## Task 4 — Comprovar a ordem no navegador

- [ ] Criar `tests/audit/frontend-precedence.spec.js`.
- [ ] Instrumentar respostas JavaScript locais e registrar execução antes do código original.
- [ ] Esperar a ativação do pacote Excel.
- [ ] Comparar a baseline observada com o manifesto.
- [ ] Atrasar artificialmente o núcleo posterior a `config.js` e comprovar a ordem relativa e a inicialização das extensões ordenadas.
- [ ] Tratar o loader Excel assíncrono como posição variável válida e comprovar apenas sua unicidade e precedência sobre os quatro módulos encadeados.
- [ ] Verificar que `retificacoes.js` executa uma vez.
- [ ] Comparar a sequência dos links CSS efetivos com o manifesto.
- [ ] Falhar em `pageerror` e `console.error` inesperado.
- [ ] Criar `playwright.frontend-audit.config.js` com Desktop Chromium e servidor local.
- [ ] Adicionar scripts `audit:frontend-precedence`, `audit:frontend-precedence:check` e `test:frontend-precedence` ao `package.json`.
- [ ] Executar os três comandos com sucesso.

## Task 5 — Produzir grafo e diagnóstico

- [ ] Criar `docs/architecture/frontend-load-order.md` com ordem estática, dinâmica, efetiva e dependências de wrappers.
- [ ] Incluir grafo Mermaid do carregamento.
- [ ] Criar `docs/audits/2026-07-15-frontend-precedencia-estado-atual.md` com métricas reais do manifesto.
- [ ] Classificar achados em `CP`, `ID`, `FA`, `IC`, `DC`, `DQ`, `DF` ou `EP`.
- [ ] Separar overrides responsivos de colisões no mesmo contexto.
- [ ] Registrar candidatos para investigação posterior sem autorizar remoção.
- [ ] Atualizar `docs/README.md`.
- [ ] Executar `npm run audit:frontend-precedence:check`.

## Task 6 — Validar ausência de regressão e salvar o checkpoint

- [ ] Executar `npm run check`.
- [ ] Executar `npm run test:unit`.
- [ ] Executar `npm run audit:cycle-a`.
- [ ] Executar `npm run test:frontend-precedence`.
- [ ] Executar E2E dirigidos de Dashboard, Carteira, Pendências, modal, mobile e Excel.
- [ ] Executar `npm audit --audit-level=high` e `git diff --check`.
- [ ] Provar que o diff não contém arquivos funcionais, visuais, Supabase, Vercel ou workflows.
- [ ] Commitar documentação, ferramenta, testes e evidência em unidades rastreáveis.
- [ ] Publicar todos os commits no branch remoto e atualizar a PR em rascunho com resultados exatos.
- [ ] Não retirar a PR de rascunho, não fazer merge e não publicar produção sem revisão e autorização.

## Autorrevisão do plano

- O pacote mede o estado atual antes de propor consolidação.
- Nenhuma mudança visual ou funcional está incluída.
- A distinção entre contexto CSS e colisão na mesma condição evita falso positivo responsivo.
- A prova no navegador cobre o comportamento que a análise estática não consegue garantir.
- Escritores globais múltiplos tornam explícito o risco de reordenar wrappers.
- O próximo pacote somente poderá propor consolidação após interpretar os resultados e, se houver impacto visual, apresentar evidência visual prévia.
