# Handoff — hotfix do boleto de pagamento de Internet

**Atualizado em:** 27 de agosto de 2026

**Classe documental:** Evidência publicada — encerramento operacional do PR #203

**Branch:** `hotfix/boleto-internet-documento`

**PR:** [#203](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/203)

**Estado:** integrado à `main`, publicado em Production e encerrado; continuidade retorna ao PR #202/PR1

## 1. Por que esta frente existe

O plano mestre pós-PR #200 foi interrompido temporariamente depois do início de G0/PR1 para uma hotfix prioritária e isolada. A hotfix inclui **Boleto de pagamento de Internet** na avaliação mensal exclusivamente para o programa Educação Conectada.

O parêntese não altera a ordem do plano mestre. Depois da publicação e do smoke desta hotfix, a retomada obrigatória é o PR #202/PR1, ainda antes de PR2.

## 2. Estado final e separação de ambientes

| Superfície | Estado confirmado no encerramento |
| --- | --- |
| Baseline funcional do PR #203 | `f90cdf83897b4c954b7b6bf74b497798006e11f9` — merge funcional |
| Primeira publicação desse baseline | `dpl_EkZDvUjMjbcopE7r9pyxbtnXnCHa`, `READY`, SHA `f90cdf83897b4c954b7b6bf74b497798006e11f9` |
| Head funcional auditado do PR #203 | `12031487edf26e5c2b6d2ae9dd09244d65911ed9` |
| Supabase Production | `ACTIVE_HEALTHY`; nenhuma migration ou backfill da hotfix |
| Dados CONECTADA após publicação | 55 verificações; 50 legadas consolidadas sem boleto; 5 não consolidadas sem boleto; 0 com `boletoInternet` materializado |

O merge commit contém o conteúdo funcional do head auditado. A Vercel publicou automaticamente esse baseline e o artefato Production foi conferido diretamente. Commits posteriores exclusivamente documentais podem gerar novos SHAs/deployments sem alterar esse runtime; o HEAD corrente deve ser revalidado na retomada do PR1.

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

## 7. Checks remotos do head final

No head final `12031487edf26e5c2b6d2ae9dd09244d65911ed9`:

- Playwright remoto: aprovado;
- validação RADAR e snapshot canônico: aprovados;
- CodeQL: aprovado;
- Supabase readiness: aprovado;
- gate remoto de perfis e viewports: aprovado;
- homologação e contratos-fonte do Excel SME: aprovados;
- Vercel Preview: `READY`.

As únicas falhas remanescentes decorreram do Lighthouse mobile e dos gates agregados que o incluem. O mobile apresentou LCP em torno de `15,05–15,21 s` para teto de `15,00 s`; desktop aprovado com LCP de aproximadamente `3,19 s`.

A exceção foi formalmente classificada como risco de performance mobile preexistente/sistêmico, sem regressão funcional material atribuível à hotfix, e aceita pelo responsável pelo produto porque o RADAR não será utilizado em dispositivos móveis nesta fase. Nenhum limiar foi afrouxado e não houve rerun oportunístico até verde.

## 8. Gate de merge — concluído

O gate foi encerrado com:

1. head final publicado e estável;
2. checks funcionais obrigatórios no mesmo SHA;
3. E2E novos aprovados no Playwright remoto;
4. Preview Vercel do SHA final em `READY`;
5. falha de Lighthouse mobile classificada com evidência;
6. descrição do PR atualizada com risco, reversão e exceção;
7. autorização explícita do responsável pelo produto;
8. merge protegido pelo SHA esperado, concluído em `f90cdf83897b4c954b7b6bf74b497798006e11f9`.

## 9. Publicação, smoke e reversão

### Publicação

- primeira publicação funcional: `dpl_EkZDvUjMjbcopE7r9pyxbtnXnCHa`;
- estado: `READY`;
- baseline funcional: `f90cdf83897b4c954b7b6bf74b497798006e11f9`;
- commits/deployments posteriores exclusivamente documentais não alteram o contrato funcional registrado aqui;
- região Vercel: `gru1`;
- Supabase: `ACTIVE_HEALTHY`.

### Smoke sem escrita em dados reais

A superfície pública de Production respondeu HTTP 200 e declarou `deploymentTarget:"production"`.

Foram conferidos diretamente no artefato servido:

- `INTERNET_BILL_PROGRAM_ID = 'CONECTADA'`;
- `INTERNET_BILL_DOCUMENT_KEY = 'boletoInternet'`;
- seleção de sete documentos apenas para Educação Conectada;
- linha de interface `Boleto de pagamento de Internet` com `programIds: ['CONECTADA']`;
- projeção legada `Não se aplica / Correto` por `getEffectiveDocumentState()`.

Após a publicação, o Supabase permaneceu com as mesmas contagens prévias: 55 verificações CONECTADA, 50 consolidadas sem a chave, 5 não consolidadas sem a chave e 0 registros com boleto materializado. Isso confirma ausência de backfill ou gravação sintética decorrente do deploy.

A jornada autenticada de Controlador/Assistente não foi executada manualmente neste encerramento porque o ambiente exige credenciais institucionais e não foi criada sessão artificial nem dado de teste em Production. A jornada funcional equivalente foi comprovada pelos E2E remotos no head exato publicado antes do merge.

### Reversão

Reversão é feita por revert do conjunto do PR #203. Não existe migration nem backfill a desfazer. Se algum usuário gravar `boletoInternet` depois da publicação, preservar esses dados e decidir separadamente sua compatibilidade antes de qualquer reversão funcional.

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
