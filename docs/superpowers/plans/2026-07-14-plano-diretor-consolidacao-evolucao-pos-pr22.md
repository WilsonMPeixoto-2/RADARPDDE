# Plano Diretor de Consolidação e Evolução do RADAR PDDE Pós-PR 22

> **Para agentes de execução:** SUB-SKILL OBRIGATÓRIA: utilizar `superpowers:subagent-driven-development` (recomendado) ou `superpowers:executing-plans` para executar cada plano técnico derivado, tarefa por tarefa. Este Plano Diretor não autoriza execução automática de todos os ciclos; cada pacote exige auditoria específica, especificação aprovada e plano técnico próprio.

**Objetivo:** conduzir o RADAR PDDE da base funcional e arquitetural consolidada após o PR 22 para uma plataforma institucional completa, conectada, consistente, segura, observável e progressivamente inteligente, assegurando que cada alteração produza evolução comprovável sem regressão de regras de negócio, fluxos, dados, navegação ou qualidade visual já alcançada.

**Arquitetura de execução:** o trabalho será dividido em ciclos independentes e PRs de escopo fechado. Cada pacote começa pela reconstrução documentada do estado atual, passa por classificação, proposta funcional, aprovação visual quando aplicável, implementação orientada por testes, comparação antes/depois e homologação. A implantação remota do Supabase constitui uma trilha própria: parte dela pode avançar em paralelo às melhorias de produto após a classificação inicial de dados e ambientes, sem ser indevidamente tratada como falha atual nem ficar bloqueada por evoluções visuais não críticas.

**Stack vigente:** JavaScript no navegador; HTML e CSS próprios; serviços de aplicação; contrato único de persistência; `LocalStorageRepository`; `SupabaseRepository` preparado; PostgreSQL 17/Supabase; Ajv e `pg_jsonschema`; Playwright; Node.js 24; npm com lockfile; Vercel; GitHub Actions.

## Restrições globais

- A orientação expressa mais recente do responsável pelo projeto prevalece sobre planos, documentos e interpretações anteriores.
- O estado funcional aprovado não pode ser reinterpretado ou simplificado sem evidência técnica concreta e autorização quando houver impacto material.
- `main` não deve ser editada diretamente; cada pacote usa branch isolada, PR inicialmente em rascunho e revisão antes do merge.
- Aprovação deste Plano Diretor não autoriza automaticamente implementação, merge, publicação ou ativação em produção.
- Produção permanece em modo local até autorização expressa para outra condição.
- O Supabase remoto não está implantado; Auth/RLS remotos, usuários reais, importação, Advisors, backup, restauração e MFA são atividades deliberadamente futuras, não defeitos esquecidos.
- Nenhuma credencial administrativa, `service_role`, `sb_secret_*`, senha de banco ou token privilegiado pode ser versionado, exibido no navegador ou registrado em logs.
- Bonificação, análise técnica, pendência documental, tentativa, retificação, nota fiscal, bem e inventário permanecem dimensões relacionadas, porém não intercambiáveis.
- Novo envio não resolve pendência; reanálise positiva resolve; reanálise negativa reabre a providência.
- Pendência e retificação não alteram automaticamente bonificação ou análise técnica.
- `Aberta` e `Aguardando reanálise` permanecem estados ativos; não existe estado canônico `Vencida`.
- Indicadores operacionais podem se sobrepor e não devem ser somados como universos mutuamente exclusivos.
- A exportação Excel aprovada permanece referência congelada; qualquer alteração exige auditoria própria, comparação estrutural e autorização.
- Não introduzir framework, biblioteca ou reescrita ampla apenas por modernidade. Toda dependência nova exige justificativa funcional, análise de alternativas, impacto de bundle, manutenção, acessibilidade, segurança e reversibilidade.
- Mudança visual material exige evidência do estado atual, proposta visual prévia e aprovação antes da implementação.
- Quando houver dúvida material sobre intenção, regra de negócio, hierarquia da informação, permissão, fluxo ou decisão visual deliberada, o agente deve parar e formular pergunta específica.
- A ausência de mudança é resultado válido quando a auditoria concluir que a solução atual já é adequada ou superior às alternativas.
- Produção somente pode ser alterada após Preview correspondente ao HEAD validado e autorização expressa.

---

## 1. Estado de referência e linha de base

### 1.1 Fonte de verdade

A execução deve iniciar sempre pela leitura combinada de:

1. orientação expressa mais recente do responsável;
2. `docs/README.md`;
3. `docs/handoff/PR22_FINAL_GATE_REPORT_2026-07-14.md`;
4. referências canônicas indicadas em `docs/reference/STATUS_DOCUMENTOS.md`;
5. especificações e planos mais recentes do pacote em execução;
6. implementação e testes vigentes.

Documentos históricos permanecem úteis para rastreabilidade, mas não reabrem decisões posteriores consolidadas.

### 1.2 Baseline técnica

- Baseline funcional do PR 22: commit `815842b75ddbd8d4413f724497cd97b7a14409a6`.
- HEAD de `main` na elaboração deste plano: `b25aeda9f6eef3ba3f06069d45dfeb574c9979d9`.
- Os commits posteriores ao merge do PR 22 ligados à captura efêmera da auditoria global não alteram o produto funcional.
- Produção oficial permanece no deployment local anteriormente publicado.
- `dataMode: "local"`;
- `supabaseRepositoryEnabled: false`;
- URL e chave publicável vazias;
- nenhuma conexão Supabase remota ativa.

