# Auditoria semântica de continuidade e rastreabilidade — WIP

**Data:** 4 de setembro de 2026  
**Classe:** trabalho de auditoria em andamento — **NÃO CANÔNICO**  
**Baseline congelada para leitura:** `876c5976124815d2848f7d2d9e8a82b7cd3a43c5`  
**Branch de auditoria:** `audit/continuity-source-traceability-2026-09-04`

> Este arquivo não autoriza alteração funcional, não redefine regra de negócio e não substitui documentação vigente. Ele existe para preservar evidências e conflitos durante a auditoria profunda. Uma regra só poderá migrar para a futura engenharia de continuidade depois de reconciliada contra código, banco/PR quando aplicável, decisões posteriores e testes que realmente representem o comportamento atual.

## 1. Método obrigatório

A auditoria não decide por data, nome de arquivo, rótulo “canônico”, quantidade de testes ou simples ocorrência de palavras-chave.

Para cada afirmação funcional relevante:

1. identificar exatamente a regra, incluindo **pré-condição, ação, efeito automático e pós-condição**;
2. localizar a origem documental ou decisão mais antiga disponível;
3. rastrear PRs/hotfixes/ADRs posteriores que tenham especializado, substituído ou limitado a afirmação;
4. localizar a implementação no SHA congelado;
5. localizar a persistência/RPC/migration quando material;
6. conferir os testes atuais, sem permitir que o teste invente a regra;
7. classificar a afirmação individualmente, e não o arquivo inteiro.

Estados provisórios usados neste WIP:

- `VERIFICADA_ATUAL`: código atual + linhagem posterior sustentam a regra;
- `VERIFICADA_CONDICIONAL`: regra atual, mas válida apenas sob pré-condições explícitas;
- `PARCIALMENTE_SUPERADA`: parte do documento continua válida e parte foi substituída depois;
- `HISTORICA`: descreve corretamente um checkpoint anterior, sem autoridade presente;
- `CONFLITO`: fontes atuais ainda não foram reconciliadas com segurança;
- `PENDENTE_DE_LEITURA`: ainda não houve confronto semântico suficiente.

## 2. Inventário mecânico anterior à leitura semântica

O inventário integral da baseline encontrou:

- 842 arquivos versionados;
- 212 documentos textuais indexados;
- 186 arquivos de código do produto indexados;
- 321 arquivos de validação;
- 0 arquivos textuais ilegíveis;
- 0 links internos ausentes pelo resolvedor mecânico;
- 15 afirmações textuais que ainda apresentam R1–R9/source-first como execução corrente ou próxima sequência.

Esses números servem somente para garantir abrangência. Não determinam validade semântica.

## 3. Achado estrutural já comprovado — precedência documental contraditória após PR #260

### Situação

`docs/CURRENT_STAGE.md`, atualizado em 04/09, declara que a estabilização do PR #260 é a baseline corrente e que R1–R9 permanece como histórico arquitetural, não devendo ser executado literalmente.

Ao mesmo tempo, documentos de entrada ainda apresentam o plano de 03/09 como corrente, entre eles:

- `AGENTS.md`;
- `README.md` da raiz;
- `docs/README.md`;
- trechos de `docs/reference/STATUS_DOCUMENTOS.md`;
- o próprio plano source-first de 03/09, como esperado para o seu checkpoint.

### Classificação provisória

`CONFLITO DOCUMENTAL DE CONTINUIDADE`.

Não significa que todo o conteúdo desses arquivos esteja errado. Significa que afirmações de **rota de retomada / fila executável** ficaram superadas por PR #260, enquanto diversas regras duradouras contidas nos mesmos arquivos continuam potencialmente válidas. A correção futura deverá ser **por afirmação**, não por descarte integral dos documentos.

## 4. Rastreabilidade funcional confirmada — Nota Fiscal permanente e Inventário

### 4.1 Criação com processo de inventário já disponível

**Regra atual provisoriamente verificada:** ao cadastrar uma despesa/NF `permanente`, se já existem número/referência fiscal e processo de inventário da escola, o bem derivado nasce em status `Encaminhada`, apresentado na fila como **Aguardando Inventariação**.

