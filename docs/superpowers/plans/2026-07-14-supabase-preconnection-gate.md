# Gate de Pré-conexão Supabase — Plano de Implementação

> **Para execução agêntica:** SUB-SKILL OBRIGATÓRIA: usar `superpowers:executing-plans` e executar uma tarefa por vez. Por determinação expressa do usuário, subagentes são proibidos nesta execução. Os passos usam caixas de seleção (`- [ ]`) para rastreamento.

**Objetivo:** Fazer todo o RADAR PDDE operar por serviços de aplicação e um contrato único de persistência, mantendo `localStorage` como backend padrão, e comprovar o mesmo frontend contra Supabase local com Auth e RLS antes de existir qualquer projeto remoto.

**Arquitetura:** Os handlers existentes permanecem como controladores de interface, mas deixam de persistir diretamente. Serviços de domínio executam mutações dentro de uma unidade de trabalho; um `state port` traduz entre o estado legado e o snapshot canônico, e a factory escolhe `LocalStorageRepository` ou `SupabaseRepository`. O modo padrão continua local, sem credenciais e sem rede; o modo Supabase local é ativado apenas por configuração pública gerada e testada.

**Stack:** JavaScript clássico no navegador, Node.js 24, Node test runner, Playwright 1.61.1, Supabase CLI 2.109.1, PostgreSQL 17, `@supabase/supabase-js` 2.110.5, TypeScript 7.0.2 somente para verificar tipos gerados, pgTAP e Vercel estático.

## Restrições globais

- `main` e produção não serão alteradas durante a execução.
- O PR 22 permanecerá em rascunho até autorização expressa.
- O modo versionado padrão continuará `local`, sem URL, chave ou requisição Supabase.
- Nenhuma credencial real, `service_role`, `sb_secret_*`, senha de banco ou token administrativo poderá entrar no GitHub, logs ou navegador.
- Nenhuma regra de bonificação, análise, pendência, retificação, inventário, Excel, tela, botão, coluna, texto ou estética aprovada poderá mudar.
- O armazenamento local e o rollback continuarão disponíveis após a futura ativação.
- Nenhum seed será disparado automaticamente porque uma tabela está vazia.
- Tabelas expostas à Data API terão `GRANT` explícito mínimo e RLS; `anon` não receberá acesso aos dados institucionais.
- Funções privilegiadas terão privilégios revogados de `PUBLIC`; `SECURITY DEFINER` somente quando indispensável, com `search_path` fixo e verificação de identidade.
- Cada tarefa começa com teste que demonstra a lacuna e termina com validação focada antes da próxima.

---

### Tarefa 1: Gateway de persistência e unidade de trabalho

**Arquivos:**
- Criar: `src/application/error-mapper.js`
- Criar: `src/application/state-port.js`
- Criar: `src/application/unit-of-work.js`
- Criar: `src/application/data-service.js`
- Modificar: `src/data/repository-contract.js`
- Modificar: `src/data/local-storage-repository.js`
- Modificar: `src/data/supabase-repository.js`
- Modificar: `src/data/repository-factory.js`
- Testar: `tests/unit/application-data-service.test.js`
- Testar: `tests/unit/repository-contract-equivalence.test.js`

**Interfaces:**
- `createStatePort({ storage, bridge, readMemory, writeMemory, dataVersion, pendencySchemaVersion })` produz `capture()`, `exportCanonical()`, `applyCanonical(snapshot)` e `restore(capture)`.
- `UnitOfWork.run({ name, changedEntities, mutate, persist })` captura estado, executa a regra, persiste e restaura memória/armazenamento em qualquer falha.
- `DataService.bootstrap()` importa o legado uma única vez quando o repositório canônico local estiver vazio e nunca semeia um banco remoto.
- `DataService.execute(command)` retorna `{ ok, value, snapshot }` ou lança `RepositoryError` categorizado.
- Os dois repositórios implementam `load`, `save`, `remove`, `exportSnapshot`, `restoreSnapshot`, `healthCheck` e `capabilities` equivalentes.

