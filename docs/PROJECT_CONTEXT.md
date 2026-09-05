# RADAR PDDE 2026 — Contexto funcional e arquitetural corrente

**Atualizado em:** 5 de setembro de 2026  
**Classe documental:** contexto funcional corrente, subordinado à continuidade operacional

> **Antes de usar este documento, leia [`../START_HERE.md`](../START_HERE.md).**  
> A única fila executável vigente é [`MASTER_PLAN_CURRENT.md`](MASTER_PLAN_CURRENT.md). Este arquivo descreve o produto e suas regras estáveis; não define uma fila concorrente.

## 1. Finalidade

O RADAR PDDE organiza o ciclo de entrega, análise, acompanhamento, regularização, consolidação, inventário, histórico e apoio à decisão dos programas do PDDE no âmbito da 4ª CRE/SME-Rio.

Dashboard, Carteira, Competências, Prontuário, Pendências, Capital e Inventário, Registros Internos, Gestão de Equipe, configurações, alertas, busca e exportações representam o mesmo universo de dados. Nenhuma dessas superfícies cria uma fonte de verdade independente.

## 2. Continuidade e precedência

A continuidade corrente é:

```text
START_HERE.md
→ conferir a main remota
→ CURRENT_STATE.md
→ MASTER_PLAN_CURRENT.md
→ PLAN_TRACEABILITY.md quando for necessário entender a origem de uma regra/tarefa
→ código, testes, ADRs, migrations e evidências específicos da tarefa
```

O plano source-first de 03/09 foi correto em seu checkpoint, mas é **histórico** depois dos PRs #254, #256, #257, #258, #260 e #261. O PR #262 foi abortado sem merge e não define regra vigente.

Para determinar o estado atual de uma superfície:

1. decisão funcional posterior deliberadamente aprovada e o hotfix que a implementou;
2. código, banco e ambiente resultantes;
3. testes que comprovadamente representam esse contrato;
4. documentação corrente reconciliada;
5. documentação histórica como explicação da linhagem.

Código atual não é automaticamente “a regra correta” se houver indício de defeito. Da mesma forma, texto antigo não pode desfazer uma decisão posterior apenas porque foi escrito primeiro.

## 3. Perfis funcionais

### Controlador

Possui carteira de responsabilidade principal e pode atuar nas escolas autorizadas da própria CRE sem transferir automaticamente `controller_id`. Pode operar análise, Pendências e demais funções concedidas pela política corrente. Redistribuição de carteira e alteração de identidade institucional da escola não são atribuições comuns do Controlador.

### Assistente de Verbas Federais

Atua transversalmente na CRE, administra a equipe, distribui carteiras, opera análises e Pendências autorizadas, pode retificar consolidações e possui as funções administrativas previstas para a CRE.

### Gestão SME

Possui acompanhamento gerencial e funções de configuração expressamente autorizadas. Nas superfícies operacionais restritas, não recebe análise técnica editável nem mutações de Pendências apenas por visualizar os dados.

### Equipe de Inventário

Opera a conclusão da inventariação e acessa o recorte patrimonial autorizado. A visibilidade de uma superfície não amplia automaticamente suas permissões de escrita.

### Administrador técnico

`technical_admin` é papel técnico autenticado, não quinto perfil funcional cotidiano. A simulação visual de outro perfil não troca JWT, identidade nem reduz a autoridade real do papel técnico.

A autorização efetiva é cumulativa entre interface, serviços, Auth, RLS, RPCs e Edge Functions.

## 4. Competência e navegação

A competência mensal usa `YYYY-MM` e é gerida por `RadarCompetenceContext` como contexto global compartilhado pelas superfícies mensais.

Regras atuais:

- uma única competência global, sem seletor concorrente;
- seleção válida pode ser restaurada entre navegações;
- competências futuras podem ser consultadas, mas não editadas nas operações mensais protegidas;
- abrir apenas o detalhe de uma Pendência não troca silenciosamente a competência global;
- Pendências é exceção deliberada: abre em **Todas as competências** porque representa passivo histórico;
- ao seguir da Pendência para o Prontuário, a competência de origem volta a ser aplicada ao contexto mensal;
- retorno contextual preserva, quando aplicável, rota, filtros, rolagem e foco.

## 5. Avaliação mensal

A identidade da avaliação é:

```text
escola + competência + programa
```

Bonificação, análise técnica e Pendência são dimensões independentes.

Regras confirmadas no código corrente:

- bonificação admite `Sim`, `Não` e `Não se aplica` quando o documento permite;
- Extrato de Conta Corrente e Extrato de Investimento não usam N/A para concluir a bonificação;
- Declaração BB Ágil pode usar N/A quando cabível; nesse estado sua análise técnica fica neutra como `Correto`;
- ao sair de N/A para `Sim` ou `Não`, derivações incompatíveis voltam ao estado que exige análise, inclusive `Não analisado` quando aplicável;
- Pendência ativa da própria Declaração BB Ágil bloqueia a troca para N/A até o ciclo ser encerrado adequadamente;
- Nota Fiscal não pode ser marcada N/A se já existem despesas/notas registradas no contexto;
- Consulta Assessoria é derivada das NFs de serviço e não é uma bonificação mensal livremente editável;
- uma operação semanticamente idêntica ao estado atual não deve criar gravação/log/versão apenas por repetição;
- consolidação exige preenchimento válido do conjunto aplicável;
- retificação é ação distinta, exige justificativa, registra antes/depois e é autorizada à Assistente no fluxo funcional corrente;
- `PDDE Básico` aparece primeiro somente na apresentação; a ordem persistida dos programas não é reescrita por esse motivo.

