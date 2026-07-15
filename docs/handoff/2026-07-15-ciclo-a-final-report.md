# Relatório final — Ciclo A pós-PR 22

## 1. Estado anterior

O Ciclo A partiu da `main` no commit `f85d0f23648f365b1f88378394914dae4ac85225`, que já continha o Gate de Pré-conexão Supabase, o Plano Diretor, produção oficial em `LocalStorageRepository`, modo `local`, 12 migrations, Auth/RLS comprovados localmente, migração reversível e as superfícies funcionais do RADAR.

O Supabase remoto não estava implantado: URL e chave publicável continuavam vazias, `supabaseRepositoryEnabled` permanecia `false` e nenhuma conexão remota estava ativa.

## 2. Escopo executado

Foram produzidos:

1. registro de decisões e fronteiras;
2. classificação obrigatória dos achados;
3. política de dados e ambientes;
4. inventário técnico determinístico;
5. catálogo de 18 superfícies;
6. auditoria global do produto;
7. linha de base visual reproduzível;
8. 16 contratos transversais de experiência;
9. backlog priorizado pós-PR 22;
10. ferramentas automatizadas de inventário, captura e validação;
11. este relatório de encerramento.

Não foram alterados comportamento, layout, regras, persistência, schema, migrations, Vercel, Supabase remoto ou produção.

## 3. Linha de base funcional

A linha de base preserva:

- unidade escolar como entidade monitorada;
- bonificação, análise técnica e pendência como dimensões independentes;
- quatro filas canônicas de pendências;
- novo envio, reanálise, contato, cancelamento, reabertura e retificação;
- notas fiscais de consumo, serviço e permanente;
- vínculo entre nota permanente, bem e inventário;
- auditoria administrativa;
- cinco perfis institucionais;
- exportação Excel aprovada;
- operação desktop, Android e iPhone;
- serviços de aplicação e contrato único de persistência.

Os testes permaneceram como fonte de verdade funcional. Nenhuma regra foi inferida apenas pela aparência da interface.

## 4. Decisões preservadas

[`PRODUCT_DECISIONS.md`](../reference/PRODUCT_DECISIONS.md) registra decisões e fronteiras de domínio, persistência, visual, navegação e governança.

Entre as principais:

- novo envio não resolve pendência;
- reanálise positiva resolve e negativa reabre;
- pendência e retificação não reescrevem automaticamente outras dimensões;
- não existe estado canônico `Vencida`;
- indicadores podem se sobrepor e não devem ser somados;
- produção permanece local até autorização expressa;
- Supabase remoto é etapa futura deliberada;
- mudança visual material exige proposta e aprovação;
- a ausência de alteração é resultado válido quando o estado atual já é adequado;
- merge e produção são autorizações distintas.

## 5. Dados e ambientes

[`DATA_CLASSIFICATION_AND_ENVIRONMENTS.md`](../reference/DATA_CLASSIFICATION_AND_ENVIRONMENTS.md) separa oito classes, de D0 a D7, e define conduta para Git, bundle, `localStorage`, teste, CI, Preview, homologação e produção.

### Achado crítico atual

O único defeito classificado como `DC` é a presença de dados D2 — pessoais ou de contato — no array `INITIAL_ESCOLAS`, entregue no repositório público e no bundle do navegador.

Esse risco independe do Supabase: RLS futura protegerá o banco remoto, mas não retirará automaticamente dados já incorporados ao JavaScript público.

### Atividades corretamente classificadas como futuras

Permanecem `DF`, e não falhas atuais:

- projeto Supabase remoto;
- Preview autorizado;
- migrations remotas;
- usuários reais;
- Auth/RLS remotos;
- migração de cópia controlada;
- Advisors;
- backup, restauração e MFA;
- ativação de produção.

### Dúvidas materiais

Dependem de decisão do responsável:

- retirar dados apenas da árvore ativa ou reescrever o histórico Git;
- quais campos de contato são necessários;
- qual é a fonte oficial;
- quais perfis podem consultar cada campo;
- como classificar e distribuir a exportação Excel.

## 6. Inventário técnico

O inventário reproduzível está em [`repository-inventory.json`](../evidence/global-baseline/repository-inventory.json).

A linha de base identificou:

- 12 serviços de aplicação;
- 9 módulos de dados e repositórios;
- 11 módulos de domínio;
- 17 integrações frontend;
- 9 folhas de estilo de extensão;
- 21 arquivos E2E anteriores ao Ciclo A;
- 12 migrations;
- 4 workflows permanentes;
- `app.js` com 11.286 linhas;
- `styles.css` com 2.758 linhas;
- 36 ocorrências de `onclick=` e 20 de `style=` no `index.html`;
- 17 chamadas ou wrappers de `alert`/`confirm` fora de vendors.

