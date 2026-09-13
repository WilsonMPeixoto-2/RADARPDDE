# RADAR PDDE — Estado atual do projeto

**Classe documental:** Canônico — estado mutável e retomada futura  
**Atualizado em:** 13 de setembro de 2026

## 1. Baseline vigente

A refatoração da arquitetura Supabase foi integrada pelo PR #300.

**Baseline funcional anterior:** `1a149174ed4a14d2fc9f92aff57d1957e8538e89`  
**PR #300:** merged  
**Data mode de Production:** `supabase-production`

Em 13/09/2026, o PR #301 foi integrado à `main` com a correção funcional do novo envio de Pendência, ampliação da UAT operacional, ciclo administrativo de Pendências, correção dos assets do logo e documentação de certificação.

**PR #301:** merged  
**Merge commit:** `39cd984206b33c7d2a6d7084e23597f964235c9a`  
**Candidato funcional certificado dentro da PR:** `452d97267348957f7155fc77bb139a4adafd766b`

O rollback do PR #299 permanece preservado; a funcionalidade de retificação de avaliação removida naquele rollback não foi reintroduzida.

## 2. Estado da frente operacional

A frente de homologação operacional do PR #301 está **integrada em `main`**.

Estado comprovado:

- `main` confirmada no merge `39cd984206b33c7d2a6d7084e23597f964235c9a`;
- candidato funcional `452d972...` aprovado nos gates operacionais críticos;
- correção real integrada em `PendencyService.registerInvoiceDocumentAttempt()` para preservar a assinatura RPC quando não existe bem patrimonial vinculado;
- regressão específica em `tests/unit/pendency-rpc-argument-contract.test.js`;
- UAT ampliada com interface real, Supabase descartável, reload e efeitos relacionados;
- correção anterior de assets do logo em `src/integration/mobile-navigation.js` integrada.

### Handoff corrente

[`handoff/2026-09-13-uat-operacional-certificacao-452d972.md`](handoff/2026-09-13-uat-operacional-certificacao-452d972.md)

O checkpoint `handoff/2026-09-13-uat-operacional-checkpoint-4a7a41dc.md` é histórico intermediário.

## 3. Certificação funcional do candidato `452d972...`

Passaram:

- `Ciclos funcionais reais com Supabase` — run `34783607506`;
- `Testes E2E Playwright` — run `34783607552`;
- `Confiabilidade funcional com Supabase real` — run `34783607532`;
- `Supabase readiness` — run `34783607627`;
- `Gate remoto de perfis e viewports` — run `34783607483`;
- `Retificação auditável direcionada` — run `34783607632`;
- `Validar RADAR PDDE` — run `34783607599`;
- `CodeQL` — run `34783607516`;
- `Saúde das dependências` — run `34783607562`.

`Homologação integral pré-production` — run `34783607517` — passou migrations, Supabase/Auth/RLS/pgTAP, dependências/segurança, backup/restauração, prontidão, Playwright completo e Excel/OOXML/rota pública. O workflow ficou vermelho apenas no job Lighthouse desktop. Por decisão operacional expressa, performance não bloqueia a reabertura funcional.

## 4. Jornadas operacionais comprovadas

As mutações são acionadas pelos controles reais da interface; consultas diretas são usadas somente para verificar o estado remoto.

Comprovado:

- login até dashboard e carregamento contextual;
- Registros Internos fora do bootstrap e carregados sob demanda;
- avaliação documental pela interface → `verifications` → reload;
- ausência de coleções operacionais do Supabase persistidas em `localStorage` como segundo banco;
- NF de consumo: criar, analisar, editar dados permitidos, reload, excluir e confirmar exclusão remota;
- serviço/Consulta Assessoria individual por NF: Pendência, novo envio, reanálise incorreta, nova tentativa, resolução e isolamento entre notas;
- `a_identificar`: abertura atômica Incorreto + Pendência, edição preservando identidade/vínculo, identificação no novo envio, reanálise e reload;
- Boleto Internet em Educação Conectada: cadastro, Pendência, novo envio, reanálise e estado final `Correto` após reload;
- ciclo administrativo de Pendência: contato, reload, cancelamento com justificativa, reload, reabertura com novo erro, reload e preservação de contato/histórico;
- lifecycle remoto de notas, avaliações e reanálise autenticada nos gates complementares.

Critério de mutação:

```text
UI real
→ persistência Supabase
→ relações/efeitos derivados
→ UI coerente
→ reload
→ mesma verdade
```

## 5. Defeito real corrigido durante a UAT