- [x] Escrever testes de contrato para bootstrap idempotente, clonagem, exclusões, rollback, falha de gravação e equivalência dos dois adaptadores simulados.
- [x] Executar `node --test tests/unit/application-data-service.test.js tests/unit/repository-contract-equivalence.test.js` e confirmar falha pelas APIs ausentes.
- [x] Implementar `error-mapper.js` com os códigos `NETWORK_UNAVAILABLE`, `SESSION_EXPIRED`, `PERMISSION_DENIED`, `OPTIMISTIC_CONFLICT`, `VALIDATION_FAILED`, `TRANSACTION_FAILED`, `REMOTE_UNAVAILABLE` e `IMPORT_RECONCILIATION_FAILED`.
- [x] Implementar o `state-port` usando exclusivamente `RadarStateBridge` para ida e volta, preservando memória e todas as chaves `radar_pdde_*`.
- [x] Implementar unidade de trabalho com snapshot anterior e rollback determinístico.
- [x] Implementar `DataService` e ampliar o contrato/capabilities sem ativar Supabase.
- [x] Executar os testes focados e `npm run test:readiness`.
- [x] Commitar como `feat: criar gateway unico de persistencia`.

### Tarefa 2: Bootstrap único e remoção definitiva da integração legada

**Arquivos:**
- Modificar: `app.js:4390-4709`
- Modificar: `config.js`
- Modificar: `index.html`
- Testar: `tests/unit/legacy-supabase-removal.test.js`
- Testar: `tests/e2e/supabase-local-mode.spec.js`

**Interfaces:**
- `initializeRadarData()` cria cliente somente quando `RADAR_PDDE_CONFIG.supabase.connectionEnabled === true`, instancia a factory e chama `DataService.bootstrap()`.
- `persist()` permanece temporariamente como adaptador de compatibilidade, mas delega ao `DataService`; não usa `localStorage` nem `supabase.from()` diretamente.
- Os módulos críticos passam a ser scripts estáticos ordenados antes de `app.js`; o carregador dinâmico continua apenas para extensões visuais/funcionais que não participam do bootstrap.

- [x] Escrever teste que falhe enquanto `app.js` contiver tabelas antigas (`config`, `escolas`, `pendencias`, `notas_registradas`), `seedDatabaseSupabase` ou `persistSingleTableSupabase`.
- [x] Escrever E2E que confirme inicialização local pelo gateway e zero requisições `/rest/v1` e `/auth/v1`.
- [x] Remover criação direta do cliente, leituras/upserts diretos, sincronização silenciosa e seed automático de `app.js`.
- [x] Substituir `initData()` por bootstrap pelo serviço e hidratação explícita do estado legado para a interface.
- [x] Fazer `persist()` delegar ao gateway e emitir erro observável, nunca apenas `console.error`.
- [x] Executar `node --test tests/unit/legacy-supabase-removal.test.js` e o E2E focado.
- [x] Commitar como `refactor: remover integracao Supabase legada`.

### Tarefa 3: Serviços de configurações, cadastros e escolas

**Arquivos:**
- Criar: `src/application/configuration-service.js`
- Criar: `src/application/directory-service.js`
- Criar: `src/application/school-service.js`
- Modificar: `app.js:9337-9377`
- Modificar: `app.js:11075-11186`
- Modificar: `app.js:11535-11749`
- Modificar: `src/integration/exercise-management.js`
- Testar: `tests/unit/configuration-service.test.js`
- Testar: `tests/unit/school-service.test.js`
- Testar: `tests/e2e/exercise-management.spec.js`

**Interfaces:**
- `ConfigurationService.saveCalendar(input)` e `createExercise(input)` preservam exatamente as regras atuais e auditam a alteração.
- `DirectoryService.saveProgram/saveController/saveInventoryMember/deactivate*` prefere desativação lógica e bloqueia remoção referenciada.
- `SchoolService.saveSchool(input)`, `assignController(input)` e `bulkAssignController(input)` atualizam escola e vínculos de programas na mesma unidade de trabalho.

