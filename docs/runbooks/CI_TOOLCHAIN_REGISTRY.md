# CI do RADAR: registros Docker, runners e compatibilidade de ferramentas

**Classe:** runbook operacional vigente, não define regra funcional.  
**Atualizado em:** 18/10/2026.

**Rota obrigatória para agentes:** ler este documento ao investigar GitHub Actions, imagens Docker, CI Supabase, geração de tipos, runners e atualizações de tooling. Ler também AGENTS.md, docs/reference/TEST_GOVERNANCE.md, docs/runbooks/SUPABASE_CONNECTION.md e verificar a versão, o SHA e o log reais. Este documento não autoriza operações em Production.

## 1. Incidente e remediação comprovados, 18/10/2026

**Sintoma:** durante a geração local de tipos pelo Supabase CLI 2.114.0, a imagem public.ecr.aws/supabase/postgres-meta:v0.97.0 recebeu a resposta `toomanyrequests: Data limit exceeded` e Docker retornou exit 125. Repetições da mesma etapa e do job não resolveram. Os testes posteriores de Auth/frontend daquele job ficaram **não executados**, não aprovados; os testes SQL/pgTAP anteriores haviam passado.

**Correção:** definir `SUPABASE_INTERNAL_IMAGE_REGISTRY: 'ghcr.io'` somente no step **Regenerar tipos** dos workflows `.github/workflows/supabase-readiness.yml` e `.github/workflows/preproduction-full-validation.yml`. A versão fixada da CLI respeita o override de registry. O teste `tests/unit/tooling-contract.test.js` protege o escopo do override e o retry delimitado. Não promover variável para nível global do workflow, não trocar todo o stack para GHCR, não alterar RLS/SQL nem desligar o gate.

