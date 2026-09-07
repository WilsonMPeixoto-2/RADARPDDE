# Design — observabilidade segura do bootstrap desktop

**Data:** 2026-09-07  
**Base:** `b37df653676a0aa10dc286aad33e69ff13cccbf5`  
**Escopo:** diagnóstico instrumental, sem alterar comportamento funcional do RADAR.

## Objetivo

Medir e mapear o que realmente acontece entre a abertura do RADAR, a autenticação e a liberação do Dashboard no desktop antes de qualquer refatoração de carregamento.

Em linguagem operacional: nesta etapa o sistema continua carregando exatamente como carrega hoje. O trabalho apenas produz evidência confiável sobre **o que carregou, em que ordem, quanto demorou e quais partes esperaram outras partes**.

## Restrições aprovadas

1. Desktop é o único alvo corretivo e de desempenho desta frente.
2. Nenhum dado, módulo, CSS, serviço ou regra será adiado/removido nesta etapa.
3. Nenhum fluxo de Production será alterado para coletar diagnóstico.
4. O diagnóstico autenticado detalhado usa Preview/HML com identidades efêmeras e limpeza automática.
5. Não publicar credenciais, payloads, nomes de escolas, documentos, notas fiscais ou outros dados institucionais nos artefatos.
6. Coverage nunca será usado como prova isolada de que um recurso pode ser removido ou carregado depois.
7. Medição de tempo e medição de coverage serão execuções separadas, porque coverage adiciona sobrecarga e contaminaria a comparação de desempenho.

## Fontes independentes de evidência

A conclusão desta etapa deverá cruzar cinco fontes:

1. **Análise estática:** `dependency-cruiser` e o analisador existente de precedência do frontend.
2. **Execução real do Chromium desktop:** Playwright em Preview/HML.
3. **Rede:** início/fim e duração de requisições, registrando apenas caminho/família do endpoint.
4. **Recursos do navegador:** scripts e folhas de estilo realmente carregados, inclusive carregamentos dinâmicos e duplicados.
5. **Coverage:** uso de JavaScript/CSS por superfície em execução separada, apenas como evidência auxiliar.

## Instrumentação test-side

A instrumentação ficará em `tests/support/desktop-bootstrap-observer.js` e será instalada por `page.addInitScript()` antes do código da aplicação.

Ela poderá observar:

- eventos de autenticação e serviços;
- inserção dinâmica de `<script>` e `<link>` por `MutationObserver`;
- requisições `fetch` com duração e URL sanitizada;
- `setInterval` criados, apenas em uma execução diagnóstica separada;
- marcos de readiness consultados do próprio runtime;
- recursos registrados em `performance.getEntriesByType('resource')`;
- long tasks quando suportadas.

A instrumentação deve delegar integralmente para APIs nativas. Ela não decide ordem, não resolve dependências e não altera o estado funcional.

## Marcos do pós-login

A execução de tempo registrará, no mínimo:

1. formulário de login enviado;
2. `radar:auth-resolved`;
3. `radar:application-services-ready`;
4. `RadarDataContext.ready === true`;
5. `RadarCompetenceContext.isInitialized() === true`;
6. navegação canônica instalada;
7. Auth Gate oculto;
8. Dashboard visível e utilizável.

Também serão resumidas as requisições Supabase ocorridas entre login e Dashboard, por endpoint/tabela e duração, sem conteúdo de resposta.

## Inventário de carregamento

O relatório deverá separar:

- scripts estáticos de `index.html`;
- extensões de `config.js`;
- extensões do bootstrap de produto;
- carregadores aninhados;
- scripts/estilos efetivamente observados no navegador;
- duplicidades de URL observadas;
- polling estático encontrado no código e timers efetivamente criados na sessão diagnóstica.

## Matriz de superfícies

Depois da coleta, o relatório final desta etapa deverá organizar as superfícies desktop:

- Dashboard;
- Carteira de Escolas;
- Competências;
- Pendências;
- Prontuário;
- Capital e Inventário;
- Registros Internos;
- Gestão de Equipe;
- Configurações SME.

Para cada uma, distinguir:

- dependências obrigatórias para renderização correta;
- dados consumidos;
- serviços consumidos;
- extensões críticas;
- melhorias opcionais;
- CSS necessário antes da primeira renderização correta.

Nada será classificado como adiável apenas porque não apareceu em uma única navegação.

## Segurança de dados e artefatos

Os artefatos podem conter somente:

- nomes de arquivos internos do repositório;
- nomes de eventos/capacidades técnicas;
- tempos em milissegundos;
- contagens;
- URLs reduzidas a origem/caminho ou tabela, sem query string sensível;
- totais de coverage por arquivo.

Não serão publicados trace, vídeo ou screenshot do HML nesta auditoria. O JSON final deve passar por sanitização antes do upload.

## Critério de conclusão desta etapa

A etapa de diagnóstico termina somente quando:

1. a instrumentação passa em testes unitários;
2. o frontend atual passa nos testes existentes com a instrumentação ausente e presente;
3. uma execução autenticada desktop em Preview/HML produz o relatório sanitizado;
4. o relatório identifica a cadeia pós-login e os carregadores observados;
5. a matriz de dependências é atualizada a partir de evidência estática + runtime;
6. nenhuma alteração funcional foi introduzida.

Depois disso, a fila acordada continua com a unificação semântica de Pendências, convergência de Nota Fiscal e somente então a correção estrutural de readiness/bootstrap.