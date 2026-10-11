# Jornadas observadas — checkpoint controlado

11/10/2026; runtime `113841bd`, UI http://127.0.0.1:4176, Chromium headed
1440×900, Controlador Local, Supabase/Auth/RLS reais **descartáveis**.
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
Não declarar B/H completos: exclusão, outras variantes e histórico/contacto ainda faltam.

## Clareza a confrontar — sem classificação causal concluída

O drawer identifica `NF: AUD-CONS-02`. O modal de novo envio mostra apenas
Documento: Notas Fiscais; o modal de reanálise destaca descrição/tipo/valor, não
o número da NF. Investigar relevância para NFs parecidas e contrato visual vigente
antes de corrigir. Nenhuma gravação na NF errada foi observada.

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
apareceu para o boleto. O formulário ainda pede “Número da Nota Fiscal” nesse tipo:
achado de clareza a reproduzir/testar, sem falha de regra demonstrada.

### Despesa a identificar / repetição de gesto

Duplo clique em Registrar Despesa produziu **uma** chamada
`save_unidentified_expense_with_pendency` (HTTP 200, corpo de resposta 3.960 bytes),
uma NF de R$85 e uma Pendência Aberta/Incorreto. Referência `AUD-EXP-PROV-01`.
IDs: NF `nota-5cd420ef-619b-4230-87b0-1f83f45bcdb5`, Pendência
`pend-f431efed-0482-4c27-a452-9dfe035506fb`. Identificação/reanálise ainda pendentes.

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