**Evidências:** [PR #449](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/449), integrado por `aac142453d3fad112e3b3c8caba177aad87d9697`; [falha antes da correção](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39155671236); [readiness após a correção](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39166595283), três jobs aprovados; [homologação pré-Production](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39166595305), aprovada. O log correto registrou o download de **ghcr.io/supabase/postgres-meta:v0.97.0**, artefatos gerados e testes posteriores de Auth/RLS aprovados. Ver upstream [Supabase CLI #5785](https://github.com/supabase/cli/issues/5785) e [PR #5786](https://github.com/supabase/cli/pull/5786). Não presumir que outra versão de CLI tenha o mesmo comportamento sem verificar.

**Roteiro de diagnóstico:** primeiro identificar step, SHA, CLI, imagem, tag, registry e erro efetivo. Distinguir quota de falha de autenticação GHCR, DNS, imagem ausente, tipos divergentes ou regressão RLS. Não tratar todo exit 125 como quota. Exigir imagem de mesma versão, não usar tag latest para contornar falha. Depois executar geração/tipagem e Auth/RLS; registrar resultados aprovados, ignorados e não executados. Se um retry isolado continuar falhando, mudar a abordagem, não insistir em loop.

## 2. Mudança dos GitHub-hosted runners Ubuntu em 2026

O [GitHub anunciou](https://github.blog/changelog/2026-09-17-ubuntu-26-generally-available-and-latest-migration/) que o alias `ubuntu-latest` migrará gradualmente de Ubuntu 24.04 para Ubuntu 26.04 de **19/10 a 19/11/2026**. Em 18/10, a main continha **15 workflows** que utilizavam o alias, enquanto parte dos gates já usava `ubuntu-24.04`. Um mesmo YAML pode rodar em sistemas diferentes durante a transição.

**Prova datada, ainda não integrada:** [PR #451](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/451), [piloto Actions 39170988272](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39170988272): Ubuntu 24.04.5 (ImageVersion 20261012.334.1) e Ubuntu 26.04.1 (20261012.163.1) passaram, cada um com Node 24.21.0, 15 testes de contrato, abertura de Chromium Playwright e download da imagem GHCR postgres-meta:v0.97.0. **Isso não homologa a suite completa de Supabase/Auth/RLS em Ubuntu 26.04.** O PR propõe fixar 15 workflows em Ubuntu 24.04 até migração explícita. Verificar estado do PR antes de presumir que o pin vigora na main.

A migração deve seguir: inventário de todos os runners; teste isolado de Ubuntu 26.04 contra o mesmo SHA; verificação de Node 24/npm ci, Docker, CLI, Chromium/Playwright, bibliotecas nativas, migrations e Auth/RLS quando aplicável; comparação com Ubuntu 24.04; identificação do ImageOS/ImageVersion real no log; atualização gradual e explícita. Fixar temporariamente em `ubuntu-24.04` protege reprodutibilidade, mas **não prova compatibilidade futura**. Não mudar produto/SQL para satisfazer diferenças ambientais.

O cache npm de actions/setup-node **não armazena imagens Docker**. Versão Node do RADAR é diferente da versão Ubuntu do runner. Não atualizar automaticamente para Node 26 porque o runner foi atualizado.

## 3. Atualização de dependências sem regressões de autorização

A CLI Supabase **2.114.0** está homologada. As versões 2.116.0, 2.117.0, 2.118.0 e 2.120.0 foram rejeitadas por duas garantias de service_role nos testes 32/33 de rls.test.sql e estão bloqueadas por versão exata no Dependabot. **Nova contraprova em 18/10:** a CLI **2.121.0 reprovou exatamente os testes 32 e 33**, enquanto a 2.114.0 passou **674/674** asserções no mesmo código, Ubuntu e banco descartável; [PR #452](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/452), [run 39171252853](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39171252853). **Ressalva material apurada por consulta somente de leitura a Production:** os dois testes 32/33 exigem que service_role não possua DELETE em user_profiles/user_school_scopes, mas **Production efetivamente possui DELETE em ambas**, com RLS ativa e anon sem DELETE. Isso corresponde ao [comportamento padrão documentado de service_role](https://supabase.com/docs/guides/database/postgres/row-level-security). A migration canônica concede SELECT/INSERT/UPDATE, sem revogar DELETE previamente existente. Portanto, **a falha de pgTAP sozinha não prova regressão da CLI 2.121.0; o contrato e a paridade local × Production estão sob investigação**. Não atualizar CLI, mas também não reclassificar o resultado como defeito do produto até confrontar grants iniciais e rotas de bootstrap. Ver [auditoria de paridade de 18/10](../audits/2026-10-18-supabase-cli-rls-parity.md). O [PR #453](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/453) foi colocado em **HOLD** sem merge; não afirmar que seu bloqueio de 2.121.0 está integrado. Versões novas devem ser testadas em branch/PR e banco descartável, com npm ci, start/reset, migrations, pgTAP/RLS, geração de tipos, Auth, E2E e comparação do contrato. Nunca afrouxar RLS ou testes para homologar ferramenta.

Atualizações de SDK, TypeScript, Node, Playwright, GitHub Actions e dependências de lint devem ser independentes, com changelogs primários, lockfile e testes proporcionais. Ver [auditoria de dependências de 10/10](../audits/2026-10-10-modernizacao-dependencias-etapas-0-4.md) e [auditoria Supabase](../reference/SUPABASE_INTEGRATION_AUDIT.md). Resultado verde após retry não elimina do histórico a falha inicial; registrar a causa comprovada.

## 4. Onde registrar novas decisões

**YAML e contratos automatizados** são a prova executável. Este runbook contém o procedimento durável. **AGENTS.md** e **STATUS_DOCUMENTOS.md** devem rotear até ele; **CURRENT_STAGE.md** registra estado temporal após merge; auditorias datadas preservam tentativas rejeitadas e resultados históricos. Nada disso substitui verificação direta dos SHAs, jobs e Production.

**Não modificar banco Production, permissões, migrations ou deploy para diagnosticar uma quota de imagem no GitHub.**