- [ ] Escrever testes com os mesmos dados e resultados atuais para calendário, doze competências, programa, controlador, inventariador, edição de escola e atribuição em lote.
- [ ] Executar os testes e confirmar falha antes da delegação.
- [ ] Mover validação e mutação institucional para os três serviços; handlers ficam responsáveis apenas por DOM, mensagens e renderização.
- [ ] Substituir chamadas diretas a `persist()` nesses fluxos por `await` aos serviços.
- [ ] Garantir que falha mantenha o formulário aberto e restaure estado/memória.
- [ ] Executar testes unitários, `exercise-management.spec.js` e `frontend-contract.spec.js`.
- [ ] Commitar como `refactor: integrar cadastros ao gateway de dados`.

### Tarefa 4: Serviços de verificações, pendências, contatos e retificações

**Arquivos:**
- Criar: `src/application/verification-service.js`
- Criar: `src/application/pendency-service.js`
- Modificar: `app.js:8100-9200`
- Modificar: `app.js:10124-10299`
- Modificar: `app.js:10740-11018`
- Modificar: `src/integration/task-10-11-pendency-actions.js`
- Modificar: `src/integration/task-12-13-retificacoes.js`
- Testar: `tests/unit/verification-service.test.js`
- Testar: `tests/unit/pendency-service.test.js`
- Testar: `tests/e2e/pendency-cycle.spec.js`

**Interfaces:**
- `VerificationService.setBonification`, `setTechnicalAnalysis`, `setSubmission`, `closeBonification` e `retify` preservam os cálculos existentes.
- `PendencyService.open`, `registerAttempt`, `reanalyze`, `resolve`, `cancel`, `reopen` e `registerContact` atualizam pendência, tentativa, verificação e log atomicamente.

- [ ] Criar testes de caracterização para todos os quatro estados canônicos, tentativa numerada, erros múltiplos, novo envio, reanálise, cancelamento, reabertura e retificação.
- [ ] Confirmar que os testes falham enquanto os handlers alterarem diretamente as raízes globais.
- [ ] Implementar serviços usando `RadarPendencias`, `RadarRetificacoes` e regras existentes como fonte, sem duplicar lógica.
- [ ] Converter handlers para `async`, aguardar o serviço antes de fechar modal e conservar foco/contexto em falhas.
- [ ] Remover persistências internas paralelas das integrações e centralizar auditoria na unidade de trabalho.
- [ ] Executar testes unitários e E2E de pendências/retificações.
- [ ] Commitar como `refactor: integrar pendencias ao gateway de dados`.

### Tarefa 5: Serviços de notas, bens, inventário e logs

**Arquivos:**
- Criar: `src/application/invoice-service.js`
- Criar: `src/application/inventory-service.js`
- Criar: `src/application/audit-service.js`
- Modificar: `src/data/supabase-repository.js`
- Modificar: `app.js:10320-10704`
- Modificar: `app.js:4711-4725`
- Testar: `tests/unit/invoice-service.test.js`
- Testar: `tests/unit/inventory-service.test.js`
- Testar: `tests/e2e/functional-core.spec.js`

**Interfaces:**
- `InvoiceService.save/remove` usa transação local no adaptador local e RPCs `save_invoice_with_effects`/`delete_invoice_with_effects` no adaptador Supabase.
- `InventoryService.updateAsset/forward/inventory` preserva responsável, data, processo, observações e vínculos.
- `AuditService.record(event)` participa da mesma unidade de trabalho; `registerLog` deixa de iniciar persistência aninhada.

- [ ] Escrever testes para notas de consumo, serviço e permanente, edição, remoção, bem derivado, verificação derivada, concorrência e rollback.
- [ ] Executar os testes e confirmar falha antes dos serviços.
- [ ] Implementar RPC no repositório Supabase e transação equivalente no local.
- [ ] Migrar handlers e tornar logs parte do commit único.
- [ ] Executar unitários, E2E funcional e testes existentes das RPCs.
- [ ] Commitar como `refactor: integrar notas e inventario ao gateway`.

### Tarefa 6: Configuração pública gerada e verificação de tipos

