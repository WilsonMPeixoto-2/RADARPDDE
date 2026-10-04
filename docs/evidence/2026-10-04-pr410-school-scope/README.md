# #410 — caracterização do contexto por escola, antes da nova RPC

Data: 04/10/2026. Código confrontado: `d4a37d7993804135619609f5ccec4adfe1d3871d`,
sobre main `d9bf67f7...` (#408). Esta etapa altera testes e documentação,
sem implementar leitura por escola, aplicação de fatia ou novo Realtime.

## O que foi conferido ao vivo

O primeiro incremento recebeu 16 workflows com conclusão `success` no SHA
exato d4a37d79. IDs/URLs constam em [stage1-ci.json](stage1-ci.json).
main continua d9bf67f7; #410 continua Draft. O manifesto Production observado
nesta rodada aponta d9bf67f7 e `supabase-production`.

A consulta [somente de leitura](production-readonly.sql), em 11:56:55 UTC,
confirmou 58 migrations, última `20260930003000`. O corpo da RPC instalada tem
MD5 `40d613a3fa7b30e677d41c1b40a6dcd6`, idêntico ao corpo entre os delimitadores
`$function$` da migration versionada. É `SECURITY INVOKER`, com
`search_path=pg_catalog, public`.

[Agregados e FKs observados](production-readonly.json):

| Relação | Vínculos existentes | Entre escolas |
|---|---:|---:|
| NF → bem | 22 | 0 |
| NF → avaliação | 233 | 0 |
| Pendência → NF | 125 | 0 |
| contato → Pendência | 5 | 0 |

As 233 relações NF/avaliação também coincidem em escola, competência e programa.
Existem **94 contatos sem Pendência**. Isso é permitido pelo schema e pela
consulta escolar própria; não classificar todos como registros órfãos indevidos.

Os números são fotografia desta consulta, não invariantes nem reprodução do
incidente de 02/10. Não foram resetadas estatísticas ou feitas escritas em Production.

## Cobertura real das seis coleções

Fonte SQL: [RPC global vigente](../../../supabase/migrations/20260929143215_read_operational_context.sql).
Seja C a competência solicitada e H o conjunto de estados históricos solicitado.
A cobertura é um fechamento de contexto F(C,H), não todas as linhas da escola.

| Coleção | Como entra na leitura global | Escola e remoção |
|---|---|---|
| `verifications` | mês C; contextos históricos escola/competência/programa das Pendências selecionadas e das NFs históricas selecionadas | `school_id`; uma avaliação histórica pode sair da projeção sem ser apagada |
| `registeredInvoices` | mês C; NF ligada a Pendência histórica; NFs dos bens ativos; todas as NFs irmãs dos contextos históricos necessários | `school_id`; apagar a última NF coberta exige representar fatia vazia; outras escolas permanecem |
| `pendencies` | mês C em qualquer estado; ativas de qualquer competência; encerradas em estados H | `school_id`; resolver uma antiga muda sua cobertura regular, não apaga histórico |
| `pendencyAttempts` | filhos das Pendências selecionadas | escola pelo pai; DELETE do pai usa CASCADE; remoção em memória precisa do vínculo antigo |
| `pendencyContacts` | contatos cujo pai está nas Pendências selecionadas | `school_id` próprio; DELETE do pai usa SET NULL, preservando contato no banco |
| `assets` | mês C; ativos em qualquer competência; bens ligados às NFs selecionadas, inclusive terminais irmãos | `school_id`; inventariar o último ativo antigo pode retirar bens, NFs e avaliações históricas da cobertura |

H admite `Resolvida` e `Cancelada`. Programa nulo numa dependência histórica
abrange **todos** os programas daquela escola/competência; não é filtro por programa
vazio. NFs ligadas podem carregar irmãs necessárias ao agregado, não só a NF do evento.
`UNION`/ordem por ID removem duplicação na resposta.

Exemplo já protegido: Pendência ativa de março leva a avaliação de março, NF ligada e
NF irmã. Bem ativo de fevereiro leva a NF do bem, NF irmã terminal, avaliação e
bem irmão. Filtrar apenas `competence_id=C` perde esse fechamento.

Ao resolver a última Pendência antiga ou inventariar o último bem ativo antigo,
essas dependências podem desaparecer da resposta. Upsert sozinho conservaria
estado que a releitura global atual teria retirado.

## Contatos têm duas coberturas deliberadamente diferentes

[Repository.querySchoolContacts](../../../src/data/repository-factory.js) consulta
`pendency_contacts` por `school_id`, independentemente do vínculo ou do mês.
[DataService.readSchoolContacts](../../../src/application/data-service.js) retorna
esses registros sem substituir o snapshot operacional. Em
[loadProntuarioContactHistory](../../../app.js), a aba Contatos consulta essa
autoridade e monta o DOM, verificando conexão do painel e escola antes de aplicar.

Já a coleção da RPC operacional contém somente contatos ligados às Pendências
selecionadas. Resolver/deletar o pai pode retirar o contato dessa coleção sem
deletá-lo do banco. Uma RPC escolar equivalente não pode se declarar completa
para o histórico inteiro de contatos. O carregamento específico da aba permanece.

Contadores/Timeline também consomem `contatos` em memória. Esta caracterização
não certifica que todos representam o histórico completo: é preciso manter
explícita a cobertura atual e testar as superfícies quando a aplicação mudar.
Incluir a jornada de alteração remota de contato geral com a aba Contatos já
aberta: aplicar as seis coleções não substitui a atualização dessa consulta própria.

## Fronteira escolar: evidência favorável e contraprova

Não foi encontrado fluxo legítimo de transferência de NF/Pendência/bem entre
escolas nos caminhos inspecionados. Exemplos de proteção existente:

- `save_pendency_command` valida escola/competência/programa da NF e da avaliação;
- `save_invoice_with_effects_impl`, quando recebe bem, valida a mesma escola e
  recusa mover escola de NF existente;
- `save_asset_with_verification_and_log` exige NF permanente que une escola,
  bem e avaliação.

Isso **não prova fechamento escolar incondicional**. As FKs relacionais são por
ID, sem chave composta que imponha igualdade de escola. O teste descartável fez:

1. NF de A aponta para bem terminal de B;
2. o UPDATE direto é aceito pelo schema;
3. assistente com acesso a A/B recebe o bem de B pela RPC global;
4. controlador restrito a A recebe a NF, mas RLS oculta o bem de B.

O teste registra comportamento existente sobre dados inconsistentes; não autoriza
esse vínculo como regra de produto nem identifica a causa do incidente atual.
RLS preserva autorização, mas não conserta integridade entre registros.
Fallback global também não repara a inconsistência.

**Decisão para o próximo incremento:** a RPC escolar precisa detectar contexto
não isolável/incompleto antes de declarar sua resposta completa. Não truncar
dependências de outra escola para obter um payload menor. Definir sinal explícito
de recuperação global ou falha sem aplicação, preservando RLS. Essa contraprova
passa a proteger o desenho; alteração ampla de constraints/writers fica fora
desta etapa, sem evidência de falha atual em Production.

## Projeções que precisam permanecer corretas

| Superfície | Dependência observada | Consequência para sincronização |
|---|---|---|
| Prontuário | seis coleções, avaliações por escola/competência/programa, NFs individuais e efeitos patrimoniais | fechar históricos; não reconstruir escola alheia |
| Dashboard | `cycle-b-dashboard.buildProjection`, escolas visíveis/filtradas, Pendências/contatos, bonificação/análise e bens | mudança de B pode alterar agregado quando A está aberta |
| Carteira/busca/filtros | `cycle-b-carteira.buildProjection`, status e filas por escola | dirty de B não pode virar dado silenciosamente atual |
| Competências | avaliações do mês e contagens de Pendências por escola/competência em `task-9-cross-view` | preservar competência e atualizar projeção dependente |
| Pendências/drawer | `task-9-pendencias-page.getPageModel`, pais/filhos/contatos e históricos | fila transversal; abertura de histórico amplia H |
| Inventário/Capital | índices `_bensByEscolaId` e vínculos com NFs/avaliações | histórico ativo e irmãos terminais continuam relevantes |
| Timeline | `school-timeline.timelineInput`: avaliações, Pendências, contatos, NFs, bens e logs | logs/contatos específicos não viram completos pela RPC das seis coleções |
| Alertas | `task-10-alerts-competence.getLatestContact` e ações/antiguidade das Pendências ativas | manter contato ligado/status da fila corretos; não limitar à unidade visível |
| Exportação de Pendências | carrega contexto com H=`Resolvida,Cancelada` antes de exportar | tratar ampliação de H como contexto novo; não misturar resposta antiga |
| Próxima unidade | lista estrutural de escolas; rota canônica corrigida em d4a37d79 | decidir nova sincronização pela rota; globais só compatibilidade |

Atualizar a escola remota sem reapresentar a tela atual não autoriza ignorar suas
projeções globais. Ao abrir uma visão global, reconciliar escolas dirty relevantes
antes de representar o agregado como atual. Busca, contadores e exportação fazem
parte da avaliação, mesmo fora da escola visível.

## Contrato mínimo antes da implementação

A futura resposta deve identificar escola S, competência C, estados H normalizados,
completude e as seis coleções obrigatórias. `[]` é resposta completa vazia;
coleção ausente é envelope inválido. Completude refere-se a F(C,H,S), não à escola
inteira em todo o histórico.

A equivalência com o global deve ser provada por IDs/conteúdo, incluindo tentativas
pela escola do pai e contatos pelo vínculo efetivamente selecionado. Dados
inconsistentes e vínculos que RLS oculta exigem teste próprio de fallback/falha.

Aplicação ainda não está implementada. Antes dela:

- representar quais registros a leitura anterior cobria; saída de cobertura e
  exclusão física têm o mesmo efeito nessa projeção, sem apagar o banco;
- preservar escolas alheias e fontes com cobertura distinta;
- usar vínculos antigos para remover filhos de pai ausente;
- não aplicar uma fatia ao `StatePort.applyEntities` atual diretamente: ele
  substitui o conjunto da entidade/bundle, podendo apagar outras escolas;
- coordenar leitura escolar/global, escrita, troca de C/H/usuário e resposta
  atrasada na autoridade DataService existente, sem controller paralelo;
- provar envelope inválido, última linha, pai excluído, alteração de vínculo,
  mudança de status, programa nulo e ampliação/redução de H;
- medir clone/normalização/reconstrução de índices: redução de rede isolada
  não garante redução de Long Tasks ou estabilidade da UI.

## Verificação desta etapa e limites

A suíte existente foi ampliada de **15 para 35 verificações pgTAP**. Passou em
PostgreSQL **17.11** descartável, pgTAP **1.3.4**, imagem fixada por digest
no [registro local](local-characterization.json). Bootstrap versionado e 57 das
58 migrations foram aplicados: a migration de Realtime gerenciado foi omitida,
como no smoke genérico do projeto.

Auth e jsonschema usam o bootstrap simplificado desse smoke. São testes reais de
SQL/FKs/RLS/RPC, não prova do gateway HTTP, JWT emitido por Auth, Broadcast,
pg_jsonschema nativo, multiusuário ou performance.

**Prova posterior em Supabase real descartável:** run
[37200758428](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/37200758428),
checkout `1d13b02c1455be7fae8628f6b40df67c70713f1c`, três jobs concluídos com
sucesso. O job Supabase executou **38 arquivos/566 verificações pgTAP**, incluindo
as 35 desta suíte. Auth, RLS, extensions/migrations nativas, frontend e primeira
despesa em duas sessões também passaram nesse gate existente. IDs, trecho de log,
hashes e limites estão em [supabase-ci.json](supabase-ci.json). Isso certifica a
caracterização do contrato vigente; RPC escolar e jornada sustentada não existem
nesta etapa. Os nove controles unitários relacionados também passaram.

Não foi alterado código do produto, schema ou configuração de Production.
Não foi criado ambiente pago. Não há ganho de performance novo para relatar.
A CI do incremento d4a37d79 está concluída. A CI do checkpoint 1d13b02c é uma
execução separada; conferir [registro por SHA](checkpoint-ci.json).

## Próximo passo e fronteira

Formalizar o envelope/recuperação e implementar leitura SQL por escola, restrita
antes da agregação, sob invoker/RLS, usando estas contraprovas como entrada.
Provar equivalência com a RPC global e medir plano/payload em ambiente descartável.
Depois implementar substituição de fatia e concorrência na autoridade existente.
Não ativar Realtime dirigido ou suprimir eco/foco antes de essas bases passarem.

#410 permanece Draft: a aprovação do incremento de rota não certifica a arquitetura
inteira. #407/#409 permanecem evidência. main/Production permanecem #408.
