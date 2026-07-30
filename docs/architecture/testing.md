# Estratégia de testes e gates de qualidade

**Estado:** vigente  
**Atualizado em:** 30 de julho de 2026

## 1. Objetivo

Garantir que cada mudança preserve regras de negócio, persistência, autorização, acessibilidade, responsividade, navegação, relatórios, recuperabilidade e operação remota do RADAR PDDE.

Nenhum comando isolado representa o gate completo. A seleção depende das camadas tocadas, e a decisão de release exige evidências cumulativas no mesmo SHA.

## 2. Runtime de teste

A major operacional do Node.js está fixada em `24.x`:

```text
package.json        engines.node = 24.x
package-lock.json   packages[""].engines.node = 24.x
.nvmrc              24
.node-version       24
GitHub Actions      node-version: 24
Vercel              nodeVersion: 24.x
```

O teste `tests/unit/release-hardening-contract.test.js` rejeita divergências.

## 3. Pirâmide de validação

```text
domínio puro e contratos
→ serviços e integrações
→ persistência local e Supabase
→ banco, Auth, RLS e migrations
→ backup e restauração
→ jornadas de interface
→ acessibilidade e responsividade
→ artefato Vercel
→ homologação operacional e UAT
```

## 4. Readiness principal

```bash
npm run test:readiness
```

Executa sintaxe, lint, testes unitários e de integração, certificação Excel, prontidão Supabase, alinhamento remoto, runtime, artefatos, tipos e auditoria funcional.

Readiness aprovado é necessário, mas não suficiente, para mudanças de banco, layout, navegação ou release.

## 5. Testes unitários e de integração

```bash
npm run test:unit
npm run test:integration
```

Coberturas relevantes:

- competência e avaliação mensal;
- pendências e timeline;
- navegação contextual;
- autorização e capacidades;
- modelos e renderers Excel;
- contratos JSON;
- identidade da migration SME;
- Node 24 e workflows;
- layout móvel;
- backup/restauração e segurança do artefato;
- serviços, unidade de trabalho e persistência atômica;
- importação, reconciliação e rollback.

Toda correção deve acrescentar caso que falhe antes e passe depois.

## 6. Banco local, migrations e pgTAP

```bash
node --test tests/unit/sme-migration-history-alignment.test.js
npm run supabase:start
npm run supabase:reset
npm run supabase:test:db
npm run supabase:lint:db
npm run supabase:gen:types
npm run typecheck:database
```

Requisitos:

- histórico local/remoto alinhado;
- identificador derivado `20260728190344` ausente;
- migrations aplicadas do zero;
- pgTAP aprovado por papel e escopo;
- lint SQL sem erro bloqueante;
- tipos regenerados quando o schema muda;
- acesso anônimo bloqueado;
- funções privilegiadas preservadas;
- dry-run remoto contendo somente mudança deliberada;
- backup e plano de rollback antes de operação remota.

## 7. Gate de backup e restauração

Workflow:

```text
.github/workflows/backup-restore-disposable.yml
```

Comando:

```bash
RADAR_ALLOW_DISPOSABLE_BACKUP_RESTORE=true npm run test:backup-restore
```

O gate:

1. inicia origem Supabase descartável;
2. aplica 25 migrations e seed;
3. gera dumps de papéis, schema, dados e histórico;
4. inicia segunda pilha isolada;
5. restaura em transação única;
6. compara schema, políticas, funções, triggers, tabelas, contagens, conteúdo e migrations;
7. publica somente `evidence.json`;
8. encerra as pilhas.

Proibições:

- `--linked`;
- segredo remoto;
- conexão Production;
- publicação de dumps SQL.

Evidência inicial:

```text
run 30537076528
job Dump, restauração e equivalência
conclusão success
```

Fingerprints coincidentes:

```text
schema:     0edda0a68fdbd4a6984f68d4d0332a3f4b8fe9965ea34911f1ea17b7a3150948
dados:      fa1f775a1eae802d59dfa889347cbe013e30b6b20b45b74e4694db750dff0cc7
migrations: 18caf36e3032a4c2dfb2064b18ad2cf1c0dbf59df8c12ff8319ab7d7bd679e6b
```

## 8. Certificação dos relatórios Excel

```bash
npm run certify:excel:fixture
```

Verifica regra de avaliação, equivalência com CSV, células dos dois produtos, estrutura OOXML, abas, ausência de `dataValidations` no produto SME, determinismo e hashes.

A massa é sintética. Antes do release, os arquivos devem ser abertos manualmente no Microsoft Excel desktop sem reparo.

## 9. Playwright local

```bash
npm run test:e2e
npm run test:mobile
```

Projetos mínimos:

- desktop Chromium;
- Android/Chromium;
- iPhone/WebKit.

Jornadas cobrem login, capacidades, competência, Carteira, Dashboard, Prontuário, timeline, Gestão SME, Inventário, erros de página e overflow.

## 10. Gate remoto por papel e viewport

Workflow:

```text
.github/workflows/gate-remoto-perfis-viewports.yml
```

O gate usa Supabase descartável, aplica migrations, cria identidades efêmeras, valida Auth/RLS e executa cinco papéis em Desktop Chrome, Pixel 7 e iPhone 15.

A matriz possui 15 cenários. Os testes mutáveis são executados uma vez no desktop.

## 11. Acessibilidade e responsividade

Cobrir:

- teclado e foco;
- modais acessíveis;
- `aria-live`;
- nomes, papéis e estados;
- contraste e semântica;
- equivalência entre tabela e cartões mobile;
- ausência de sobreposição;
- logout acionável por toque;
- ausência de overflow relevante.

Mudança visual não pode reduzir conteúdo, filtros, ações ou informação acessível.

## 12. Lighthouse, precedência e build

```bash
npm run audit:lighthouse
npm run audit:baseline
npm run audit:frontend-precedence:check
npm run test:frontend-precedence
npm run build:vercel
```

Aplicar conforme impacto em layout, carregamento, estilos, navegação, configuração ou ordem de bootstraps. Preview e Production são builds independentes.

## 13. Segurança e dependências

```bash
npm run lint
npm run analyze:unused
npm run check:team-account-function
```

Além disso:

- revisar Advisors após alteração relevante;
- confirmar CORS exato da Edge Function;
- manter lockfile versionado;
- não introduzir segredo em frontend, GitHub, artefato ou log;
- não editar diretamente o histórico de migrations;
- não publicar dumps SQL.

A verificação de credenciais comprometidas depende de plano Pro ou superior e não é gate no plano Free atual.

## 14. Mesmo SHA

Antes de declarar ciclo concluído:

1. registrar o SHA candidato;
2. executar gates aplicáveis nesse SHA;
3. confirmar que o PR não mudou depois dos testes;
4. verificar checks e workflows associados;
5. publicar somente o commit aprovado;
6. documentar eventual commit operacional posterior.

Ausência de workflow não equivale a aprovação.

## 15. Gates externos remanescentes

Mesmo com CI verde, permanecem:

- homologação manual dos arquivos Excel;
- revisão dos Advisors quando aplicável;
- UAT;
- polimento editorial e visual;
- decisão formal de release.

Node, matriz remota e backup/restauração estão cumpridos.

## 16. Critério de conclusão

Uma mudança está concluída quando:

- representa corretamente o dado e a regra;
- preserva autoria, auditoria e histórico;
- aplica autorização em profundidade;
- mantém coerência entre superfícies e exportações;
- funciona em desktop e mobile;
- mantém acessibilidade;
- passa pelos gates aplicáveis;
- atualiza documentação e evidências;
- declara explicitamente o estado final.
