# Handoff — hotfix do boleto de pagamento de Internet

**Atualizado em:** 27 de agosto de 2026

**Classe documental:** Trabalho em andamento — checkpoint operacional do PR #203

**Branch:** `hotfix/boleto-internet-documento`

**PR:** [#203](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/203)

**Estado:** correções e validação local concluídas; publicação do novo head e gates remotos pendentes

## 1. Por que esta frente existe

O plano mestre pós-PR #200 foi interrompido temporariamente depois do início de G0/PR1 para uma hotfix prioritária e isolada. A hotfix inclui **Boleto de pagamento de Internet** na avaliação mensal exclusivamente para o programa Educação Conectada.

O parêntese não altera a ordem do plano mestre. Depois da publicação e do smoke desta hotfix, a retomada obrigatória é o PR #202/PR1, ainda antes de PR2.

## 2. Baseline e separação de ambientes

| Superfície               | Estado confirmado na revisão                                                  |
| ------------------------ | ----------------------------------------------------------------------------- |
| GitHub `main`            | `2db2a5102d877422d068141a59f5ea340a2ebdc0` — merge documental do PR #201      |
| Vercel Production        | `dpl_AtHwooDcYgFaiUykT8Ja8rLRoZKT`, `READY`, no mesmo SHA `2db2a510...`       |
| PR #203 antes da revisão | `a4de3f6e61559aa0d6e446831d6a558d0c88d7d7`                                    |
| Correção da revisão      | `c76a7ba` — escopo de escrita e compatibilidade visual                        |
| Supabase Production      | somente leitura; nenhuma migration, backfill ou escrita executada pela hotfix |

Preview e checks de um SHA anterior não servem como prova do novo head. Confirmar novamente PR, CI e Vercel depois do push.

## 3. Contrato funcional fechado

- a nova chave canônica é `boletoInternet`;
- o rótulo é `Boleto de pagamento de Internet`;
- a categoria existe somente em `programId = CONECTADA`;
- os demais programas continuam com os seis documentos anteriores e não recebem a chave;
- bonificação aceita `Sim`, `Não` e `Não se aplica`;
- análise usa os estados documentais canônicos;
- `Incorreto` abre Pendência documental pela operação atômica vigente;
- o boleto não cria Nota Fiscal, bem, efeito financeiro ou Consulta Assessoria;
- consolidações conectadas antigas sem a chave permanecem válidas, sem backfill;
- registros conectados ainda não consolidados precisam avaliar o novo documento explicitamente;
- o Excel SME pode refletir o resultado da avaliação, mas permanece com 27 colunas e sem nova coluna de boleto.

## 4. Evidência de dados somente leitura

Consulta agregada em Supabase Production para `program_id = 'CONECTADA'`:

| Medida                                | Quantidade |
| ------------------------------------- | ---------: |
| Verificações conectadas               |         55 |
| Consolidadas                          |         50 |
| Consolidadas sem `boletoInternet`     |         50 |
| Não consolidadas sem `boletoInternet` |          5 |
| Registros que já possuem a chave      |          0 |

Consequência: compatibilidade legada é requisito de produção, não caso teórico. Nenhum dos 50 registros consolidados pode ser invalidado ou regravado apenas pela publicação da hotfix.

## 5. Achados da revisão independente

### 5.1 Retificação direta contornava o escopo do programa

**RED reproduzido:** `VerificationService.retify()` aceitava um payload com `boletoInternet` para `2026-08_BASIC`, embora os handlers normais escondessem a categoria fora de Educação Conectada.

**Correção:** o serviço agora resolve o programa antes da fila de escrita e rejeita a chave com `DOCUMENT_NOT_APPLICABLE`. A mesma regra negativa está comprovada para bonificação, análise técnica, retificação e abertura de Pendência.

### 5.2 Grade contradizia a compatibilidade dos registros antigos

**RED reproduzido:** o domínio considerava uma consolidação antiga como `Não se aplica / Correto`, mas a linha do boleto seria mostrada em branco / `Não analisado`.

**Correção:** `getEffectiveDocumentState()` aplica a compatibilidade somente na projeção. A grade apresenta `N/A / Correto`, e o teste confirma que `bonificacao` e `analise` armazenadas continuam sem `boletoInternet`.

### 5.3 Persistência remota precisava de prova direta

Foi acrescentado teste com `VerificationService` e o caminho remoto real simulado. Bonificação e análise usam a RPC atômica de verificação/log, preservam `program_id = CONECTADA`, não acionam persistência paralela e não criam NF ou bem.

## 6. Validação local do conteúdo versionado em `c76a7ba`

| Gate                                          | Resultado                                                     |
| --------------------------------------------- | ------------------------------------------------------------- |
| Testes focados de boleto/serviço/persistência | 22 aprovados, 0 falhas                                        |
| Suíte unitária integral                       | 721 aprovados, 0 falhas                                       |
| Integração                                    | 7 aprovados, 0 falhas                                         |
| Sintaxe `npm run check`                       | aprovado                                                      |
| ESLint de produto e E2E                       | 0 erros; warnings preexistentes dentro dos limites do projeto |
| Matriz funcional                              | 42 operações válidas                                          |
| Referências de workflows                      | 24 workflows e 139 referências locais válidas                 |
| Arquitetura                                   | 169 módulos e 236 dependências, sem violações                 |
| Tipos do banco                                | aprovado                                                      |
| Artefatos gerados e runtime config            | aprovados                                                     |
| Certificação Excel sintética                  | manifesto reproduzido                                         |
| Auditoria funcional/persistência              | aprovada, sem lacunas estruturais                             |
| Build Vercel                                  | artefato gerado com sucesso                                   |
| `git diff --check`                            | aprovado                                                      |

O script genérico `npm run format:check` é inválido no baseline porque chama Prettier sem caminho. A verificação de whitespace aplicável passou; não alterar a hotfix para compensar esse defeito preexistente do script.

### Limitação ambiental local

O worktree não possuía Chromium. O download oficial expirou e devolveu arquivo truncado. Os dois E2E do arquivo `internet-bill-document.spec.js` estão versionados, mas precisam ser comprovados pelo Playwright remoto no SHA final:

1. categoria somente em Educação Conectada, com Pendência atômica e sem NF/bem;
2. consolidação legada exibida como `N/A / Correto`, sem materializar as chaves no estado.

## 7. Checks remotos do head anterior

No head `a4de3f6...`, os gates funcionais, CodeQL, Supabase readiness, Excel SME, Playwright, perfis/viewports, homologação integral e Vercel estavam aprovados. O Lighthouse falhou apenas no mobile porque o LCP medido foi `15004,863 ms` para limite `15000 ms`, diferença de `4,863 ms`; desktop permaneceu aprovado.

Essa execução não cobre `c76a7ba`. No head final:

- não afrouxar o limite;
- não repetir o job indefinidamente até ficar verde;
- uma repetição controlada pode distinguir ruído, se a falha equivalente reaparecer;
- classificar conforme `TEST_GOVERNANCE.md` e a decisão do plano que só torna o Lighthouse estatisticamente obrigatório depois do PR9B.

## 8. Gate objetivo antes do merge

O PR #203 fica tecnicamente pronto somente quando:

1. o novo head estiver publicado na branch remota;
2. todos os checks funcionais obrigatórios corresponderem ao mesmo SHA;
3. os dois E2E de boleto passarem no Playwright remoto;
4. o Preview Vercel desse SHA estiver `READY`;
5. o smoke confirmar Controlador/Assistente e leitura SME, sem exibição fora de `CONECTADA`;
6. qualquer falha remanescente estiver classificada com evidência e sem regressão material;
7. a descrição do PR registrar escopo, REDs, correções, gates, risco e reversão;
8. houver autorização explícita para merge.

Não fazer merge nem promover Production apenas porque o Preview está pronto.

## 9. Publicação, smoke e reversão

Depois do merge autorizado:

1. confirmar o SHA da `main` e o deployment de Production;
2. abrir uma escola com Educação Conectada e confirmar a nova linha;
3. confirmar ausência da linha em outro programa;
4. verificar uma consolidação legada sem gravação sintética;
5. registrar o resultado em `CURRENT_STAGE.md` e mudar este handoff de candidato para evidência publicada.

Reversão é feita por revert do conjunto do PR #203. Não existe migration nem backfill a desfazer. Se algum usuário já tiver gravado `boletoInternet` depois da publicação, preservar os dados e decidir separadamente sua compatibilidade antes de qualquer reversão funcional.

## 10. Retomada do plano mestre

Depois do smoke da hotfix:

```text
PR #203 publicado e validado
→ reconciliar branch do PR #202
→ repetir gates no head efetivo do PR1
→ concluir PR1
→ somente então iniciar PR2
```

Não transportar para PR1 a regra do boleto, migration, backfill, redesign ou qualquer ampliação desta hotfix.
