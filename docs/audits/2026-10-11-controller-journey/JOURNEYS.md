# Jornadas observadas — checkpoint controlado

11/10/2026; baseline `113841bd`, UI http://127.0.0.1:4176, Chromium headed
1440×900, Controlador Local, Supabase/Auth/RLS reais **descartáveis**.
As verificações posteriores no candidato estão identificadas abaixo.
O usuário autorizou continuidade no cloud; não é observação de Production.

## Consumo / Pendência individual — B e parte de H

Pela UI: editada a primeira NF para `AUD-CONS-01`, descrição corrigida e R$145,60;
análise Correto. Criada `AUD-CONS-02`, R$200,00; selecionar Incorreto abriu o modal
documental, onde foi marcado Documento ausente. A confirmação criou uma Pendência
vinculada à segunda NF e abriu drawer com número, valor, escola/competência/programa,
motivo e próxima ação. A primeira NF permaneceu Correto.

Registrar novo envio → data 11/10/2026 + observação → Aguardando reanálise.
O envio **não resolveu** a Pendência. Reanalisar → Documento correto → Resolvida.
Depois de reload: primeira NF Correto; segunda Correto (Atrasado), coerente com
disponibilização de outubro para competência de maio; mesma competência/rota.
Banco confirmou os estados, tentativa com result=correto e `bonus_result=null`.

IDs para continuidade local:

- NF 1: `nota-0592baa9-05be-46cf-bbaa-1101db8f5472`;
- NF 2: `nota-af7aab01-dbee-43a7-9b54-c5a1251f38be`;
- Pendência: `pend-cca6893b-e886-4779-9d4c-65347f974ecd`.

Bonificação não foi lançada/alterada pelo ciclo. Nenhum ativo foi criado por consumo.
Não declarar B/H completos nesse primeiro checkpoint; as continuações abaixo
registram exclusão, identificação, histórico e contato efetivamente observados.

## Clareza documental — observação inicial e prova posterior

O drawer identifica `NF: AUD-CONS-02`. O modal de novo envio mostra apenas
Documento: Notas Fiscais; o modal de reanálise destaca descrição/tipo/valor, não
o número da NF. Nenhuma gravação na NF errada foi observada.
O defeito de apresentação foi posteriormente reproduzido por seis REDs e corrigido
no candidato, com 11 GREENs dirigidos; ver `CAUSAL_FINDINGS.md`. A prova conserva
dimensão, descrição, tipo, valor e legado. Não certifica toda a tabela nem o footer
da reanálise; as capturas representativas não substituem essa inspeção.

## Evidência e limites de medição

Capturas examinadas e versionadas: edição, análise correta, drawer aberto, modal
de novo envio estável, reanálise e reload. Arquivos brutos/trace em
`/workspace/scratch/controller-mcp`, fora do Git por conterem autenticação local.

- Uma criação: **739 ms**, clique Salvar → modal fechado + controle da NF visível,
  antes de screenshot. Amostra única local, sem p95 ou extrapolação para Production.
- Edição: Resource Timing registrou `save_invoice_with_effects_v2` em **342,3 ms**;
  bytes indisponíveis (cross-origin sem timing autorizado retorna zero).
- Medição 2.470 ms incluiu screenshot; **não é latência de UI**. Medição de envio
  219 ms terminou na troca do texto do botão para Registrando; **não é commit**.
- Três long tasks (60/123/66 ms) observadas desde instrumentação; janela incluía
  preenchimento e espera, sem atribuição causal isolada à edição.
- Timeouts causados por seletor dinâmico de dialog/renomeação busy/estado MCP não
  são erros do produto. Exclusão não concluída e nenhuma NF removida nesse checkpoint.

Após duas tentativas de confirmar a exclusão pelo harness MCP, foram detectados
estado de modal perdido por inicialização de sessões e timeout de backend. Parar
essa abordagem, preservar o banco e preparar controle Playwright nativo do lockfile
para continuação, em vez de modificar o produto para satisfazer a ferramenta.

