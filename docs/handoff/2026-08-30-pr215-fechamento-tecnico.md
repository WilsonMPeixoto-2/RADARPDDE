# RADAR PDDE — Fechamento técnico pós-PR #215

**Data:** 30 de agosto de 2026  
**Classe documental:** Canônico — estado pós-correção e ponte para homologação autenticada  
**Escopo:** PR #211 + PR #214 + PR #215

## 1. Estado corrente

O hotfix de individualização de Notas Fiscais permanece arquiteturalmente definido pela ADR-050 e foi consolidado em três etapas:

1. **PR #211** — individualização de análise técnica, Pendência, novo envio e reanálise por `registered_invoice_id`;
2. **PR #214** — correção do overflow desktop dos painéis de Notas Fiscais e Consulta Assessoria, sem alterar regra de negócio;
3. **PR #215** — correção da fronteira de compatibilidade que duplicava `row_version` como `payload.rowVersion` e fazia RPCs atômicas rejeitarem operações legítimas.

O PR #215 foi integrado pelo merge:

`19ba20cb7b8a8415070d4a8711a8af0eb23e1fa7`

O `main` corrente após o redeploy operacional é:

`24e1934541b92e4399798556c05fd164c9c43801`

Esse último commit não altera a lógica funcional; foi usado para disparar nova publicação da Vercel.

## 2. Causa e correção do defeito pós-PR #211

A ponte canônico → legado expunha `row_version` como `rowVersion` para concorrência otimista no navegador. O adapter legado, por sua vez, copiava esse metadado para o `payload`, produzindo estados como:

```text
row_version = 3
payload.rowVersion = 2
```

As RPCs `save_invoice_document_with_pendency` e `save_service_advisory_with_pendency` comparavam o payload de negócio e interpretavam a diferença técnica como tentativa de alterar a despesa.

O PR #215 passou a:

- manter `row_version` somente na coluna canônica/top-level;
- remover `rowVersion` e `row_version` dos payloads produzidos pelo adapter;
- limpar os payloads já persistidos de invoices, verifications, pendencies, attempts, contacts e assets;
- tornar as duas RPCs de abertura tolerantes apenas a essas chaves técnicas de versão, preservando todas as demais invariantes de identidade e negócio.

## 3. Supabase Production

Projeto canônico:

`scnryinorqeucbfkioxo`

Estado verificado após o PR #215:

- **44 migrations**;
- última migration: `20260830223000_payload_row_version_boundary`;
- `registered_invoices` com `payload.rowVersion/row_version`: **0**;
- `verifications` contaminadas: **0**;
- `pendencies` contaminadas: **0**;
- `pendency_attempts` contaminadas: **0**;
- duplicidade de Pendência ativa por invoice/dimensão: **0**;
- Pendência de Assessoria vinculada a despesa não-serviço: **0**;
- divergência de contexto entre Pendência individual e invoice: **0**;
- 16 `a_identificar` históricos preservados sem análise ou Pendência retroativa inventada.

Há uma Pendência ativa antiga de `notaFiscal` sem `registered_invoice_id`. Ela é o passivo fiscal agregado real preservado deliberadamente pelo PR #211 e continua acessível no layout como Pendência legada. Não deve receber vínculo heurístico.

## 4. Validação funcional real no Supabase Production

Depois da migration do PR #215 foram executados dois smokes transacionais contra dados e funções reais de Production, com rollback ao final:

### 4.1 Nota Fiscal

- operação real: `save_invoice_document_with_pendency`;
- cenário: análise individual → `Incorreto` + Pendência;
- entrada simulou deliberadamente o antigo formato com `payload.rowVersion`;
- a operação foi aceita;
- a Pendência ficou vinculada à NF exata;
- valor e identidade da despesa permaneceram imutáveis;
- rollback confirmou ausência de artefatos temporários.

### 4.2 Consulta Assessoria

- operação real: `save_service_advisory_with_pendency`;
- cenário: análise individual da Assessoria → `Incorreto` + Pendência;
- entrada também simulou o antigo formato contaminado;
- a operação foi aceita;
- a Pendência ficou vinculada à NF de serviço exata;
- valor e identidade da despesa permaneceram imutáveis;
- rollback confirmou ausência de artefatos temporários.

Esses smokes corrigem a principal lacuna de validação que permitiu o defeito do PR #211 escapar aos testes anteriores.

## 5. Layout e regras consolidadas

O estado atual preserva o contrato visual e funcional aprovado:

- Notas Fiscais exibidas por registro;
- bonificação de `notaFiscal` continua agregada;
- situação técnica é individual e o resumo mensal é derivado;
- `Incorreto` somente é persistido junto com a Pendência correspondente;
- Pendência ativa da NF A não bloqueia NF B;
- Consulta Assessoria existe somente para NFs de serviço;
- envio, análise e Pendência da Assessoria são individuais;
- novo envio e reanálise pertencem à tela de Pendências;
- Prontuário usa **Visualizar pendência**;
- `a_identificar` novo nasce atomicamente `Incorreto + Pendência`;
- identificação posterior preserva o mesmo ID;
- `boleto_internet` existe apenas como tipo de gasto dentro de Notas Fiscais;
- o PR #214 continua protegendo os painéis contra overflow entre 901 e 1440 px.

## 6. Cobertura de regressão de versão

Novo envio e reanálise não enviam diretamente o estado legado ao RPC. `PendencyService.persistInvoiceDocumentCommand()` usa `snapshot.entities`, produzido pelo adapter canônico antes de chamar:

- `register_invoice_document_attempt`;
- `reanalyze_invoice_document_pendency`.

O mesmo contrato de snapshot é usado pelo fluxo de Assessoria.

A regressão de `state-bridge-row-version.test.js` deve manter cobertura explícita de que:

- `row_version` continua disponível no top-level canônico;
- `rowVersion` e `row_version` não reaparecem nos payloads de verification, invoice, pendency ou attempt.

Assim, não é necessária nova migration nem relaxamento adicional das RPCs de novo envio/reanálise.

## 7. Publicação

Vercel Production verificada após o PR #215:

- deployment: `dpl_TXwRPK2Sv72u5HtQVF3Z7ejJby3k`;
- estado: **READY**;
- monitoramento contínuo de Production: aprovado;
- Validar RADAR PDDE: aprovado;
- CodeQL: aprovado.

O Lighthouse móvel continua dívida conhecida e não bloqueante deste hotfix desktop.

## 8. Única validação funcional ainda pendente

Ainda falta a homologação autenticada pela interface real de Production após o último deployment, incluindo:

1. abrir a escola/competência/programa real;
2. marcar uma NF como `Incorreto`;
3. confirmar abertura da Pendência;
4. reler o estado após refresh;
5. repetir para Consulta Assessoria;
6. validar visualmente o layout publicado;
7. confirmar que a persistência exibida corresponde ao Supabase.

Essa etapa depende do ambiente Work/Cloud Browser e não deve ser substituída por nova alteração de código.

## 9. Segurança adiada

A ADR-051 permanece vigente. O hardening contra escrita direta de campos estruturais de `registered_invoices` foi deliberadamente adiado até a conclusão das frentes funcionais.

Não confundir essa frente com o defeito de `payload.rowVersion`, já corrigido pelo PR #215.

## 10. Próxima transição

Depois da homologação autenticada:

```text
registrar evidência final do hotfix
→ marcar o conjunto PR #211/#214/#215 como encerrado
→ reconciliar o plano mestre de 26/08 com o que o hotfix já resolveu/alterou
→ retomar PR3.1 sem reimplementar entregas já incorporadas
```
