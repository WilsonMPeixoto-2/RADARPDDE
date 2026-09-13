# RADAR PDDE — Estado atual do projeto

**Classe documental:** Canônico — estado mutável e retomada futura  
**Atualizado em:** 13 de setembro de 2026

## 1. Baseline vigente

A refatoração da arquitetura Supabase foi integrada pelo PR #300.

**Baseline funcional de aplicação integrado:** `1a149174ed4a14d2fc9f92aff57d1957e8538e89`  
**PR #300:** merged  
**Data mode de Production:** `supabase-production`

Depois do PR #300, a `main` recebeu merges documentais de roteamento/handoff. Revalidar sempre o SHA exato da `main` e do deployment antes de tomar decisão temporal. O rollback do PR #299 continua preservado; a funcionalidade de retificação de avaliação removida naquele rollback não foi reintroduzida.

## 2. Frente ativa

A frente corrente é **homologação operacional ponta a ponta e integração do PR #301**, não nova refatoração arquitetural.

Branch:

`test/operational-uat-supabase-2026-09-13`

PR:

`#301 — UAT operacional Supabase e observabilidade pós-refatoração`

Estado funcional certificado desta frente:

- candidato funcional: `452d97267348957f7155fc77bb139a4adafd766b`;
- o branch pode estar alguns commits documentais à frente sem mudança de runtime;
- PR #301 continua aberto/Draft até a integração final;
- correção funcional real incluída: `PendencyService.registerInvoiceDocumentAttempt()` passa `p_expected_asset_version: null` quando não há bem vinculado, preservando a assinatura da RPC;
- regressão específica adicionada em `tests/unit/pendency-rpc-argument-contract.test.js`;
- correção anterior de assets do logo em `src/integration/mobile-navigation.js` continua dentro da PR.

### Handoff corrente obrigatório depois deste arquivo

[`handoff/2026-09-13-uat-operacional-certificacao-452d972.md`](handoff/2026-09-13-uat-operacional-certificacao-452d972.md)

Esse arquivo substitui temporalmente o checkpoint `4a7a41dc` como handoff corrente e pressupõe, quando necessário reconstruir toda a história da frente, a leitura do predecessor:

[`handoff/2026-09-13-relatorio-tecnico-consolidado-pos-pr300-uat.md`](handoff/2026-09-13-relatorio-tecnico-consolidado-pos-pr300-uat.md)

## 3. Certificação funcional do candidato `452d972...`

No candidato funcional, os seguintes workflows passaram:

- `Ciclos funcionais reais com Supabase` — run `34783607506`;
- `Testes E2E Playwright` — run `34783607552`;
- `Confiabilidade funcional com Supabase real` — run `34783607532`;
- `Supabase readiness` — run `34783607627`;
- `Gate remoto de perfis e viewports` — run `34783607483`;
- `Retificação auditável direcionada` — run `34783607632`;
- `Validar RADAR PDDE` — run `34783607599`;
- `CodeQL` — run `34783607516`;
- `Saúde das dependências` — run `34783607562`.

`Homologação integral pré-production` — run `34783607517` — passou migrations, Supabase/Auth/RLS/pgTAP, dependências/segurança, backup/restauração, prontidão, Playwright completo e Excel/OOXML/rota pública. O workflow ficou vermelho apenas porque o job Lighthouse desktop excedeu o piso interno de performance. Por decisão operacional expressa do responsável do projeto, essa oscilação de performance **não bloqueia** a reabertura funcional do RADAR.

## 4. Jornadas operacionais já comprovadas por UI + Supabase + reload

A nova UAT exerce mutações pelos controles reais da interface e usa consultas diretas somente para verificar o resultado remoto.

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
- lifecycle remoto de notas, avaliações e reanálise autenticada já existente nos gates complementares.

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

A UAT revelou que o novo envio de uma Pendência fiscal sem bem patrimonial podia chamar `register_invoice_document_attempt` sem `p_expected_asset_version`, porque `undefined` era omitido na serialização. O PostgREST então não encontrava a assinatura da RPC e respondia 404.

Correção aplicada:

```text
p_expected_asset_version: persistence.expectedAssetVersion ?? null
```

O banco já aceitava `null`; não houve migration nem mudança de regra de negócio.

## 6. Production observada nesta frente

Durante execução em Work/Astra, o site oficial aceitou login real e permitiu abrir o Prontuário da Ary Barroso com avaliações reais.

Foi observada antes disso a mensagem transitória `Não foi possível carregar os escopos de escolas`; a sessão se recuperou e a unidade abriu normalmente. Classificação atual: ocorrência transitória ainda sem causa determinada, não bloqueio permanente comprovado.

Nenhuma escrita operacional de homologação foi autorizada em Production. Escritas de teste permanecem no Supabase descartável de CI.

O monitor autenticado de Production para cinco perfis continua dependente de contas técnicas protegidas; um run verde com a etapa autenticada ignorada não deve ser usado como prova completa de todos os perfis.

## 7. Matriz funcional e operações `partial`

A matriz canônica possui operações classificadas como `partial`. Pela definição vigente, `partial` significa **contrato funcional com evidência adicional específica ainda não encerrada**, não defeito conhecido nem bloqueio automático.

A UAT desta frente fortalece especialmente:

- `PEND-01` — abertura de Pendência fiscal/Assessoria pela UI;
- `PEND-04` — cancelamento com justificativa e releitura;
- `PEND-05` — reabertura e releitura;
- `PEND-06` — contato associado e releitura;
- `INV-03` — fluxo individual de Assessoria;
- `INV-04` — análise fiscal individual, Pendência e resumo derivado.

Não reclassificar automaticamente itens que ainda exigem autoria explícita, idempotência, negativas completas por perfil, reversão controlada ou observação recorrente em Production.

Ações administrativas menos frequentes de Configurações SME, programas, cadastro/redistribuição de escolas e algumas operações patrimoniais continuam com cobertura E2E/serviço/RLS, mas parte delas permanece `partial` na matriz por exigir ensaio controlado específico. Isso é dívida de evidência, não bug conhecido.

## 8. Critério de release da frente atual

Antes de comunicar reabertura aos usuários:

1. integrar o PR #301 na `main`;
2. confirmar o SHA integrado;
3. confirmar deployment Vercel Production `READY` no SHA integrado;
4. executar smoke não destrutivo do endereço oficial;
5. verificar ausência de erro funcional novo em login/navegação/leitura real;
6. registrar o fechamento documental da frente.

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

O problema anterior era padrão de acesso, não volume absoluto.

Preservar `pg_stat_statements` e monitorar delta pós-refatoração; não resetar histórico apenas para produzir gráfico mais bonito.

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

## 11. Documentos temporais antigos

- `handoff/2026-09-13-uat-operacional-checkpoint-4a7a41dc.md` é checkpoint histórico intermediário;
- `audits/SUPABASE_ARCHITECTURE_FINAL_2026-09-13.md` é evidência pré-merge do PR #300;
- `audits/ASTRA_AUDITORIA_RADAR_2026.md` é diário investigativo incremental;
- `PROJECT_CONTEXT.md` contém contexto funcional útil, mas SHAs/PRs/deployments antigos cedem a este arquivo;
- planos, auditorias e handoffs não apontados aqui não formam fila automática.

## 12. Rota obrigatória para retomada

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
