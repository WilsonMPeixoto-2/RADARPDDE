# Estratégia de testes e gates de qualidade

**Estado:** vigente  
**Atualizado em:** 7 de agosto de 2026

## 1. Princípio

> Nenhuma função crítica é aprovada apenas porque DOM, serviço ou banco funciona isoladamente.

```text
domínio e contratos
→ serviços e integrações
→ repositórios
→ banco, Auth, RLS, RPC e Edge Function
→ navegador
→ releitura após refresh
→ artefato publicado
→ monitoramento e integridade
→ UAT
```

Mutação crítica acrescenta concorrência, erro, falha parcial, rollback e compensação.

O baseline mutável do ambiente fica em [`../CURRENT_STAGE.md`](../CURRENT_STAGE.md).

## 2. Matriz funcional executável

```text
docs/reference/functional-contract-matrix.json
docs/reference/functional-contract-matrix/*.json
docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md
scripts/check-functional-contract-matrix.mjs
tests/unit/functional-contract-matrix.test.js
```

```bash
npm run generate:functional-matrix
npm run check:functional-matrix
```

O verificador confirma IDs, perfis, superfícies, permissões, âncoras, evidências, cobertura e contratos de releitura, concorrência e compensação.

Após a reconciliação pós-PR #162:

- 9 operações `covered`;
- 32 operações `partial`;
- 0 `gap`;
- 0 `decision`;
- 6 operações dependem do smoke autenticado de leitura;
- 25 dependem de escrita controlada e reversível;
- 5 permanecem em observação contínua;
- 5 apenas mantêm regressão.

## 3. Readiness

```bash
npm run test:readiness
```

Inclui sintaxe, matriz funcional, referências de workflows, vendors, lint, unitários, certificação Excel, integração, Supabase, tipos, artefatos e auditoria funcional.

Acesso real a Production permanece separado e protegido.

## 4. Unitários e integração

```bash
npm run test:unit
npm run test:integration
```

Toda correção funcional deve criar ou atualizar regressão capaz de falhar diante da reintrodução do defeito.

Coberturas centrais:

- competência e avaliação mensal;
- pendências, timeline e navegação;
- capacidades e autorização;
- serviços e UnitOfWork;
- runtime e certificação Excel;
- CORS, Auth e Gestão de Equipe;
- transições entre perfis da equipe;
- autorização de carteira escolar;
- criação de exercício e sincronização pós-reload;
- identidade institucional de escolas;
- edição patrimonial versionada e auditada;
- integridade nota/bem;
- sincronização de tentativas de pendência;
- auditoria obrigatória das exportações;
- importação e rollback;
- monitor geral e incidentes;
- auditoria de integridade;
- matriz funcional;
- proteção do smoke autenticado.

Regressões específicas do pacote de remediação incluem, entre outras:

- `tests/unit/school-service.test.js`;
- `tests/unit/school-form-integrity.test.js`;
- `tests/unit/school-institutional-identity-migration.test.js`;
- `tests/unit/configuration-service.test.js`;
- `tests/unit/inventory-service.test.js`;
- `tests/unit/excel-export-audit.test.js`;
- `tests/unit/functional-integrity-migration.test.js`;
- `supabase/tests/database/functional-integrity-remediation.test.sql`.

## 5. Supabase local

```bash
npm run supabase:start
npm run supabase:reset
npm run supabase:test:db
npm run supabase:lint:db
npm run supabase:gen:types
npm run typecheck:database
```

A contagem atual das migrations fica em `CURRENT_STAGE.md`; o gate deve sempre aplicar a árvore inteira do zero.

Requisitos:

- migrations em ordem;
- pgTAP por perfil e escopo;
- anônimo bloqueado;
- funções privilegiadas e grants mínimos;
- tipos alinhados;
- histórico reconciliado;
- dry-run e plano de reversão antes de aplicação remota.

## 6. Gates de remediação funcional

### Escolas

Comprovar:

- nova escola sem identidade institucional é rejeitada;
- valores institucionais informados são preservados;
- duplicidade de INEP, CNPJ e SICI é rejeitada;
- Controlador não altera identidade institucional nem `controller_id`;
- edição cadastral autorizada permanece funcional.

### Exercícios

Comprovar:

- exatamente doze competências;
- janeiro a dezembro do mesmo exercício;
- lote do novo exercício, sem enviar histórico inteiro à RPC;
- `row_version` obrigatório;
- conflito otimista;
- sincronização antes do primeiro render.

### Patrimônio e notas

Comprovar:

- `ASSET-02` usa `saveAssetWithLog`, versão esperada e log;
- somente o campo de edição rápida permitido é aceito;
- nota permanente que perde/troca `linked_asset_id` não deixa bem derivado órfão;
- criação, encaminhamento e inventariação preservam seus fluxos próprios.

### Pendências

