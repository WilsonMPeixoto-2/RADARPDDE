# Estratégia de testes e gates de qualidade

**Estado:** vigente  
**Atualizado em:** 5 de agosto de 2026

## 1. Objetivo

Garantir regras de negócio, persistência, autorização, acessibilidade, responsividade, relatórios, recuperabilidade e operação remota.

> Nenhuma função crítica é aprovada apenas porque o DOM, o serviço ou o banco funciona isoladamente.

## 2. Percurso de confiança

```text
domínio e contratos
→ serviços e integrações
→ repositórios
→ banco, Auth, RLS, RPC e Edge Function
→ navegador
→ releitura após refresh
→ artefato publicado
→ monitor de Production
→ UAT
```

Mutação crítica acrescenta conflito, falha parcial, rollback e compensação.

## 3. Runtime

Node.js está fixado em `24.x` no projeto, lockfile, arquivos de versão, workflows e Vercel.

## 4. Matriz funcional executável

Fontes:

```text
docs/reference/functional-contract-matrix.json
docs/reference/functional-contract-matrix/*.json
docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md
scripts/check-functional-contract-matrix.mjs
tests/unit/functional-contract-matrix.test.js
```

Comandos:

```bash
npm run generate:functional-matrix
npm run check:functional-matrix
```

O verificador confirma:

- IDs únicos;
- perfis e superfícies conhecidos;
- classificação integral entre permitido e negado;
- arquivos e símbolos de código existentes;
- evidências versionadas existentes;
- coerência entre cobertura e lacunas;
- releitura, concorrência e compensação nas mutações P0/P1;
- correspondência exata entre JSON e Markdown gerado.

Toda mudança funcional material deve atualizar a operação correspondente. O readiness falha quando a matriz diverge.

## 5. Readiness principal

```bash
npm run test:readiness
```

Inclui:

- sintaxe;
- matriz funcional;
- referências de workflows;
- bundles e vendors;
- lint de segurança e E2E;
- testes unitários e integração;
- certificação Excel;
- Supabase e tipos;
- artefatos gerados;
- auditoria funcional.

Readiness é necessário, mas não substitui E2E, banco local, Preview, Production smoke ou homologação humana.

## 6. Unitários e integração

```bash
npm run test:unit
npm run test:integration
```

Toda correção deve criar caso que falha antes e passa depois.

Coberturas centrais:

- competência e avaliação mensal;
- pendências, timeline e navegação;
- capacidades e autorização;
- serviços e unidade de trabalho;
- modelos e runtime Excel;
- CORS e classificação de erros;
- Gestão de Equipe e compensação;
- importação e rollback;
- monitoramento de Production;
- integridade da matriz funcional.

## 7. Supabase local

```bash
npm run supabase:start
npm run supabase:reset
npm run supabase:test:db
npm run supabase:lint:db
npm run supabase:gen:types
npm run typecheck:database
```

Production possui 25 migrations. Branch com migration adicional declara a própria contagem sem reescrever o estado remoto antes da aplicação.

Requisitos:

- migrations do zero;
- pgTAP por perfil e escopo;
- anônimo bloqueado;
- funções privilegiadas e grants;
- tipos alinhados;
- histórico reconciliado;
- dry-run e reversão antes de aplicação.

## 8. Backup e restauração

```bash
RADAR_ALLOW_DISPOSABLE_BACKUP_RESTORE=true npm run test:backup-restore
```

Workflow:

```text
.github/workflows/backup-restore-disposable.yml
```

Compara schema, dados, Auth e migrations entre duas pilhas descartáveis. Não usa Production.

## 9. Excel

```bash
npm run certify:excel:fixture
```

### Institucional

- quatro abas;
- equivalência com CSV;
- células, fórmulas e OOXML.

### SME

- competência mensal única;
- 27 colunas A:AA;
- ausência de K, R e Y no produto final;
- designação textual;
- bordas, alinhamento, filtro, impressão e congelamento;
- manifesto e assets;
- download e reabertura;
- homologação no Microsoft Excel desktop quando houver alteração material.

## 10. Playwright

```bash
npm run test:e2e
npm run test:mobile
```

Projetos mínimos:

- desktop Chromium;
- Pixel 7/Chromium;
- iPhone 15/WebKit.

Jornadas incluem login, perfis, competência, Dashboard, Carteira, Prontuário, Pendências, Inventário, Gestão SME, Gestão de Equipe, exportações, erros, foco e overflow.

## 11. Gate remoto por perfil e viewport

```text
.github/workflows/gate-remoto-perfis-viewports.yml
```

Usa Supabase descartável, identidades efêmeras e três viewports. Prova Auth/RLS e organização da interface sem usar Production.

Não substitui smoke autenticado recorrente no ambiente publicado.

## 12. Contrato ponta a ponta

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
- 4 sem nova prova imediata.

## 13. Monitor de Production

```text
.github/workflows/production-system-smoke.yml
```

Executa após `push` na `main`, a cada hora e manualmente. Verifica SHA, manifesto, shell, Auth gate, assets, bloqueio anônimo, preflight e incidente automático.

O monitor não executa todas as jornadas autenticadas.

## 14. Acessibilidade e responsividade

- teclado, foco e retorno;
- modais e anúncios;
- nomes, papéis e estados;
- equivalência de tabelas e cartões;
- ausência de sobreposição e overflow;
- ações essenciais no mobile.

## 15. Desempenho, precedência e build

```bash
npm run audit:lighthouse
npm run audit:baseline
npm run audit:frontend-precedence:check
npm run test:frontend-precedence
npm run build:vercel
```

Oscilação deve ser repetida no mesmo SHA sem reduzir o piso silenciosamente.

## 16. Dependências

```bash
npm run lint
npm run analyze:unused
npm run check:team-account-function
```

Atualização exige PR isolado, versão fixada, changelog, lockfile e gates afetados. Supabase JS/CLI exige Auth, RLS, migrations, Edge Function e backup.

## 17. Mesmo SHA

Antes de declarar conclusão:

1. fixar SHA candidato;
2. executar gates nesse SHA;
3. confirmar que a branch não mudou;
4. verificar checks;
5. publicar somente o commit aprovado;
6. repetir smokes após Production.

## 18. Gates externos

- integração autorizada da matriz;
- smoke autenticado de leitura;
- escrita controlada e compensação;
- decisão sobre programas SME;
- correção da lacuna `ASSET-02`;
- UAT;
- homologação humana quando aplicável;
- decisão formal de liberação.

## 19. Critério de conclusão

A mudança deve representar a regra correta, funcionar ponta a ponta, preservar autorização e autoria, manter desktop/mobile, passar pelos gates, atualizar matriz e documentação e declarar ambiente e SHA da evidência.
