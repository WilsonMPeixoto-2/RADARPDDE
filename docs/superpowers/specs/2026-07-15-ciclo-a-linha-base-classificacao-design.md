# Ciclo A — Linha de Base, Classificação e Contratos

## Objetivo

Construir uma linha de base funcional, visual, documental e de dados do RADAR PDDE após o PR 22, sem alterar o comportamento do produto, para que todos os ciclos posteriores partam de evidências verificáveis, preservem decisões corretas e distingam claramente defeitos atuais, melhorias possíveis e atividades dependentes da implantação remota do Supabase.

## Resultado esperado

Ao final do Ciclo A, o projeto terá:

1. um registro consolidado de decisões e fronteiras;
2. uma classificação explícita de dados e ambientes;
3. um catálogo de superfícies, fluxos e conexões do produto;
4. uma linha de base visual reproduzível em desktop, Android e iPhone;
5. uma auditoria global com pontos fortes, lacunas, dúvidas e riscos;
6. contratos transversais de experiência para orientar os ciclos seguintes;
7. um backlog único, priorizado e sem duplicidade;
8. a indicação fundamentada do primeiro pacote funcional a ser implementado.

## Escopo

### Incluído

- documentação canônica e histórica;
- frontend vigente;
- estilos e ordem de carregamento;
- perfis e permissões funcionais;
- persistência local e arquitetura Supabase preparada;
- dados iniciais, fixtures, configurações e logs;
- Dashboard;
- Carteira de Escolas;
- Competências Mensais;
- Pendências Operacionais;
- Prontuário;
- Capital e Inventário;
- Registros Internos;
- Configurações SME;
- Gestão de Equipe;
- exercícios, programas, alertas, busca e exportações;
- formulários, tabelas, modais, estados vazios, erros e loading;
- desktop Chromium, Pixel 7/Chromium e iPhone 15/WebKit;
- testes, CI, Vercel e readiness Supabase.

### Fora do escopo

- alterar regras de negócio;
- redesenhar telas;
- instalar bibliotecas;
- decompor `app.js`;
- consolidar CSS;
- alterar navegação;
- ativar Supabase remoto;
- migrar dados;
- configurar usuários reais;
- alterar produção;
- modificar exportação Excel;
- implementar telemetria.

Achados dessas áreas podem entrar no backlog, mas não serão implementados no Ciclo A.

## Estado de referência

A execução deve partir da `main` após o merge do Plano Diretor, preservando:

- produção oficial em `localStorage`;
- `dataMode: "local"`;
- `supabaseRepositoryEnabled: false`;
- URL e chave publicável vazias;
- nenhuma conexão Supabase remota;
- doze migrations já preparadas;
- Auth/RLS comprovados localmente;
- quatro filas canônicas de pendências;
- independência entre bonificação, análise técnica e pendência;
- exportação Excel aprovada e congelada;
- comportamento desktop e mobile vigente.

## Fontes de verdade

A análise deve usar, em conjunto:

1. orientação expressa mais recente do responsável;
2. `docs/README.md`;
3. `docs/superpowers/plans/2026-07-14-plano-diretor-consolidacao-evolucao-pos-pr22.md`;
4. `docs/handoff/PR22_FINAL_GATE_REPORT_2026-07-14.md`;
5. `docs/reference/STATUS_DOCUMENTOS.md`;
6. Dossiê Consolidado v1.0;
7. Plano do Lote 2 v2.0;
8. documentação arquitetural vigente;
9. código e testes atuais.

Quando documentação e implementação divergirem, a divergência será registrada e classificada; não será resolvida por suposição.

## Arquitetura documental

O Ciclo A produzirá artefatos com responsabilidades distintas.

### 1. Registro de decisões

`docs/reference/PRODUCT_DECISIONS.md`

Responsável por:

- decisões canônicas;
- regras não reinterpretáveis;
- decisões visuais aprovadas;
- itens congelados;
- decisões substituídas;
- fonte e data de cada decisão;
- condições para reabertura.

Não deve duplicar toda a documentação existente. Deve apontar a fonte canônica e resumir somente o suficiente para impedir reinterpretação.

### 2. Modelo de classificação de mudanças

`docs/reference/CHANGE_CLASSIFICATION.md`

Responsável por definir:

- `CP` — correto e protegido;
- `ID` — intencional e deliberado;
- `FA` — funcional e aprimorável;
- `IC` — inconsistente ou duplicado;
- `DC` — defeito comprovado;
- `DQ` — dúvida de produto ou regra;
- `DF` — dependente de etapa futura;
- `EP` — evolução posterior.

Cada categoria deverá conter definição, evidência mínima, conduta permitida, conduta proibida e exemplo do RADAR.