## Continuação nativa — C, D, E, F/G e I

O Playwright do lockfile passou a controlar um Chromium headed persistente, com
login pelo formulário e credenciais privadas do descartável. A exclusão da
`AUD-CONS-01` foi concluída pela UI e confirmação nativa; SQL confirmou a remoção.
Isso supera a limitação do harness anterior, sem alteração do produto.

### Permanente / Inventário

Criada `AUD-PERM-01` (R$900), com bem vinculado. Controlador adicionou observação;
uma sessão separada, legitimamente autenticada como Inventário Local, confirmou
inventariação. Banco: bem `bem-ce545fc6-8a48-415e-a2cf-076cf5356b0c`, status
`Inventariada`, autoria `inventory-local`. A sessão do Controlador recebeu o novo
estado sem F5. Não restou ação Marcar como inventariado na fila.

Edição da NF terminal: classificação indisponível, campos ordinários como valor
continuam editáveis conforme a regra vigente. A presença do ícone de exclusão
ainda não prova que uma exclusão terminal seja permitida; testar a proteção antes
de classificar. Não houve reset de terminal nem escrita em Production.

### Serviço / Assessoria e competência histórica

Criada `AUD-SERV-01` (R$300); consulta enviada e análise Incorreto abriram Pendência
individual de Assessoria. Novo envio e reanálise Correto resolveram a Pendência;
`analiseConsultaAssessoria=Correto (Atrasado)`, enquanto a análise fiscal permaneceu
Não analisado. A operação de Assessoria não confundiu as duas análises.

Novo envio e reanálise foram feitos com competência global Junho e origem Maio;
o modal mostrou a origem e a competência global permaneceu Junho. A hipótese de
que a página de Pendências perderia as resolvidas de Maio em Junho foi refutada:
a aba Resolvidas carregou o registro histórico. A página é transversal entre
competências; diferença de contagem na aba Abertas não constitui perda de histórico.

### Boleto Internet

Tipo disponível no formulário de Educação Conectada e ausente das opções
acessíveis de PDDE Básico. Criada `AUD-NET-01` (R$120), análise Correto. SQL confirmou
`boleto_internet`, `CONECTADA`, sem bem vinculado. Nenhuma Consulta Assessoria
apareceu para o boleto. Na baseline, o formulário pede “Número da Nota Fiscal”.
O candidato corrige somente esse rótulo para “Número ou referência do documento”,
com RED/GREEN dirigido, sem alterar as opções ou regras do boleto.

### Despesa a identificar / repetição de gesto

Duplo clique em Registrar Despesa produziu **uma** chamada
`save_unidentified_expense_with_pendency` (HTTP 200, corpo de resposta 3.960 bytes),
uma NF de R$85 e uma Pendência Aberta/Incorreto. Referência `AUD-EXP-PROV-01`.
IDs: NF `nota-5cd420ef-619b-4230-87b0-1f83f45bcdb5`, Pendência
`pend-f431efed-0482-4c27-a452-9dfe035506fb`.

Continuação F: identificação pela UI como consumo, número `AUD-IDENT-01`, seguida
de envio e reanálise Correto. NF e Pendência conservaram esses mesmos IDs, R$85,
uma tentativa e estado final Resolvida/Correto (Atrasado), confirmado no banco.
A requisição `register_invoice_document_attempt` respondeu HTTP 200, 5.864 bytes;
o fluxo também realizou uma leitura global HTTP 200 de 19.001 bytes. Não confundir
essa leitura pós-comando com a amostra dirigida de Realtime descrita a seguir.
Boleto permaneceu ausente das opções acessíveis de identificação em BASIC.

## Dashboard com segunda sessão real — K

