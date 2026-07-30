# Estratégia de testes e gates de qualidade

**Estado:** vigente  
**Atualizado em:** 30 de julho de 2026

## 1. Objetivo

Garantir que cada mudança preserve regras de negócio, persistência, autorização, acessibilidade, responsividade, navegação, relatórios e operação remota do RADAR PDDE.

Nenhum comando isolado representa o gate completo. A seleção depende das camadas tocadas, e a decisão de release exige evidências cumulativas no mesmo SHA.

## 2. Runtime de teste

A major operacional do Node.js está fixada em `24.x`.

Contratos:

```text
package.json        engines.node = 24.x
package-lock.json   packages[""].engines.node = 24.x
.nvmrc              24
.node-version       24
GitHub Actions      node-version: 24
Vercel              nodeVersion: 24.x
```

O teste `tests/unit/release-hardening-contract.test.js` rejeita divergência entre esses contratos.

## 3. Pirâmide de validação

```text
domínio puro e contratos
→ serviços e integrações
→ persistência local e Supabase
→ banco, Auth, RLS e histórico de migrations
→ jornadas de interface
→ acessibilidade e responsividade
→ artefato Vercel
→ homologação operacional e UAT
```

## 4. Readiness principal

```bash
npm run test:readiness
```

O script executa:

1. sintaxe dos arquivos críticos;
2. lint de segurança;
3. lint E2E;
4. testes unitários;
5. certificação Excel sintética;
6. testes de integração;
7. prontidão Supabase;
8. alinhamento final das camadas remotas;
9. contrato de runtime;
10. artefatos determinísticos;
11. tipos do banco;
12. auditoria funcional.

Readiness aprovado é necessário, mas não suficiente, para mudanças de banco, layout, navegação ou release.

## 5. Testes unitários

```bash
npm run test:unit
```

Coberturas relevantes:

- competência e contexto global;
- avaliação mensal APTA/INAPTA;
- estados e transições de pendência;
- projeção operacional;
- timeline e deduplicação;
- navegação contextual;
- autorização e capacidades;
- modelos e renderers Excel;
- certificação célula a célula;
- contratos JSON;
- identidade e hash da migration SME;
- Node 24 e workflows;
- separação móvel entre perfil técnico e logout.

Correção de regressão deve acrescentar caso que falhe antes da correção e passe depois.

## 6. Testes de integração

```bash
npm run test:integration
```

Validam:

- serviços de aplicação;
- unidade de trabalho;
- repositórios local e Supabase;
- persistência atômica;
- concorrência otimista;
- compensação de falhas;
- importação, reconciliação e rollback;
- integração de Auth e diretórios;
- contratos de runtime e build.

## 7. Banco local, migrations e pgTAP

Para mudanças de banco, RLS, RPC, Auth, Edge Function ou tipos:

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
- wrappers e funções privilegiadas preservados;
- `db push --linked --dry-run` contendo apenas mudança deliberada;
- backup e rollback antes de operação remota.

`migration repair` altera histórico e não reverte SQL funcional.

## 8. Certificação dos relatórios Excel

```bash
npm run certify:excel:fixture
```

O gate verifica:

- regra canônica de avaliação;
- equivalência com o CSV legado;
- células do relatório institucional;
- células do Excel SME mensal;
- escopo histórico e isolamento mensal;
- estrutura OOXML;
- quantidade e ordem de abas;
- ausência de `dataValidations` no produto SME;
- determinismo e hashes.

A massa é sintética. Antes do release, os arquivos devem ser abertos manualmente no Microsoft Excel desktop sem reparo.

## 9. Playwright local

### Jornada completa

```bash
npm run test:e2e
```

### Mobile

```bash
npm run test:mobile
```

Projetos mínimos:

- desktop Chromium;
- Android/Chromium;
- iPhone/WebKit.

Jornadas devem validar login, capacidades, competência, Carteira, Dashboard, Prontuário, timeline, navegação contextual, Gestão SME, Inventário, ausência de `pageerror` e overflow relevante.

## 10. Gate remoto por papel e viewport

Workflow:

```text
.github/workflows/gate-remoto-perfis-viewports.yml
```

O gate executa em runner remoto do GitHub Actions e utiliza Supabase descartável. Não acessa Production nem exige segredo administrativo persistente.

Sequência:

1. Node 24 e `npm ci`;
2. Chromium e WebKit;
3. Supabase descartável;
4. aplicação das 25 migrations;
5. identidades Auth efêmeras;
6. contratos Auth/RLS no desktop;
7. código do próprio PR servido localmente no runner;
8. matriz de papel × viewport;
9. artefatos Playwright;
10. restauração e destruição do ambiente.

Papéis:

- Administrador técnico;
- Assistente de Verbas Federais;
- Controlador;
- Equipe de Inventário;
- Gestão SME.

Viewports:

- Desktop Chrome;
- Pixel 7 / Chromium;
- iPhone 15 / WebKit.

A matriz possui 15 cenários. Os testes mutáveis Auth/RLS são executados uma vez no desktop para evitar duplicidade de efeitos.

Evidência inicial aprovada:

```text
run 30516532485
job Perfis × Desktop, Android e iPhone
conclusão success
```

## 11. Acessibilidade e responsividade

Os testes devem cobrir:

- navegação por teclado;
- foco inicial, retorno e restauração;
- modais acessíveis;
- `aria-live`;
- nomes, papéis e estados;
- contraste e semântica não dependente apenas de cor;
- equivalência entre tabela e cartões mobile;
- ausência de sobreposição entre controles;
- logout acionável por toque;
- ausência de overflow horizontal relevante.

Mudança visual não pode reduzir conteúdo, filtros, ações ou informação acessível.

## 12. Lighthouse e evidência visual

```bash
npm run audit:lighthouse
npm run audit:baseline
```

Aplicar quando houver mudança em layout, carregamento, estilos ou navegação. Capturas antigas são históricas e não devem ser editadas manualmente.

## 13. Precedência do frontend

```bash
npm run audit:frontend-precedence:check
npm run test:frontend-precedence
```

Obrigatório para alterações em HTML, configuração, estilos, ordem de extensões, wrappers globais ou bootstraps pós-`app.js`.

## 14. Build Vercel

```bash
npm run build:vercel
```

Deve confirmar runtime coerente, somente configuração publicável, ausência de segredo, manifesto gerado e compatibilidade com o deployment pretendido.

Preview e Production são builds independentes.

## 15. Segurança e dependências

```bash
npm run lint
npm run analyze:unused
npm run check:team-account-function
```

Além disso:

- revisar Advisors após alteração relevante;
- verificar proteção contra senhas vazadas;
- confirmar CORS exato da Edge Function;
- manter dependências e lockfile versionados;
- não introduzir segredo em frontend, GitHub, artefato ou log;
- não editar diretamente o histórico de migrations.

## 16. Mesmo SHA

Antes de declarar ciclo concluído:

1. registrar o SHA candidato;
2. executar os gates aplicáveis nesse SHA;
3. confirmar que o PR não mudou depois dos testes;
4. verificar checks e workflows associados;
5. publicar somente o commit aprovado;
6. documentar eventual commit operacional posterior.

Ausência de workflow não equivale a aprovação.

## 17. Gates externos remanescentes

Mesmo com CI verde, permanecem:

- proteção contra senhas vazadas;
- backup e restauração em ambiente descartável;
- homologação manual dos arquivos Excel;
- UAT;
- polimento editorial e visual;
- decisão formal de release.

A fixação do Node e o gate remoto por papel/viewport estão cumpridos.

## 18. Critério de conclusão

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
