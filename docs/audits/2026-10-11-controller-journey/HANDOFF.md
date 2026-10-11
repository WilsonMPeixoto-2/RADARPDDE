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
4. MCPs registrados no Codex CLI; falta provar cliente/processo para esta sessão.
5. GitHub/Vercel/Supabase SQL e smoke público revalidados sem escrita.
6. Startup Supabase descartável iniciado com configuração copiada para
   `/workspace/scratch/controller-supabase`, project_id próprio; nenhum projeto
   remoto alterado. Excluídos somente serviços auxiliares não necessários à jornada.

## Próximas ações concretas

1. Conferir `/workspace/scratch/controller-supabase-start.log`, redigindo tokens
   antes de imprimir; não versionar status env/credenciais locais.
2. Provar MCP isolado com snapshot + screenshot e medir recursos disponíveis.
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