Esses números indicam concentração ou inconsistência potencial; não são defeitos automáticos. Qualquer decomposição continua sujeita à auditoria específica.

## 7. Catálogo e evidências visuais

[`PRODUCT_SURFACE_CATALOG.md`](../reference/PRODUCT_SURFACE_CATALOG.md) descreve 18 superfícies: Dashboard, Carteira, Competências, Pendências, Prontuário, Capital e Inventário, Registros Internos, Configurações SME, Gestão de Equipe, Exercícios, Programas, Alertas, Busca global, Excel, Autenticação, Modais e confirmações, Formulários e os estados vazios/loading/erro.

### Baseline visual

A execução `Cycle A visual baseline`, run `29427940698`, concluiu com sucesso em Node 24, Chromium e WebKit.

Foram geradas 24 capturas:

- 8 em desktop Chromium;
- 8 em Pixel 7/Chromium;
- 8 em iPhone 15/WebKit;
- 18 cenários do perfil Controlador;
- 6 cenários do perfil SME;
- nenhuma ocorrência de `pageerror` ou `console.error`.

As imagens usam o viewport real de cada dispositivo. O manifesto registra também a altura total do documento, que chegou a 116.060 px na Carteira do iPhone com a base de 163 unidades. Essa escala confirma a necessidade de estudar produtividade e densidade, mas não constitui regressão funcional.

O manifesto está em [`manifest.json`](../evidence/global-baseline/manifest.json), associado ao commit de captura `de4ef4edcf39d0232dbb6ee8259147d19bc7c33c`.

### Leitura visual consolidada

A revisão das 24 imagens confirmou:

- identidade lilás/grafite coerente;
- maior maturidade em Dashboard, Carteira, Competências, Pendências e Prontuário;
- Carteira mobile em cartões, sem reprodução mecânica da tabela desktop;
- hierarquia móvel consistente;
- estados vazios visíveis em Pendências e Registros Internos;
- Inventário, Registros Internos e Configurações SME com menor profundidade de orientação e acabamento;
- cabeçalho mobile funcional, embora ocupe parcela relevante do primeiro viewport;
- crescimento vertical expressivo em Carteira, Competências e Inventário.

Essas constatações foram classificadas como `FA`, `IC` ou `DQ`; não autorizam redesign sem proposta visual aprovada.

## 8. Pontos fortes protegidos

Foram protegidos:

- modelo de domínio institucional;
- ciclo completo de pendências;
- conexões entre superfícies;
- Dashboard com universos não somáveis;
- Carteira desktop integral e mobile em cartões;
- modais novos com foco, Escape, trap e retorno;
- formulários recentes preservados após falha;
- configuração fail-closed;
- contrato único de persistência;
- RPCs, RLS e migração preparados;
- rollback local;
- testes unitários, integração, E2E, axe, pgTAP e lint;
- exportação Excel congelada como referência.

## 9. Achados por classificação

- **`CP` e `ID`:** regras, fluxos e capacidades a preservar.
- **`FA`:** navegação recuperável, produtividade de tabelas, formulários, estados vazios, ajuda, observabilidade, desempenho e paridade dos módulos.
- **`IC`:** CSS em camadas, modais acessíveis versus diálogos nativos, formulários heterogêneos e maturidade visual distinta.
- **`DC`:** dados D2 reais no repositório e bundle públicos.
- **`DQ`:** histórico Git, campos e perfis de contato, densidade da Carteira e governança do Excel.
- **`DF`:** implantação e operação remotas do Supabase.
- **`EP`:** PWA e inteligência operacional dependentes de evidência posterior.

## 10. Dúvidas submetidas ao responsável

### DQ-DATA-01 — Histórico Git

- **A:** retirar dados D2 apenas da árvore ativa;
- **B:** reescrever o histórico público.

Recomendação provisória: retirar da árvore ativa no primeiro pacote e avaliar o histórico em plano autônomo.

### DQ-DATA-02 — Campos e acesso

- **A:** manter todos os contatos em banco protegido;
- **B:** manter apenas os indispensáveis e consultar fonte oficial para os demais.

Recomendação provisória: privilegiar contato institucional e menor acesso necessário.

### DQ-WAL-01 — Densidade da Carteira

- todas as colunas visíveis;
- colunas configuráveis;
- detalhe expansível.

Recomendação provisória: testar colunas configuráveis com conjunto obrigatório, após mockup e teste de tarefa.

### DQ-EXCEL-01 — Classificação do workbook