**Arquivos:**
- Criar: `config.runtime.js`
- Criar: `scripts/generate-runtime-config.mjs`
- Criar: `tsconfig.database-types.json`
- Modificar: `config.js`
- Modificar: `index.html`
- Modificar: `package.json`
- Modificar: `package-lock.json`
- Modificar: `scripts/check-generated-artifacts.js`
- Testar: `tests/unit/runtime-config-generation.test.js`

**Interfaces:**
- `config.runtime.js` define apenas `window.RADAR_PDDE_RUNTIME_INPUT`.
- O gerador aceita somente variáveis públicas `RADAR_DATA_MODE`, `RADAR_SUPABASE_URL`, `RADAR_SUPABASE_PUBLISHABLE_KEY`, `RADAR_SUPABASE_REPOSITORY_ENABLED`, `RADAR_ENVIRONMENT` e autorização explícita de produção.
- `npm run typecheck:database` executa `tsc -p tsconfig.database-types.json --noEmit` sobre os tipos gerados.

- [ ] Escrever testes para saída local determinística, rejeição de segredos e bloqueio de produção.
- [ ] Atualizar `@supabase/supabase-js` de `2.110.3` para `2.110.5` e adicionar `typescript` `7.0.2`, preservando lockfile.
- [ ] Implementar o gerador sem imprimir valores de chaves e manter o arquivo versionado em modo local seguro.
- [ ] Fazer `config.js` consumir exclusivamente a entrada pública e remover `legacyAppBridgeEnabled`.
- [ ] Adicionar verificação de tipos e artefatos ao CI/readiness.
- [ ] Executar testes, `npm audit`, build do cliente e typecheck.
- [ ] Commitar como `build: gerar configuracao publica segura`.

### Tarefa 7: Auth e RLS reais na pilha local, com exposição explícita da Data API

**Arquivos:**
- Criar: `src/auth/session-service.js`
- Criar: `src/integration/auth-gate.js`
- Modificar: `index.html`
- Modificar: `styles.css`
- Modificar: `supabase/config.toml`
- Criar via `npx supabase migration new preconnection_auth_and_api_grants`: migration CLI para grants e endurecimento.
- Criar: `supabase/seed.sql`
- Modificar: `supabase/tests/database/rls.test.sql`
- Criar: `tests/unit/session-service.test.js`
- Criar: `tests/e2e/supabase-auth-local.spec.js`

**Interfaces:**
- `SessionService.initialize/signIn/signOut/restore/getAuthorizationContext` usa Supabase Auth e lê perfil/escopos sujeitos a RLS.
- O seletor simulado permanece apenas em `dataMode: local`; no modo Supabase o perfil vem da sessão.
- A migration revoga defaults, concede privilégios mínimos a `authenticated`, nenhum privilégio institucional a `anon`, e mantém RLS em todas as tabelas expostas.

- [ ] Descobrir comandos com `npx supabase --help` e `npx supabase migration new --help`; criar a migration somente pela CLI.
- [ ] Escrever testes de sessão, usuário inativo, sem perfil, perfil único, leitura, escrita e negações.
- [ ] Implementar serviço de sessão e gate de login apenas para modo Supabase.
- [ ] Criar cinco identidades locais determinísticas sem expor senha fora dos fixtures de teste e vinculá-las aos cinco perfis.
- [ ] Aplicar grants explícitos e testar `anon` negado, `authenticated` condicionado por RLS e RPCs com `EXECUTE` mínimo.
- [ ] Executar reset local, pgTAP e E2E de Auth/RLS.
- [ ] Commitar como `feat: homologar auth e RLS localmente`.

### Tarefa 8: JSONB, transações restantes e UX padronizada de falhas

**Arquivos:**
- Criar: `src/domain/json-contracts.js`
- Criar via `npx supabase migration new preconnection_transactions_and_json_contracts`: migration CLI para validações/RPCs.
- Modificar: `src/application/error-mapper.js`
- Modificar: `src/integration/modal-accessibility.js`
- Criar: `tests/unit/json-contracts.test.js`
- Criar: `supabase/tests/database/json-contracts.test.sql`
- Criar: `supabase/tests/database/operations-rpc.test.sql`
- Criar: `tests/e2e/data-error-ux.spec.js`

