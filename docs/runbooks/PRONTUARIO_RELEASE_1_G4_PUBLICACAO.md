# Runbook Gate G4 — Preparação de Publicação, Compatibilidade e Rollback da Release 1 (T0–T3)

**Classe:** runbook operacional pré-publicação (subordinado a `docs/releases/2026-11-20-prontuario-t0-t3-release-1.md` e às decisões `T0T6-D006`, `T0T6-D013`, `T0T6-D017`, `T0T6-D018`).  
**Estado em 20/11/2026:** **NENHUMA MIGRATION, DEPLOY OU ATIVAÇÃO INSTITUCIONAL AUTORIZADA OU EXECUTADA.** Este documento prepara o roteiro verificável exigido pelo Gate G4 para quando o proprietário autorizar a publicação da Release 1.

---

## 1. Pré-requisitos obrigatórios antes de abrir a janela G4

| Gate | Condição de saída verificável | Evidência esperada |
|---|---|---|
| **G0 — Fontes e governança** | PR #535 reconciliado com `main` atual e `npm run check:continuity` verde, sem mistura de PRs independentes (`#515`, `#522`, `#523`) nem dados institucionais | SHA único no PR #535 |
| **G1 — Backend (63 migrations)** | Job `supabase-local` aprovado no HEAD final: 63 migrations, 81+ asserções pgTAP (`operational-correction.test.sql` + suíte completa), 3 provas de concorrência, `check:generated` e `typecheck:database` | Run verde de `Supabase readiness` no HEAD |
| **G2 — Frontend, visual e consumidores** | Aceite visual explícito do proprietário para a nova tela T1 (1440×900, 1280×720, 1920×1080, 390×844, claro/escuro e teclado); só **após** esse aceite atualizar `prontuario-desktop-chromium-linux.png` e obter `Desktop homologado` verde; 9/9 jornadas autenticadas Docker passando (Prontuário, Pendências, Assessoria, Qualidade, Busca Global, Excel SME, Capital/Inventário, Passivo/Carteira/Dashboard e compatibilidade de cliente sem flag) | Aceite registrado em `CHECKPOINT.md` + CI verde |
| **G3 — Opt-in e convivência** | Build `VERCEL_ENV=production` gera `radar-build-manifest.json` com `operationalCorrectionRelease: false` por padrão e `true` somente com `RADAR_OPERATIONAL_CORRECTION_RELEASE_ENABLED=true`; piloto local e release de produção mutuamente exclusivos no gerador e em `config.js` | `tests/unit/vercel-build.test.js`, `tests/unit/runtime-config.test.js` e jornada G3 em `supabase-operational-correction-local.spec.js` |
| **Regra pendente `T0T6-C014`** | Decisão registrada (manter `LATE_ANALYSIS_REQUIRED` na Release 1 ou alterar antes do corte) | Entrada em `registry.json` |

---

## 2. Compatibilidade com clientes antigos e operação institucional paralela

A 63ª migration (`supabase/migrations/20261114000100_operational_correction_contract.sql`) é **aditiva e retrocompatível** com o frontend de produção atual (flag OFF):
- **Novos objetos:** tabela de recibos idempotentes, funções `preview_operational_change` e `apply_operational_change` sob RLS/autenticação e guarda de contexto transacional `radar_private.operational_correction_allows(...)`.
- **Rotas legadas preservadas:** clientes já abertos no navegador (sem a flag T0–T3) continuam gravando NFs, avaliações, Pendências, contatos e inventário pelas rotas normais sem chamar as RPCs novas, como provado na jornada G3 (`cliente sem flag convive com schema de 63 migrations`).
- **Concorrência mista:** se um cliente legado alterar uma NF enquanto outro usuário revisa uma prévia T2/T3, `apply_operational_change` falha atomicamente com `STALE_PLAN` ou `OPTIMISTIC_CONFLICT`, preservando intacta a gravação mais recente.
- **Operação institucional PDDE (Drive + Supabase real):** o corte não limpa dados, não reescreve `documentSnapshot` histórico, não altera `bonus_result` consolidado (ADR-055) e não interrompe a prestação de contas em curso.

---

## 3. Sequência controlada de implantação (somente após autorização expressa)

Executar estritamente nesta ordem, validando cada passo antes do seguinte:

1. **Backup verificável e ensaio de restauração:**
   - Gerar backup cifrado atualizado do Supabase institucional (`scnryinorqeucbfkioxo`) e registrar o ID/URL do artefato no `CHECKPOINT.md`.
   - Confirmar a integridade do procedimento de backup/restore (`npm run test:backup-restore` em ambiente descartável).
2. **Inspeção e aplicação da 63ª migration (backend antes do frontend):**
   - Revisar o diff final de `supabase/migrations/20261114000100_operational_correction_contract.sql`.
   - Aplicar a 63ª migration no Supabase institucional (mantendo o frontend ainda sem opt-in T2/T3).
   - Confirmar integridade pós-migration (login institucional, leitura do Prontuário, Pendências, Inventário e zero regressão nas tabelas de prestação de contas).
3. **Publicação do frontend na Vercel com opt-in OFF (padrão):**
   - Integrar o SHA homologado do PR #535 na `main` (sem definir `RADAR_OPERATIONAL_CORRECTION_RELEASE_ENABLED=true`).
   - Confirmar via `npm run check:production` e `/radar-build-manifest.json` que:
     - `commitSha` coincide com o SHA homologado;
     - `vercelEnvironment: "production"` e `productionActivationApproved: true`;
     - `operationalCorrectionRelease: false`.
   - Confirmar que a nova composição T1 e a rotina institucional normal funcionam sem erros de console ou regressão de login/exportação Excel.
4. **Ativação controlada de T2/T3 (ato separado na Vercel):**
   - Somente após confirmar o passo 3 estável e mediante autorização expressa, configurar `RADAR_OPERATIONAL_CORRECTION_RELEASE_ENABLED=true` exclusivamente no ambiente **Production** da Vercel e disparar novo build do mesmo SHA.
   - Conferir `/radar-build-manifest.json` (`operationalCorrectionRelease: true`) e executar smoke controlado com perfis autorizados (Controlador, Assistente, SME somente leitura) em unidade/registro controlado.

---

## 4. Interrupção imediata e recuperação (Rollback)

- **Desativação rápida da UI T2/T3 (segundos/minutos):** remover ou definir `RADAR_OPERATIONAL_CORRECTION_RELEASE_ENABLED=false` na Vercel Production e promover o build anterior (ou novo build com flag OFF). O manifesto volta a reportar `operationalCorrectionRelease: false` e o frontend retorna ao comportamento legado sem necessidade de reverter o schema.
- **Limite explícito de rollback de frontend:** reverter o frontend ou desligar a flag **NÃO desfaz transações já confirmadas** no PostgreSQL pelas RPCs `apply_operational_change`.
- **Recuperação de dados:** qualquer reversão de mutação já confirmada exige inspeção dos recibos de operação gravados pela 63ª migration e restauração seletiva/point-in-time a partir do backup do passo 1 — nunca `DELETE` manual irrestrito em produção.
