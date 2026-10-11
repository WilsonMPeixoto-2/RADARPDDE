# Preparação do ambiente — Etapa 5

Data: 11/10/2026. Baseline: `113841bda52ce3bbda228524daf9a7464f12b462`.
Worktree isolada: `/workspace/RADARPDDE-controller-journey`.
Branch: `audit/controller-journey-2026-10-11`.

## Recursos conferidos e preparados

| Recurso | Estado observado | Uso |
|---|---|---|
| Codex | executor Linux cloud; CLI e shell ativos; configuração inicialmente vazia | inspeção, automação, revisão e checkpoints |
| Desktop/navegador integrado | sessão pessoal não exposta ao executor; nenhuma ferramenta nativa de browser nesta sessão | não afirmar controle do Desktop ou login já existente |
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

As configurações globais MCP foram registradas, mas isso **não injeta ferramentas
novas automaticamente no turno já aberto**. O processo MCP será provado por cliente
local; não declarar sua conexão verificada apenas pela existência do arquivo.

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
Preparação local Supabase está em andamento; não declarar pronta antes de Auth/API/
Realtime e persistência funcionarem.
