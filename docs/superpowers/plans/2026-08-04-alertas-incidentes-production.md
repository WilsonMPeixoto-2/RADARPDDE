# Alertas e Incidentes Automáticos de Production — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development and superpowers:verification-before-completion.

**Goal:** Fazer o monitor geral de Production abrir ou atualizar um único incidente no GitHub quando falhar e encerrá-lo automaticamente somente após recuperação confirmada.

**Architecture:** Um módulo Node.js sem dependências concentra o contrato do incidente, a seleção segura de issues e as chamadas REST do GitHub. O workflow existente fornece apenas resultados sanitizados e executa o módulo com o token efêmero do GitHub Actions. A falha do mecanismo de alerta não altera o diagnóstico principal do monitor, mas permanece visível no resumo da execução.

**Tech Stack:** Node.js 24, Fetch API nativa, `node:test`, GitHub REST API e GitHub Actions.

## Regras de segurança

- Não registrar `GITHUB_TOKEN`, cabeçalhos de autorização ou respostas integrais da API.
- Não copiar logs técnicos completos para a issue.
- Não executar gestão de incidentes em eventos `pull_request`.
- Usar título exato e marcador HTML estável para não alterar issues humanas.
- No máximo uma issue aberta para o incidente do monitor; duplicatas legadas devem ser encerradas na recuperação.
- Atualizações recorrentes substituem o corpo da issue em vez de gerar comentários horários.
- A recuperação deve adicionar um comentário final e fechar o incidente como concluído.
- O workflow mantém `contents: read` e recebe apenas `issues: write` adicional.

## Contrato do incidente

Título:

`[Incidente automático] Falha no monitoramento de Production`

Marcador:

`<!-- radar-production-monitor-incident -->`

O corpo registra somente:

- estado atual;
- primeira e última detecção;
- commit verificado;
- evento que disparou o monitor;
- códigos de saída do smoke geral e do preflight;
- endereço da execução do GitHub Actions;
- orientação para consultar os logs da execução.

## Tarefas

### 1. Contratos puros e RED

- criar `tests/unit/production-incident-manager.test.js`;
- exigir correspondência por título e marcador;
- exigir corpo sanitizado e determinístico;
- exigir fechamento de todas as duplicatas reconhecidas;
- executar o teste antes da implementação e registrar a falha esperada.

### 2. Implementação do gerenciador

- criar `scripts/manage-production-incident.mjs`;
- validar argumentos e variáveis de ambiente;
- listar issues abertas e ignorar pull requests;
- em falha, criar uma issue ou atualizar a mais antiga;
- em recuperação, comentar e fechar todas as issues reconhecidas;
- aplicar timeout e códigos de erro estáveis;
- nunca imprimir token ou resposta integral.

### 3. Integração ao workflow

- ampliar `.github/workflows/production-system-smoke.yml` com `issues: write`;
- executar o gerenciador somente fora de `pull_request`;
- usar `if: always()` e `continue-on-error: true`;
- registrar o resultado da gestão do incidente no resumo;
- manter o resultado do monitor como fonte da aprovação ou falha do job.

### 4. Verificação

- executar testes unitários e readiness;
- validar referências de workflows;
- provar em teste com API simulada os fluxos criar, atualizar e recuperar;
- não gerar incidente artificial em Production durante a homologação;
- integrar por PR somente após todos os gates.
