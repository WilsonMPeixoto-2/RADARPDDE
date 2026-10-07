# Retomada — validação operacional por perfil

## Objetivo e autorização

O usuário encerrou a frente de fluidez/sincronização e autorizou avançar na
validação funcional operacional. Não realizar nova arquitetura, refatoração
geral de `app.js` ou otimizações sem reprodução. Preservar checkpoints no remoto.

Baseline: main `a5a67d34b6dcab04903b6657fb9fa01f0aba9d11`, #429 mergeado.
Branch: `audit/operational-readiness-2026-10-07`.

## Achados que orientam a continuação

1. O topo de `CURRENT_STAGE.md` e o handoff #429 ainda descrevem pré-merge.
   Atualizar a classificação, preservando os RED/GREEN e checkpoints históricos.
2. Smoke autenticado não executou contas reais no run `37629357126`. Jobs verdes
   de contratos/provisionamento não equivalem a homologação autenticada.
3. Disparo manual do smoke sempre habilita CRUD; adicionar escolha explícita
   `read-only` / `read-and-crud`, com padrão somente leitura. Esta frente usa
   **somente leitura** em Production. Não remover o CRUD opt-in aprovado no #426.
4. Allow-list do detector do smoke omite as duas RPCs operacionais de leitura.
   Admitir somente os nomes canônicos comprovados; writers/desconhecidos continuam
   classificados como mutação. RED dos itens 3–4: 12 testes / 2 falhas.
5. Matriz: 44 operações / 18 covered / 26 partial; não transformar essas 26 em
   fila de bugs. `INV-01` ainda pede CI do candidato da Fase 2, apesar de #404 já
   integrado e homologado. Corrigir esse texto sem inventar validação de Production.
6. PROD-UX-08 tem handoff de 28/09 com clipping histórico e um WIP antigo.
   Não aplicar stash nem corrigir CSS antes de repetir a observação na main atual.

[Evidência e limitações](../evidence/2026-10-07-operational-readiness/README.md).

## Pendência externa

O usuário precisa provisionar no GitHub o secret
`RADAR_PRODUCTION_AUTH_ACCOUNTS_JSON` com conta real autorizada. Nunca pedir senha
no chat, criar usuários ou resetar credenciais como atalho. Orientação enviada:
uma conta `controller`, sem `allowWrite`; habilitar
`RADAR_PRODUCTION_AUTH_SMOKE_ENABLED=true` depois do ajuste seguro.

Se houver credencial/habilitação: executar o workflow corrigido em modo
`read-only`, conferir que o job autenticado realmente iniciou e registrar o
resultado por perfil. Sem credencial, deixar explícito o bloqueio e concluir
somente o que puder ser verificado sem acesso autenticado.

## Fronteira da rodada

O smoke cobre login/restauração, perfil, busca, Dashboard, Carteira, Prontuário,
Pendências, leituras RLS, reload e logout. Não prova toda a matriz, ausência de
vazamento entre contas ou todos os fluxos de escrita. As suítes descartáveis
existentes continuam a autoridade para CRUD controlado e concorrência.

Não abrir Fase D ou intervenção no drawer automaticamente. Primeiro confirmar
uma falha atual, preservar reprodução e escolher uma jornada/risco concreto.