### 1.3 Classificação obrigatória dos achados

Todo apontamento deve receber uma destas classificações antes de entrar no backlog:

| Código | Classificação | Conduta |
|---|---|---|
| `CP` | Correto e protegido | preservar; acrescentar teste apenas quando a proteção for insuficiente |
| `ID` | Intencional e deliberado | documentar; não alterar sem nova decisão |
| `FA` | Funcional e aprimorável | propor evolução com benefício demonstrável |
| `IC` | Inconsistente ou duplicado | consolidar somente após mapear dependências |
| `DC` | Defeito comprovado | corrigir com teste de regressão |
| `DQ` | Dúvida de produto/regra | perguntar antes de implementar |
| `DF` | Dependente de etapa futura | planejar no ciclo adequado; não tratar como falha atual |
| `EP` | Evolução posterior | manter no roadmap sem bloquear etapas essenciais |

Nenhum item pode ser classificado apenas por preferência estética, padrão genérico de mercado ou opinião isolada sobre arquitetura.

---

## 2. Definição de evolução comprovável

Uma alteração somente será considerada evolução quando:

1. resolver um problema observado, reduzir risco ou melhorar capacidade necessária;
2. explicar a consequência positiva para usuários, operação ou manutenção;
3. preservar explicitamente regras, dados e capacidades que não pertencem ao escopo;
4. possuir evidência anterior e posterior comparável;
5. passar pelos testes pertinentes ao impacto;
6. ser reversível ou possuir rollback documentado;
7. não introduzir complexidade desproporcional ao ganho.

### 2.1 Quadro obrigatório de valor

Cada proposta deve conter:

| Campo | Conteúdo obrigatório |
|---|---|
| Situação atual | comportamento observado e evidência |
| Decisão existente | regra, motivo conhecido ou hipótese que ainda precisa de confirmação |
| Problema real | efeito negativo constatado; não usar termos vagos como “antigo” |
| Evolução proposta | mudança funcional e técnica |
| Resultado esperado | benefício concreto para o trabalho real |
| Preservações | regras, informações, ações e estados que não podem mudar |
| Riscos | regressões possíveis e mitigação |
| Evidência de sucesso | teste, captura, métrica ou homologação que comprovará o ganho |

### 2.2 Critério de não regressão multidimensional

A proposta deve melhorar pelo menos uma dimensão e não degradar materialmente as demais:

- correção funcional;
- aderência institucional;
- clareza;
- encontrabilidade;
- esforço cognitivo;
- produtividade;
- acessibilidade;
- responsividade;
- desempenho;
- segurança e privacidade;
- rastreabilidade;
- manutenibilidade;
- observabilidade;
- reversibilidade.

Quando houver trade-off real, ele deve ser apresentado ao responsável antes da implementação.

---

## 3. Protocolo obrigatório de cada pacote

Nenhum pacote técnico pode iniciar diretamente pela edição de código.

### Gate 0 — isolamento e preflight

**Objetivo:** garantir que o agente conhece o ponto exato de partida e não mistura trabalhos.

**Ações obrigatórias:**

```bash
git status --short
git branch --show-current
git log -5 --oneline
git diff --stat
git diff
npm ci
npm run check
npm run test:unit
npm run test:integration
npm run audit:functional
```

Executar também `npm run test:readiness` quando o pacote tocar persistência, serviços, contratos, configuração, Supabase, migração, autenticação ou permissões.

**Resultado esperado:** working tree conhecida, baseline verde ou falhas preexistentes registradas antes da mudança.

### Gate 1 — auditoria específica do estado atual

Criar:

```text
docs/audits/YYYY-MM-DD-<pacote>-estado-atual.md
```

O documento deve cobrir:

- objetivo institucional;
- perfis usuários;
- tarefa real do usuário;
- fluxo completo;
- regras de negócio;
- estados;
- dados de entrada, transformação e saída;
- telas e componentes;
- conexões com outros módulos;
- permissões;
- comportamento desktop, Android e iPhone;
- acessibilidade;
- testes existentes;
- decisões documentadas;
- pontos fortes;
- problemas comprovados;
- riscos de alteração;
- itens cuja intenção não pôde ser confirmada.

**Regra:** o agente deve executar o fluxo real e ler código, testes e documentos. Não é suficiente inferir pelo nome dos arquivos.

### Gate 2 — matriz de preservação e decisão

Criar no mesmo documento:

| Elemento | Estado atual | Classificação | Evidência | Conduta |
|---|---|---|---|---|
| regra/fluxo/componente | descrição | `CP/ID/FA/IC/DC/DQ/DF/EP` | teste, captura, código ou documento | preservar, perguntar, corrigir ou propor |

A matriz deve listar também efeitos derivados e combinações válidas que uma simplificação visual poderia ocultar.

### Gate 3 — alternativas e proposta

Para itens `FA`, `IC` ou `DC`:

- apresentar duas ou três abordagens quando houver decisão relevante;
- explicar custo, risco, benefício e impacto sobre o produto;
- recomendar uma opção;
- registrar o resultado esperado em linguagem funcional;
- não escolher biblioteca antes de definir a capacidade necessária.