## 6. Notas Fiscais e despesas

`notaFiscal` continua agregada para bonificação, mas cada registro em `registered_invoices` possui identidade própria.

### Análise fiscal individual

- análise técnica é individual por `registered_invoice_id`;
- o resumo fiscal mensal é derivado, não uma análise agregada livremente editável;
- precedência do resumo: `Incorreto → Não analisado → Correto (Atrasado) → Correto`;
- Pendência fiscal nova precisa estar ligada à invoice correspondente;
- NFs diferentes podem ter Pendências simultâneas;
- a mesma NF não pode ter duas Pendências ativas equivalentes;
- com Pendência ativa da própria NF, edição estrutural comum fica bloqueada;
- exclusão comum é bloqueada quando existe histórico individual que precisa ser preservado.

### `a_identificar`

- registro novo nasce obrigatoriamente `Incorreto + Pendência` na mesma operação protegida;
- o editor comum não transforma uma despesa identificada em `a_identificar`;
- a identificação posterior ocorre em **Pendências → Registrar novo envio**;
- o mesmo `registered_invoice_id` é preservado;
- a apresentação do documento leva a análise para `Não analisado` e a Pendência para `Aguardando reanálise`; não resolve o caso por si só;
- os 16 registros legados legítimos classificados no hotfix permanecem sem história retroativa fabricada;
- não é permitido associar automaticamente um legado por número, valor, descrição ou outra heurística.

### Boleto de Internet

`boleto_internet` é **tipo de gasto dentro de Notas Fiscais**, exclusivo de Educação Conectada. Não é documento autônomo, não possui bonificação/análise/Pendência próprias, não cria patrimônio e não participa de Consulta Assessoria.

## 7. Consulta Assessoria

Somente NFs de serviço participam dessa dimensão.

- cada NF possui estado de envio e análise próprios;
- Pendência usa `registered_invoice_id`;
- Pendência da NF A não bloqueia a NF B;
- `Incorreto` é confirmado junto com a Pendência pela operação atômica correspondente;
- edição comum da Assessoria é separada da abertura de Pendência;
- novo envio corretivo aceita a Pendência ativa quando está **`Aberta` ou `Aguardando reanálise`**; se já havia envio aguardando análise, o novo envio o substitui como tentativa mais recente sem reescrever o histórico;
- depois do novo envio, o caso permanece `Aguardando reanálise`;
- reanálise usa a tentativa real mais recente ainda aguardando;
- reanálise correta resolve; incorreta ou arquivo indisponível retorna o ciclo para `Aberta`;
- conteúdo histórico do envio não é reescrito pela reanálise;
- resumo mensal: `Sim` se ao menos uma consulta exigível foi enviada; `Não` se existem NFs de serviço e nenhuma foi enviada; `Não se aplica` se não existe NF de serviço.

Autoridades atuais permanecem separadas: edição ordinária no `InvoiceService`; abertura/reanálise na integração de Pendência da Assessoria; novo envio na integração corretiva; persistência pelas RPCs correspondentes.

## 8. Pendências

Estados canônicos:

```text
Aberta
Aguardando reanálise
Resolvida
Cancelada
```

`Aberta` e `Aguardando reanálise` são estados ativos.

Regras atuais:

- abertura documental preserva contexto de escola, competência, programa e documento;
- NF/Assessoria individual também preserva `registered_invoice_id`;
- novo envio não resolve;
- substituição de envio ainda não analisado é permitida enquanto a Pendência está `Aguardando reanálise`;
- `Aberta → próxima ação da Escola`;
- `Aguardando reanálise → próxima ação do Controlador`;
- estados terminais não mantêm próximo ator ativo;
- reanálise correta resolve; incorreta/arquivo indisponível reabre o ciclo para ação da Escola;
- somente Pendência ativa pode ser cancelada;
- `Resolvida` ou `Cancelada` pode ser reaberta quando a operação é autorizada;
- histórico de cancelamento permanece histórico, mas `canceled_at` atual só representa estado terminal efetivamente cancelado;
- contatos/cobranças são registros associados, não mudança automática do estado da Pendência;
- a fila é transversal entre competências e possui filtro local próprio.

## 9. Capital e Inventário

Regra vigente pós-PRs #257/#258/#260:

1. NF permanente cria/vincula o bem patrimonial;
2. com número da NF **e processo de inventário já cadastrado**, o bem novo entra `Encaminhada`, mostrado como **Aguardando Inventariação**;
3. sem processo, o bem novo entra `Não encaminhada`;
4. se o bem está `Não encaminhada`, ele não pode pular diretamente para `Inventariada`;
5. nesse ramo, a ordem é `Não encaminhada → Encaminhada → Inventariada`;
6. `encampInventario` é derivado do conjunto de aquisições permanentes: nenhuma = `Não se aplica`; alguma não encaminhada = `Não`; todas encaminhadas/inventariadas = `Sim`;
7. mudança patrimonial não aprova automaticamente a análise técnica derivada;
8. o Prontuário exibe o vínculo NF ↔ bem pela identidade técnica, não por coincidência de texto/valor;
9. encaminhamento posterior sincroniza bem + verificação + log atomicamente;
10. bem derivado de NF não permite edição isolada do número fiscal;
11. conclusão da inventariação exige estado corrente `Encaminhada` e responsável informado;
12. guards de gesto repetido protegem encaminhamento e inventariação enquanto a primeira chamada está em andamento.

A frase `Não encaminhada → Encaminhada → Inventariada` descreve **o ramo que está Não encaminhada**. Ela não determina o estado inicial de toda NF permanente.

## 10. Escolas, carteira e Gestão de Equipe

### Escolas e carteira

- `controller_id` representa o responsável principal;
- Controlador não redistribui carteira pela edição comum da escola;
- alteração da identidade institucional e redistribuição são reservadas ao fluxo autorizado da Assistente;
- nova escola exige os identificadores institucionais obrigatórios e competência inicial válida;
- duplicidades de identificadores institucionais são rejeitadas;
- PDDE Básico permanece no conjunto de programas ativos da escola;
- redistribuição individual ou em lote usa operação própria e log.

### Gestão de Equipe

Fluxo atual:

```text
DirectoryService
→ TeamAccountGateway
→ Edge Function team-account-management
→ Supabase Auth Admin + RPC transacional
```

- Assistente e `technical_admin` são os gestores autorizados dessa frente;
- cadastro/edição de Controlador ou Inventário sincroniza diretório, conta Auth, perfil e log;
- reutilização de conta existente só ocorre quando não há vínculo ativo incompatível;
- falha após alteração de Auth exige compensação/restauração;
- desativação é lógica e preserva histórico;
- Controlador só pode ser desativado depois que sua carteira estiver zerada;
- não é permitido desativar o único Controlador ativo nem o único integrante ativo do Inventário;
- segredos administrativos permanecem somente no backend protegido;
- CORS, sessão/JWT e papel autorizado são verificados pela Edge Function.

## 11. Exportações e registros

- relatório institucional: XLSX, com CSV de contingência onde previsto;
- Excel SME: uma competência, uma aba e 27 colunas A:AA; o template de 30 colunas é apenas fonte de projeção;
- relatório XLSX de Pendências respeita busca/filtros e não expõe IDs técnicos;
- downloads institucionais previstos registram auditoria;
- alterações materiais do Excel SME exigem sua certificação específica;
- Registros Internos usam `administrative_logs` e respeitam o recorte de leitura por papel; SME real não recebe automaticamente visão ampla de logs.

## 12. Persistência e confiabilidade

- Supabase é a persistência canônica de Production;
- Production é fail-closed: ausência ou inconsistência da configuração remota não ativa seed/LocalStorage institucional silenciosamente;
- concorrência otimista usa `row_version` onde aplicável;
- operações compostas usam RPC/transação quando o domínio exige atomicidade;
- payloads de negócio não devem carregar aliases técnicos `rowVersion`/`row_version`;
- dois documentos com conteúdo idêntico podem representar despesas legítimas distintas; não deduplicar por conteúdo;
- o PR #260 deixou jornadas reais de `ação → persistência → leitura → reload → releitura` como baseline de regressão;
- guards de clique/repetição em andamento não substituem a dívida ainda planejada de idempotência durável para retry ambíguo da NF normal.

A baseline funcional do PR #260 contém 46 migrations, incluindo `20260904040000_functional_reliability_inventory_sync` e a RPC `save_asset_with_verification_and_log`.

## 13. Comunicação e UX protegidas

- textos oficiais externos gerados não exibem o nome interno `RADAR PDDE`;
- o cabeçalho de Notas Fiscais não repete uma situação técnica agregada que já é apresentada individualmente;
- Notas Fiscais/Consulta Assessoria mantêm a individualização visual aprovada e a correção de overflow desktop do PR #214;
- vínculo de inventário no Prontuário mostra NF, bem, valor e status conforme PR #258;
- Pendências mantém sua estrutura vigente; o plano atual não autoriza redesign por simples refatoração arquitetural;
- mobile não pode perder conteúdo ou capacidade essencial por reorganização responsiva.

## 14. Trabalho remanescente

Este documento **não define o backlog**. O que ainda deve ser executado está exclusivamente em [`MASTER_PLAN_CURRENT.md`](MASTER_PLAN_CURRENT.md), reconciliado em [`PLAN_TRACEABILITY.md`](PLAN_TRACEABILITY.md).

ADR-051, sobre hardening adicional de escrita direta em `registered_invoices`, permanece deliberadamente adiada e não deve ser inserida oportunisticamente nas frentes funcionais atuais.
