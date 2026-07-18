# Auditoria integral de perfis, abas, telas e fluxos do RADAR PDDE

**Data de consolidação:** 18/07/2026  
**Estado auditado:** produção local correspondente ao commit `72c13a74a1c41e4c0fd4924c400e12d624af1482`  
**Persistência vigente:** `LocalStorageRepository`  
**Supabase remoto:** não conectado  
**Escopo:** experiência funcional, visual, de navegação, permissão e continuidade entre todas as superfícies catalogadas e todos os perfis atuais ou preparados.

---

## 1. Conclusão executiva

O RADAR PDDE já possui um núcleo operacional consistente para o **Controlador** e para a **Assistente de Verbas Federais**, especialmente no Dashboard, Carteira, Competências, Pendências, Prontuário e diálogos recentes. O produto preserva corretamente as três dimensões independentes do domínio — bonificação, análise técnica e pendência documental — e mantém conexões funcionais entre as principais áreas.

A avaliação integral, entretanto, mostra que a maturidade não é uniforme entre os perfis e superfícies:

1. **Controlador:** fluxo principal funcional e relativamente maduro; maior necessidade de produtividade em tabelas largas, continuidade de contexto e estados vazios.
2. **Assistente:** fluxo transversal robusto, mas com concentração de responsabilidades administrativas que precisa ser reconciliada com a matriz futura de permissões.
3. **Equipe de Inventário:** domínio e serviços estão preparados, porém a experiência própria do perfil ainda é menos completa e menos orientada à tarefa que a dos perfis documentais.
4. **Gestão SME:** possui visão gerencial e configuração, mas formulários, feedback de alteração e escala administrativa ainda estão abaixo do padrão das áreas centrais.
5. **Administrador técnico:** existe no modelo Auth/RLS, mas **não possui experiência própria na interface**. Atualmente o papel `technical_admin` é convertido no perfil legado `assistente`, o que mistura administração técnica com operação cotidiana.

Portanto, o sistema pode ser considerado **funcionalmente consolidado no modo local para os fluxos já aprovados**, mas **não está pronto para homologação remota de cinco perfis** até que sejam resolvidos os contratos de acesso, a experiência específica do Administrador técnico e a divergência entre a Gestão de Equipe atual e a matriz futura de permissões.

---

## 2. Fontes e limites da auditoria

A consolidação utiliza, de forma combinada:

- o catálogo das 18 superfícies em [`../reference/PRODUCT_SURFACE_CATALOG.md`](../reference/PRODUCT_SURFACE_CATALOG.md);
- a matriz futura de permissões em [`../reference/SUPABASE_PERMISSIONS_MATRIX.md`](../reference/SUPABASE_PERMISSIONS_MATRIX.md);
- a auditoria visual desktop e as 12 capturas registradas em [`2026-07-15-polimento-visual-desktop-producao.md`](2026-07-15-polimento-visual-desktop-producao.md);
- o manifesto de evidências em [`../evidence/visual-polish-desktop/manifest.json`](../evidence/visual-polish-desktop/manifest.json);
- o backlog priorizado em [`../reference/POST_PR22_PRIORITIZED_BACKLOG.md`](../reference/POST_PR22_PRIORITIZED_BACKLOG.md);
- o seletor de quatro perfis simulados presente em `index.html`;
- o mapeamento de papéis institucionais para perfis legados em `src/integration/auth-gate.js`;
- os testes unitários e E2E referenciados no catálogo de superfícies.

### Limites objetivos

- As capturas visuais disponíveis cobrem principalmente Controlador, Assistente e SME; não existe conjunto visual equivalente para todas as superfícies do perfil Inventário.
- O Administrador técnico não possui superfície própria na interface local.
- A auditoria não equivale à homologação remota de Auth/RLS, pois o Supabase remoto permanece desativado.
- Acessibilidade completa exige teste manual com leitor de tela, navegação por teclado em todas as rotas e validação de contraste; os resultados existentes comprovam apenas os fluxos automatizados e os diálogos já auditados.

---