O novo envio de uma Pendência fiscal sem bem patrimonial podia chamar `register_invoice_document_attempt` sem `p_expected_asset_version`, porque `undefined` era omitido na serialização. O PostgREST então não encontrava a assinatura da RPC e respondia 404.

Correção integrada:

```text
p_expected_asset_version: persistence.expectedAssetVersion ?? null
```

O banco já aceitava `null`; não houve migration nem mudança de regra de negócio.

## 6. Production

Antes do merge do PR #301, Production estava no SHA `4c9ba4e997088d022d05ad2018b1138151aab82a`.

Durante execução em Work/Astra, o site oficial aceitou login real e permitiu abrir o Prontuário da Ary Barroso com avaliações reais. Foi observada antes disso a mensagem transitória `Não foi possível carregar os escopos de escolas`; a sessão se recuperou e a unidade abriu normalmente. Classificação atual: ocorrência transitória sem causa determinada, não bloqueio permanente comprovado.

Nenhuma escrita operacional de homologação foi executada em Production; escritas de teste permaneceram no Supabase descartável de CI.

**Pendência imediata pós-merge:** confirmar deployment Vercel Production `READY` contendo a `main` integrada e executar smoke não destrutivo do endereço oficial antes de comunicar reabertura.

## 7. Matriz funcional e operações `partial`

A matriz canônica ainda possui operações classificadas como `partial`. Pela definição vigente, `partial` significa contrato funcional com evidência adicional específica ainda não encerrada, não defeito conhecido nem bloqueio automático.

A UAT desta frente fortaleceu especialmente:

- `PEND-01` — abertura de Pendência fiscal/Assessoria pela UI;
- `PEND-04` — cancelamento com justificativa e releitura;
- `PEND-05` — reabertura e releitura;
- `PEND-06` — contato associado e releitura;
- `INV-03` — fluxo individual de Assessoria;
- `INV-04` — análise fiscal individual, Pendência e resumo derivado.

Não reclassificar automaticamente itens que ainda exigem autoria explícita, idempotência, negativas completas por perfil, reversão controlada ou observação recorrente em Production.

## 8. Critério de liberação

Antes de comunicar reabertura aos usuários:

1. `main` no merge do PR #301 — **concluído**;
2. deployment Vercel Production `READY` contendo o merge — **pendente nesta atualização**;
3. smoke não destrutivo do endereço oficial — **pendente nesta atualização**;
4. ausência de erro funcional novo em login/navegação/leitura real — **a confirmar no smoke**;
5. registrar o fechamento documental final.

Lighthouse não é critério bloqueante nesta decisão.

## 9. Capacidade e observabilidade

Baseline de Supabase Production observado em 13/09:

- banco total ~39 MB;
- 163 escolas;
- 430 vínculos escola-programa;
- `administrative_logs` ~3.563 linhas / ~1,7 MB;
- `verifications` 339;
- `registered_invoices` 84;
- `pendencies` 94;
- `assets` 14.

Preservar `pg_stat_statements` e monitorar o delta pós-refatoração.

Observabilidade existente:

- smoke de Production horário;
- integridade de Production a cada 6h;
- CodeQL;
- Dependabot;
- saúde de dependências;
- Vercel deployments/logs;
- Supabase Advisors/Reports/Logs;
- pgTAP/RLS/Auth/readiness.

## 10. Dependências

Não misturar upgrades de dependência com esta homologação. `@supabase/supabase-js` e Playwright podem ser avaliados depois, em branches próprias. A Supabase CLI 2.116.0 havia sido rejeitada por regressão nas garantias pgTAP/RLS; não atualizar automaticamente.

## 11. Rota obrigatória para retomada

Ler nesta ordem:

1. `../AGENTS.md`;
2. `reference/SYSTEM_CANONICAL_MODEL.md`;
3. `reference/PRODUCT_SURFACE_CATALOG.md`;
4. este `CURRENT_STAGE.md`;
5. `handoff/2026-09-13-uat-operacional-certificacao-452d972.md`;
6. o relatório consolidado predecessor se precisar reconstruir o ciclo completo;
7. `reference/ENGINEERING_METHOD.md`;
8. `reference/FRONTEND_USER_VALIDATION_GATE.md`;
9. `reference/STATUS_DOCUMENTOS.md`;
10. matriz funcional/ADRs/referências especializadas conforme a frente;
11. históricos apenas depois.

Não começar por memória de chat, plano antigo ou auditoria isolada. Revalidar SHAs e ambientes ao vivo quando a decisão depender do estado atual.