### Gate 4 — aprovação visual

Obrigatório para mudança material em:

- Dashboard;
- Carteira;
- Competências;
- Pendências;
- Prontuário;
- navegação;
- tabelas e filtros;
- hierarquia de páginas;
- cards;
- modais e painéis;
- módulos administrativos;
- estados vazios, carregamento e erro.

Evidências mínimas:

```text
docs/evidence/<pacote>/before/
docs/evidence/<pacote>/proposal/
docs/evidence/<pacote>/after/
```

A proposta deve incluir, conforme aplicável:

- desktop;
- Android;
- iPhone;
- estado padrão;
- estado filtrado;
- estado vazio;
- conteúdo extenso;
- erro;
- carregamento;
- foco/teclado quando relevante.

A imagem deve ser acompanhada de explicação sobre hierarquia, densidade, ações, informações preservadas e consequência positiva. Não basta apresentar uma tela “mais bonita”.

### Gate 5 — aprovação humana

O agente deve perguntar antes de implementar quando a proposta:

- remove, oculta ou reordena informação relevante;
- altera interpretação de indicador;
- muda regra, estado, permissão ou efeito derivado;
- substitui fluxo aprovado;
- modifica nomenclatura institucional;
- altera layout de forma material;
- cria dependência estrutural;
- exige escolha entre alternativas com trade-off;
- toca dúvida marcada como `DQ`.

A pergunta deve ser específica e conter contexto, alternativas e consequência.

### Gate 6 — plano técnico derivado

Criar:

```text
docs/superpowers/specs/YYYY-MM-DD-<pacote>-design.md
docs/superpowers/plans/YYYY-MM-DD-<pacote>.md
```

O plano técnico deve:

- indicar caminhos exatos;
- definir interfaces;
- usar TDD;
- dividir em entregas revisáveis;
- prever commits pequenos;
- listar comandos e resultados esperados;
- incluir rollback;
- limitar o escopo ao problema aprovado.

### Gate 7 — implementação

Regras:

- worktree e branch isolados;
- PR em rascunho;
- teste falhando antes da correção quando aplicável;
- menor alteração capaz de entregar o resultado aprovado;
- não refatorar áreas adjacentes sem relação comprovada;
- não misturar mudança visual ampla com alteração de dados/segurança, salvo necessidade técnica explícita;
- preservar formulários preenchidos após falha;
- impedir duplo envio;
- não deixar loading preso; desligar em `finally`;
- manter mensagens funcionais específicas.

### Gate 8 — validação antes/depois

Executar conforme impacto:

```bash
npm run check
npm run test:unit
npm run test:integration
npm run audit:functional
npm run test:e2e
npm run test:mobile
npm run test:readiness
npm audit --audit-level=high
```

Além dos comandos:

- repetir exatamente os fluxos do Gate 1;
- comparar capturas;
- testar perfis afetados;
- testar teclado, foco e `Escape`;
- executar axe nas superfícies alteradas;
- conferir console e `pageerror`;
- confirmar que filtros, contexto, rolagem e retorno funcionam;
- testar dados vazios, extensos, inválidos e conflitos;
- provar preservação das regras listadas.

### Gate 9 — Preview e homologação

- criar Preview correspondente exatamente ao HEAD;
- validar HTTP, console, logs e modo de dados;
- anexar capturas antes/depois ao PR;
- descrever benefício funcional obtido;
- descrever o que foi preservado;
- registrar limitações remanescentes;
- manter PR em rascunho até os gates obrigatórios passarem.

### Gate 10 — merge e produção

- nenhum auto-merge;
- merge somente após autorização;
- não apagar branch nem fechar trabalho antes da confirmação;
- produção somente após autorização expressa;
- deployment de produção deve corresponder ao commit aprovado;
- realizar smoke pós-publicação;
- registrar rollback disponível.

---

## 4. Governança visual

### 4.1 Regra de preservação

O design existente deve ser tratado como sistema institucional em evolução, não como material descartável. A análise deve separar:

- identidade visual aprovada;
- solução funcional correta;
- limitação técnica;
- inconsistência entre módulos;
- preferência subjetiva.

### 4.2 Critérios para aprovar uma mudança visual

A proposta deve demonstrar:

- melhor hierarquia;
- menor esforço para localizar ação ou informação;
- densidade adequada;
- leitura mais rápida;
- continuidade entre telas;
- responsividade real;
- contraste e foco;
- preservação de dados e ações;
- coerência com as melhores superfícies atuais.

### 4.3 Comparação obrigatória

| Evidência | Pergunta |
|---|---|
| Antes | qual problema está visível? |
| Proposta | como o problema será resolvido? |
| Depois | a implementação corresponde à proposta? |
| Fluxo | o usuário executa a tarefa com menos esforço? |
| Preservação | alguma capacidade anterior foi perdida? |
| Mobile | a solução funciona sem depender da tabela desktop? |
| Acessibilidade | teclado, foco, leitura e movimento reduzido permanecem adequados? |

### 4.4 Movimento

Animação só será adotada para explicar continuidade, atualização ou mudança de estado. Deve:

- ser curta;
- não bloquear;
- respeitar `prefers-reduced-motion`;
- não esconder atraso;
- não ser usada como substituto de feedback textual.

---

## 5. Governança de dependências e arquitetura