**Origem posterior comprovada:** PR #257, que explicitamente acrescentou os cenários:

- permanente com processo → `Sim` em `encampInventario`;
- permanente sem processo → `Não`.

O PR #257 declarou que não alterava os estados patrimoniais nem o fluxo manual `InventoryService.forward`; apenas passou a projetar corretamente os efeitos do conjunto patrimonial na verificação mensal.

**Confirmação subsequente:** PR #258 usa como cenário real `NF Teste 2 → Impressora → Bem permanente/Encaminhada` e declara preservar a criação automática do bem conforme PR #257.

**Implementação atual:** `src/domain/invoice-effects.js` e `src/application/inventory-service.js` escolhem o status inicial conforme presença simultânea de número fiscal + processo de inventário.

**Classificação:** `VERIFICADA_CONDICIONAL`.

### 4.2 Criação sem processo de inventário

**Regra atual:** despesa permanente sem processo de inventário disponível gera bem `Não encaminhada`; a projeção mensal `encampInventario` fica `Não` enquanto existir aquisição permanente não encaminhada.

**Classificação:** `VERIFICADA_CONDICIONAL`.

### 4.3 Encaminhamento posterior

Se o bem nasceu `Não encaminhada` e o processo de inventário é disponibilizado depois, `InventoryService.forward` realiza a transição para `Encaminhada`. Após PR #260, o encaminhamento posterior persiste de forma atômica o bem, a projeção `encampInventario` da verificação e o log administrativo pela operação `save_asset_with_verification_and_log`.

**Classificação:** `VERIFICADA_ATUAL`.

### 4.4 Conclusão da inventariação

`InventoryService.inventory` exige que o estado corrente seja exatamente `Encaminhada`; tentativa de concluir a inventariação a partir de `Não encaminhada` é rejeitada.

**Classificação:** `VERIFICADA_ATUAL`.

### 4.5 Wording perigoso no checkpoint do PR #260

O handoff do PR #260 resume a sequência como `Não encaminhada → Encaminhada → Inventariada`. Essa frase é correta como **ordem das transições quando o bem ainda não foi encaminhado**, mas é incompleta como descrição universal da criação: PR #257 já havia estabelecido criação direta em `Encaminhada` quando os pré-requisitos estavam presentes.

O E2E `supabase-functional-reliability.spec.js` do PR #260 confirma esse recorte porque limpa propositalmente `inventory_process` antes de cadastrar a NF, criando o ramo `Não encaminhada` que depois é encaminhado manualmente.

**Classificação da frase isolada do handoff:** `PARCIALMENTE_SUPERADA/IMPRECISA SEM PRÉ-CONDIÇÃO`, sem indicar defeito no código atual.

## 5. Rastreabilidade funcional confirmada — Pendências / novo envio

### 5.1 Novo envio não resolve automaticamente

A operação de novo envio registra uma tentativa e leva/mantém a Pendência em `Aguardando reanálise`; a resolução depende de reanálise posterior.

**Classificação:** `VERIFICADA_ATUAL`.

### 5.2 Pré-condição do novo envio foi ampliada após ADR-050

A ADR-050 ainda contém formulação segundo a qual novo envio exige Pendência `Aberta`. O PR #254, posterior e integrado, corrigiu explicitamente a incompatibilidade entre RPC e interface/domínio para permitir **Registrar substituição mais recente** também quando a Pendência já está `Aguardando reanálise`.

Comportamento posterior do PR #254:

- Pendência real pode estar `Aberta` ou `Aguardando reanálise` para registrar novo envio/substituição;
- a tentativa nova fica aguardando análise;
- a Pendência resultante permanece `Aguardando reanálise`;
- o histórico e o conteúdo do envio anterior não são reescritos.

**Classificação da ADR-050 nesse ponto específico:** `PARCIALMENTE_SUPERADA`.

O restante da ADR-050 não é automaticamente invalidado por essa especialização.

### 5.3 Reabertura

PR #254 também alinhou a interface ao domínio para permitir reabertura de Pendência `Resolvida` **ou `Cancelada`**, preservando histórico de cancelamento sem projetar `canceled_at` como se o registro ainda estivesse terminalmente cancelado depois da reabertura.

