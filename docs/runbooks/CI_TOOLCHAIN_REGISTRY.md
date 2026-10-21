# CI do RADAR: registros Docker, runners e compatibilidade de ferramentas

**Classe:** runbook operacional vigente, não define regra funcional.  
**Atualizado em:** 21/10/2026.

**Rota obrigatória para agentes:** ler este documento ao investigar GitHub Actions, imagens Docker, CI Supabase, geração de tipos, runners e atualizações de tooling. Ler também AGENTS.md, docs/reference/TEST_GOVERNANCE.md, docs/runbooks/SUPABASE_CONNECTION.md e verificar a versão, o SHA e o log reais. Este documento não autoriza operações em Production.

## 1. Incidente e remediação comprovados, 18/10/2026

**Sintoma:** durante a geração local de tipos pelo Supabase CLI 2.114.0, a imagem public.ecr.aws/supabase/postgres-meta:v0.97.0 recebeu a resposta `toomanyrequests: Data limit exceeded` e Docker retornou exit 125. Repetições da mesma etapa e do job não resolveram. Os testes posteriores de Auth/frontend daquele job ficaram **não executados**, não aprovados; os testes SQL/pgTAP anteriores haviam passado.

**Correção:** definir `SUPABASE_INTERNAL_IMAGE_REGISTRY: 'ghcr.io'` somente no step **Regenerar tipos** dos workflows `.github/workflows/supabase-readiness.yml` e `.github/workflows/preproduction-full-validation.yml`. A versão fixada da CLI respeita o override de registry. O teste `tests/unit/tooling-contract.test.js` protege o escopo do override e o retry delimitado. Não promover variável para nível global do workflow, não trocar todo o stack para GHCR, não alterar RLS/SQL nem desligar o gate.

