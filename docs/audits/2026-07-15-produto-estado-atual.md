# Auditoria global do produto — estado atual

## Resumo executivo

O RADAR PDDE é um produto institucional funcional, com modelo de domínio consistente, fluxos auditáveis e arquitetura preparada para persistência remota. A maturidade não é uniforme: Dashboard, Carteira, Competências, Pendências e Prontuário possuem maior profundidade operacional; Inventário, Registros Internos, Configurações SME e contratos transversais de feedback ainda não atingiram o mesmo grau de acabamento.

A conclusão não é reescrever o produto. O próximo salto exige preservar as melhores partes e reduzir inconsistências acumuladas, especialmente no frontend, na navegação recuperável, nos contratos de interação e na governança dos dados já entregues ao bundle.

## Linha de base e limites

- commit funcional: `f85d0f23648f365b1f88378394914dae4ac85225`;
- produção: `LocalStorageRepository`, modo `local`;
- Supabase remoto: não conectado;
- 12 migrations e Auth/RLS comprovados localmente;
- Ciclo A: somente auditoria, documentos, ferramentas e evidências;
- nenhuma conclusão visual autoriza redesign sem proposta aprovada.

## Modelo de domínio preservado

`CP-DOM-001` a `CP-DOM-006`:

- unidade escolar como entidade monitorada;
- independência entre bonificação, análise técnica e pendência;
- novo envio não resolve pendência;
- reanálise positiva resolve e negativa reabre;
- pendência e retificação não reescrevem automaticamente outras dimensões;
- indicadores podem se sobrepor.

Os testes do ciclo de pendências e do núcleo funcional demonstram que combinações aparentemente contraditórias são intencionais. Simplificação visual não pode eliminar essa semântica.

## Conexões entre lógicas e módulos

```text
Dashboard → Carteira/Pendências/Prontuário
Carteira → Prontuário/Pendências
Competências → Pendências/Prontuário/Alertas
Pendências → Competências/Prontuário/Retificação
Prontuário → Notas/Bens/Pendências/Histórico
Notas permanentes → Capital e Inventário
Mutações → Registros Internos/Auditoria
Configurações → exercícios/programas/equipes → todas as projeções
```

`CP-CON-001`: o sistema já possui conexões reais entre superfícies. `FA-CON-002`: o contexto é transportado por estado e pontes internas, não por endereço recuperável.

## Frontend e ordem de carregamento

- `app.js`: 11.286 linhas;
- `styles.css`: 2.758 linhas;
- nove folhas de extensão;
- dezessete scripts de domínio/integração carregados por `config.js`;
- 36 handlers `onclick` e 20 estilos inline em `index.html`;
- coexistência de modais acessíveis e diálogos nativos.

`IC-FE-001`: a evolução por camadas foi eficaz para preservar o produto, mas a precedência de CSS e scripts tornou-se parte do contrato. O Ciclo B deve primeiro produzir grafo de seletores, consumidores e computed styles; não deve apagar arquivos por nomenclatura.

`FA-FE-002`: a concentração de responsabilidades aumenta custo de mudança. Extração deve ser incremental e orientada pelo pacote, sem reescrita total.

## Design e consistência visual

A identidade lilás/grafite, tipografia, cards e estados semânticos formam um sistema reconhecível. Dashboard e Carteira apresentam acabamento mais recente; áreas administrativas utilizam mais estilos inline, formulários simples e feedback nativo.

- `CP-VIS-001`: identidade e hierarquia das melhores superfícies devem ser preservadas.
- `IC-VIS-002`: módulos de maturidade distinta parecem pertencer a gerações diferentes do mesmo produto.
- `FA-VIS-003`: tokens e componentes precisam de fonte única, mas somente após comparação visual computada.

## Navegação e encontrabilidade

A sidebar e a busca global tornam as áreas principais encontráveis. A navegação móvel controla overlay, Escape e retorno de foco. Entretanto, `switchView` concentra o estado no runtime.

- `CP-NAV-001`: transporte contextual entre Pendências, Competências e Prontuário.
- `FA-NAV-002`: refresh, back/forward, compartilhamento de links e restauração de filtros não possuem contrato URL central.
- `FA-NAV-003`: itens da navegação são `div` com `onclick`; integração móvel acrescenta comportamento, mas a semântica nativa deve ser reavaliada em pacote próprio.

## Dashboard

Pontos fortes:

- indicadores separados para pendências abertas e aguardando reanálise;
- cards filtram a própria visão;
- listas e próximas ações usam o mesmo recorte;
- perfis recebem dashboards específicos.

Achados:

