# RADAR PDDE — Registro corrente de decisões

**Atualizado em:** 5 de setembro de 2026  
**Classe:** ledger de decisões vigentes e sucessão; não é fila executável

> Para retomar o projeto, comece em [`../START_HERE.md`](../START_HERE.md). O único plano executável está em [`MASTER_PLAN_CURRENT.md`](MASTER_PLAN_CURRENT.md). Este arquivo registra **o que foi decidido**, não **o que executar a seguir**.

## 1. Regra de manutenção

Uma decisão permanece válida até ser expressamente substituída, especializada ou limitada por decisão/hotfix posterior.

Quando uma decisão posterior muda apenas parte de uma ADR, a ADR não é descartada inteira: registra-se a cláusula substituída e preserva-se o restante compatível.

O histórico detalhado anterior permanece nos ADRs, handoffs, evidências e no histórico Git. Este ledger corrente evita que a próxima sessão tenha de deduzir a regra vigente pela ordem de dezenas de arquivos.

## 2. Governança de continuidade

### GOV-01 — uma única porta de entrada

**Status:** vigente

Toda sessão nova começa em `START_HERE.md`, confirma a `main` remota e só depois lê estado, plano e rastreabilidade.

Não existe segunda ordem de leitura em README, handoff, ADR ou plano datado.

### GOV-02 — hotfix posterior emenda o plano anterior

**Status:** vigente

Quando um hotfix deliberadamente aprovado altera uma superfície, sua decisão prevalece sobre a redação anterior do plano nessa superfície. Antes de retomar a fila planejada, o estado, a rastreabilidade e o plano sucessor precisam absorver o hotfix.

O produto não é revertido para “voltar a combinar” com um plano histórico.

### GOV-03 — auditoria não altera regra por inferência

**Status:** vigente

Auditoria primeiro classifica o comportamento atual. Teste, wording de PR ou plano histórico não criam regra de negócio por conta própria. Divergência entre fontes atuais deve ser investigada antes de qualquer mudança funcional.

## 3. Linha recente de sucessão do plano

### Checkpoint PR #253 — 03/09

O plano source-first R1–R9 foi a reconciliação correta do plano anterior com o estado conhecido naquele momento.

### Emendas posteriores

Depois do #253 foram integrados:

```text
#254 → #256 → #257 → #258 → #260 → #261
```

Esses PRs alteraram/estabilizaram o produto antes da retomada literal da fila R1–R9.

### Evento de governança — continuidade pós-PR #260

**Status:** vigente

O plano source-first de 03/09 passou a ser **histórico**. Seus itens foram reconciliados em `PLAN_TRACEABILITY.md` contra os hotfixes posteriores e o código final da baseline.

O sucessor é:

**`docs/MASTER_PLAN_CURRENT.md` — único plano executável vigente.**

O PR #262 foi abortado e fechado sem merge; não integra a baseline nem a linha de decisão vigente.

## 4. Persistência e segurança operacional

### ADR-023 e sucessoras — Supabase canônico

**Status:** vigente

Production usa Supabase como persistência canônica. Production é fail-closed: ausência ou inconsistência da configuração remota não autoriza seed/local fallback institucional silencioso.

Auth/RLS continuam parte da autorização, não substitutos da regra de aplicação.

### Concorrência e atomicidade

**Status:** vigente

Operações compostas usam versão esperada e RPC/transação quando o domínio exige que múltiplas entidades mudem juntas. `row_version` é metadado top-level; aliases `rowVersion`/`row_version` não pertencem ao payload de negócio.

Duas NFs de mesmo conteúdo podem ser despesas legítimas distintas. Deduplicação por conteúdo continua excluída.

## 5. Competência e navegação

### ADR-025 — competência global

**Status:** vigente

`RadarCompetenceContext` é a fonte do contexto mensal global. Não criar seletor concorrente.