**Evidências:** [PR #449](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/449), integrado por `aac142453d3fad112e3b3c8caba177aad87d9697`; [falha antes da correção](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39155671236); [readiness após a correção](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39166595283), três jobs aprovados; [homologação pré-Production](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39166595305), aprovada. O log correto registrou o download de **ghcr.io/supabase/postgres-meta:v0.97.0**, artefatos gerados e testes posteriores de Auth/RLS aprovados. Ver upstream [Supabase CLI #5785](https://github.com/supabase/cli/issues/5785) e [PR #5786](https://github.com/supabase/cli/pull/5786). Não presumir que outra versão de CLI tenha o mesmo comportamento sem verificar.

**Roteiro de diagnóstico:** primeiro identificar step, SHA, CLI, imagem, tag, registry e erro efetivo. Distinguir quota de falha de autenticação GHCR, DNS, imagem ausente, tipos divergentes ou regressão RLS. Não tratar todo exit 125 como quota. Exigir imagem de mesma versão, não usar tag latest para contornar falha. Depois executar geração/tipagem e Auth/RLS; registrar resultados aprovados, ignorados e não executados. Se um retry isolado continuar falhando, mudar a abordagem, não insistir em loop.

## 2. Runners Ubuntu: migração concluída e procedimento de manutenção

**Estado integrado:** os PRs #451, #454 e #455 foram integrados. O #455 concluiu a migração dos runners canônicos para **Ubuntu 26.04** em `fcf4eda47196b4e5fd9730d433abe21fa8099edb`, após 29/29 workflows aprovados com repetições isoladas documentadas em `CURRENT_STAGE.md`. A comparação controlada Ubuntu 24.04 × 26.04 permanece como experimento de compatibilidade. Não regredir automaticamente para Ubuntu 24.04 a partir de uma descrição antiga do piloto.

**Contexto histórico do piloto:** o [GitHub anunciou](https://github.blog/changelog/2026-09-17-ubuntu-26-generally-available-and-latest-migration/) a migração do alias `ubuntu-latest` de 19/10 a 19/11/2026. Em 18/10 havia 15 workflows com esse alias. O [PR #451](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/451), [run 39170988272](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39170988272), comparou Ubuntu 24.04.5 (ImageVersion 20261012.334.1) e 26.04.1 (20261012.163.1) com Node 24.21.0, contratos, Chromium e imagem GHCR. Esse piloto isolado não certificava a suíte Supabase completa; a homologação posterior do #454 e a conclusão do #455 são as evidências que superaram aquela limitação.

Para uma próxima troca de runner: inventariar todos os jobs; comparar o mesmo SHA em ambientes isolados; verificar Node/npm ci, Docker, CLI, Chromium, bibliotecas nativas, migrations, pgTAP/Auth/RLS e tipos; registrar ImageOS/ImageVersion reais; migrar explicitamente e preservar evidências de falhas/repetições. Nunca modificar produto/SQL para satisfazer diferenças ambientais.

### 2.1 Portas Supabase em runners descartáveis

As portas `54320–54323` devem ficar fora da faixa de alocação efêmera nos jobs que adotam a reserva existente. O #455 introduziu a proteção nos gates afetados naquela rodada; o [PR #467](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/467), merge `60578d36c5bdb1a26e4755b55750a4aef8263cb7`, transportou o mesmo passo para `functional-reliability-supabase.yml`, após colisões de `54322` **antes dos testes** nos #457/#466. Sete workflows do #467 passaram, incluindo startup e testes reais.

O passo lê `net.ipv4.ip_local_reserved_ports`, preserva reservas preexistentes e adiciona `54320–54323` via sysctl somente no runner descartável. Não desliga serviços alheios nem garante ausência de toda disputa possível. Ao diagnosticar `address already in use`, distinguir reserva ausente, listener já existente e falha de startup; não rerodar indefinidamente nem alterar Auth/RLS para compensar infraestrutura.

O cache npm de actions/setup-node **não armazena imagens Docker**. Node 24 é contrato próprio do RADAR; atualizar Ubuntu não autoriza migrar para Node 26.

## 3. Atualização de dependências sem regressões de autorização

A CLI Supabase **2.114.0** permanece homologada. As versões 2.116.0, 2.117.0, 2.118.0 e 2.120.0 foram retidas após falhas nos testes 32/33 de service_role em rls.test.sql e continuam bloqueadas por versão exata no Dependabot. Esse histórico não basta para atribuir causalmente uma regressão à ferramenta: o contrato de grants e a paridade entre bootstrap descartável e Production precisam ser reconciliados conforme a ressalva a seguir. **Nova contraprova em 18/10:** a CLI **2.121.0 reprovou exatamente os testes 32 e 33**, enquanto a 2.114.0 passou **674/674** asserções no mesmo código, Ubuntu e banco descartável; [PR #452](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/452), [run 39171252853](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39171252853). **Ressalva material apurada por consulta somente de leitura a Production:** os dois testes 32/33 exigem que service_role não possua DELETE em user_profiles/user_school_scopes, mas **Production efetivamente possui DELETE em ambas**, com RLS ativa e anon sem DELETE. Isso corresponde ao [comportamento padrão documentado de service_role](https://supabase.com/docs/guides/database/postgres/row-level-security). A migration canônica concede SELECT/INSERT/UPDATE, sem revogar DELETE previamente existente. Portanto, **a falha de pgTAP sozinha não prova regressão da CLI 2.121.0; o contrato e a paridade local × Production estão sob investigação**. Não atualizar CLI, mas também não reclassificar o resultado como defeito do produto até confrontar grants iniciais e rotas de bootstrap. Ver [auditoria de paridade de 18/10](../audits/2026-10-18-supabase-cli-rls-parity.md). O [PR #453](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/453) foi **encerrado sem merge**; não afirmar que seu bloqueio de 2.121.0 está integrado. Versões novas devem ser testadas em branch/PR e banco descartável, com npm ci, start/reset, migrations, pgTAP/RLS, geração de tipos, Auth, E2E e comparação do contrato. Nunca afrouxar RLS ou testes para homologar ferramenta.

Atualizações de SDK, TypeScript, Node, Playwright, GitHub Actions e dependências de lint devem ser independentes, com changelogs primários, lockfile e testes proporcionais. Ver [auditoria de dependências de 10/10](../audits/2026-10-10-modernizacao-dependencias-etapas-0-4.md) e [auditoria Supabase](../reference/SUPABASE_INTEGRATION_AUDIT.md). Resultado verde após retry não elimina do histórico a falha inicial; registrar a causa comprovada.

## 4. Onde registrar novas decisões

**YAML e contratos automatizados** são a prova executável. Este runbook contém o procedimento durável. **AGENTS.md** e **STATUS_DOCUMENTOS.md** devem rotear até ele; **CURRENT_STAGE.md** registra estado temporal após merge; auditorias datadas preservam tentativas rejeitadas e resultados históricos. Nada disso substitui verificação direta dos SHAs, jobs e Production.

**Não modificar banco Production, permissões, migrations ou deploy para diagnosticar uma quota de imagem no GitHub.**
