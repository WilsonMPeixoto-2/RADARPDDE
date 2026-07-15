# Ciclo A — Linha de Base, Classificação e Contratos

## Objetivo

Construir uma linha de base funcional, visual, documental, técnica e de dados do RADAR PDDE após o PR 22, sem alterar o comportamento do produto, para que todos os ciclos posteriores partam de evidências verificáveis, preservem decisões corretas e distingam defeitos atuais, melhorias possíveis e atividades dependentes da implantação remota do Supabase.

## Resultado esperado

Ao final do Ciclo A, o projeto terá:

1. registro consolidado de decisões e fronteiras;
2. classificação explícita de dados e ambientes;
3. catálogo de superfícies, fluxos e conexões;
4. linha de base visual reproduzível em desktop, Android e iPhone;
5. auditoria global com pontos fortes, lacunas, dúvidas e riscos;
6. contratos transversais de experiência;
7. backlog único e priorizado;
8. indicação fundamentada do primeiro pacote posterior.

## Escopo incluído

- documentação canônica e histórica;
- frontend, estilos e ordem de carregamento;
- perfis e permissões funcionais;
- persistência local e arquitetura Supabase preparada;
- dados iniciais, fixtures, configuração, logs e snapshots;
- Dashboard, Carteira, Competências, Pendências e Prontuário;
- Capital e Inventário, Registros Internos, Configurações SME e Gestão de Equipe;
- exercícios, programas, alertas, busca e exportação;
- formulários, tabelas, modais, estados vazios, erro e loading;
- desktop Chromium, Pixel 7/Chromium e iPhone 15/WebKit;
- testes, CI, Vercel e readiness Supabase.

## Fora do escopo

- alterar regras de negócio ou comportamento;
- redesenhar telas;
- instalar bibliotecas;
- decompor `app.js`;
- consolidar CSS;
- alterar navegação;
- ativar Supabase remoto;
- migrar dados;
- configurar usuários reais;
- alterar produção;
- modificar Excel;
- implementar telemetria.

Achados dessas áreas podem entrar no backlog, mas não serão implementados no Ciclo A.

## Estado de referência

A execução parte da `main` após o merge do Plano Diretor, preservando:

- produção em `localStorage`;
- `dataMode: "local"`;
- `supabaseRepositoryEnabled: false`;
- URL e chave publicável vazias;
- nenhuma conexão Supabase remota;
- doze migrations preparadas;
- Auth/RLS comprovados localmente;
- quatro filas canônicas de pendências;
- independência entre bonificação, análise técnica e pendência;
- Excel aprovado e congelado;
- comportamento desktop e mobile vigente.

## Fontes de verdade

1. orientação expressa mais recente do responsável;
2. `docs/README.md`;
3. `docs/superpowers/plans/2026-07-14-plano-diretor-consolidacao-evolucao-pos-pr22.md`;
4. `docs/handoff/PR22_FINAL_GATE_REPORT_2026-07-14.md`;
5. `docs/reference/STATUS_DOCUMENTOS.md`;
6. Dossiê Consolidado v1.0;
7. Plano do Lote 2 v2.0;
8. documentação arquitetural vigente;
9. código e testes atuais.

Divergências serão registradas e classificadas; não serão resolvidas por suposição.

---

## Arquitetura dos artefatos

### Decisões

`docs/reference/PRODUCT_DECISIONS.md`

Registra decisões canônicas, fonte, data, condição de reabertura e decisões substituídas. Não duplica documentos completos; funciona como índice normativo.

### Classificação de mudanças

`docs/reference/CHANGE_CLASSIFICATION.md`

Define:

- `CP` — correto e protegido;
- `ID` — intencional e deliberado;
- `FA` — funcional e aprimorável;
- `IC` — inconsistente ou duplicado;
- `DC` — defeito comprovado;
- `DQ` — dúvida de produto ou regra;
- `DF` — dependente de etapa futura;
- `EP` — evolução posterior.

Cada código contém definição, evidência mínima, conduta permitida, conduta proibida e exemplo.

### Dados e ambientes

`docs/reference/DATA_CLASSIFICATION_AND_ENVIRONMENTS.md`

Classifica:

- D0 público institucional;
- D1 interno institucional;
- D2 pessoal ou contato;
- D3 credencial ou segredo;
- D4 configuração pública;
- D5 fixture ou demonstração;
- D6 log ou auditoria;
- D7 snapshot ou migração.

A política define o tratamento em Git, bundle, `localStorage`, teste, CI, Preview, Supabase de homologação, produção, logs e artefatos. Deve separar exposição atual, risco independente do Supabase, proteção futura por backend/RLS, minimização e eventual saneamento do histórico Git.

### Catálogo de superfícies

`docs/reference/PRODUCT_SURFACE_CATALOG.md`

Cada superfície registra:

- identificador e nome;
- mecanismo atual de abertura;
- perfis;
- tarefa real;
- entradas e saídas;
- dados lidos e gravados;
- serviços e repositórios;
- estados e ações;
- conexões;
- desktop e mobile;
- acessibilidade;
- testes;
- pontos fortes, riscos, classificação e evidências.

Superfícies mínimas:

1. Dashboard;
2. Carteira;
3. Competências;
4. Pendências;
5. Prontuário;
6. Capital e Inventário;
7. Registros Internos;
8. Configurações SME;
9. Gestão de Equipe;
10. Exercícios;
11. Programas;
12. Alertas;
13. Busca global;
14. Exportação Excel;
15. Autenticação;
16. Modais e confirmações;
17. Formulários;
18. Estados vazios/loading/erro.

### Inventário técnico

`docs/audits/2026-07-15-inventario-tecnico-global.md`

Registra árvore relevante, scripts npm, domínio, serviços, adaptadores, integrações, estilos, ordem de carregamento, testes, workflows, migrations, documentação, dependências, arquivos concentradores e referências cruzadas.

### Auditoria de dados

`docs/audits/2026-07-15-dados-e-ambientes-estado-atual.md`

Registra onde cada categoria de dado aparece, motivo, exposição atual, proteção atual, proteção futura e conduta.

### Auditoria global

`docs/audits/2026-07-15-produto-estado-atual.md`

Consolida maturidade por módulo, conexões, qualidades a preservar, inconsistências, defeitos, dúvidas, riscos, dependências, oportunidades e itens futuros.

### Contratos transversais

`docs/superpowers/specs/2026-07-15-contratos-transversais-experiencia-design.md`

Define, sem implementar:

- loading;
- sucesso;
- erro;
- alerta;
- confirmação crítica;
- conflito;
- sessão expirada;
- indisponibilidade;
- estado vazio;
- formulário alterado;
- salvamento;
- foco;
- modal;
- menu;
- tooltip;
- painel lateral.

### Backlog

`docs/reference/POST_PR22_PRIORITIZED_BACKLOG.md`

Cada item registra ID, prioridade, ciclo, superfície, classe, evidência, problema ou oportunidade, resultado esperado, preservações, risco, dependências, decisão humana, proposta visual, relação com Supabase e pacote sugerido.

---

## Evidência visual

### Estrutura

```text
docs/evidence/global-baseline/
  repository-inventory.json
  manifest.json
  desktop/
  android/
  iphone/
```

### Nomenclatura

```text
<perfil>__<superficie>__<estado>__<viewport>.png
```

Exemplos:

```text
controlador__dashboard__padrao__desktop.png
controlador__carteira__resultado__android.png
sme__configuracoes__padrao__iphone.png
```

### Viewports

- `desktop` — Desktop Chrome;
- `android` — Pixel 7;
- `iphone` — iPhone 15.

### Baseline inicial

A baseline automatizada terá oito cenários por viewport, totalizando 24 capturas:

- Controlador: Dashboard, Carteira, Competências, Pendências, Inventário e Registros Internos;
- Gestão SME: Dashboard e Configurações SME.

Superfícies sem captura automatizada dedicada continuam obrigatórias no catálogo e serão avaliadas pelos testes existentes, inspeção dirigida e evidências adicionais quando necessárias.

### Reprodutibilidade

A captura deve:

- preparar diretórios sem apagar o inventário técnico;
- limpar apenas estado local de filtro necessário;
- usar fixtures determinísticas;
- registrar perfil, superfície, estado, viewport, tamanho e commit;
- falhar em `pageerror` ou `console.error`;
- substituir o nome do usuário por `Usuário de teste`;
- remover e-mail e telefone da evidência;
- não mudar produção;
- não depender de Supabase remoto.