Pendências é exceção deliberada: representa passivo transversal e pode abrir em todas as competências; navegar da Pendência ao Prontuário reaplica a competência de origem quando o recorte mensal volta a ser necessário.

Navegação contextual preserva origem, filtros/rolagem/foco quando aplicável.

## 6. Avaliação mensal

### Independência das três dimensões

**Status:** vigente

Bonificação, análise técnica e Pendência são dimensões independentes. Abrir/resolver Pendência não reescreve automaticamente a bonificação.

Consolidação depende do conjunto aplicável estar preenchido e válido; retificação é operação distinta, auditável e autorizada conforme o serviço atual.

### Declaração BB Ágil N/A

**Status:** vigente

Declaração BB Ágil pode ser `Não se aplica` quando cabível. N/A projeta análise neutra `Correto`; sair de N/A reinicia a análise aplicável; Pendência ativa do mesmo documento bloqueia a troca para N/A.

Extratos de Conta Corrente/Investimento não recebem essa exceção.

### PDDE Básico primeiro

**Status:** vigente

PDDE Básico aparece primeiro **somente na apresentação**. A ordem persistida de programas não é reescrita.

## 7. Notas Fiscais, `a_identificar` e Assessoria

### ADR-050 — individualização por invoice

**Status:** vigente com emendas posteriores já incorporadas à ADR

- bonificação de `notaFiscal` permanece agregada;
- análise técnica e Pendência fiscal usam `registered_invoice_id`;
- resumo técnico é derivado;
- NFs distintas podem ter Pendências independentes;
- a mesma NF não duplica Pendência ativa equivalente;
- edição comum da própria NF é bloqueada quando há Pendência ativa incompatível com a mutação.

### `a_identificar`

**Status:** vigente

Novo `a_identificar` nasce `Incorreto + Pendência` atomicamente. Identificação posterior ocorre em Pendências, preserva o mesmo ID e não fabrica história retroativa para os 16 legados legítimos classificados.

### Boleto de Internet

**Status:** vigente; ADR-049 histórica nesse ponto

`boleto_internet` é tipo de gasto dentro de Notas Fiscais, somente em Educação Conectada. A chave documental autônoma `boletoInternet` não deve ser recriada.

### Consulta Assessoria

**Status:** vigente

Somente NFs de serviço participam. Estado de envio/análise e Pendência são individuais por invoice.

Autoridades:

```text
edição ordinária → InvoiceService.updateServiceAdvisory
abertura/reanálise → service-advisory-pendency.js
novo envio/substituição → service-advisory-corrective-submission.js
persistência → RPC específica
```

## 8. Pendências

### Estados

**Status:** vigente

`Aberta`, `Aguardando reanálise`, `Resolvida`, `Cancelada`.

`Aberta` e `Aguardando reanálise` são ativas.

### Novo envio, emenda do PR #254

**Status:** vigente; substitui a pré-condição mais estreita da ADR-050 original

Novo envio/substituição pode operar sobre Pendência ativa `Aberta` **ou** `Aguardando reanálise` conforme o fluxo. O novo envio não resolve; o caso fica `Aguardando reanálise`. Uma tentativa anterior ainda aguardando é preservada como substituída, não reescrita.

`Resolvida` e `Cancelada` podem ser reabertas quando autorizado. Histórico de cancelamento não se torna `canceled_at` atual depois da reabertura.

### Próximo ator, PR #256

**Status:** vigente

```text
Aberta → Escola
Aguardando reanálise → Controlador
Resolvida/Cancelada → nenhum próximo ator ativo
```

## 9. Capital e Inventário

### PRs #257/#258/#260 — regra composta atual

**Status:** vigente