## 3. Perfis efetivos e perfis preparados

### 3.1 Perfis expostos no modo local

O seletor de perfil da interface apresenta quatro opções:

- `controlador` — Controlador;
- `assistente` — Assistente de Verbas Federais;
- `sme` — SME (Gestão);
- `inventario` — Equipe de Inventário.

### 3.2 Perfis previstos para Auth/RLS

O modelo remoto prevê cinco papéis:

- `controller`;
- `federal_assistant`;
- `inventory`;
- `sme_management`;
- `technical_admin`.

### 3.3 Achado crítico de correspondência

O arquivo `src/integration/auth-gate.js` converte:

```text
technical_admin → assistente
```

Essa conversão foi suficiente para o gate técnico de pré-conexão, mas não é um contrato de produto adequado para ativação real. O Administrador técnico passaria a receber a navegação e as ações do perfil Assistente, embora sua finalidade seja administrar perfis, escopos, infraestrutura e auditoria excepcional — não executar a rotina documental.

**Classificação:** `DF` com impacto `P1` antes da homologação remota.  
**Conduta:** criar experiência e autorização próprias para o Administrador técnico ou limitar explicitamente o papel a uma área técnica separada, sem herdar a operação da Assistente.

---

## 4. Legenda da matriz de cobertura

| Código | Significado |
|---|---|
| **O** | operação cotidiana autorizada |
| **L** | leitura/consulta |
| **A** | administração estrutural |
| **E** | ação excepcional e auditada |
| **P** | acesso patrimonial restrito |
| **—** | sem acesso direto esperado |
| **F** | preparado para etapa futura, ainda não homologado |
| **DQ** | depende de decisão funcional ou institucional |

---

## 5. Matriz perfil × superfície

| Superfície | Controlador | Assistente | Inventário | Gestão SME | Admin técnico | Situação consolidada |
|---|---:|---:|---:|---:|---:|---|
| S-01 Dashboard | O | O | O/L | L gerencial | F/DQ | saudável nos perfis capturados; falta contrato próprio do Admin |
| S-02 Carteira de Escolas | O | O | —/L contextual | L | F/E | tabela integral preservada; acesso do Inventário deve permanecer orientado a escopo |
| S-03 Competências Mensais | O | O | L contextual | L | F/E | modelo correto e denso; ações devem respeitar papel |
| S-04 Pendências Operacionais | O | O | P/L | L | F/E | ciclo canônico preservado; vazio e filtros precisam acabamento |
| S-05 Prontuário | O | O | P/O patrimonial | L | F/E | núcleo mais completo; alta densidade e contexto precisam ancoragem |
| S-06 Capital e Inventário | L | O | O | L | F/E | domínio preparado; experiência do Inventário ainda menos madura |
| S-07 Registros Internos | L do escopo | L do escopo | L do escopo | L amplo | L amplo/E | consulta visual simples; falta filtro, origem e diferenciação de estados |
| S-08 Configurações SME | — | — | — | A | A/E | coerente, porém feedback e formulários são heterogêneos |
| S-09 Gestão de Equipe | L | **O/A atual** | L | A | A/E | **divergência entre comportamento atual e matriz futura** |
| S-10 Exercícios | L contexto | L contexto | L contexto | A | A/E | criação atômica; encontrabilidade depende da configuração |
| S-11 Programas | L | L | L | A | A/E | histórico preservado; administração concentrada em configuração |
| S-12 Alertas | O | O | O patrimonial | L gerencial | F/DQ | conteúdo depende do papel; teclado e prioridade precisam consolidação |
| S-13 Busca global | O | O | O em escopo | O | F/DQ | útil; falta deep link e contrato explícito de escopo por perfil |
| S-14 Exportação Excel | O autorizado | O autorizado | DQ | O autorizado | E | workbook aprovado; governança de distribuição ainda aberta |
| S-15 Autenticação | F | F | F | F | F | preparada localmente; não homologada remotamente |
| S-16 Modais e confirmações | O | O | O | O | F | padrão novo é acessível; ainda coexistem `alert/confirm` legados |
| S-17 Formulários | O | O | O patrimonial | A | F/E | preservação após erro existe em fluxos novos; feedback não uniforme |
| S-18 Vazio/loading/erro | O | O | O | O | F | contrato transversal existe, mas aplicação é heterogênea |