Comprovar estado da pendência e da tentativa após tentativa, reanálise, cancelamento/reabertura e reload. O status persistido em `pendency_attempts` deve acompanhar o agregado canônico.

### Exportações

Comprovar:

- falha da auditoria inicial bloqueia o download;
- auditoria inicial bem-sucedida libera geração;
- conclusão é registrada;
- evento legado duplicado é neutralizado;
- falha da auditoria final é distinguida de falha de geração.

## 7. Backup e restauração

```bash
RADAR_ALLOW_DISPOSABLE_BACKUP_RESTORE=true npm run test:backup-restore
```

O workflow compara schema, dados, Auth e migrations entre pilhas descartáveis e não usa Production.

## 8. Excel

```bash
npm run certify:excel:fixture
```

O relatório institucional mantém contrato próprio. O Excel SME protege competência mensal, 27 colunas A:AA, designação textual, estilos, manifesto, assets, download, reabertura e homologação desktop após mudança material.

## 9. Playwright e dispositivos

```bash
npm run test:e2e
npm run test:mobile
```

Projetos mínimos:

- desktop Chromium;
- Pixel 7/Chromium;
- iPhone 15/WebKit.

Jornadas incluem login, perfis, competência, Dashboard, Carteira, Prontuário, Pendências, Inventário, Gestão SME, Gestão de Equipe, exportações, erros, foco e overflow.

## 10. Gate remoto descartável por perfil e viewport

`.github/workflows/gate-remoto-perfis-viewports.yml` usa Supabase descartável, identidades efêmeras e três viewports. Prova Auth/RLS e responsividade sem tocar Production.

## 11. Smoke autenticado de leitura em Production

Arquivos:

```text
.github/workflows/production-authenticated-read.yml
playwright.production-authenticated-read.config.js
tests/e2e/production-authenticated-read.spec.js
tests/support/production-authenticated-read.js
```

A infraestrutura foi integrada pelo PR #148, porém sua execução real permanece desativada até provisionamento específico.

Cobertura prevista:

- autenticação, restauração e logout;
- busca global autorizada;
- Dashboard;
- Carteira ou negativa correta para Inventário;
- Prontuário e timeline;
- Pendências.

Regras obrigatórias:

1. cinco contas técnicas dedicadas, nunca contas pessoais/operacionais;
2. execução real somente fora de pull requests;
3. segredo em arquivo temporário protegido e removido ao final;
4. trace, screenshot, vídeo e upload de artefatos desabilitados;
5. nenhuma service role no navegador;
6. falha imediata diante de mutação operacional;
7. erros sanitizados.

A ausência das contas técnicas é bloqueio deliberado de ativação, não falha da infraestrutura integrada.

## 12. Production

### Monitor geral

`.github/workflows/production-system-smoke.yml` verifica publicação, manifesto, shell, Auth gate, assets, bloqueio anônimo, preflight e incidentes.

### Integridade dos dados

`.github/workflows/production-data-integrity.yml` consulta vinte invariantes agregadas por função privilegiada e publica somente contagens sanitizadas.

### Leitura autenticada

Permanece desabilitada até autorização/provisionamento. Não alterar a cobertura da matriz como se estivesse ativa.

## 13. Auditoria funcional remanescente

O PR #156 contém testes e diagnósticos históricos, mas sua branch divergiu da `main`. Não executar seus workflows temporários como se fossem fonte atual sem primeiro avaliar compatibilidade.

Continuidade correta:

1. partir da `main` reconciliada;
2. identificar evidências ainda válidas da Task 5;
3. não repetir prova já absorvida por PR posterior sem motivo;
4. criar nova regressão apenas para falha atual comprovada;
5. atualizar a matriz quando a evidência realmente alterar o estado de cobertura.

## 14. Acessibilidade, desempenho e build

```bash
npm run audit:lighthouse
npm run audit:baseline
npm run audit:frontend-precedence:check
npm run test:frontend-precedence
npm run build:vercel
```

Validar teclado, foco, modais, equivalência mobile, ausência de overflow e piso de desempenho no mesmo SHA.

## 15. Dependências

```bash
npm run lint
npm run analyze:unused
npm run check:team-account-function
```

Atualização exige PR isolado, versão fixada, changelog, lockfile e gates afetados.

## 16. Mesmo SHA

Antes de declarar conclusão:

1. fixar SHA candidato;
2. executar gates nesse SHA;
3. confirmar que a branch não mudou;
4. verificar checks;
5. publicar somente o commit aprovado;
6. repetir smokes após Production quando houver impacto.

## 17. Gates externos/remanescentes

- continuar auditoria funcional a partir da `main` atual;
- executar as provas controladas das operações `partial`;
- decidir se serão provisionadas as cinco contas técnicas do smoke;
- verificar a tela de detalhes da escola;
- UAT com usuários reais;
- homologação humana de artefatos quando aplicável;
- decisão formal de liberação.
