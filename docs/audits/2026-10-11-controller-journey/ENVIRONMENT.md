# Preparação do ambiente — Etapa 5

Data: 11/10/2026. Baseline: `113841bda52ce3bbda228524daf9a7464f12b462`.
Worktree isolada: `/workspace/RADARPDDE-controller-journey`.
Branch: `audit/controller-journey-2026-10-11`.

## Recursos conferidos e preparados

| Recurso | Estado observado | Uso |
|---|---|---|
| Codex | executor Linux cloud; CLI e shell ativos; configuração inicialmente vazia | inspeção, automação, revisão e checkpoints |
| Desktop/navegador integrado | habilidade Browser encontrada e lida; sua ferramenta exigida ausente após duas buscas; socket de gerenciamento ausente; flags browser já ativas | capacidade instalada não equivale a transporte de controle disponível |
| Node/npm | 24.19.0 / 11.9.0 | ferramentas do lockfile; sem upgrade |
| Dependências RADAR | `npm ci` da main atual concluído; Playwright 1.64.0, Supabase JS 2.117.3 | jornadas, arquivos, acessibilidade, medições e regressões dirigidas |
| Chromium | binário correspondente ao Playwright instalado; 156.0.8078.4 | interface real, cliques, screenshots e vídeo |
| Display | Xvfb 21.1.16 extraído em diretório auxiliar, sem root; display virtual :99 | Chromium **headed**, confirmado em 1440×900; não é tela pessoal do usuário |
| CDP | conexão Playwright confirmada; 36 métricas de Performance disponíveis | Network, Performance, long tasks e diagnóstico orientado por achados |
| MCP | `.mcp.json` fixa @playwright/mcp 0.0.82; `playwright` e `playwright-session` registrados por `codex mcp add` | navegador isolado; sessão com extensão exige Chrome pessoal conectado |
| Git/GitHub | Git 2.52.0, gh 2.46.0; fetch e REST autenticados funcionando | worktree nova; branch anterior preservada; commits/push e PR |
| Hooks | somente arquivos `.sample`; nenhum hook ativo ou core.hooksPath | não instalar ações automáticas que alterem/publquem produto sem revisão |
| Docker | daemon local 28.4.0 saudável; nenhum container ativo inicialmente | banco/Auth/RLS/Realtime descartáveis para históricos irreversíveis |
| Supabase CLI | 2.114.0 do lockfile | ambiente local isolado; não atualizar a CLI reprovada |
| Supabase MCP | leitura SQL de Production funcionando; `list_projects` retornou vazio | confirmar metadados/persistência; lista vazia não prova projeto ausente |
| Vercel MCP | projeto e deployments consultados com sucesso | confirmar artefato/alias, logs retidos e dados de campo quando disponíveis |
| Cloud plugin | ambiente conectado/running, política unrestricted/enforced; nenhuma credencial de conta RADAR injetada | diagnóstico de rede; manter proxy e TLS |
| FFmpeg | instalado | examinar transições e vídeo |

As configurações globais MCP **não injetam ferramentas automaticamente no turno
aberto**. Foi iniciado e provado um servidor Playwright MCP local em
`http://localhost:8931/mcp`, Chromium headed em :99 e cliente JSON-RPC local.
Navegação, ARIA, screenshot e redimensionamento foram executados. Screenshots do
login de Production e Dashboard local foram **abertos e examinados**. O servidor
habilita `vision,devtools`, mantém WebMCP desativado e permite rede, console, traces
e vídeo. O MCP fixado usa seu engine Playwright 1.64.0-alpha; as jornadas nativas
do projeto usam Playwright 1.64.0 do lockfile. Não confundir essas versões.

## Production revalidada sem escrita

- Vercel: `dpl_Az4q8VTqmWdT8e5tMxYTGyKv7SHo`, `READY`, SHA `113841bd…`.
- Smoke público: `approved`, 52 assets e RLS anônima `blocked-401`.
- Supabase `scnryinorqeucbfkioxo`: última migration `20261004210000`, conferida por
  consulta somente leitura.
- Isso não comprova login de Controlador, CRUD nem homologação visual autenticada.

## Limitações e intervenções pessoais

Não há sessão autenticada de Production disponível no navegador desta máquina.
Não solicitar senha pelo chat, ler hashes de senha, forjar JWT ou alterar Auth/RLS
para entrar. Para usar uma sessão pessoal, o responsável precisa instalar/conectar
a extensão oficial Playwright MCP no Chrome do seu Desktop e realizar o login
diretamente nele. O executor cloud atual não controla esse navegador por inferência.

Como alternativa automatizada, as contas reais podem ser provisionadas pelo secret
GitHub previsto no #426. Disparo manual daquele workflow habilita CRUD por padrão;
não utilizá-lo como prova somente leitura sem selecionar/corrigir esse comportamento.
O RED antigo `7ca3d736` foi preservado em sua branch; não misturar automaticamente
sua implementação com a auditoria imersiva.

Não houve alteração em Production, regras, dependências, schema, Auth ou RLS.
Preparação local Supabase concluída: Database/Auth/Kong/Realtime saudáveis, PostgREST ativo,
bootstrap de sete identidades aprovado e login real pela UI local funcionando.
Sessão de Production continua indisponível nesta máquina.