---

## 6. Jornada integral por perfil

## 6.1 Controlador

### Objetivo operacional

Acompanhar sua carteira, iniciar e concluir análises, abrir e tratar pendências, registrar contatos, reanalisar documentos e manter a rastreabilidade de cada unidade.

### Sequência principal

```text
Dashboard
  → Carteira de Escolas
  → Competência / Prontuário
  → Análise técnica
  → Pendência, quando necessária
  → Novo envio
  → Reanálise
  → Resolução ou reabertura
```

### Superfícies essenciais

- Dashboard;
- Carteira de Escolas;
- Competências Mensais;
- Pendências Operacionais;
- Prontuário;
- Alertas;
- Busca global;
- Registros Internos do próprio escopo;
- leitura de Capital e Inventário;
- exportação autorizada.

### Avaliação

**Saudável:** separação dos indicadores, fluxo entre Pendências e Prontuário, ações contextuais, quatro filas e diálogos novos.  
**Aperfeiçoar:** preservação de contexto ao retornar, cabeçalhos persistentes, percepção da rolagem horizontal, estado vazio e filtros avançados.  
**Não alterar:** unidade como eixo, três dimensões independentes, estados canônicos da pendência e tabela aprovada da Carteira.

---

## 6.2 Assistente de Verbas Federais

### Objetivo operacional

Acompanhar transversalmente as escolas, apoiar controladores, realizar retificações administrativas autorizadas, revisar situações consolidadas e executar ações operacionais de maior abrangência.

### Sequência principal

```text
Dashboard transversal
  → recorte por controlador/RA/escola
  → Carteira, Competências ou Pendências
  → Prontuário
  → retificação, contato, reabertura ou apoio à análise
  → auditoria do resultado
```

### Superfícies essenciais

- Dashboard transversal;
- Carteira de Escolas com filtros amplos;
- Competências Mensais;
- Pendências Operacionais;
- Prontuário;
- Capital e Inventário;
- Registros Internos;
- Gestão de Equipe no comportamento local vigente;
- busca, alertas, modais e formulários.

### Achado de permissão

A interface atual permite que a Assistente opere a Gestão de Equipe e conduza a desativação de controladora com reatribuição explícita. A matriz futura de permissões, entretanto, atribui à Assistente apenas leitura de controladores e equipe, reservando criação e alteração à Gestão SME e ao Administrador técnico.

Essa divergência não pode ser resolvida por inferência técnica. Deve ser decidida formalmente antes da aplicação remota das políticas RLS.

**Classificação:** `DQ` funcional e institucional, prioridade `P1` antes de `BL-SUP-02`.  
**Alternativas válidas:**

1. manter a Assistente como administradora operacional da equipe e atualizar matriz, RLS e testes;
2. transferir a gestão de equipe para SME/Admin e retirar a ação do perfil Assistente;
3. separar ações cotidianas de distribuição de carteira das ações estruturais de criação, desativação e exclusão.

**Recomendação:** alternativa 3, por preservar a operação sem concentrar administração estrutural no perfil transversal.

---

## 6.3 Equipe de Inventário

### Objetivo operacional

Localizar bens permanentes, verificar nota fiscal e processo, registrar encaminhamento, acompanhar inventariação e consultar o contexto escolar indispensável.

### Sequência principal desejada

```text
Dashboard patrimonial
  → fila de bens e pendências patrimoniais
  → escola / prontuário no contexto do bem
  → atualização de encaminhamento
  → inventariação
  → registro auditável
```

### Situação atual

O domínio, o serviço de aplicação e a relação nota–bem–processo estão preparados. A tela Capital e Inventário é funcional, mas ainda não oferece ao perfil a mesma maturidade de priorização, filtros e próxima ação existente no ciclo documental.

