# Correção P0 da Gestão de Equipe e Resíduos Auth — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restabelecer cadastro, transição de perfil, desativação e redistribuição na Gestão de Equipe, impedindo que usuários Auth legados malformados bloqueiem operações não relacionadas e removendo exclusivamente os resíduos sintéticos HML conhecidos.

**Architecture:** A Edge Function deixará de percorrer todo o catálogo Auth com `listUsers` e consultará somente o UUID correspondente ao e-mail solicitado por RPC administrativa `SECURITY DEFINER`, executável apenas por `service_role`. Uma migration normalizará campos textuais nulos incompatíveis com o GoTrue e eliminará o conjunto HML validado por identificador e e-mail. A conciliação da transição funcional real será executada separadamente, sem movimentar automaticamente a carteira escolar.

**Tech Stack:** TypeScript/Deno, Supabase JS 2.110.9, PostgreSQL 17, Supabase CLI 2.110.0, pgTAP, Node.js 24 e GitHub Actions.

## Restrições

- Baseline: `main` em `4a95c9074d00c29310aea6544f287ea15e3ced8a`.
- Código e estado remoto comprovado prevalecem sobre documentação.
- Não transferir automaticamente escolas reais.
- Preservar o histórico inativo do perfil anterior na transição Inventário → Controlador.
- Não relaxar RLS, grants ou autorização da Gestão de Equipe.
- Não expor e-mails institucionais, tokens ou credenciais na documentação pública.
- TDD obrigatório.
- A limpeza deve atingir somente os identificadores sintéticos HML confirmados.
- Toda mutação em Production exige releitura e prova de ausência de resíduos.

---

## Task 1 — Reprodução e contrato RED

**Files:**
- `tests/unit/team-account-role-transition.test.js`
- `tests/unit/team-account-edge-contract.test.js`
- `supabase/tests/database/team-management-rpc.test.sql`
- `docs/audits/2026-08-06-incidente-gestao-equipe-residuos-auth.md`

- [x] Exigir `resolve_team_auth_user_id_by_email` na Edge Function.
- [x] Proibir `admin.auth.admin.listUsers`.
- [x] Exigir execução da RPC somente por `service_role`.
- [x] Registrar o POST 500, o erro de conversão de `confirmation_token = NULL`, os dois usuários HML afetados e o estado incompleto da transição real.

## Task 2 — Implementação mínima

**Files:**
- `supabase/migrations/202608060001_team_auth_legacy_repair.sql`
- `supabase/functions/team-account-management/index.ts`
- `src/types/database.types.ts`

- [x] Criar RPC administrativa de lookup exato por e-mail normalizado.
- [x] Revogar execução de `public`, `anon` e `authenticated`; conceder somente a `service_role`.
- [x] Normalizar `confirmation_token`, `recovery_token` e `email_change_token_new` quando nulos.
- [x] Definir defaults vazios para inserções técnicas futuras.
- [x] Remover exclusivamente a escola, os diretórios, perfis e usuários Auth HML conhecidos, com guardas contra reaproveitamento dos identificadores.
- [x] Trocar a varredura global pela nova RPC.
- [ ] Regenerar e versionar `database.types.ts` pelo Supabase local.

## Task 3 — Prova integral em ambiente descartável

- [ ] Aplicar as 28 migrations em PostgreSQL genérico e Supabase local.
- [ ] Executar pgTAP completo.
- [ ] Executar cadastro e edição de controlador.
- [ ] Executar cadastro e edição de integrante do Inventário.
- [ ] Executar Inventário → Controlador preservando o histórico inativo.
- [ ] Redistribuir escola sintética, reler e desativar o controlador de origem.
- [ ] Confirmar negativas por perfil e conflito de função ativa.
- [ ] Confirmar limpeza completa dos dados sintéticos.
- [ ] Executar readiness, E2E e backup/restauração descartável.

## Task 4 — Publicação e conciliação

- [ ] Revisar o diff e os gates do PR nº 161.
- [ ] Aplicar a migration somente após merge aprovado.
- [ ] Publicar a Edge Function com JWT obrigatório.
- [ ] Confirmar ausência de registros HML e de tokens textuais nulos.
- [ ] Recriar, pelo fluxo seguro, o vínculo de Controlador da pessoa cuja transição ficou interrompida, preservando o histórico de Inventário inativo.
- [ ] Confirmar que o novo controlador aparece no seletor sem alterar escolas nessa etapa.
- [ ] Transferir a carteira real somente por decisão operacional explícita e visível.
- [ ] Reexecutar monitores e atualizar documentação final.