### 3. Classificação de dados e ambientes

`docs/reference/DATA_CLASSIFICATION_AND_ENVIRONMENTS.md`

Responsável por classificar:

- dado institucional público;
- dado institucional interno;
- dado operacional;
- dado pessoal ou de contato;
- credencial;
- configuração pública;
- fixture;
- dado de demonstração;
- log;
- snapshot de migração;
- artefato de teste.

Também deve definir o comportamento permitido em:

- repositório Git;
- bundle do navegador;
- `localStorage`;
- teste local;
- CI;
- Preview;
- Supabase remoto de homologação;
- produção;
- logs e artefatos.

A classificação deve separar claramente:

1. exposição que já existe hoje;
2. risco atual independente do Supabase;
3. proteção que pertence ao backend e às políticas RLS futuras;
4. necessidade de minimização;
5. eventual necessidade de saneamento do histórico Git.

### 4. Catálogo de superfícies

`docs/reference/PRODUCT_SURFACE_CATALOG.md`

Cada superfície terá uma ficha com:

- identificador;
- nome;
- rota ou mecanismo de abertura atual;
- perfis autorizados;
- tarefa real do usuário;
- entradas;
- saídas;
- dados lidos e gravados;
- serviços e repositórios envolvidos;
- estados possíveis;
- ações;
- conexões com outras superfícies;
- comportamento desktop;
- comportamento mobile;
- acessibilidade;
- testes existentes;
- pontos fortes;
- riscos;
- classificação inicial;
- evidências associadas.

### 5. Inventário técnico

`docs/audits/2026-07-15-inventario-tecnico-global.md`

Responsável por registrar:

- árvore relevante do projeto;
- scripts npm;
- módulos de domínio;
- serviços de aplicação;
- adaptadores;
- integrações;
- folhas de estilo;
- ordem de carregamento;
- testes;
- workflows;
- migrations;
- documentos;
- dependências;
- arquivos grandes ou concentradores de responsabilidade;
- referências cruzadas relevantes.

### 6. Auditoria de dados e ambientes

`docs/audits/2026-07-15-dados-e-ambientes-estado-atual.md`

Responsável por registrar evidências concretas de onde cada categoria de dado aparece e por qual motivo.

### 7. Auditoria global do produto

`docs/audits/2026-07-15-produto-estado-atual.md`

Responsável por consolidar:

- visão executiva;
- maturidade por módulo;
- conexões entre fluxos;
- qualidades a preservar;
- inconsistências;
- defeitos comprovados;
- dúvidas materiais;
- riscos;
- dependências;
- oportunidades de evolução;
- itens dependentes do Supabase.

### 8. Contratos transversais de experiência

`docs/superpowers/specs/2026-07-15-contratos-transversais-experiencia-design.md`

Responsável por definir, sem implementar:

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

Cada contrato deverá descrever propósito, comportamento, acessibilidade, conteúdo, estado visual, persistência do formulário, ação de recuperação e critérios de uso.

### 9. Backlog priorizado

`docs/reference/POST_PR22_PRIORITIZED_BACKLOG.md`

Cada item deverá conter:

- identificador;
- ciclo sugerido;
- superfície;
- classificação;
- problema ou oportunidade;
- evidência;
- benefício esperado;
- risco de regressão;
- dependências;
- necessidade de decisão humana;
- necessidade de proposta visual;
- relação com Supabase;
- prioridade;
- justificativa da prioridade;
- pacote técnico recomendado.

## Evidência visual

### Estrutura