### 5.1 Princípio capacidade antes de pacote

A decisão deve seguir:

```text
problema observado
→ capacidade necessária
→ alternativas compatíveis
→ protótipo/benchmark
→ decisão
→ dependência, componente próprio ou nenhuma mudança
```

### 5.2 Avaliação obrigatória de dependência

Toda nova dependência deve documentar:

- capacidade entregue;
- por que a solução atual é insuficiente;
- alternativas sem dependência;
- compatibilidade com JavaScript/HTML/CSS atuais;
- tamanho e carregamento;
- manutenção e comunidade;
- acessibilidade;
- segurança;
- licença;
- lockfile;
- estratégia de remoção;
- impacto sobre testes e CSP.

### 5.3 Migração de framework

Não faz parte do escopo presumido. Só poderá ser considerada em plano autônomo se houver evidência de que:

- a arquitetura atual impede objetivos prioritários;
- a migração possui benefício superior ao custo;
- existe estratégia incremental;
- funcionalidades e regras podem ser preservadas;
- o usuário aprova expressamente o investimento e os riscos.

---

## 6. Trilhas e dependências

O programa será executado em três trilhas coordenadas.

### Trilha P — produto e experiência

- Ciclo A — linha de base, classificação e contratos;
- Ciclo B — consolidação do frontend;
- Ciclo C — navegação e encontrabilidade;
- Ciclo D — produtividade operacional;
- Ciclo E — paridade dos módulos.

### Trilha S — Supabase remoto

- Ciclo F — implantação, dados, Auth/RLS, segurança e homologação remota.

### Trilha O — operação e inteligência

- Ciclo G — segurança de entrega, desempenho e observabilidade;
- Ciclo H — inteligência operacional e apoio à decisão.

### 6.1 Dependências reais

- Ciclo A precede todos os demais.
- B, C, D e E não precisam terminar integralmente para começar F.
- F1–F3 podem começar após A2, desde que não exista mudança pendente no contrato de dados correspondente.
- F4, importação real, depende da classificação e aprovação dos dados.
- F6, ativação de produção, depende de homologação remota, backup/restauração, segurança, usuários e autorização expressa.
- Melhorias visuais não críticas não bloqueiam a conexão remota.
- Alterações que mudem schema, contrato, permissão ou semântica de dados bloqueiam somente a etapa remota afetada.
- G1, hardening de entrega, deve anteceder F6.
- H somente começa após estabilidade dos dados e observabilidade mínima.

---

# Ciclo A — Linha de base, classificação e contratos

**Objetivo:** criar uma base comum e verificável para todas as evoluções, sem alterar comportamento funcional.

**Arquivos principais a analisar:**

- `docs/README.md`;
- `docs/reference/STATUS_DOCUMENTOS.md`;
- `docs/handoff/PR22_FINAL_GATE_REPORT_2026-07-14.md`;
- `README.md`;
- `app.js`;
- `index.html`;
- `styles.css`;
- `config.js`;
- `config.runtime.js`;
- `src/domain/**`;
- `src/application/**`;
- `src/data/**`;
- `src/integration/**`;
- `src/styles/**`;
- `tests/**`;
- `.github/workflows/**`;
- `vercel.json`;
- `supabase/**`.

## A1 — Registro de decisões e fronteiras

**Produzir:**

```text
docs/reference/PRODUCT_DECISIONS.md
docs/reference/CHANGE_CLASSIFICATION.md
```

Conteúdo:

- decisões canônicas;
- decisões visuais aprovadas;
- regras de negócio imutáveis sem autorização;
- áreas abertas a evolução;
- questões dependentes do Supabase;
- itens congelados;
- histórico de decisões substituídas.

**Resultado esperado:** impedir que novos agentes reabram decisões ou confundam etapa futura com defeito atual.

## A2 — Classificação de dados e ambientes

**Produzir:**

```text
docs/reference/DATA_CLASSIFICATION_AND_ENVIRONMENTS.md
docs/audits/YYYY-MM-DD-dados-e-ambientes-estado-atual.md
```

Mapear:

- dados institucionais;
- dados pessoais ou de contato;
- dados operacionais;
- fixtures;
- dados de demonstração;
- configuração;
- credenciais;
- logs;
- snapshots de migração;
- local;
- teste;
- Preview;
- produção.

Distinguir:

1. exposição existente no repositório/bundle atual;
2. proteção que será resolvida por backend e RLS remotos;
3. política de minimização e acesso;
4. necessidade eventual de saneamento de histórico Git;
5. dados que podem existir em fixtures públicas;
6. dados que só podem existir em ambiente protegido.

**Resultado esperado:** resolver riscos atuais sem atribuir ao frontend a responsabilidade das proteções que pertencem à implantação final do Supabase.

## A3 — Inventário funcional e visual

**Produzir:**

```text
docs/audits/YYYY-MM-DD-inventario-global-produto.md
docs/reference/PRODUCT_SURFACE_CATALOG.md
docs/evidence/global-baseline/
```

Catalogar:

- Dashboard;
- Carteira;
- Competências;
- Pendências;
- Prontuário;
- Inventário;
- Registros Internos;
- Configurações SME;
- Equipe;
- exercícios e programas;
- alertas;
- busca;
- exportações;
- autenticação;
- modais;
- formulários;
- tabelas;
- estados vazios;
- mobile.