- `CP-DASH-001`: não somar indicadores sobrepostos;
- `FA-DASH-002`: estado e filtro devem ser recuperáveis;
- `IC-DASH-003`: duas folhas `cycle-b-dashboard*.css` exigem análise de precedência, não remoção automática.

## Carteira

Pontos fortes:

- pesquisa por nome, designação e INEP;
- filtros técnicos/documentais;
- ações Ver Unidade, Editar e Abrir Pendências;
- tabela desktop integral;
- cartões mobile próprios.

Achados:

- `FA-WAL-001`: tabela ampla exige rolagem e pode aumentar custo de comparação;
- `DQ-WAL-002`: ocultar colunas, permitir personalização ou usar detalhe expansível são decisões com consequências diferentes;
- `CP-WAL-003`: nenhuma proposta pode remover dados aprovados nem prejudicar comparação entre escolas.

## Competências

`CP-COMP-001`: concentra bonificação, análise, pendência, programa e documento sem achatamento. `FA-COMP-002`: a densidade e a dependência do contexto global exigem teste com tarefas reais antes de reorganização.

## Pendências

`CP-PEND-001`: ciclo completo com quatro filas, tentativas, contatos, cancelamento, reabertura, reanálise e retificação. `FA-PEND-002`: em base sem registros, o estado vazio precisa explicar finalidade, filtros ativos e como uma pendência surgirá, sem simular dados.

## Prontuário

`CP-PRON-001`: é a visão mais rica de rastreabilidade por escola, programa, competência e documento. `FA-PRON-002`: quantidade de informações e ações exige estudo de hierarquia e retorno à origem; não é justificativa para remover conteúdo.

## Inventário

`CP-INV-001`: nota permanente gera vínculo com bem e processo de inventário. `FA-INV-002`: filtros, estados vazios e próxima ação são menos desenvolvidos que no Dashboard/Carteira.

## Registros Internos

`CP-AUD-001`: mutações relevantes geram auditoria. `FA-AUD-002`: a tela de consulta possui filtragem, leitura e explicação inferiores à riqueza do modelo de eventos.

## Configurações SME

`CP-SME-001`: exercícios, programas e equipes utilizam serviços transacionais e auditoria. `IC-SME-002`: formulários, mensagens e confirmações não seguem um contrato uniforme. `FA-SME-003`: layout administrativo deve ser elevado sem transformar configuração em dashboard ornamental.

## Gestão de Equipe

`CP-TEAM-001`: regras impedem remover o único integrante e exigem reatribuição de escolas. `FA-TEAM-002`: `alert/confirm` e ausência de explicação de impacto tornam a operação menos previsível.

## Formulários, modais e feedback

- `CP-UX-001`: fluxos recentes preservam formulário após erro e anunciam mensagem em `aria-live`;
- `CP-UX-002`: modais novos controlam foco, Escape, trap e retorno;
- `IC-UX-003`: 17 ocorrências/wrappers de `alert/confirm` coexistem com o padrão acessível;
- `FA-UX-004`: obrigatoriedade, salvamento, sucesso, erro e conflito precisam de contratos transversais.

## Mobile e acessibilidade

- menu móvel com overlay e Escape;
- foco restaurado;
- alvos de interação adequados;
- inputs evitam zoom involuntário;
- Carteira usa cartões;
- axe e Playwright cobrem fluxos.

`CP-MOB-001`: preservar solução mobile específica. `FA-MOB-002`: nem todas as 18 superfícies possuem a mesma profundidade de cenário E2E móvel.

## Dados e ambientes

O array inicial de 163 escolas contém dados D0, D1 e D2 no repositório público e bundle. Este é `DC-DATA-001` para dados pessoais/contato desnecessários no bundle, independentemente da futura RLS. O nível de saneamento do histórico e a lista de campos necessários são `DQ-DATA-002/003`.

## Persistência e Supabase

- `CP-SUP-001`: contrato único e adaptadores equivalentes;
- `CP-SUP-002`: configuração fail-closed;
- `CP-SUP-003`: migrations, grants, RLS e RPCs preparados;
- `DF-SUP-004`: projeto remoto, usuários reais, Advisors, backup, restauração e MFA;
- `DF-SUP-005`: importação de cópia controlada e ativação em produção.

## Testes, CI e entrega

A baseline possui 147 testes unitários do produto, 1 integração, 21 arquivos E2E, testes de banco e workflows. Ferramentas do Ciclo A elevam o total unitário sem tocar no produto.

- `CP-TEST-001`: cobertura funcional extensa;
- `FA-TEST-002`: alguns testes e arquivos muito extensos elevam custo de manutenção;
- `FA-DEL-001`: não há contrato consolidado de headers de segurança, Web Vitals ou erros em produção;
- `EP-DEL-002`: PWA/offline formal só deve ser estudado se houver necessidade operacional comprovada.