Controlador permanece no Dashboard, Maio/2026, escopo Todas da CRE. Assistente
legitimamente autenticado em outra sessão abre Pendência de Extrato Conta Corrente
da Escola Local Autorizada. O observador recebe a mudança e executa **1
`read_school_operational_context`, 0 `read_operational_context`**, HTTP 200, resposta
**21.318 bytes**. Pendências abertas passa de 0 para 1 escola; as três escolas do
recorte continuam presentes. Amostra única, sem baseline pareado ou percentual de
ganho. A análise de extrato sem entrega preenchida foi impedida com explicação;
marcar entrega Sim permitiu o comando, conforme a regra vigente.

## Contato, cancelamento e reabertura — continuação H

Na baseline, uma sessão de Assistente com login rápido instalou as ações e registrou
contato interno pela UI (`save_pendency_contact_with_log`, HTTP 200, 1.891 bytes).
O drawer mostrou texto, autoria Assistente Local, data e histórico; nenhuma
mensagem externa foi enviada. Cancelar com justificativa mostrou Cancelada,
sem ação pendente. Reabrir com Documento ilegível e justificativa retornou Aberta
e preservou contato/histórico. Isso é uma contraprova de funcionamento das ações
quando os instaladores rodam a tempo, não prova de que o login tardio da baseline
funcionasse.

No candidato, o E2E Auth/RLS real de login tardio passou **1/1 em 1,0 minuto**:
aguardar 11 segundos antes de autenticar, criar NF/Pendência, contato, cancelamento
e reabertura, sem reload entre Auth e ações. A causa e a revisão independente estão
em `CAUSAL_FINDINGS.md`.

## Origem, competência e navegação — I/J

Partindo da página transversal de Pendências em Junho, Abrir Prontuário de um
registro originado em Maio levou a `/escolas/ESC-LOCAL` e selecionou Maio/2026.
Essa navegação recupera o contexto do registro; não contradiz a preservação de
Junho durante o novo envio/reanálise no próprio modal, observada anteriormente.

No candidato, Próxima unidade levou a `/escolas/ESC-OTHER`, mostrando Escola Local
de Outro Controlador (04.00.002), e manteve Maio/2026. Escola exibida e rota canônica
concordam. Retorno à Carteira preservou busca; a busca global encontrou escola e
Pendências relacionadas. Não foi certificada toda combinação de filtros/histórico.

## Exportação XLSX real — parte de M

Exportação de Pendências efetivamente baixada e aberta com leitor XLSX: **11.161
bytes**, SHA-256 `05697aaf6890ba96383a42d1b9008aca914fad1fea0a83d046050d98fffdfd0b`.
Abas RESUMO (23 linhas/12 colunas) e PENDÊNCIAS (9 linhas/23 colunas); cinco
registros operacionais conferidos, incluindo duas Abertas e três Resolvidas,
origem Maio/2026, Assessoria de `AUD-SERV-01`, `AUD-CONS-02` e `AUD-IDENT-01`, cada
resolvida com uma tentativa. O resumo sanitizado está em
`evidence/pendency-export-summary.json`; o workbook e os traces Auth permanecem
privados. Isso não certifica exports de todos os perfis/formatos nem Excel instalado.

## Limites adicionais e continuidade

Primeira autenticação nativa apresentou `PGRST303: JWT issued at future` numa
consulta de papel; nova autenticação legítima funcionou. Tratar como ocorrência
de relógio/ambiente, sem relaxar RLS ou inventar uma sessão. Nenhum pageerror foi
capturado no checkpoint (43 respostas REST observadas, não um benchmark isolado).

Capturas novas examinadas: fila terminal de Inventário, histórico Resolvidas em
Junho e drawer da despesa provisória. Recursos com trace/vídeo bruto permanecem
privados porque podem conter autenticação; o índice de rede versionado contém
somente horário, rota, status e bytes. Os testes A–N continuam parciais; esta
rodada não certifica todos os perfis, exports, falhas e operações concorrentes.
O índice `evidence/green-index.json` distingue os 11 GREENs de identidade, 19
unitários e o GREEN Auth tardio dos dois cenários legados que terminaram em timeout
e permanecem não certificados; nenhuma expectativa ou deadline foi afrouxada.
