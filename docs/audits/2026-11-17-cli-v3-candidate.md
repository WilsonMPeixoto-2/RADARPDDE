# Supabase CLI 3.2.0 — migração candidata e condições para liberação

**Classe:** auditoria técnica da branch de desenvolvimento; NÃO comprova publicação em Production.
**Ponto de partida:** main 58ca0c0a507fb42ee512ace95ab766edaa1f2243 (17/11/2026).
**Escopo:** issue #530; migração de ferramentas e workflows, sem alterações nas migrations, RLS, RPCs, dados, frontend ou Supabase hospedado.

## Mudanças propostas

A CLI Supabase v3 usa o banco local por padrão. Scripts administrativos destinados ao banco remoto foram atualizados para selecionar explicitamente --remote; comandos com efeitos de escrita exigem --yes e mantêm as confirmações humanas próprias dos workflows.

Os contratos de verificação remota (remote-preflight, remote-post-apply e production-integrity-health) possuem blocos SQL DO. Na CLI 3, a opção --read-only rejeita sintaticamente DO. Para manter essas verificações sem escrita, cada workflow candidato monta um arquivo temporário começando por BEGIN TRANSACTION READ ONLY e terminando por COMMIT. A opção --yes confirma a execução ao CLI, mas a impossibilidade de escrita é garantida pelo PostgreSQL. O novo job descartável deve comprovar tanto a execução legítima dos três contratos quanto a rejeição de um DELETE intencional sob essa transação.

Os dois workflows de correção histórica de dados de produção (remove-test-invoice-1234 e update-inventory-process-0411012) perderam o gatilho por push e passam a aceitar somente workflow_dispatch com texto de confirmação específico. Não são parte da rotina normal e não podem executar automaticamente na integração de arquivos.

O mecanismo de verificação de backup passa --remote=<URL> explicitamente aos cinco dumps Supabase. O arquivo de configuração substitui auth.email.enable_signup (obsoleto) por auth.email.enabled, preservando auth.enable_signup=false e o bloqueio de cadastro público. O contrato de auto_expose_new_tables=false permanece intocado.

## Evidências prévias, independentes de Production

- [Supabase local com migrations, pgTAP/RLS, lint e geração de tipos](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/44173135759).
- [PostgreSQL sintético em modo remoto — leitura, confirmação e bloqueio de escrita](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/44195189250).
- [Supabase completo e isolado, destino remoto loopback — 62 migrations, pgTAP e tipos](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/44195820993).
- [Issue #530: inventário dos comandos, decisões e riscos](https://github.com/WilsonMPeixoto-2/RADARPDDE/issues/530).
- [Guia oficial de migração CLI v3](https://supabase.com/docs/guides/local-development/cli/migrating-to-v3).

## Testes desta candidata

- TDD: 6 testes de contrato falharam contra a main antiga (RED) e passaram após a migração (GREEN).
- npm ci reproduzível, config validate v3.2.0, build Vercel e test:readiness passaram no ambiente de desenvolvimento isolado. Resultado da suite local: 1.398 unitários aprovados, 8 integrações aprovadas, sem falhas.
- Novo workflow supabase-cli-v3-disposable-remote.yml, sem secrets hospedados, exige bloqueio efetivo de escrita no PostgreSQL e executa migrações, pgTAP, geração de tipos e contratos remotos no próprio SHA candidato.
- Pendente: gates completos da CI no SHA do PR, backup-restauração no runner, homologação hospedada num projeto de testes autorizado e revisão da segurança.

## Bloqueio independente de segurança

O relatório atualizado npm audit continua mostrando 7 ocorrências high, relacionadas a um único advisory do picomatch@4.0.7 em dependências de desenvolvimento; npm audit --omit=dev não encontrou vulnerabilidades. O gate de segurança permanece obrigatório; não utilizar relatórios de auditoria antigos, não remover a política, não fazer merge por conta de testes funcionais verdes. Ver [issue #528](https://github.com/WilsonMPeixoto-2/RADARPDDE/issues/528).

## Conclusão operacional

Candidata exclusivamente em Draft até os requisitos acima. Não alterar Production nem acionar scripts de correção histórica para validar esta migração. A frente de Prontuário e o PR #515 são independentes.