```text
docs/evidence/global-baseline/
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

- desktop: projeto Playwright `desktop-chromium`;
- Android: Pixel 7 pelo projeto `mobile-chromium`;
- iPhone: iPhone 15 pelo projeto `mobile-webkit`.

### Estados mínimos

Para cada superfície aplicável:

- padrão;
- filtrado;
- vazio;
- conteúdo extenso;
- modal ou painel aberto;
- erro ou indisponibilidade quando houver fixture segura;
- interação por teclado quando relevante.

### Reprodutibilidade

A captura deve:

- limpar estado local antes do cenário quando necessário;
- usar fixtures determinísticas já existentes;
- registrar perfil, superfície, estado, arquivo, viewport e commit;
- falhar se houver `pageerror`;
- registrar `console.error` e `console.warn` relevantes;
- não publicar dados pessoais desnecessários;
- não modificar a configuração de produção;
- não depender de Supabase remoto.

## Ferramentas de auditoria

O ciclo poderá adicionar ferramentas sem efeito funcional:

### `scripts/audit/generate-repository-inventory.mjs`

Gera um relatório JSON determinístico com:

- arquivos rastreados por categoria;
- tamanho em bytes;
- linhas para arquivos textuais;
- imports e referências simples;
- scripts npm;
- estilos e scripts carregados por `config.js`;
- testes por área;
- workflows;
- migrations.

Saída:

```text
docs/evidence/global-baseline/repository-inventory.json
```

### `tests/audit/global-baseline.spec.js`

Captura a linha de base visual e gera `manifest.json`.

O teste ficará fora do `testDir` padrão de Playwright, para não aumentar o gate normal. Será executado por comando específico.

### Script npm

```json
"audit:baseline": "playwright test tests/audit/global-baseline.spec.js --config=playwright.audit.config.js"
```

### `playwright.audit.config.js`

Configuração separada, reutilizando os mesmos dispositivos e servidor, com saída em `docs/evidence/global-baseline/`.

## Modelo de classificação de superfícies

Cada superfície receberá notas de 1 a 5, usadas apenas como apoio comparativo:

- correção funcional;
- cobertura de regras;
- conexão com outros módulos;
- clareza;
- encontrabilidade;
- produtividade;
- acessibilidade;
- responsividade;
- consistência visual;
- tratamento de estados;
- testabilidade;
- prontidão para operação remota.

A nota não substitui a análise qualitativa e não deve ser usada como ranking simplista.

## Regra de dúvida

Um achado será marcado `DQ` e apresentado ao responsável quando:

- a intenção não puder ser comprovada;
- a documentação divergir do comportamento;
- duas soluções forem plausíveis e tiverem efeitos distintos;
- a alteração futura puder remover informação, ação ou capacidade;
- a interpretação de um indicador puder mudar;
- a permissão não tiver fonte clara;
- o dado não tiver classificação segura.

A pergunta deverá citar a evidência e explicar as alternativas e suas consequências.

## Perfis

A auditoria deverá considerar:

- Controlador;
- Assistente de Verbas Federais;
- Equipe de Inventário;
- Gestão SME;
- Administrador técnico.

Quando a interface local atual usar nomes de perfil diferentes dos nomes canônicos, a divergência será registrada.

## Superfícies mínimas

1. Dashboard;
2. Carteira de Escolas;
3. Competências Mensais;
4. Pendências Operacionais;
5. Prontuário;
6. Capital e Inventário;
7. Registros Internos;
8. Configurações SME;
9. Gestão de Equipe;
10. gestão de exercícios;
11. gestão de programas;
12. alertas;
13. busca global;
14. exportação Excel;
15. autenticação local e gate Supabase preparado;
16. modais e confirmações;
17. formulários;
18. estados vazios, loading e erro.

## Validação

### Baseline funcional

Antes e depois dos artefatos documentais e ferramentas de auditoria:

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

### Validação documental

Um script ou teste deverá verificar:

- arquivos obrigatórios presentes;
- links Markdown locais válidos;
- ausência de `TBD` e `TODO` nos artefatos finais;
- códigos de classificação válidos;
- todos os itens do backlog com evidência;
- todas as superfícies com ficha;
- todos os arquivos do manifesto visual existentes;
- commit do manifesto igual ao HEAD auditado;
- nenhum segredo aparente nos relatórios.

### Segurança

```bash
npm audit --audit-level=high
npm run check:supabase
npm run check:runtime-config
```

## Critérios de aceite

O Ciclo A será considerado concluído quando:

- nenhuma lógica funcional tiver sido alterada;
- a `main` de referência estiver registrada;
- decisões canônicas estiverem indexadas;
- dados e ambientes estiverem classificados;
- todas as superfícies mínimas tiverem ficha;
- capturas desktop, Android e iPhone estiverem disponíveis para as superfícies aplicáveis;
- o inventário técnico estiver completo;
- a auditoria global distinguir `CP`, `ID`, `FA`, `IC`, `DC`, `DQ`, `DF` e `EP`;
- as dúvidas materiais estiverem apresentadas ao responsável;
- contratos transversais estiverem especificados, sem implementação;
- o backlog estiver priorizado e sem duplicidade;
- o primeiro pacote funcional pós-Ciclo A estiver indicado e justificado;
- todos os testes pertinentes estiverem verdes;
- não houver conexão remota, credencial ou alteração de produção;
- o relatório final explicar o que foi aprendido e por que a próxima etapa foi escolhida.

## Decisão de arquitetura

O Ciclo A produzirá documentação e ferramentas de auditoria reproduzíveis em uma única branch, mas a execução será dividida em tarefas com commits independentes. A PR permanecerá em rascunho durante a coleta e só sairá de rascunho quando os documentos, evidências e validações estiverem completos.

Nenhum pacote funcional dos Ciclos B–H será iniciado dentro desta PR.
