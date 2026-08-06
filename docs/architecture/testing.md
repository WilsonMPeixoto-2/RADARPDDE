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

O verificador confirma IDs, perfis, superfícies, permissões, âncoras, evidências, cobertura e contratos de releitura, concorrência e compensação.

Toda mudança funcional material deve atualizar a operação correspondente.

## 3. Readiness

```bash
npm run test:readiness
```

Inclui sintaxe, matriz funcional, referências de workflows, vendors, lint, unitários, certificação Excel, integração, Supabase, tipos, artefatos e auditoria funcional.

Os testes unitários do smoke autenticado e o lint da suíte remota integram esse percurso. O acesso real a Production permanece separado e protegido por segredo e variável.

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
- autorização da redistribuição da carteira escolar;
- importação e rollback;
- monitor geral e incidentes;
- auditoria de integridade;
- matriz funcional;
- validação das contas técnicas, ausência de mutação e proteção do workflow autenticado.

## 5. Supabase local

```bash
npm run supabase:start
npm run supabase:reset
npm run supabase:test:db
npm run supabase:lint:db
npm run supabase:gen:types
npm run typecheck:database
```

Na `main` e em Production existem 27 migrations. A última, `202608050001_school_assignment_authorization`, protege a alteração de `schools.controller_id` por usuários autenticados e mantém a operação autorizada de `federal_assistant`, `technical_admin` e manutenção administrativa.

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

## 9. Gate remoto descartável por perfil e viewport

`.github/workflows/gate-remoto-perfis-viewports.yml` usa Supabase descartável, identidades efêmeras e três viewports. Prova Auth/RLS e responsividade sem tocar Production.

## 10. Smoke autenticado de leitura em Production

Arquivos:

```text
.github/workflows/production-authenticated-read.yml
playwright.production-authenticated-read.config.js
tests/e2e/production-authenticated-read.spec.js
tests/support/production-authenticated-read.js
```

O monitor cobre cinco perfis e seis operações:

- autenticação, restauração e logout;
- busca global autorizada;
- Dashboard;
- Carteira ou negativa correta para Inventário;
- Prontuário e timeline;
- Pendências.

Regras obrigatórias:

1. cinco contas técnicas dedicadas, nunca contas pessoais;
2. execução real somente fora de pull requests;
3. segredo em arquivo temporário com permissão `600` e remoção obrigatória;
4. trace, screenshot, vídeo e upload de artefatos desabilitados;
5. nenhuma service role no navegador;
6. falha imediata diante de `POST` operacional, Edge Function, `PATCH`, `PUT` ou `DELETE`;
7. erros sanitizados antes de qualquer resumo.

A execução remota só ocorre quando `RADAR_PRODUCTION_AUTH_READ_ENABLED=true` e o segredo `RADAR_PRODUCTION_READ_ACCOUNTS_JSON` está presente. Sem provisionamento, o workflow registra o bloqueio de forma segura e não afirma cobertura.

## 11. Contrato ponta a ponta

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

## 12. Production

### Monitor geral

`.github/workflows/production-system-smoke.yml` verifica SHA, manifesto, shell, Auth gate, assets, bloqueio anônimo, preflight e incidentes.

### Integridade dos dados

`.github/workflows/production-data-integrity.yml` consulta vinte invariantes agregadas pela função privada `radar_private.production_integrity_check()` e publica somente contagens sanitizadas.

### Leitura autenticada

`.github/workflows/production-authenticated-read.yml` comprova jornadas reais somente após provisionamento autorizado. Enquanto desabilitado, não altera a classificação de cobertura da matriz.

Essas camadas não substituem as provas controladas das 23 mutações.

## 13. Acessibilidade, desempenho e build

```bash
npm run audit:lighthouse
npm run audit:baseline
npm run audit:frontend-precedence:check
npm run test:frontend-precedence
npm run build:vercel
```

Validar teclado, foco, modais, equivalência mobile, ausência de overflow e piso de desempenho no mesmo SHA.

## 14. Dependências

```bash
npm run lint
npm run analyze:unused
npm run check:team-account-function
```

Atualização exige PR isolado, versão fixada, changelog, lockfile e gates afetados.

## 15. Mesmo SHA

Antes de declarar conclusão:

1. fixar SHA candidato;
2. executar gates nesse SHA;
3. confirmar que a branch não mudou;
4. verificar checks;
5. publicar somente o commit aprovado;
6. repetir smokes após Production.

## 16. Gates externos

- concluir e integrar o monitor autenticado;
- autorizar e provisionar as cinco contas técnicas;
- aprovar uma execução manual e outra agendada;
- escrita controlada e compensação;
- decisão sobre programas SME;
- correção de `ASSET-02`;
- UAT;
- homologação humana quando aplicável;
- decisão formal de liberação.