- aviso dentro do arquivo;
- aviso apenas na interface.

A decisão exige plano próprio porque a referência v2.1 está congelada.

## 11. Contratos transversais definidos

[`2026-07-15-contratos-transversais-experiencia-design.md`](../superpowers/specs/2026-07-15-contratos-transversais-experiencia-design.md) define, sem escolher pacote:

1. loading;
2. sucesso;
3. erro;
4. alerta;
5. confirmação crítica;
6. conflito;
7. sessão expirada;
8. indisponibilidade;
9. estado vazio;
10. formulário alterado;
11. salvamento;
12. foco;
13. modal;
14. menu;
15. tooltip;
16. painel lateral.

Cada contrato registra finalidade, estados, comportamento, linguagem, acessibilidade, recuperação, evidência atual e critério de aceite futuro.

## 12. Backlog e prioridade

[`POST_PR22_PRIORITIZED_BACKLOG.md`](../reference/POST_PR22_PRIORITIZED_BACKLOG.md) contém 23 itens com prioridade, ciclo, evidência, benefício, risco, dependência, necessidade visual, decisão humana e relação com Supabase.

- P0: proteção da árvore ativa e decisões de dados;
- P1: guardrails, precedência frontend, interações, navegação, Supabase Preview/migrations, Auth/RLS e hardening;
- P2: produtividade, estados vazios, formulários, Inventário, Registros, Configurações e Excel;
- P3: ajuda, observabilidade e desempenho;
- P4: PWA e inteligência operacional.

Preview e migrations remotas podem avançar em paralelo ao frontend e sem dados reais, enquanto as decisões de governança são resolvidas.

## 13. Primeiro pacote recomendado

**Proteção da árvore ativa e separação entre dados reais, fixtures e demonstração.**

É o único defeito atual cuja consequência independe de Supabase, navegação ou design.

Resultado esperado:

- bundle público sem D2 real;
- fixtures determinísticas e fictícias;
- dados autorizados separados do código;
- funcionamento local preservado;
- preparação para fonte protegida no Supabase;
- nenhuma perda de designação, programa, atribuição ou regra.

A implementação depende das decisões DQ-DATA-01 e DQ-DATA-02. A aprovação deste relatório não escolhe automaticamente uma alternativa.

## 14. Testes e evidências

No commit de captura:

- `Validar RADAR PDDE`, run `29427940815`: sucesso;
- `Cycle A visual baseline`, run `29427940698`: sucesso;
- `Supabase readiness`, run `29427940600`: sucesso;
- `Testes E2E Playwright`, run `29427940481`: sucesso.

Validação da árvore limpa:

- 147 testes unitários anteriores;
- 3 testes das ferramentas de auditoria;
- total: 150 testes unitários aprovados;
- 1 integração aprovada;
- auditoria funcional aprovada;
- readiness aprovada;
- 24 cenários visuais aprovados;
- `npm audit --audit-level=high`: 0 vulnerabilidades;
- inventário e validação documental reproduzíveis.

## 15. Ausência de mudança funcional

O diff final não inclui `app.js`, `index.html`, `styles.css`, `config.js`, `config.runtime.js`, módulos em `src/`, `supabase/`, `vercel.json` ou workflows permanentes.

As únicas alterações executáveis são ferramentas de auditoria e scripts npm específicos, sem carregamento pela aplicação.

Produção não recebeu deployment e continua local.

## 16. Riscos remanescentes

- dados D2 continuam na árvore ativa até o pacote aprovado;
- histórico Git permanece público até decisão específica;
- campos e perfis precisam de confirmação institucional;
- frontend mantém precedência acumulativa;
- diálogos nativos continuam em fluxos legados;
- navegação continua baseada em estado interno;
- Supabase remoto ainda não está implantado;
- observabilidade e hardening serão executados nos ciclos próprios.

## 17. Rollback

Como o Ciclo A não altera o produto, o rollback consiste em reverter o merge documental e remover as ferramentas/evidências de auditoria. Nenhum dado, schema, deployment ou configuração remota precisa ser restaurado.

## 18. Autorizações pendentes

Ainda exigem autorização expressa:

1. retirar a PR 26 do modo rascunho;
2. mesclar a PR 26;
3. escolher o tratamento do histórico Git;
4. definir campos e perfis de contato;
5. criar o plano do primeiro pacote de proteção;
6. criar projeto Supabase remoto ou configurar Preview;
7. publicar qualquer alteração em produção.

O Ciclo A está tecnicamente concluído quando o HEAD limpo da PR passar por todos os gates finais. O merge permanece separado e depende de revisão do responsável.
