# CI do RADAR: registros Docker, runners e compatibilidade de ferramentas

**Classe:** runbook operacional vigente, não define regra funcional.  
**Atualizado em:** 22/10/2026.

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

**Contrato integrado pelo #472:** CLI **2.121.0** com `[api] auto_expose_new_tables = false` explícito. A CLI 2.114 tratava chave ausente como `false`; a 2.121 passou a tratá-la como `true`, preservando grants automáticos antes das migrations. A matriz nativa de quatro stacks no [run 39830514391](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39830514391) isolou a causa: 2.121 sem chave falha exatamente 32/33; 2.114 ausente/false e 2.121 false passam **674/674**, com as mesmas ACLs finais nos vínculos administrativos. [Evidência completa](../evidence/2026-10-22-supabase-cli-grants/README.md). A homologação final foi **19/19 workflows** no candidato `e44dd96`, seguida de **8/8 workflows de push** no merge `caf2de3e`, incluindo Auth/RLS, tipos, visual, Production e backup. Os detalhes ficam no #472 e em CURRENT_STAGE; a matriz causal não substitui Auth, tipos e jornadas.

**Regra para próximas atualizações:** preservar a configuração explícita e os testes existentes; conferir defaults de bootstrap, imagens e privilégios antes de atribuir regressão à CLI. Não remover a chave por parecer redundante. A configuração local não é autorização para `config push`, GRANT/REVOKE ou mudanças em Production. Production possui DELETE administrativo e rotinas técnicas que o utilizam; isso não exige concedê-lo ao bootstrap descartável.

**Histórico preservado:** 2.116/2.117/2.118/2.120 ficaram retidas por asserções 32/33; #452 reproduziu a diferença na 2.121 em [39171252853](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39171252853), e #453 foi encerrado sem merge. Não extrapolar a causa isolada na 2.121 para todas as versões intermediárias não medidas nesta matriz. A [auditoria de 18/10](../audits/2026-10-18-supabase-cli-rls-parity.md) registra a divergência com Production e agora remete à resolução. A candidata atual não relaxa testes, migrações ou RLS.

Atualizações de SDK, TypeScript, Node, Playwright, GitHub Actions e dependências de lint devem ser independentes, com changelogs primários, lockfile e testes proporcionais. Ver [auditoria de dependências de 10/10](../audits/2026-10-10-modernizacao-dependencias-etapas-0-4.md) e [auditoria Supabase](../reference/SUPABASE_INTEGRATION_AUDIT.md). Resultado verde após retry não elimina do histórico a falha inicial; registrar a causa comprovada.

## 4. Onde registrar novas decisões

**YAML e contratos automatizados** são a prova executável. Este runbook contém o procedimento durável. **AGENTS.md** e **STATUS_DOCUMENTOS.md** devem rotear até ele; **CURRENT_STAGE.md** registra estado temporal após merge; auditorias datadas preservam tentativas rejeitadas e resultados históricos. Nada disso substitui verificação direta dos SHAs, jobs e Production.

**Não modificar banco Production, permissões, migrations ou deploy para diagnosticar uma quota de imagem no GitHub.**

## 5. Adequação do typegen pós-CLI 2.121 e contenção de falhas de runner (22/10)

O gerador da CLI 2.121.0 modificou a representação TypeScript sem alterar o
conjunto de entidades ou RPCs: 48 campos JSON de tabela não-nulos, 20
`ComputedFields: never` e 3 assinaturas de RPC sem parâmetros foram
incorporados ao arquivo de tipos versionado. A CI valida a sintaxe com o parser TypeScript do Prettier e compara
tokens significativos via `scripts/check-generated-database-types.js`, para aceitar
aspas, espaçamento e agrupamentos não semânticos, **reprovando alterações de
tipos, campos ou obrigatoriedade**. Arquivos de bundle e runtime continuam
comparados literalmente. O teste remoto descartável segue o mesmo critério.

Falha de inicialização por porta 54322 no workflow independente de backup é
tratada com reserva local no runner, sem reduzir a cobertura. Limite `toomanyrequests` simultâneo no GHCR e no mirror ECR revelou que
um pull de imagem na matriz de comparação Ubuntu 24/26 era redundante: todos
os runners canônicos usam Ubuntu 26 e executam Supabase real em outros gates.
A matriz de compatibilidade mantém Node 24, npm, Docker e Chromium real,
mas não repete download de imagem de terceiro. Os gates de Supabase dedicados
continuam bloqueantes; não confundir redução de duplicação com aprovação
simulada. Conferir execução do novo SHA antes de
considerar essas duas correções homologadas.