Para cada superfície:

- finalidade;
- perfis;
- entrada e saída;
- regras;
- conexões;
- maturidade;
- pontos fortes;
- inconsistências;
- testes;
- capturas desktop/mobile;
- classificação `CP/ID/FA/IC/DC/DQ/DF/EP`.

**Resultado esperado:** nenhuma evolução futura começa de impressão parcial ou memória.

## A4 — Contratos transversais de experiência

**Produzir especificação, sem substituir componentes antes da aprovação:**

```text
docs/superpowers/specs/YYYY-MM-DD-contratos-transversais-experiencia-design.md
```

Definir contratos para:

- loading;
- sucesso;
- erro;
- alerta;
- confirmação crítica;
- conflito;
- sessão expirada;
- indisponibilidade;
- formulário alterado;
- salvamento;
- estado vazio;
- foco;
- modal;
- menu;
- tooltip;
- painel lateral.

**Resultado esperado:** os ciclos posteriores convergem para o mesmo comportamento, em vez de criar novas soluções paralelas.

## A5 — Backlog priorizado e planos derivados

Classificar cada pacote por:

- urgência;
- impacto;
- dependência;
- risco;
- esforço;
- necessidade de aprovação visual;
- relação com Supabase.

Criar o plano detalhado do primeiro pacote aprovado do Ciclo B ou, se a classificação indicar maior urgência, do item crítico correspondente.

### Critérios de aceite do Ciclo A

- nenhuma lógica funcional alterada;
- decisões e dependências documentadas;
- dados e ambientes classificados;
- superfícies capturadas;
- pontos fortes protegidos;
- dúvidas materiais apresentadas;
- backlog sem duplicidade;
- separação explícita entre pendência atual e etapa futura;
- plano técnico seguinte aprovado.

---

# Ciclo B — Consolidação do frontend

**Objetivo:** reduzir a arquitetura acumulativa do frontend sem reescrever o produto nem alterar regras aprovadas.

## B1 — Grafo de carregamento e precedência

Auditar:

- `config.js`;
- `styles.css`;
- `src/styles/mobile-responsive.css`;
- `src/styles/mobile-rendering-hotfix.css`;
- `src/styles/task-9-pendencias.css`;
- `src/styles/task-9-cross-view.css`;
- `src/styles/task-10-11-pendency-actions.css`;
- `src/styles/task-12-13-retificacoes.css`;
- `src/styles/cycle-b-carteira.css`;
- `src/styles/cycle-b-dashboard.css`;
- `src/styles/cycle-b-dashboard-final.css`;
- scripts carregados dinamicamente.

Produzir:

```text
docs/architecture/frontend-load-order.md
docs/audits/YYYY-MM-DD-frontend-precedencia-estado-atual.md
```

Identificar regras ativas, superadas, duplicadas e dependentes de ordem.

**Resultado esperado:** saber o que pode ser consolidado sem alterar a aparência efetiva.

## B2 — Tokens e componentes básicos

Consolidar somente após comparação visual:

- cores;
- tipografia;
- espaçamento;
- raios;
- sombras;
- estados;
- foco;
- botões;
- campos;
- cards;
- chips;
- tabelas;
- títulos.

Não alterar identidade por gosto. Corrigir inconsistência comprovada e criar fonte única.

## B3 — Interações compartilhadas

Consolidar:

- modal;
- alert dialog;
- menu;
- dropdown;
- painel;
- tooltip;
- região de mensagens;
- controle de foco;
- `Escape`;
- clique externo;
- restauração de foco.

Substituir `alert()` e `confirm()` por etapas, preservando confirmação explícita em ações críticas.

## B4 — Decomposição controlada de `app.js`

A decomposição ocorre apenas nas responsabilidades tocadas por um pacote aprovado. Prioridades potenciais:

- navegação;
- renderização de páginas;
- formulários;
- mensagens;
- tabelas;
- dados iniciais;
- estado de interface.

Cada extração exige:

- teste antes;
- interface explícita;
- compatibilidade;
- ausência de mudança funcional;
- remoção da implementação antiga somente após equivalência.

## B5 — Remoção de camadas superadas

Só remover arquivo/regra quando:

- o comportamento efetivo estiver coberto;
- capturas forem equivalentes ou aprovadas;
- E2E passar;
- não houver seletor consumidor;
- a ordem de carregamento não for mais necessária;
- rollback estiver documentado.

### Critérios de aceite do Ciclo B

- menos fontes concorrentes de estilo e comportamento;
- nenhum fluxo ou informação removido;
- modais e mensagens consistentes;
- redução mensurável de duplicação;
- testes desktop/mobile verdes;
- comparação visual aprovada;
- sem migração ampla de framework.

---

# Ciclo C — Navegação e encontrabilidade

**Objetivo:** tornar o contexto operacional recuperável, compartilhável e previsível.

## C1 — Contrato central de navegação

Modelar:

```text
view
schoolId
competence
programId
documentKey
pendencyId
tab
filters
sort
origin
scrollAnchor
```

A especificação deve definir serialização, validação, defaults e compatibilidade.

## C2 — URL e histórico

Avaliar History API, query string e fragmento sem presumir framework.

Entregar:

- links diretos;
- botão voltar;
- atualização sem perda de contexto;
- estado inválido tratado;
- título de documento;
- preservação de filtros;
- restauração de rolagem.

