# RADAR PDDE — Evidência G0 antes do PR1

**Data:** 26/08/2026

**Objetivo:** congelar a referência técnica antes de qualquer alteração funcional do PR1. Este arquivo é evidência read-only; não autoriza migration, reparo de dados ou escrita em Production.

## 1. GitHub

- `main`: `2db2a5102d877422d068141a59f5ea340a2ebdc0`.
- Origem: merge do PR #201, exclusivamente documental.
- `main` permanece sem branch protection tradicional (`protected=false`).
- Rulesets do repositório: nenhum ruleset ativo encontrado no baseline.
- Gate substituto: revisão manual do diff + checks proporcionais + autorização antes de merge/publicação.

## 2. Vercel Production

Deployment Production observado:

- projeto: `radarpdde-fix`;
- deployment: `dpl_AtHwooDcYgFaiUykT8Ja8rLRoZKT`;
- estado: `READY`;
- target: `production`;
- branch: `main`;
- Git SHA: `2db2a5102d877422d068141a59f5ea340a2ebdc0`.

Portanto, GitHub `main` e Vercel Production estão alinhados neste checkpoint.

## 3. Supabase Production

Projeto: `scnryinorqeucbfkioxo` (`RADAR PDDE 2026`).

- região: `sa-east-1`;
- status: `ACTIVE_HEALTHY`;
- PostgreSQL: `17.6.1.147`;
- última migration observada: `20260823050000_delete_invoice_bonus_result_clear_semantics`.

RPCs/funções públicas relevantes observadas:

- `save_invoice_with_effects(...) -> jsonb`;
- `delete_invoice_with_effects(...) -> jsonb`;
- `save_pendency_command(...) -> jsonb`;
- `reanalyze_pendency_with_verification(...) -> jsonb`;
- `save_service_advisory_with_pendency(...) -> jsonb`;
- `reanalyze_service_advisory_pendency(...) -> jsonb`;
- `save_verification_with_log(...) -> jsonb`.

Nenhuma RPC `save_invoice_with_effects_v2` existe neste baseline; ela pertence ao PR5 e não será antecipada no PR1.

## 4. Snapshot read-only de dados

| Entidade/estado | Quantidade observada |
| --- | ---: |
| Verificações | 128 |
| Despesas/notas registradas | 17 |
| Logs administrativos | 1.655 |
| Pendências | 26 |
| Pendências abertas | 23 |
| Pendências aguardando reanálise | 2 |
| Pendências canceladas | 1 |
| Tentativas de Pendência | 5 |
| Contatos de Pendência | 0 |
| Bens | 0 |

Natureza atual das 17 despesas/notas:

- `a_identificar`: 16;
- `consumo`: 1;
- `servico`: 0;
- `permanente`: 0.

## 5. Consulta Assessoria: drift confirmado para PR4 futuro

Há **13** verificações com `bonification.consAssessoria` vazio e zero NF de serviço no snapshot atual. Isso confirma que a lista histórica de quatro contextos não pode ser tratada como conjunto fixo de reparo.

Os quatro contextos históricos ainda aparecem entre os 13 candidatos, mas existem registros adicionais, inclusive competências incompletas/novas. Portanto:

- PR1 não altera esses dados;
- PR2 deve primeiro publicar a regra canônica;
- PR4 deverá executar preflight fresco e classificar elegibilidade real imediatamente antes da migration.

## 6. Baseline do fluxo de invoice antes do PR1

No `app.js`, `salvarDadosNota(e)`:

1. chama `e.preventDefault()`;
2. valida o perfil;
3. lê os campos do modal;
4. chama `await radarInvoiceService.save(...)`;
5. só depois do retorno fecha o modal e renderiza novamente.

Não existe, nesse handler, trava síncrona de `busy` antes do primeiro `await`. Assim, dois eventos de submit podem entrar no handler enquanto a primeira chamada ainda está pendente.

Cada invocação do handler chama uma vez `radarInvoiceService.save(...)`; no caminho atômico, `InvoiceService` delega a persistência a `repository.saveInvoiceWithEffects(...)`. A ausência do guard de gesto é, portanto, a contenção imediata que o PR1 deve adicionar. Idempotência de servidor continua reservada ao PR5.

## 7. Política de refresh antes do PR1

A isenção segura de releitura de `administrativeLogs` para `invoice:save`/`invoice:remove` está hoje implementada por `src/integration/operational-write-performance.js` e protegida por `tests/unit/operational-write-refresh-policy.test.js`.

O PR1 deve mover essa semântica mínima para o comando/núcleo de invoice, de forma que a ausência da extensão de performance não altere o comportamento funcional de refresh.

## 8. Performance de referência

A homologação do merge candidato do PR #201 executou Lighthouse sobre o mesmo código funcional do PR #200 (o PR #201 só altera documentação). Duas execuções por perfil produziram:

### Mobile

- performance: 62%;
- accessibility: 94%;
- best-practices: 100%;
- FCP: 3,89 s;
- LCP: 14,60 s;
- Speed Index: 3,89 s;
- TBT: 209 ms;
- CLS: 0,013;
- TTI: 15,49 s.

### Desktop

- performance: 81%;
- accessibility: 100%;
- best-practices: 100%;
- FCP: 971 ms;
- LCP: 3,19 s;
- Speed Index: 1,30 s;
- TBT: 0 ms;
- CLS: 0,030;
- TTI: 3,19 s.

Esses valores são baseline sintético e não autorizam otimização prematura no PR1. A decomposição causal pertence ao PR9A.

## 9. Gates automatizados mais recentes

No merge candidato do PR #201, concluíram com sucesso:

- Validar RADAR PDDE;
- CodeQL;
- Homologação integral pré-production;
- Playwright completo;
- Lighthouse CI móvel e desktop;
- Supabase local/Auth/RLS/pgTAP;
- migrations em PostgreSQL limpo;
- backup/restauração descartáveis;
- gate final pré-production.

## 10. Gate G0

G0 é considerado fechado para início do PR1 porque:

- GitHub `main` e Vercel Production estão alinhados no mesmo SHA;
- Supabase Production está saudável e foi inspecionado somente por leitura;
- migrations e RPCs relevantes foram registradas;
- snapshot de dados e drift de Assessoria foram registrados;
- branch protection/rulesets foram verificados e o gate manual substituto foi explicitado;
- baseline funcional e sintético de performance foi registrado;
- nenhuma escrita em Production foi executada.

**Próxima ação autorizada pelo plano:** implementar somente PR1 na branch `fix/pr1-invoice-submit-guard`, iniciando por testes RED.