- NF permanente cria/vincula bem;
- com número fiscal e processo de inventário já existente, o bem novo entra `Encaminhada`, exibido como **Aguardando Inventariação**;
- sem processo, entra `Não encaminhada`;
- um bem que esteja `Não encaminhada` não pode pular para `Inventariada`;
- nesse ramo vale `Não encaminhada → Encaminhada → Inventariada`;
- `encampInventario`: nenhum permanente = `Não se aplica`; algum não encaminhado = `Não`; todos `Encaminhada`/`Inventariada` = `Sim`;
- Prontuário explicita NF ↔ bem por vínculo técnico;
- encaminhamento posterior sincroniza bem + verificação + log atomicamente;
- bem derivado de NF não permite editar isoladamente o número fiscal;
- conclusão da inventariação exige `Encaminhada` e responsável.

A sequência `Não encaminhada → Encaminhada → Inventariada` **não significa que todo bem permanente deva nascer Não encaminhada**.

## 10. Autoridade de fluxos críticos e bootstrap

### ADR-052

**Status:** vigente

Fluxos P0/P1 possuem autoridade explícita e ordem de composição testada. Bootstrap não pode duplicar silenciosamente handlers críticos.

O PR #260 acrescentou `critical-action-guard.js` antes das camadas de diagnóstico/performance para novo envio, reanálise, encaminhamento e inventariação. O guard de Nota Fiscal já existente foi preservado.

### Readiness sistêmico

**Status:** dívida ainda planejada

A expansão para readiness determinístico continua no plano. Isso não autoriza remover timers indiscriminadamente nem desmontar `RadarProductExtensionsReady`/eventos atuais antes da migração segura.

## 11. Performance e consistência

### Autoridade funcional em wrapper de performance

**Status:** dívida confirmada, não decisão de produto a perpetuar

`operational-write-performance.js` ainda injeta parte das políticas de consistência/convergência. O plano atual manda retirar essa autoridade preservando exatamente o comportamento funcional já homologado.

### Idempotência da NF normal

**Status:** parcialmente resolvida

Guards atuais evitam repetição imediata enquanto a primeira chamada está em andamento. Continua pendente idempotência durável para retry ambíguo/operation key da NF normal. Duas operações legítimas com conteúdo idêntico continuam podendo criar dois registros.

## 12. Gestão de Equipe e escolas

**Status:** vigente

- Assistente e `technical_admin` gerem Controladores/Inventário pelo fluxo autorizado;
- conta Auth, perfil, diretório e log são coordenados pelo backend protegido;
- conta existente só é reutilizada sem vínculo ativo incompatível;
- falha exige compensação quando Auth já foi alterado;
- desativação preserva histórico;
- Controlador precisa ficar sem carteira antes da desativação;
- redistribuição de carteira usa operação específica e não ocorre pela edição comum do Controlador.

## 13. Exportações e comunicação externa

### Excel SME

**Status:** vigente

Contrato público: uma competência, uma aba, 27 colunas A:AA. Template-fonte de 30 colunas é projetado removendo as posições definidas no contrato. Alteração material exige certificação própria.

### Exportação de Pendências

**Status:** vigente

XLSX respeita busca/filtros atuais e não expõe IDs técnicos ao usuário.

### ADR-053 — comunicação externa

**Status:** vigente

`RADAR PDDE` pode aparecer internamente, mas não em texto oficial externo gerado para escola. O gerador termina em `Atenciosamente` sem assinatura automática do sistema.

## 14. Decisão deliberadamente adiada

### ADR-051 — hardening de escrita direta em `registered_invoices`

**Status:** adiada conscientemente

A blindagem adicional de campos estruturais no banco não integra as frentes funcionais correntes. Ela deve ser reavaliada depois do fechamento do plano atual, não reaparecer oportunisticamente em outro hotfix.

## 15. Referências

- continuidade: `START_HERE.md`, `CURRENT_STATE.md`, `PLAN_TRACEABILITY.md`, `MASTER_PLAN_CURRENT.md`;
- ADRs individuais em `docs/decisions/`;
- histórico de checkpoints em `docs/handoff/`, `docs/audits/`, `docs/evidence/` e Git;
- operações atuais na matriz funcional, sempre lidas em conjunto com pré-condições do domínio quando a linha resumida não as expressar.
