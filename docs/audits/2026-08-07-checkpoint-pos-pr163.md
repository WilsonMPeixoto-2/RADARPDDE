# RADAR PDDE — checkpoint remoto pós-PR #163

**Data da verificação:** 7 de agosto de 2026
**Classe documental:** Histórico — evidência pontual pós-merge

Este arquivo preserva o snapshot remoto exato imediatamente após a integração do PR #163. Não é documento de estado corrente e não deve ser atualizado para acompanhar mudanças futuras.

## GitHub

- repositório: `WilsonMPeixoto-2/RADARPDDE`;
- PR #163: integrado com sucesso;
- `main` verificada: `d1562bd1b9996b65c6713d3cd9387abbccd4238b`;
- merge com assinatura GitHub verificada;
- candidato pré-merge: `e9050f4a383569291cb47fa3fce0add5f6fc973a`.

No candidato `e9050f4a383569291cb47fa3fce0add5f6fc973a`, os sete gates normais concluíram com sucesso:

1. `Validar RADAR PDDE`;
2. `Lighthouse CI`;
3. `Supabase readiness`;
4. `Backup e restauração descartáveis`;
5. `Gate remoto de perfis e viewports`;
6. `Homologação integral pré-production`;
7. `Testes E2E Playwright`.

O readiness comprovou aplicação das 30 migrations, seed, contratos pre/post apply, 268 testes pgTAP, lint SQL, artefatos reproduzíveis, sete identidades Auth, autorização da Edge Function de Gestão de Equipe e frontend/Auth/RLS na pilha local.

## Vercel Production

- projeto: `radarpdde-fix`;
- project id: `prj_GfXuUuO3dF2jykpp9QgyqIDsxg4U`;
- deployment: `dpl_3aD71xz2HFpS2Sa4r6ryhEe2dhCX`;
- estado: `READY`;
- target: `production`;
- commit publicado: `d1562bd1b9996b65c6713d3cd9387abbccd4238b`;
- região: `gru1`;
- alias principal: `radarpdde-fix.vercel.app`;
- `aliasError`: ausente;
- erros de runtime nas 24 horas consultadas: nenhum.

## Supabase Production

- project ref: `scnryinorqeucbfkioxo`;
- nome: `RADAR PDDE 2026`;
- status: `ACTIVE_HEALTHY`;
- região: `sa-east-1`;
- PostgreSQL: `17.6.1.147`;
- migrations aplicadas: 30;
- última migration: `202608060003_school_institutional_identity`;
- `closing_competence`: `2026-12`;
- `app_config.row_version`: `20`;
- `production_integrity_check()`: `healthy`, `totalIssues = 0`, `schemaVersion = 1`;
- Edge Function `team-account-management`: versão 113, `ACTIVE`, `verify_jwt = true`.

A versão 113 da Edge Function foi observada após o merge do PR #163. O número da versão é deliberadamente mantido somente neste checkpoint histórico; versões futuras devem ser consultadas diretamente no Supabase.

## Matriz funcional

- total: 41 operações;
- `covered`: 9;
- `partial`: 32;
- `gap`: 0;
- `decision`: 0.

## Conclusão do checkpoint

No instante desta verificação, GitHub, Vercel e Supabase estavam operacionalmente coerentes, Production não apresentava incidente sistêmico conhecido e a reconciliação do PR #163 estava publicada. Valores remotos posteriores devem ser revalidados nas fontes efetivas e não inferidos deste registro histórico.
