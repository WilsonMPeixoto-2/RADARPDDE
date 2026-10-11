# Handoff — auditoria imersiva do Controlador

## Missão e ponto de partida

Etapa 5 autorizada em 11/10/2026: explorar jornadas A–N pela UI real, observar
fora para dentro, conferir persistência/reload/projeções e corrigir achados
fundamentados. Testes históricos verdes não encerram a missão.

Main: `113841bda52ce3bbda228524daf9a7464f12b462`, pós-#437.
Branch/worktree e capacidades: [ENVIRONMENT.md](ENVIRONMENT.md).
O trabalho anterior `7ca3d736` permanece na branch
`audit/operational-readiness-2026-10-07`; não foi descartado nem incorporado cegamente.

## Regras de execução

- Ler a ordem de AGENTS.md. Documentos funcionais/metodológicos estáveis conferidos
  sem alterações desde `a5a67d34`; CURRENT_STAGE/STATUS e reconciliação foram relidos.
- PRs contextualizados: #397, #403, #404; #406, #408, #410, #427, #429;
  #415, #426, #431, #433–#437. Conferir diffs/discussões materiais antes das jornadas.
- Respeitar independência fiscal/bonificação, identidade da NF, histórico individual,
  patrimônio terminal, autoridade de rota/competência, RLS e recuperação global.
- Usuário autoriza ciclos sintéticos reversíveis em Production **autenticada**.
  Sem sessão legítima, usar Supabase descartável; não criar usuário/resetar senha de
  Production nem acessar a UI com service role.
- Histórico imutável, Pendências e patrimônio terminal: somente descartável.
- Capturas/trace/vídeo devem ser abertos e examinados, não apenas produzidos.
- Analisar impactos transversais; duas tentativas sem convergência exigem reavaliar.
- Nenhum problema foi corrigido ou encerrado neste checkpoint de preparação.

## Estado executado

1. Anexos da missão e diretriz sistêmica lidos; branch nova criada da main atual.
2. Dependências do lockfile instaladas sem upgrade; Chromium correspondente instalado.
3. Xvfb auxiliar e Chromium headed/CDP/ARIA provados com página de diagnóstico.
4. MCP registrado e servidor/cliente JSON-RPC provados; login Production e Dashboard local capturados e examinados. Chrome pessoal não conectado à máquina cloud.
5. GitHub/Vercel/Supabase SQL e smoke público revalidados sem escrita.
6. Startup Supabase descartável e incidentes de infraestrutura registrados em ENVIRONMENT.md; configuração copiada para
   `/workspace/scratch/controller-supabase`, project_id próprio; nenhum projeto
   remoto alterado. Excluídos somente serviços auxiliares não necessários à jornada.

## Próximas ações da preparação original — superadas pela correção abaixo

1. Conferir `/workspace/scratch/controller-supabase-start.log`, redigindo tokens
   antes de imprimir; não versionar status env/credenciais locais.
2. MCP isolado já provado. Servidor localhost:8931, display :99; não reinstalar. Cliente auxiliar `/workspace/scratch/controller-mcp.mjs`.
3. Preparar identidades locais pelo bootstrap já existente e build Preview contra
   localhost; serviços/Admin são preparação, todas as ações de jornada pela UI.
4. Começar por A (orientação) com screenshot examinado antes de DOM/código; depois
   B–H, I–M e exploração N, incluindo sessões concorrentes e arquivos exportados.
5. Registrar tarefa/caminho/interação/resposta/tempo/persistência/experiência/achado
   em JOURNEYS.md. Nenhuma jornada autenticada está executada neste checkpoint.
6. Para cada falha atual: reprodução, autoridade/impacto, RED proporcional, correção,
   jornada repetida, revisão crítica e CI; não implementar hipóteses antigas.

Preservar commits/push por avanço material. Dados brutos ficam fora do Git;
versionar síntese, índices, hashes e capturas representativas sem credenciais.

## Atualização de preparação

O usuário escolheu conectar Chrome pessoal; foi orientado a usar extensão oficial
Playwright MCP + servidor `playwright-session` no Codex Desktop **na mesma máquina**
e entrar no RADAR diretamente. A sessão cloud não passou a controlar esse Chrome.
Não solicitar senha/token; continuar trabalho independente no descartável.

Ferramentas auxiliares estão em `/workspace/scratch/controller-tools`.
O servidor local de orientação usa 4175 em modo local, sem Auth; a árvore isolada
real da auditoria `.radar-snapshot/controller-ui` será servida em 4176 com configuração
Supabase localhost. Não alterar o config.runtime.js versionado para essa preparação.

## Direção vigente após intervenção do usuário — 11/10

**Prioridade absoluta agora: conectar o navegador pessoal autenticado.** O usuário
apontou o desvio: a missão não é substituir o operador real por uma auditoria cloud
com fixtures. As jornadas locais foram pausadas e não serão utilizadas como prova
de Production. Não retomar a lista local A–N como se fosse o pedido corrente.

Preparação concluída e observações limitadas: [LOCAL_PREPARATION.md](LOCAL_PREPARATION.md).
Nenhum defeito do produto foi confirmado ou corrigido; não houve escrita de Production.
PR de continuidade: [#438](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/438), Draft.

### Retomada pelo Codex Desktop local

1. Abrir o repositório em ambiente **local** do Codex Desktop; obter a branch
   `audit/controller-journey-2026-10-11` sem descartar mudanças locais. Usar worktree
   separada quando necessário. A sessão atual /workspace é cloud.
2. Instalar a extensão oficial Playwright MCP no Chrome/Edge do mesmo computador:
   https://chromewebstore.google.com/detail/playwright-extension/mmlmfjhmonkocbjadbfplnigmagldckm
3. Configurar no cliente local:
   `codex mcp add playwright-session -- npx -y @playwright/mcp@0.0.82 --extension`
   e conferir `codex mcp list`. Reabrir a sessão se necessário para as ferramentas
   aparecerem no turno. Não presumir ativação por arquivo ou por registro CLI.
4. O responsável entra em https://radarpdde-fix.vercel.app diretamente no Chrome.
   Na primeira chamada MCP, aprova a conexão e seleciona essa aba. Nunca enviar
   senha, cookies, storageState, JWT ou token da extensão pelo chat/Git.
5. Provar conexão com snapshot + screenshot **examinado** da tela autenticada,
   identificando perfil, rota, competência e SHA. Não usar tela de login como prova.
6. Iniciar A e prosseguir pelas jornadas reais autorizadas. Reversíveis sintéticas
   em Production exigem estado anterior e cleanup; irreversíveis no descartável.

Não expor CDP/browser pessoal à Internet para contornar a separação cloud/Desktop.
O usuário ainda não confirmou instalação/seleção de aba; o estado ambient de uma
aba GitHub aberta não equivale a conexão MCP estabelecida.
