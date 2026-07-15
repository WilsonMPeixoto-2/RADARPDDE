# Ciclo B3 — Interações compartilhadas Implementation Plan

> **Execução:** agente principal único, sem subagentes, com TDD, evidência visual e checkpoints no remoto.

**Goal:** substituir a desativação automática/nativa de controladora por uma escolha manual, acessível e transacional da nova responsável, iniciando a fundação compartilhada de feedback do RADAR.

**Architecture:** a UI compartilhada constrói e valida a decisão, mas delega a mutação ao `DirectoryService` existente. O módulo é carregado antes de `app.js`, reutiliza o contrato de modal atual e expõe funções puras testáveis em Node. Sucesso e erro usam regiões acessíveis não bloqueantes.

**Tech Stack:** JavaScript; CSS; Node test runner; Playwright Desktop Chromium; nenhuma dependência nova.

## Status de execução

| Tarefa | Estado |
|---|---|
| 1 — Auditar o fluxo e congelar preservações | concluída |
| 2 — Comparar alternativas e aprovar o desenho | concluída |
| 3 — Escrever testes vermelhos | concluída |
| 4 — Implementar o diálogo e o feedback compartilhado | concluída |
| 5 — Integrar o fluxo e a correção Érika Reis | concluída |
| 6 — Validar visual, regressões e gates globais | concluída |
| 7 — Salvar no remoto e abrir PR rascunho | em publicação |

## Restrições globais

- Partir da `main` remota em `1bdfb77a1ff2d8c21ce685ea2e5a8f9633b21a3b`.
- Não usar subagentes.
- Não mudar a transação do `DirectoryService` nem duplicar persistência na UI.
- Não alterar regras de bonificação, pendências, retificação, inventário ou Excel.
- Não implementar destinatária automática.
- Não redesenhar mobile neste pacote.
- Não instalar dependência sem problema comprovado.
- Não conectar Supabase remoto, alterar Vercel ou publicar produção.
- Salvar a entrega no branch remoto antes do encerramento.

## Mapa de arquivos

### Criar

- `src/integration/shared-interactions.js`;
- `src/styles/shared-interactions.css`;
- `tests/unit/shared-interactions.test.js`;
- `tests/e2e/shared-interactions.spec.js`;
- `docs/evidence/shared-interactions/*.png`;
- `design-qa.md`;
- esta especificação e este plano.

### Modificar

- `app.js` — integrar a decisão manual, feedback, foco e nome Érika Reis;
- `index.html` — carregar o módulo e o estilo antes do núcleo;
- `src/integration/modal-accessibility.js` — preservar `alertdialog`;
- `package.json` — incluir o módulo no gate de sintaxe;
- `docs/architecture/frontend-load-order.md` e manifesto de precedência — registrar a nova ordem;
- `docs/README.md` e backlog — indexar o pacote e marcar a fatia vertical.

## Task 1 — Auditar o fluxo e congelar preservações

- [x] confirmar a `main` remota e criar worktree limpo;
- [x] localizar `removerControlador` e `DirectoryService.deactivateController`;
- [x] comprovar que a transação já aceita destinatária explícita;
- [x] contar as 13 escolas de Alzira no estado inicial;
- [x] mapear foco, modal, feedback, persistência e auditoria existentes;
- [x] registrar o que deve ser preservado.

## Task 2 — Comparar alternativas e aprovar o desenho

- [x] apresentar as alternativas automática, bloqueada e escolha manual;
- [x] receber a aprovação da escolha manual;
- [x] corrigir a identidade para Érika Reis;
- [x] produzir a referência visual desktop;
- [x] obter autorização expressa para implementar.

## Task 3 — Escrever testes vermelhos

- [x] exigir API pura para modelo, validação, normalização e mensagem;
- [x] exigir exclusão do alvo e inativos;
- [x] exigir seleção quando existirem escolas;
- [x] exigir compatibilidade para carteira vazia;
- [x] exigir correção nominal sem mutar os demais registros;
- [x] executar os testes e confirmar falha pela API ainda inexistente;
- [x] criar E2E que falha contra a confirmação nativa anterior.

## Task 4 — Implementar o diálogo e o feedback compartilhado

- [x] criar funções puras e erros funcionais;
- [x] criar `alertdialog` sob demanda com rótulos e descrição;
- [x] iniciar o seletor vazio;
- [x] colocar foco inicial em Cancelar;
- [x] bloquear duplo envio e comunicar estado ocupado;
- [x] preservar escolha e diálogo na falha;
- [x] implementar região `status`/`alert` não bloqueante;
- [x] reutilizar tokens e componentes atuais;
- [x] preservar `role=alertdialog` na infraestrutura de modal.

## Task 5 — Integrar o fluxo e a correção Érika Reis

- [x] passar o acionador para restauração de foco;
- [x] remover o `confirm()` do fluxo de controladora;
- [x] encaminhar o identificador escolhido ao serviço existente;
- [x] renderizar somente depois de confirmação transacional;
- [x] informar resultado real e focar o título após sucesso;
- [x] corrigir a seed para `Érika Reis`;
- [x] normalizar somente os nomes legados `Érica`/`Erica` no id `erica`, sem reset de dados.

## Task 6 — Validar visual, regressões e gates globais

- [x] aprovar seis testes unitários dirigidos;
- [x] aprovar cancelamento, foco, seleção, transferência e histórico no E2E;
- [x] aprovar preservação do diálogo em falha controlada;
- [x] capturar a implementação no mesmo viewport e estado da referência;
- [x] comparar referência e implementação na mesma imagem;
- [x] registrar `design-qa.md` com resultado aprovado;
- [x] estabilizar a auditoria Axe para aguardar o fim da transição de opacidade, sem mudar o produto;
- [x] atualizar e verificar o manifesto de precedência;
- [x] executar `npm run check`;
- [x] aprovar 161 testes unitários, 1 teste de integração, auditoria funcional e artefatos do Ciclo A;
- [x] aprovar 2 testes de precedência e os 3 E2E dirigidos deste pacote;
- [x] executar E2E desktop completo: 66 aprovados e 12 saltos previstos por perfil/dispositivo;
- [x] executar `npm run test:readiness` com configuração local, artefatos e tipos aprovados;
- [x] executar `npm audit --audit-level=high` com zero vulnerabilidades e `git diff --check`;
- [x] revisar o diff integral e confirmar ausência de segredo e configuração remota.

## Task 7 — Salvar no remoto e abrir PR rascunho

- [ ] atualizar o status deste plano com resultados exatos;
- [ ] commitar somente arquivos intencionais;
- [ ] publicar `agent/interacoes-compartilhadas` no GitHub;
- [ ] abrir PR rascunho com situação anterior, evolução, resultado e gates;
- [ ] acompanhar os workflows do HEAD remoto;
- [ ] não fazer merge nem deployment sem nova autorização.

## Rollback

Reverter o PR restaura o `confirm()` anterior e a escolha automática sem tocar nos dados já persistidos. Como a mudança não altera schema nem formato de armazenamento, não há migração reversa. A normalização nominal é compatível e não apaga campos.

## Limite de conclusão

Este PR conclui o piloto de confirmação crítica e feedback compartilhado na Gestão de Equipe. Os demais `alert()`/`confirm()` continuam no backlog e devem ser convertidos por fluxos, após auditoria de regra, risco e desenho próprios.