## C3 — Busca global

Auditar o uso real e apresentar proposta visual para:

- resultados por nome;
- designação;
- INEP;
- tipo de resultado;
- ação principal;
- vazio;
- múltiplas correspondências;
- teclado.

## C4 — Breadcrumbs e contexto

Mostrar com clareza:

- exercício;
- competência;
- escola;
- programa;
- documento;
- origem;
- filtro ativo.

Evitar repetir informação sem benefício.

## C5 — Retorno ao trabalho

Garantir retorno à:

- mesma tela;
- mesma aba;
- mesmos filtros;
- mesma ordenação;
- mesma posição;
- mesmo item de origem.

### Critérios de aceite do Ciclo C

- rotas/estados inválidos falham com segurança;
- links podem ser compartilhados;
- voltar/avançar funciona;
- refresh preserva contexto suportado;
- busca orienta ação;
- comportamento mobile homologado;
- nenhum dado sensível é exposto indevidamente na URL.

---

# Ciclo D — Produtividade operacional

**Objetivo:** reduzir procura, cliques repetidos e esforço cognitivo nas superfícies mais usadas.

Cada subpacote exige auditoria e proposta visual autônomas.

## D1 — Dashboard

Avaliar:

- hierarquia dos indicadores;
- sobreposição entre universos;
- seleção e filtros;
- lista resultante;
- próximas ações;
- urgência;
- estados vazios;
- contexto de competência;
- coerência por perfil.

Preservar a distinção entre pendências abertas e aguardando reanálise.

## D2 — Carteira

Avaliar:

- tabela desktop de alta largura;
- colunas essenciais e secundárias;
- ordenação;
- filtros combinados;
- colunas configuráveis;
- densidade;
- cabeçalho fixo;
- ações em lote;
- persistência de preferências;
- cartões mobile;
- última movimentação;
- próxima ação.

Não remover dados aprovados sem decisão. A evolução pode usar revelação progressiva ou personalização, desde que comparação entre escolas permaneça adequada ao trabalho real.

## D3 — Competências

Avaliar:

- bonificação;
- análise;
- pendência;
- programa;
- documento;
- bloqueios;
- lançamentos em lote;
- prazos;
- leitura horizontal;
- retorno ao prontuário.

## D4 — Pendências

Avaliar:

- quatro filas;
- filtros;
- novo envio;
- reanálise;
- contato;
- cancelamento;
- reabertura;
- retificação;
- estados vazios;
- orientação de próxima ação;
- preservação de contexto.

## D5 — Prontuário

Avaliar:

- hierarquia;
- competência;
- programas;
- documentos;
- notas;
- bens;
- pendências;
- histórico;
- ações;
- densidade;
- leitura por perfil;
- retorno à origem.

### Critérios de aceite do Ciclo D

- tarefas principais executadas com menos esforço comprovado;
- filtros e resultados coerentes;
- informação integral preservada;
- ações críticas claras;
- estados vazios orientativos;
- desktop e mobile aprovados;
- regras de domínio inalteradas salvo autorização específica;
- testes por perfil e fluxo.

---

# Ciclo E — Paridade dos módulos

**Objetivo:** elevar áreas intermediárias ou básicas ao padrão funcional e visual das melhores superfícies.

Ordem inicial, sujeita ao Ciclo A:

1. Capital e Inventário;
2. Registros Internos;
3. Configurações SME;
4. Gestão de Equipe;
5. exercícios e programas;
6. alertas;
7. exportações e relatórios.

Para cada módulo:

- reconstruir propósito;
- identificar usuário e decisão;
- definir informação principal;
- mapear próxima ação;
- revisar formulários;
- revisar permissões;
- revisar histórico;
- revisar estados vazios;
- revisar mobile;
- revisar ajuda contextual;
- validar conexões com os demais módulos.

### Regra para Excel

A exportação aprovada só entra no escopo quando houver necessidade comprovada. Qualquer mudança deve comparar:

- planilhas;
- abas;
- colunas;
- tipos;
- fórmulas;
- estilos;
- metadados;
- filtros;
- congelamentos;
- conteúdo;
- compatibilidade com Excel.

### Critérios de aceite do Ciclo E

- linguagem visual e operacional coerente;
- nenhum módulo tratado apenas como “página administrativa” sem tarefa clara;
- formulários consistentes;
- permissões respeitadas;
- ajuda contextual disponível onde a complexidade exigir;
- testes e capturas equivalentes aos módulos centrais.

---

# Ciclo F — Implantação remota do Supabase

**Objetivo:** ativar em ambiente remoto a arquitetura já preparada, com dados, usuários, permissões, operação e recuperação homologados.

**Importante:** este ciclo não corrige uma arquitetura ausente. Ele executa a etapa remota deliberadamente deixada para depois do Gate de Pré-conexão.

## F1 — Projeto e Preview

- criar ou selecionar projeto autorizado;
- registrar `project_ref` com segurança;
- configurar Vercel Preview;
- usar somente URL e chave publicável no frontend;
- manter produção em modo local;
- validar extensões e versões.

## F2 — Migrations remotas

- aplicar as 12 migrations na ordem;
- comparar schema;
- validar funções, grants, RLS e extensões;
- executar smoke;
- registrar versão;
- não criar seed automático.