## Pontos fortes protegidos

1. modelo de domínio institucional;
2. rastreabilidade do ciclo documental;
3. conexões entre superfícies;
4. Carteira desktop e mobile;
5. acessibilidade dos modais novos;
6. arquitetura de persistência e rollback;
7. RLS e migração preparadas;
8. cobertura automatizada;
9. identidade visual consolidada;
10. produção local preservada.

## Defeitos comprovados

| ID | Evidência | Consequência | Conduta |
|---|---|---|---|
| DC-DATA-001 | D2 em `INITIAL_ESCOLAS` no repositório e bundle públicos | exposição independente de RLS | remover da árvore ativa em pacote aprovado; decidir histórico |

Nenhum outro ponto foi classificado como `DC` sem reprodução específica. Nomes de arquivos, tamanho ou preferência estética não são defeitos por si só.

## Funcionalidades aprimoráveis

- URL e histórico recuperáveis;
- contratos de formulário e feedback;
- produtividade de tabelas;
- ajuda contextual;
- estados vazios;
- paridade dos módulos administrativos;
- observabilidade e desempenho;
- política de dados e exportações.

Cada item possui evidência e deverá virar pacote delimitado.

## Inconsistências e duplicações

- CSS em camadas por task/ciclo/hotfix;
- modais acessíveis versus diálogos nativos;
- formulários recentes versus administrativos;
- maturidade visual distinta entre módulos;
- estado interno robusto sem contrato URL equivalente.

## Dúvidas materiais

1. `DQ-DATA-002`: árvore atual versus reescrita do histórico Git;
2. `DQ-DATA-003`: quais contatos de direção são indispensáveis e para quais perfis;
3. `DQ-WAL-002`: estratégia de densidade da Carteira;
4. `DQ-EXP-001`: classificação e comunicação da exportação Excel.

Essas dúvidas não impedem a documentação do Ciclo A, mas bloqueiam implementação das decisões correspondentes.

## Dependências futuras

- Ciclo B: precedência e contratos frontend;
- Ciclo C: navegação recuperável;
- Ciclo D: produtividade operacional;
- Ciclo E: paridade dos módulos;
- Ciclo F: implantação remota;
- Ciclo G: hardening, observabilidade e desempenho;
- Ciclo H: inteligência operacional.

## Mapa de maturidade

Escala 1–5, sem nota única:

| Superfície/dimensão | Correção | Regras | Conexão | Clareza | Encontrabilidade | Produtividade | Acessibilidade | Responsividade | Consistência | Estados | Testabilidade | Prontidão remota |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Dashboard | 5 | 5 | 5 | 4 | 4 | 4 | 4 | 4 | 4 | 4 | 5 | 5 |
| Carteira | 5 | 5 | 5 | 4 | 5 | 4 | 4 | 5 | 4 | 4 | 5 | 5 |
| Competências | 5 | 5 | 5 | 3 | 4 | 4 | 4 | 3 | 4 | 4 | 5 | 5 |
| Pendências | 5 | 5 | 5 | 4 | 4 | 5 | 5 | 4 | 4 | 4 | 5 | 5 |
| Prontuário | 5 | 5 | 5 | 3 | 4 | 4 | 4 | 3 | 4 | 4 | 5 | 5 |
| Inventário | 4 | 5 | 4 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 4 | 5 |
| Registros Internos | 4 | 5 | 4 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 4 | 5 |
| Configurações SME | 5 | 5 | 4 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 5 | 5 |
| Contratos UX | 4 | 5 | 4 | 3 | 3 | 3 | 4 | 4 | 3 | 3 | 5 | 5 |

As notas refletem evidência técnica e fluxo, não pesquisa com usuários reais. A dimensão de produtividade deve ser validada com tarefas e perfis reais antes de redesign.

## Conclusão

O RADAR já possui base institucional e técnica madura. A prioridade imediata é proteger dados expostos no bundle e consolidar contratos do frontend sem degradar as melhores superfícies. A implantação remota do Supabase pode avançar em paralelo após a decisão de dados, pois a arquitetura já está preparada; melhorias visuais não críticas não devem bloqueá-la.

## Resultado da priorização

O backlog completo está em `docs/reference/POST_PR22_PRIORITIZED_BACKLOG.md`. O único `DC` atual é a entrega de D2 no repositório/bundle. A implantação remota permanece `DF`. O primeiro pacote recomendado é a proteção da árvore ativa, condicionado às decisões sobre histórico e campos necessários; Supabase Preview/migrations podem avançar em paralelo sem cópia real.