### Aperfeiçoamentos necessários

- Dashboard orientado a filas patrimoniais, sem reproduzir indicadores documentais irrelevantes;
- busca por escola, bem, nota e processo;
- filtros por `Não encaminhada`, `Aguardando` e `Inventariada`;
- próxima ação explícita em cada registro;
- acesso ao Prontuário já contextualizado no bem;
- estado vazio que diferencie inexistência de bens, falta de escopo e erro;
- testes visuais dedicados ao perfil Inventário.

**Classificação:** `FA`, prioridade `P2` (`BL-INV-01`).

---

## 6.4 Gestão SME

### Objetivo operacional

Acompanhar resultados agregados, administrar parâmetros institucionais, exercícios, programas e equipes, sem assumir por padrão a operação documental de cada controlador.

### Sequência principal

```text
Dashboard gerencial
  → recorte por CRE / escola / competência
  → consulta de Carteira, Competências, Pendências e Prontuário
  → Configurações SME
  → exercícios, programas e equipe
  → auditoria e exportação
```

### Avaliação

**Saudável:** hierarquia dos cartões, visão agregada e conexão com as superfícies operacionais.  
**Aperfeiçoar:** escalabilidade da tabela de coordenadorias, estados de formulário, indicação de alteração não salva, consequência dos salvamentos, substituição de `alert/confirm` e distinção entre leitura gerencial e administração.  
**Preservar:** acesso amplo de leitura, administração de parâmetros e ausência de mutação cotidiana das pendências por padrão.

**Classificação:** `FA/IC`, prioridade `P2` (`BL-SME-01` e `BL-FORM-01`).

---

## 6.5 Administrador técnico

### Objetivo institucional

Administrar identidades, perfis, escopos, configuração técnica, importações, auditoria e operações excepcionais, sem ser utilizado como usuário operacional cotidiano.

### Situação atual

- papel preparado no Auth/RLS;
- sem opção própria no seletor local;
- sem navegação própria;
- convertido para o perfil legado `assistente`;
- potencial herança de ações documentais e administrativas incompatíveis com segregação de funções.

### Experiência mínima necessária antes da ativação remota

- área própria de usuários, perfis e escopos;
- consulta de auditoria técnica e execuções de importação;
- ações excepcionais claramente marcadas, justificadas e auditadas;
- ausência de indicadores e filas operacionais por padrão;
- modo de suporte/impersonação somente se aprovado, temporário e registrado;
- negação explícita para operação cotidiana não necessária;
- testes RLS e E2E próprios.

**Classificação:** `DF/P1`; bloqueia homologação dos cinco perfis.

---

## 7. Avaliação por grupo de telas

## 7.1 Núcleo operacional

**Dashboard, Carteira, Competências, Pendências e Prontuário** formam uma cadeia coerente. O principal risco não é falta de função, mas perda de contexto entre superfícies e custo de varredura em telas densas.

Prioridades:

1. URLs e estado navegável;
2. retorno à origem com filtros e rolagem preservados;
3. cabeçalhos e identidade da escola/competência ancorados;
4. filtros essenciais e avançados sem eliminar capacidade;
5. affordance de rolagem horizontal.

## 7.2 Áreas administrativas

**Gestão de Equipe, Configurações SME, Exercícios e Programas** possuem regras transacionais válidas, mas a experiência é menos uniforme.

Prioridades:

1. resolver a responsabilidade da Assistente na Gestão de Equipe;
2. padronizar dirty state, saving, sucesso, erro e conflito;
3. substituir confirmações nativas remanescentes;
4. adicionar busca, filtro, paginação ou virtualização para as 163 unidades;
5. separar administração cotidiana, estrutural e técnica.

## 7.3 Patrimônio

**Capital e Inventário** precisa de uma experiência própria do perfil Inventário, sem depender de o usuário interpretar uma tela concebida inicialmente como visão transversal.

## 7.4 Auditoria