## F3 — Usuários, perfis e escopos

- criar usuários reais de homologação;
- vincular perfis;
- configurar escopos;
- validar usuário inativo e sem perfil;
- validar leitura e escrita;
- validar negações;
- habilitar MFA para perfis privilegiados conforme política aprovada.

## F4 — Dados e migração controlada

- usar cópia autorizada;
- aplicar classificação do Ciclo A;
- minimizar dados;
- exportar snapshot;
- validar;
- planejar;
- staging;
- lotes;
- checkpoint;
- reconciliação;
- promoção;
- reconciliação do destino;
- rollback.

A política de dados deve definir o que pode ser usado em Preview e quem pode acessar.

## F5 — Segurança e operação

- Security Advisor;
- Performance Advisor;
- backups;
- restauração testada;
- logs;
- alertas;
- política de incidentes;
- política de rotação;
- limites e capacidade;
- latência.

## F6 — Homologação e ativação

Homologar:

- cinco perfis;
- desktop;
- Android;
- iPhone;
- falha de rede;
- sessão expirada;
- conflito otimista;
- RLS;
- importação;
- rollback;
- volume realista.

Produção só será ativada após:

1. Preview aprovado;
2. backup e restauração comprovados;
3. usuários e permissões aprovados;
4. migração ensaiada;
5. rollback disponível;
6. observabilidade mínima;
7. autorização expressa.

### Critérios de aceite do Ciclo F

- Supabase remoto efetivamente conectado e comprovado;
- nenhuma credencial privilegiada exposta;
- RLS e perfis reais validados;
- dados reconciliados;
- backup/restauração testados;
- produção ativada apenas quando autorizada;
- local/rollback preservados pelo período definido.

---

# Ciclo G — Segurança de entrega, desempenho e observabilidade

**Objetivo:** tornar a operação mensurável, diagnosticável e resiliente.

## G1 — Hardening da entrega web

Auditar e definir:

- Content Security Policy;
- `frame-ancestors`;
- referrer;
- permissões do navegador;
- recursos externos;
- fontes;
- cache;
- versionamento de assets;
- integridade;
- exposição em logs;
- headers Vercel.

Deve anteceder ativação remota de produção quando o risco for aplicável.

## G2 — Erros e saúde

Implementar solução aprovada para:

- erros não tratados;
- `pageerror`;
- falhas de rede;
- falhas por fluxo;
- correlação sem conteúdo sensível;
- alertas operacionais;
- retenção;
- acesso aos logs.

## G3 — Desempenho

Medir:

- carregamento;
- Web Vitals;
- tempo de interação;
- volume de JS/CSS;
- renderização de tabelas;
- filtros;
- importação;
- latência remota.

Definir budgets somente após baseline.

## G4 — Métricas de produto

Coletar apenas métricas aprovadas e minimizadas:

- uso de superfícies;
- conclusão de fluxos;
- erros de validação;
- tempo de tarefas;
- abandono;
- uso de busca e filtros;
- dispositivo.

Não registrar conteúdo institucional desnecessário.

### Critérios de aceite do Ciclo G

- falhas reais podem ser diagnosticadas;
- métricas possuem finalidade;
- dados de telemetria são minimizados;
- desempenho tem baseline e budgets;
- alertas não geram ruído indiscriminado;
- políticas documentadas.

---

# Ciclo H — Inteligência operacional e apoio à decisão

**Objetivo:** usar dados estáveis para antecipar risco e apoiar gestão, sem automatizar indevidamente decisões humanas.

Candidatos sujeitos a nova análise:

- reincidência de pendências;
- risco de atraso;
- carga por controlador;
- gargalos por programa;
- tempo de reanálise;
- volume por competência;
- padrões de retificação;
- progresso de inventário;
- alertas antecipados;
- comparação entre exercícios;
- relatórios gerenciais.

Cada indicador deve definir:

- pergunta que responde;
- população;
- fórmula;
- granularidade;
- atualização;
- filtros;
- limitações;
- interpretação;
- ação esperada;
- risco de leitura equivocada;
- validação com usuário real.

### Critérios de aceite do Ciclo H

- nenhum indicador sem decisão associada;
- fórmulas auditáveis;
- sobreposição explicitada;
- rastreabilidade até o dado de origem;
- incerteza comunicada;
- decisão humana preservada.

---

## 7. Estratégia de PRs e releases

### 7.1 Unidade de mudança

- uma finalidade principal por PR;
- um pacote revisável;
- evitar misturar frontend visual, schema, migração e segurança;
- dependências explícitas entre PRs;
- commits pequenos e semânticos;
- documentação no mesmo PR da mudança.

### 7.2 Descrição obrigatória do PR

```markdown
## Situação atual
## Evidências
## Problema comprovado
## Decisões preservadas
## Evolução proposta
## Resultado esperado
## Mudanças
## Testes
## Comparação visual
## Riscos
## Rollback
## Fora do escopo
## Perguntas/decisões humanas
```

### 7.3 Gates

O PR não sai de rascunho sem:

- auditoria atual;
- matriz de preservação;
- dúvida material resolvida;
- visual aprovado quando aplicável;
- testes pertinentes;
- Preview do mesmo HEAD;
- descrição atualizada;
- ausência de segredo;
- documentação coerente.

### 7.4 Produção

