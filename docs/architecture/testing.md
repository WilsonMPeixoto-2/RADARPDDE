# Estratégia de testes e gates de qualidade

**Estado:** vigente  
**Atualizado em:** 5 de agosto de 2026

## 1. Princípio

> Nenhuma função crítica é aprovada apenas porque o DOM, o serviço ou o banco funciona isoladamente.

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

Mutação crítica acrescenta conflito, falha parcial, rollback e compensação.

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

O verificador confirma:

- IDs únicos;
- perfis e superfícies conhecidos;
- classificação integral entre permitido e negado;
- arquivos e símbolos existentes;
- evidências versionadas;
- coerência entre cobertura e lacunas;
- releitura, concorrência e compensação nas mutações P0/P1;
- correspondência exata entre JSON e Markdown gerado.

Toda mudança funcional material deve atualizar a operação correspondente.

## 3. Readiness

```bash
npm run test:readiness
```

Inclui sintaxe, matriz funcional, referências de workflows, vendors, lint, unitários, certificação Excel, integração, Supabase, tipos, artefatos e auditoria funcional.

## 4. Unitários e integração

```bash
npm run test:unit
npm run test:integration
```

Toda correção deve criar regressão que falha antes e passa depois.

Coberturas centrais:

- competência e avaliação mensal;
- pendências, timeline e navegação;
- capacidades e autorização;
- serviços e unidade de trabalho;
- runtime e certificação Excel;
- CORS, Auth e Gestão de Equipe;
- importação e rollback;
- monitor geral e incidentes;
- auditoria de integridade;
- matriz funcional.

## 5. Supabase local

```bash
npm run supabase:start
npm run supabase:reset
npm run supabase:test:db
npm run supabase:lint:db
npm run supabase:gen:types
npm run typecheck:database
```

Na `main` e em Production existem 26 migrations. A última cria `radar_private.production_integrity_check()` e permanece restrita ao contexto administrativo apropriado.

Requisitos:

- migrations do zero;
- pgTAP por perfil e escopo;
- anônimo bloqueado;
- funções privilegiadas e grants;
- tipos alinhados;
- histórico reconciliado;
- dry-run e reversão antes de aplicação.

## 6. Backup e restauração

```bash
RADAR_ALLOW_DISPOSABLE_BACKUP_RESTORE=true npm run test:backup-restore
```

O workflow `backup-restore-disposable.yml` compara schema, dados, Auth e migrations entre pilhas descartáveis e não usa Production.

## 7. Excel

```bash
npm run certify:excel:fixture
```

O relatório institucional mantém equivalência com CSV e certificação OOXML. O Excel SME protege competência mensal, 27 colunas A:AA, designação textual, estilos, manifesto, assets, download, reabertura e homologação desktop quando houver alteração material.

## 8. Playwright e dispositivos

```bash
npm run test:e2e
npm run test:mobile
```

Projetos mínimos:

- desktop Chromium;
- Pixel 7/Chromium;
- iPhone 15/WebKit.

Jornadas incluem login, perfis, competência, Dashboard, Carteira, Prontuário, Pendências, Inventário, Gestão SME, Gestão de Equipe, exportações, erros, foco e overflow.

## 9. Gate remoto por perfil e viewport

`.github/workflows/gate-remoto-perfis-viewports.yml` usa Supabase descartável, identidades efêmeras e três viewports. Não substitui smoke autenticado recorrente em Production.

## 10. Contrato ponta a ponta

Cada operação P0/P1 deve comprovar, conforme a matriz:

1. perfil autorizado e perfil negado;
2. controle visível e acionável;
3. payload correto;
4. serviço e repositório esperados;
5. backend alcançado;
6. estado no banco;
7. resposta e renderização;
8. persistência após recarregar;
9. conflito de versão;
10. falha parcial e compensação;
11. mensagem funcional.

A matriz atual classifica:

- 6 operações para smoke autenticado de leitura;
- 23 para escrita controlada e reversível;
- 2 para decisão funcional;
- 5 para observação contínua;
- 5 sem nova prova imediata.

## 11. Production

### Monitor geral

`.github/workflows/production-system-smoke.yml` verifica SHA, manifesto, shell, Auth gate, assets, bloqueio anônimo, preflight e incidentes.

### Integridade dos dados

`.github/workflows/production-data-integrity.yml` consulta vinte invariantes agregadas pela função privada `radar_private.production_integrity_check()` e publica somente contagens sanitizadas.

Essas camadas não executam todas as jornadas autenticadas nem mutações.

## 12. Acessibilidade, desempenho e build

```bash
npm run audit:lighthouse
npm run audit:baseline
npm run audit:frontend-precedence:check
npm run test:frontend-precedence
npm run build:vercel
```

Validar teclado, foco, modais, equivalência mobile, ausência de overflow e piso de desempenho no mesmo SHA.

## 13. Dependências

```bash
npm run lint
npm run analyze:unused
npm run check:team-account-function
```

Atualização exige PR isolado, versão fixada, changelog, lockfile e gates afetados.

## 14. Mesmo SHA

Antes de declarar conclusão:

1. fixar SHA candidato;
2. executar gates nesse SHA;
3. confirmar que a branch não mudou;
4. verificar checks;
5. publicar somente o commit aprovado;
6. repetir smokes após Production.

## 15. Gates externos

- integração autorizada da matriz;
- smoke autenticado de leitura;
- escrita controlada e compensação;
- decisão sobre programas SME;
- correção de `ASSET-02`;
- UAT;
- homologação humana quando aplicável;
- decisão formal de liberação.