**Registros Internos** preserva integridade, mas ainda não oferece consulta proporcional à riqueza do modelo de eventos. Deve incluir busca, filtros, origem, entidade relacionada e distinção entre base vazia, falta de escopo e indisponibilidade.

## 7.5 Superfícies transversais

**Alertas, busca, Excel, autenticação, modais, formulários e estados** precisam ser avaliados em cada perfil, porque sua existência global não garante conteúdo, ação ou permissão adequados.

---

## 8. Achados prioritários

| ID | Prioridade | Achado | Consequência | Conduta |
|---|---:|---|---|---|
| PERF-01 | P1 | `technical_admin` herda perfil `assistente` | mistura administração técnica e operação | criar experiência e autorização próprias |
| PERF-02 | P1/DQ | Assistente administra equipe no local, mas matriz futura prevê somente leitura | RLS pode bloquear fluxo aprovado ou UI pode conceder acesso indevido | decisão institucional e alinhamento UI/RLS/testes |
| PERF-03 | P1 | não há matriz E2E completa de perfil × superfície × ação | regressões podem passar em um perfil e falhar em outro | suíte parametrizada para cinco papéis |
| PERF-04 | P2 | Inventário não possui jornada visual equivalente ao ciclo documental | maior custo de localização e atualização patrimonial | pacote `BL-INV-01` |
| PERF-05 | P2 | estados vazios e erros variam por tela | vazio pode parecer falha ou falta de permissão | aplicar contrato `C-09` por superfície e perfil |
| PERF-06 | P2 | Gestão de Equipe escala para página de aproximadamente 11,5 mil px | localização e reatribuição custosas | busca, filtro e paginação/virtualização |
| PERF-07 | P2 | Configurações SME não uniformiza alteração, salvamento e conflito | risco de perda e baixa previsibilidade | contrato de formulários |
| PERF-08 | P2 | contexto não é plenamente recuperável por URL | retorno, compartilhamento e refresh incompletos | `BL-NAV-01` |
| PERF-09 | P2 | tabelas largas não possuem sistema comum de continuidade | identificação se perde durante rolagem | cabeçalho/coluna persistentes e affordance |
| PERF-10 | P2 | Registros Internos não explora filtros e origem | auditoria difícil em escala | `BL-AUD-01` |

---

## 9. Contrato obrigatório de navegação por perfil

Para cada ação entre telas, o sistema deve transportar:

- perfil e escopo efetivos;
- escola;
- competência;
- programa;
- documento;
- pendência, quando houver;
- filtro de origem;
- fila de origem;
- posição ou registro de retorno quando relevante.

O destino deve validar novamente a autorização. Transportar contexto não substitui controle de acesso.

---

## 10. Critérios de aceite para considerar todos os perfis concluídos

### 10.1 Cobertura funcional

- cada perfil acessa somente as abas previstas;
- ações indisponíveis não aparecem como ativas;
- leitura e escrita obedecem ao mesmo contrato no modo local e no Supabase;
- acesso direto por URL não contorna permissão;
- filtros e ações refletem o escopo do usuário;
- Administrador técnico não herda a operação da Assistente;
- Gestão de Equipe possui decisão formal e matriz consistente.

### 10.2 Continuidade de fluxo

- Dashboard → Carteira/Pendências/Prontuário mantém o recorte;
- retorno restaura filtros e posição útil;
- alerta abre a entidade e o contexto corretos;
- busca global respeita escopo;
- Prontuário preserva escola, competência e programa durante a operação.

### 10.3 Estados e feedback

- vazio real, vazio por filtro, falta de escopo, loading e erro são distintos;
- formulários preservam dados após falha;
- salvamento informa progresso, sucesso e conflito;
- ações críticas usam diálogo acessível;
- nenhum fluxo depende apenas de `alert()` ou `confirm()`.

### 10.4 Acessibilidade

- navegação integral por teclado;
- foco visível;
- ordem de foco coerente;
- `Escape`, trap e retorno de foco nos diálogos;
- tabelas e cartões possuem nomes e relações compreensíveis;
- estados dinâmicos usam regiões adequadas;
- validação manual com leitor de tela nos fluxos principais de cada perfil.