### Pipeline de captura

```text
prepare-baseline-output.mjs
→ Playwright em 3 projetos
→ build-baseline-manifest.mjs
```

Comando:

```json
"audit:baseline": "node scripts/audit/prepare-baseline-output.mjs && playwright test --config=playwright.audit.config.js && node scripts/audit/build-baseline-manifest.mjs"
```

O manifesto exige exatamente 24 capturas e rejeita arquivos vazios ou nomes inválidos.

---

## Ferramentas de auditoria

### Inventário

`scripts/audit/generate-repository-inventory.mjs`

Produz JSON determinístico com arquivos rastreados, categoria, bytes, linhas, scripts npm, dependências, extensões carregadas e quantidade de migrations.

### Preparação visual

`scripts/audit/prepare-baseline-output.mjs`

Limpa somente `desktop/`, `android/`, `iphone/` e `manifest.json`, preservando `repository-inventory.json`.

### Manifesto

`scripts/audit/build-baseline-manifest.mjs`

Valida nomes, tamanho mínimo, quantidade, commit e grava `manifest.json`.

### Validação final

`scripts/audit/validate-cycle-a-artifacts.mjs`

Verifica arquivos obrigatórios, links locais, ausência de placeholders, 18 superfícies, 24 capturas e arquivos referenciados pelo manifesto.

### Testes

`tests/unit/audit-tools.test.js` cobre inventário, nomenclatura e validação final.

`tests/audit/global-baseline.spec.js` captura a linha de base fora do `testDir` normal, por configuração própria.

---

## Modelo de maturidade

Cada superfície recebe notas de 1 a 5, sempre justificadas, para:

- correção funcional;
- cobertura de regras;
- conexão;
- clareza;
- encontrabilidade;
- produtividade;
- acessibilidade;
- responsividade;
- consistência visual;
- tratamento de estados;
- testabilidade;
- prontidão remota.

Não haverá média única nem ranking simplista.

## Regra de dúvida

Um item será `DQ` quando:

- a intenção não puder ser comprovada;
- documentação e comportamento divergirem;
- alternativas plausíveis tiverem efeitos distintos;
- uma evolução puder remover informação ou ação;
- a interpretação de indicador puder mudar;
- a permissão não tiver fonte clara;
- o dado não tiver classificação segura.

A pergunta deve conter evidência, alternativas, consequências, recomendação provisória e decisão solicitada.

## Perfis

A auditoria considera:

- Controlador;
- Assistente de Verbas Federais;
- Equipe de Inventário;
- Gestão SME;
- Administrador técnico.

Nomes internos diferentes dos nomes canônicos serão registrados como evidência, não corrigidos automaticamente.

---

## Validação

### Baseline funcional

```bash
npm ci
npm run check
npm run test:unit
npm run test:integration
npm run audit:functional
npm run test:readiness
npm run test:e2e
npm run test:mobile
```

### Auditoria

```bash
npm run audit:inventory
npm run audit:baseline
npm run audit:cycle-a
npm audit --audit-level=high
git diff --check
```

### Restrições de diff

A PR não poderá modificar:

```text
app.js
index.html
styles.css
config.js
config.runtime.js
src/**
supabase/**
vercel.json
.github/workflows/**
```

## Critérios de aceite

- nenhuma lógica funcional alterada;
- `main` de referência registrada;
- decisões indexadas;
- dados e ambientes classificados;
- 18 superfícies catalogadas;
- 24 capturas reproduzíveis disponíveis;
- inventário técnico completo;
- auditoria distingue os oito códigos;
- dúvidas materiais apresentadas;
- 16 contratos transversais especificados sem implementação;
- backlog priorizado e sem duplicidade;
- primeiro pacote indicado e justificado;
- testes verdes;
- nenhuma conexão, credencial ou alteração de produção;
- relatório final explica aprendizado, preservações e próxima etapa.

## Decisão de arquitetura

O Ciclo A será executado em uma única branch e PR em rascunho, com commits independentes por entrega. Nenhum pacote funcional dos Ciclos B–H será iniciado nessa PR. A aprovação da especificação e do plano autoriza apenas a execução do Ciclo A; merge e produção continuam dependentes de autorização posterior.
