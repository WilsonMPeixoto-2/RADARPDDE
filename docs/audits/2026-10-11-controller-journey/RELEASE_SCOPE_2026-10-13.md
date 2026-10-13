# Escopo de fechamento do #438 — 13/10/2026

Este registro delimita o fechamento do PR; não substitui o método canônico nem
certifica toda a auditoria A–N. Incorpora a revisão enviada pelo usuário após a
comparação de frescor. Agente principal, sem delegação.

## Correções e evidência já disponível

| Grupo alterado | Evidência aproveitada | Situação |
|---|---|---|
| Ações depois de autenticação/app.js tardios | E2E Auth real com atraso de 11 s, controles de lifecycle | Verificado no candidato |
| Identidade documental e rodapés dos três modais | RED/GREEN dirigido e inspeção a 1280×720 / 1440×900 | Verificado; não autoriza reforma geral de CSS |
| Submit concorrente de contato | Guard existente, teste de repetição e jornada Auth | Verificado |
| Navegação, competência e seletor escolar | RED Auth; catálogo completo da sessão; limpar/chip/Voltar/Avançar/reload; autorização preservada | Verificado |
| Exclusão terminal de NF/bem | 18 pgTAP, concorrência SQL, duas sessões/perfis UI, exclusão recusada e edição ordinária preservada | Verificado no descartável; publicação ainda pendente |
| Relógio dos testes de retry | Contraprova de event loop, timers controlados, nenhuma mudança de controller | Corrigido no harness |

As referências detalhadas estão em CAUSAL_FINDINGS, JOURNEYS e
DIAGNOSTIC_CLASSIFICATION desta pasta. CI consultada: 22 workflows concluídos com
sucesso no SHA funcional 99fa423c; 1.361 unitários locais e jornadas autenticadas
registradas. Smoke autenticado de Production não é certificado pelo job de
contratos verde quando os jobs autenticados são pulados.

## O que não reabre nem bloqueia automaticamente este PR

- A comparação curta de frescor reproduziu o adiamento em main e candidato;
  não demonstrou regressão do #438. Ver FRESHNESS_COMPARISON_2026-10-13.md.
- O gate longo usa #408 como baseline histórica. Não atribuir seus deltas de
  leituras/aborts/payload/CPU exclusivamente ao #438.
- O vermelho antigo de opacity 0 na preparação continua inconclusivo. A nova
  execução completa não explica sua causa, mas não há base para convertê-lo em
  defeito do candidato nem para relaxar sua asserção.
- A auditoria ampla A–N, CPU/DOM e módulos adicionais sob atraso artificial
  permanecem parciais. Ausência de certificação universal não equivale a uma
  regressão. Trabalho adicional exige jornada afetada e relevância demonstradas.
- Preservar #406/#408/#410/#427. Não alterar debounce ou arquitetura por advertência
  de um ensaio; confrontar relevância operacional antes de abrir correção separada.

## Requisitos delimitados antes da publicação

1. Conferir diff final e CI aplicável do SHA de release; reaproveitar provas da
   árvore funcional idêntica, sem chamar CI histórica de CI do HEAD novo.
2. Resolver achados materiais de revisão diretamente relacionados ao diff.
   CodeQL apontou nome temporário previsível no script auxiliar startup-probe:
   corrigido com diretório privado e criação exclusiva por descriptor. Sintaxe,
   recusa de symlink, preservação do alvo, checkpoints sucessivos e permissões
   0600/0700 conferidos; aguardar análise CodeQL do novo SHA. Sem runtime alterado.
3. Revalidar histórico real de migrations e compatibilidade com a main anterior;
   confirmar que somente a migration 61 candidata falta e que não há drift.
4. Publicar a proteção de banco em sequência controlada antes de anunciar a
   proteção completa. A migration acrescenta guardas, sem backfill nem alteração
   de Auth/RLS; clientes anteriores continuam sujeitos à mesma proibição terminal.
   Após aplicação, verificar histórico e ambos os triggers habilitados, funções,
   grants e leitura operacional. Não executar pgTAP com fixtures em Production.
5. Publicar frontend pelo fluxo normal e verificar SHA/deployment e smoke público;
   registrar separadamente qualquer limitação do smoke autenticado. Rollback de
   frontend não deve remover automaticamente a proteção de integridade do banco.

Os workflows chamados "remoto descartável" não são autorização para aplicar em
Production nem devem receber a referência de Production como alvo descartável.
A sequência de publicação exige o procedimento autorizado e o alvo correto.

Estado: PR aberto/Draft; nenhuma mudança em Production. Não há nova correção de
sincronização proposta. Critérios acima são finitos: só nova evidência material
sobre o diff pode ampliar a homologação do PR. A auditoria geral permanece
registrada separadamente, sem alegação de sistema perfeito ou fluidez encerrada.