**Classificação:** `VERIFICADA_ATUAL`.

### 5.4 Próximo ator

PR #256 sincronizou as projeções `responsavel` e `proximoAtor` em todas as transições documentais e remove aliases stale `nextActor` / `next_actor` durante normalização.

Semântica atual observada:

- `Aberta` → próxima ação da Escola;
- `Aguardando reanálise` → próxima ação do Controlador;
- `Resolvida` / `Cancelada` → sem próximo ator ativo.

**Classificação:** `VERIFICADA_ATUAL`.

## 6. Rastreabilidade funcional confirmada — Declaração BB Ágil

PR #241 implementou e testou:

- Declaração BB Ágil aceita `Não se aplica` quando não houver despesas a lançar;
- N/A projeta análise técnica neutra `Correto`;
- ao voltar de N/A para `Sim`/`Não`, análise retorna a `Não analisado`;
- Pendência ativa do mesmo documento bloqueia a troca para N/A até resolução/cancelamento;
- Extrato de Conta Corrente e Extrato de Investimento continuam sem N/A.

A regra está refletida em `docs/architecture/avaliacao-mensal.md` e no código atual examinado.

**Classificação:** `VERIFICADA_ATUAL`.

## 7. Rastreabilidade funcional confirmada — Boleto de Internet

A regra antiga de `boletoInternet` como documento autônomo foi substituída pelos PRs #208/#209 e especializada pela ADR-050:

- `boleto_internet` é tipo de gasto dentro de `notaFiscal`;
- exclusivo de Educação Conectada;
- usa bonificação/análise/Pendência de Notas Fiscais;
- não possui linha documental própria;
- não cria inventário;
- não participa de Consulta Assessoria.

Documentos históricos do PR #203 permanecem evidência daquele checkpoint, não especificação atual.

**Classificação:** `VERIFICADA_ATUAL`.

## 8. Rastreabilidade funcional confirmada — PR #260

O PR #260 introduziu ou reforçou, no estado atual:

- bloqueio de inventariação antes do estado `Encaminhada`;
- bloqueio de edição isolada do número fiscal no bem derivado de NF;
- sincronização atômica do encaminhamento posterior com `encampInventario` + log;
- limpeza e prevenção de `rowVersion` / `row_version` dentro do payload funcional da verificação;
- proteção contra gesto repetido durante gravação em novo envio, reanálise, encaminhamento e inventariação;
- preservação do guard já existente no submit de Nota Fiscal;
- provas com Supabase descartável para jornadas selecionadas de persistência e reload.

Essas garantias não autorizam inferir regras não testadas ou transformar o wording resumido do PR em especificação universal sem pré-condições.

## 9. Problemas de representação já identificados na matriz funcional

A matriz atual registra operações importantes, mas alguns itens agregam variantes com efeitos diferentes. Exemplo: `INV-01` agrupa cadastro/edição de Nota Fiscal, despesa comum e `a_identificar` numa única ação.

Para continuidade robusta, o contrato futuro precisará registrar pelo menos:

```text
pré-condição → ação → efeitos automáticos → persistência → pós-condição → superfícies afetadas
```

Também precisará registrar explicitamente a relação `regra anterior → regra sucessora`, em vez de depender de o próximo agente interpretar cronologia entre dezenas de documentos.

## 10. Próximos blocos da auditoria semântica

Ainda **não consolidados**:

- avaliação mensal completa e retificações;
- análise fiscal individual e Consulta Assessoria por NF;
- `a_identificar` e legados;
- identidade/exclusão/conversão de NFs e efeitos patrimoniais;
- todas as transições de Pendências e contatos;
- competência global e navegação transversal;
- perfis funcionais e operações efetivamente disponíveis;
- escolas, carteira e Gestão de Equipe;
- exportações;
- bootstrap/readiness/extensões e autoridade funcional;
- Supabase/RPCs/migrations 45–46;
- documentação visual/UX e decisões aprovadas;
- planos, audits, handoffs e evidências históricas anteriores, para rastrear origem e sucessão das regras.

Nenhum item desta seção deve ser tratado como defeito ou backlog até a leitura e reconciliação correspondentes.
