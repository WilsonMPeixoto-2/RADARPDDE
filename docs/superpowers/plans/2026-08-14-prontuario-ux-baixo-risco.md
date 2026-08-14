# Prontuário UX de Baixo Risco — Plano de Implementação

**Objetivo:** aproximar o checkbox de envio à Assessoria da respectiva NF e melhorar a separação visual entre programas sem alterar regras de negócio ou persistência.

**Baseline:** `9e584f199e21d3749be01e4fe92a3bea6ce0bbea`  
**Branch:** `feat/prontuario-ux-baixo-risco-20260814`  
**PR:** `#177`

## Adaptação arquitetural após exploração

O plano inicial previa editar `app.js` e `styles.css`. A inspeção do repositório mostrou uma alternativa mais segura já prevista pela arquitetura: a cadeia `product-extensions-bootstrap.js` para extensões pós-`app.js`.

Por isso, a implementação foi isolada em:

- `src/integration/prontuario-operational-ux.js`;
- `src/styles/prontuario-operational-ux.css`;
- `src/integration/product-extensions-bootstrap.js`;
- `tests/e2e/prontuario-ux-baixo-risco.spec.js`.

`app.js`, serviços, domínio e banco permanecem intactos.

## Restrições

- não alterar schema, migrations, RPCs, RLS, Auth, Excel ou serviços de domínio;
- preservar `toggleInvoiceAdvisorySent()` e a persistência individual por NF;
- preservar análise técnica individual e resumo mensal automático;
- manter identidade visual vigente;
- não duplicar o checkbox: mover o elemento existente no DOM;
- aplicar TDD e comparar eventuais falhas globais com a baseline.

## Task 1 — Contrato E2E antes da produção

- [x] Criar `tests/e2e/prontuario-ux-baixo-risco.spec.js`.
- [x] Proteger a exigência de que cada checkbox fique dentro da caixa da NF correspondente.
- [x] Proteger a permanência dos selects individuais de análise na linha Consulta Assessoria.
- [x] Proteger o resumo mensal agregado.
- [x] Proteger marcadores visuais distintos para cada programa.
- [x] Observar RED antes da implementação: ausência de `program-block-start` confirmada; fixture auxiliar corrigido sem tocar em produção.

## Task 2 — Extensão de apresentação do Prontuário

- [x] Criar `src/integration/prontuario-operational-ux.js`.
- [x] Envolver `renderProntuario` preservando função anterior, argumentos e retorno.
- [x] Identificar os grupos de programa pela célula `rowspan` já renderizada.
- [x] Acrescentar classes de início/contexto de programa sem estado paralelo.
- [x] Localizar a NF por número exato e mover o `<label>`/checkbox já existente para a caixa da NF.
- [x] Preservar o `aria-label`, `onchange`, estado `checked` e análise técnica individual.
- [x] Garantir associação visual um-para-um mesmo se houver números de NF repetidos.

## Task 3 — Estilos isolados

- [x] Criar `src/styles/prontuario-operational-ux.css`.
- [x] Aplicar borda superior, fundo sutil e hierarquia tipográfica ao início de programa.
- [x] Organizar a caixa de NF em grid com o controle de Assessoria ao lado.
- [x] Adaptar a caixa para viewport estreito sem esconder conteúdo.

## Task 4 — Cadeia oficial de carregamento

- [x] Acrescentar o CSS à lista de extensões de produto.
- [x] Carregar `prontuario-operational-ux.js` por último, depois dos wrappers já existentes.
- [x] Atualizar `docs/architecture/product-extensions-load-order.md`.

## Task 5 — Validação e integração

- [ ] Confirmar GREEN dos dois cenários focados na CI.
- [ ] Confirmar que os gates materiais não introduziram nova regressão em relação à baseline.
- [x] Revisar o diff do PR #177 e confirmar ausência de mudanças em serviços, migrations, schema e persistência.
- [x] Fazer code review do pacote e corrigir a associação um-para-um entre NF e controle de Assessoria.
- [ ] Marcar PR como pronto, integrar na `main` e registrar o merge SHA.
- [ ] Confirmar deployment Vercel `READY`, `target=production` e alias `radarpdde-fix.vercel.app`.
- [ ] Confirmar no conteúdo servido em Production que a nova extensão e o CSS estão carregados.

## Critério de conclusão

A tarefa termina somente depois de validação fresca, merge na `main` e confirmação do SHA em Production. Falhas preexistentes de suites amplas devem ser documentadas e comparadas com a baseline, não mascaradas nem transformadas em refatoração fora do escopo.