**Interfaces:**
- Validadores cobrem bonificação, análise, erros, tentativas, cancelamento, resolução, retificação, auditoria e compatibilidade.
- RPCs atômicas cobrem exercício+12 competências, escola+programas e reanálise+pendência+verificação.
- `showDataOperationError(error, context)` preserva formulário/foco e apresenta mensagem funcional para cada código obrigatório.

- [ ] Criar testes JS/SQL que rejeitem payloads inválidos sem rejeitar registros legados válidos.
- [ ] Criar migrations somente pela CLI e implementar funções `SECURITY INVOKER` quando possível.
- [ ] Ligar operações compostas dos serviços às RPCs/capabilities.
- [ ] Implementar UX para rede, sessão, RLS, conflito, validação, transação e indisponibilidade remota.
- [ ] Executar unitários, pgTAP, lint e E2E de erros.
- [ ] Commitar como `feat: validar contratos e falhas de dados`.

### Tarefa 9: Importador operacional, reconciliação, retomada e rollback

**Arquivos:**
- Criar: `src/data/import-coordinator.js`
- Criar: `scripts/migration-cli.mjs`
- Modificar: `src/data/snapshot-tools.js`
- Modificar: `src/data/supabase-repository.js`
- Criar: `tests/unit/import-coordinator.test.js`
- Criar: `tests/integration/local-migration-flow.test.js`
- Modificar: `package.json`
- Modificar: `docs/runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md`

**Interfaces:**
- Comandos: `migration:plan`, `migration:validate`, `migration:dry-run`, `migration:import:local`, `migration:reconcile` e `migration:rollback`.
- Relatório contém hash SHA-256, contagens, rejeições, diferenças, `importId`, lotes concluídos e estado de retomada, sem dados sensíveis integrais.

- [ ] Escrever testes para validação referencial, ordem de dependência, idempotência, interrupção, retomada, diferença e rollback.
- [ ] Implementar coordenador sem seed implícito e bloquear promoção quando reconciliação falhar.
- [ ] Implementar CLI sem imprimir registros completos ou credenciais.
- [ ] Executar fluxo completo contra LocalStorageRepository e Supabase local, inclusive falha induzida e retomada.
- [ ] Atualizar runbook com comandos e evidências.
- [ ] Commitar como `feat: concluir migracao reversivel de dados`.

### Tarefa 10: Equivalência integral, E2E Supabase local e encerramento do Gate

**Arquivos:**
- Criar: `tests/e2e/supabase-full-contract.spec.js`
- Modificar: `playwright.config.js`
- Modificar: `.github/workflows/supabase-readiness.yml`
- Modificar: `scripts/audit-functional-persistence.js`
- Modificar: `docs/reference/SUPABASE_FUNCTIONAL_COVERAGE.md`
- Modificar: `docs/reference/SUPABASE_INTEGRATION_AUDIT.md`
- Modificar: `docs/architecture/supabase-readiness.md`
- Modificar: `README.md`

**Interfaces:**
- O workflow sobe Supabase local, gera configuração pública local, inicia o frontend, executa E2E, restaura configuração local segura e falha se houver segredo ou divergência gerada.
- A auditoria falha se handler mutante não delegar a um serviço ou se `app.js` gravar diretamente dados institucionais.

- [ ] Cobrir os cinco perfis, escopos, escola, exercício, verificação, pendência completa, contato, três tipos de nota, inventário, conflito, sessão expirada, rede indisponível, logout e restauração.
- [ ] Executar o mesmo contrato funcional nos dois adaptadores e comparar snapshots canônicos.
- [ ] Executar `npm run test:readiness`, reset/migrations, pgTAP, lint, types, Playwright desktop/Android/iPhone e `npm audit`.
- [ ] Fazer revisão integral do diff e corrigir qualquer regressão, permissão excessiva ou caminho direto de persistência.
- [ ] Atualizar documentação e descrição do PR 22 com HEAD/testes reais.
- [ ] Criar exatamente um Preview manual, verificar HTTP, console, runtime e ausência de conexão remota no modo publicado.
- [ ] Manter PR em rascunho e não fazer merge nem promover produção sem autorização expressa.