- produção não é consequência automática do merge;
- autorização é separada;
- deployment exato do commit aprovado;
- smoke pós-publicação;
- verificação por perfil quando aplicável;
- rollback documentado;
- registro de resultado.

---

## 8. Testes mínimos por tipo de mudança

| Mudança | Testes mínimos |
|---|---|
| somente documentação | links, coerência, revisão de precedência |
| CSS não material | capturas afetadas, desktop/mobile, foco |
| layout material | visual antes/proposta/depois, E2E, axe, desktop/Android/iPhone |
| navegação | History/URL, refresh, back/forward, filtros, scroll, deep link |
| formulário | validação, primeiro erro, preservação, loading, duplo envio, falha |
| regra de domínio | unitário, integração, E2E, casos de precedência |
| persistência/serviço | unitário, integração, auditoria funcional, readiness |
| Supabase/schema/RLS | migrations, pgTAP, lint, Auth/RLS, E2E local/remoto |
| Excel | testes de workbook, integração, abertura real e comparação congelada |
| segurança | testes negativos, headers, segredo, CSP, logs |
| desempenho | baseline e comparação com cenário idêntico |

---

## 9. Critérios de pausa obrigatória

O agente deve interromper e consultar o responsável quando:

- a documentação e o comportamento divergem sem fonte clara;
- duas decisões recentes são incompatíveis;
- o ganho exige retirar capacidade;
- a mudança visual possui alternativas com consequências diferentes;
- a interpretação de indicador pode mudar;
- dados ou permissões não têm classificação;
- a solução exige dependência estrutural;
- o escopo cresce para além do PR;
- o teste revela regra não documentada;
- o plano do pacote não cobre um efeito derivado;
- produção, merge ou ativação remota exigem autorização.

O agente não deve interromper por dúvidas técnicas triviais que podem ser resolvidas por leitura, teste ou protótipo seguro.

---

## 10. Critérios para encerrar um pacote

Um pacote só está concluído quando o relatório final responde:

1. Como funcionava antes?
2. Qual decisão foi preservada?
3. Qual problema foi comprovado?
4. O que mudou?
5. Qual consequência positiva foi obtida?
6. Como a melhoria foi demonstrada?
7. Quais regras e capacidades foram preservadas?
8. Quais testes passaram?
9. Qual Preview corresponde ao HEAD?
10. Que riscos ou itens posteriores permanecem?
11. Qual é o rollback?
12. Houve autorização para merge e, separadamente, para produção?

Produzir:

```text
docs/handoff/YYYY-MM-DD-<pacote>-final-report.md
```

---

## 11. Sequência inicial recomendada

```text
A1 Registro de decisões
   ↓
A2 Dados e ambientes
   ↓
A3 Inventário funcional e visual
   ↓
A4 Contratos transversais
   ↓
A5 Backlog priorizado
   ├──────────────→ F1/F2 Supabase Preview e migrations remotas
   ↓
B Consolidação do frontend
   ↓
C Navegação e encontrabilidade
   ↓
D Produtividade operacional
   ↓
E Paridade dos módulos
```

Em paralelo controlado:

```text
F3 usuários/RLS
→ F4 ensaio de migração
→ G1 hardening
→ F5 operação
→ F6 ativação autorizada
```

Depois da estabilidade:

```text
G2–G4 observabilidade e desempenho
→ H inteligência operacional
```

A ordem interna dos pacotes B–E poderá ser alterada pelo backlog do Ciclo A quando houver maior impacto ou risco comprovado. A alteração da ordem deve ser documentada, não improvisada.

---

## 12. Primeira ação após aprovação deste Plano Diretor

Criar a especificação e o plano técnico do **Ciclo A — Linha de base, classificação e contratos**, sem editar comportamento funcional.

Arquivos previstos:

```text
docs/superpowers/specs/2026-07-14-ciclo-a-linha-base-classificacao-design.md
docs/superpowers/plans/2026-07-14-ciclo-a-linha-base-classificacao.md
```

O plano do Ciclo A deverá dividir A1–A5 em PRs ou entregas revisáveis, indicar fontes exatas, comandos, capturas e critérios de aceite. Somente após a aprovação desse plano começam as alterações documentais do Ciclo A.

---

## 13. Autorrevisão deste Plano Diretor

### Cobertura

- análise prévia obrigatória: coberta nos Gates 0–2;
- proteção contra regressão: coberta nas matrizes, testes e comparação antes/depois;
- evolução sem conservadorismo: coberta pela definição de evolução e possibilidade de melhorar soluções funcionais;
- consulta em dúvida material: coberta no Gate 5 e critérios de pausa;
- explicação de resultado positivo: coberta no quadro de valor e descrição de PR;
- imagens antes de mudanças visuais: coberta no Gate 4 e governança visual;
- distinção entre Supabase futuro e falha atual: coberta na linha de base, classificação `DF`, trilhas e Ciclo F;
- implementação incremental: coberta por pacotes e PRs de finalidade única;
- produção controlada: coberta nos Gates 9–10 e estratégia de releases;
- observabilidade e inteligência: cobertas nos Ciclos G e H.

### Limite deliberado

Este documento governa o programa completo, mas não substitui os planos técnicos de cada pacote. Isso é intencional: arquivos, interfaces e código só podem ser definidos com precisão depois da auditoria específica exigida por este próprio plano.