### 10.5 Responsividade

- alterações desktop não degradam os cartões mobile aprovados;
- tabelas largas possuem alternativa ou rolagem compreensível;
- modais e formulários permanecem operáveis em Android e iPhone;
- o redesenho mobile pode continuar adiado, mas a regressão é obrigatória.

---

## 11. Suíte mínima de homologação por papel

| Papel | Cenários obrigatórios |
|---|---|
| Controlador | própria carteira; análise; abertura de pendência; novo envio; reanálise; contato; negação de escola externa |
| Assistente | visão transversal; retificação; apoio a pendência; filtros por controlador/RA; decisão aprovada de gestão de equipe |
| Inventário | escopo patrimonial; primeiro bem com autorização; atualização de status; negação de análise técnica |
| Gestão SME | leitura ampla; parâmetros; exercício; programa; equipe; negação de mutação de pendência cotidiana |
| Admin técnico | perfis; escopos; auditoria; importação; exclusão excepcional; ausência de operação documental por padrão |

Cada cenário deve ser executado em:

- modo local;
- Supabase local;
- Preview remoto autorizado;
- desktop Chromium;
- Android/Chromium;
- iPhone/WebKit para regressão dos fluxos essenciais.

---

## 12. Sequência recomendada de execução

### Pacote P1 — contrato de perfis e segregação de funções

1. decidir Gestão de Equipe da Assistente;
2. definir experiência do Administrador técnico;
3. produzir matriz única UI × serviços × RLS;
4. parametrizar testes de navegação e ação por papel;
5. bloquear ativação remota enquanto houver divergência.

### Pacote P2A — estados e feedback compartilhados

1. Pendências;
2. Registros Internos;
3. Configurações SME;
4. Inventário;
5. demais vazios, erros e confirmações.

### Pacote P2B — produtividade das superfícies densas

1. Gestão de Equipe;
2. Carteira;
3. Prontuário;
4. Competências;
5. Inventário;
6. tabela gerencial SME.

### Pacote P2C — navegação recuperável

1. URL e histórico;
2. transporte integral de contexto;
3. retorno à origem;
4. busca global e alertas;
5. proteção de dados na URL.

### Gate remoto

Somente após os pacotes P1 e a homologação de Auth/RLS:

1. criar usuários reais de teste;
2. comprovar cinco papéis e negações;
3. reconciliar local e remoto;
4. validar auditoria, backup, restauração e MFA;
5. submeter ativação à autorização expressa.

---

## 13. Decisões que permanecem humanas

1. A Assistente continuará administrando equipe ou apenas distribuirá carteiras?
2. Quais ações pertencem à Gestão SME e quais ao Administrador técnico?
3. O Administrador técnico terá interface própria ou console separado?
4. Quais campos pessoais são indispensáveis para cada perfil?
5. Quem pode gerar e redistribuir o Excel?
6. Quais colunas da Carteira são obrigatórias e quais configuráveis?
7. Quais dados podem aparecer em URLs compartilháveis?

Nenhuma dessas decisões deve ser ocultada em implementação técnica ou inferida apenas a partir da interface atual.

---

## 14. Encerramento

A exigência de considerar todas as abas, telas e perfis altera a conclusão da auditoria visual original: o principal risco remanescente não é estético, mas de **coerência entre experiência, responsabilidade e autorização**.

O RADAR possui base forte para Controlador e Assistente, áreas gerenciais e patrimoniais funcionais e uma arquitetura pronta para conexão. O próximo avanço seguro é consolidar um contrato único de perfis e superfícies, eliminar a conversão do Administrador técnico em Assistente, resolver a Gestão de Equipe e somente depois homologar os cinco papéis no ambiente remoto.

Até essas providências, a produção local permanece válida para os fluxos aprovados, mas o estado correto deve ser descrito como:

> **funcionalmente consolidado no modo local, com cobertura visual e operacional desigual entre perfis e com duas decisões de autorização bloqueadoras da homologação remota.**