## Preparação Supabase: limites encontrados, sem alteração do produto

O daemon Docker usa VFS. A extração multicamada de
`public.ecr.aws/supabase/postgres:17.6.1.158` excedia o espaço desta máquina.
As duas tentativas de pull foram interrompidas; não houve mudança em SQL/RLS.
A solução local usa **o filesystem completo da mesma imagem oficial**, exportado
com Crane 0.20.6 (download com checksum verificado), importado em uma camada e
com ENV/Entrypoint/Cmd/WorkingDir/portas e healthcheck/StopSignal preservados.
Não é uma imagem Postgres genérica com funções Supabase simuladas.

- Manifest digest oficial: `sha256:99b1729aeb0bac314445024fc149fbd39306170b61dd50800ccf180327ab3459`.
- Imagem local achatada: `sha256:aa2b5f3bbb6aa37646f4660c81ba8e041692dcebd035aca60b48245ed460e81c`.
- Database iniciou saudável e aplicou migrations até `20261004210000` + seed.
- Primeiro startup completo parou no healthcheck Auth: wget tentou passar pelo
  proxy para um endpoint local, recebeu 403 e a CLI encerrou a pilha corretamente.
  Não foi usado `--ignore-health-check`. Causa confirmada e corrigida localmente como abaixo.
- Causa confirmada: BusyBox wget ignora `no_proxy`; o healthcheck oficial
  `wget ... http://127.0.0.1:9999/health` recebeu 403 do proxy, enquanto o mesmo
  comando com `-Y off` respondeu “remote file exists”. Acrescentar bypass ao
  Docker não resolveu; a configuração original foi restaurada.
- Proxy/TLS externos e configuração Docker originais preservados. A imagem local
  GoTrue v2.195.0 recebe somente um wrapper wget: para **esse endpoint localhost
  exato** usa `-Y off`; qualquer outro URL usa o wget original sem alteração.
  O binário GoTrue, Auth, banco, RLS e resposta/asserção do healthcheck continuam
  reais. Não é `--ignore-health-check` nem bypass de destino externo.
- Imagens cache não utilizadas de logflare/vector/edge-runtime foram removidas
  sem force; são baixáveis novamente. Container/volume histórico de caracterização
  do #410 preservado. Nenhum projeto cloud criado ou serviço pago ativado.

A árvore estática da baseline foi copiada para `.radar-snapshot/controller-ui`
(ignorada pelo Git), permitindo configuração localhost sem modificar o
`config.runtime.js` versionado. Credenciais locais ficam fora do Git, em arquivos
protegidos; nunca exportar service role para o frontend.

O smoke autenticado de Production de 11/10 (run `38141455147`) teve o job real
**skipped**, com o job “Credenciais Production pendentes” aprovado. Workflow verde
não representa login feito. O usuário escolheu Chrome pessoal: requer extensão
Playwright MCP e servidor `playwright-session` no Codex Desktop **na mesma máquina**;
a presente sessão cloud não alcança o Chrome pessoal por configuração implícita.

## Estado final da preparação e direção corrigida

Supabase descartável preparado com **60 registros de migrations**, última
`20261004210000`; DB/Auth/Kong/Realtime healthy, PostgREST ativo.
Sete identidades locais foram provisionadas pelo bootstrap canônico e o Controlador
entrou pela UI. A árvore isolada está em 4176, modo `supabase-preview/test`.
Config.runtime.js versionado, dependências, hooks e Production permanecem intactos.
Limite: Edge Runtime não ativado (Gestão de Equipe não foi exercitada); nem navegador
pessoal, integração Desktop ou sessão institucional foram obtidos por essa preparação.

**A pausa pelo navegador pessoal foi posteriormente levantada pelo usuário:**
“pode continuar neste ambiente mesmo”. A auditoria prossegue no cloud, pela UI
autenticada local, sem alegar observação de dados/uso pessoal de Production.
A abertura do GitHub
na aba embutida do usuário informa uma URL, mas nenhuma ferramenta para controlar
essa aba foi disponibilizada ao executor. O único `run_code_in_browser` encontrado
é específico do app Floot e não controla RADAR; não foi usado.

Documentação oficial da extensão atual:
https://github.com/microsoft/playwright/tree/main/packages/extension#readme
Instalação oficial:
https://chromewebstore.google.com/detail/playwright-extension/mmlmfjhmonkocbjadbfplnigmagldckm
O primeiro acesso pelo cliente MCP pede seleção/aprovação da aba. Manter essa
aprovação; não solicitar ou publicar o token de conexão.

Extensão confirmada instalada pelo usuário. `.codex/config.toml` agora oferece os
mesmos dois servidores de `.mcp.json`; TOML e equivalência validados, versões
preservadas. O cliente precisa carregar configuração de projeto confiável.
Registro CLI global confirmado; configuração do Desktop de outra máquina e
ativação de ferramentas no turno atual não foram comprovadas por esse registro.

Documentação oficial consultada:
https://developers.openai.com/codex/config-basic — configurações por projeto são
carregadas somente para projetos confiáveis. Nenhuma autenticação/política de
aprovação foi alterada para tentar fabricar acesso ao navegador pessoal.
