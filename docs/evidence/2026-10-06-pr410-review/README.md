# Revisão causal do candidato d571a26a

## Checkpoint GREEN local

Os cinco REDs foram corrigidos no mesmo mecanismo de refresh existente. A leitura
escolar passa pelo mesmo fluxo de cooldown/edição/inflight/fallback da global.
O debounce conserva a união de escopos. Duas fontes alteradas: saldo de **45 linhas
removidas**; nenhum novo timer. 44 testes escolares/Realtime passaram, assim como
os 57 controles do hardening anterior. Sintaxe, lint das fontes e referências dos
workflows passaram. A suíte completa passou **1.294/1.294, zero skips**. A prova nativa do candidato
será registrada quando concluir; não herda a certificação de d571.

O gate específico inclui agora as cinco contraprovas permanentes. A suíte nativa
ganhou um cenário com duas sessões, escrita real, primeiro request escolar falhando
por HTTP 500 induzido e 30 eventos DOM de clique antes da convergência. Esperado:
uma tentativa com falha + um retry real, sem avalanche. Esse cenário ainda precisa
ser executado no CI; não foi declarado verde com base apenas nos testes locais.

Continuam pendentes para decisão final: CI do novo SHA, diagnóstico exato das
dependências, jornada sustentada/medição do cliente e homologação hospedada quando
necessária. Nenhum merge/deploy foi feito.

## Estado observado em 06/10/2026

#410 aberto, Draft, mergeável, HEAD `d571a26afdc7e443df096564b7db951a58abfc37`.
main permanece `d9bf67f7d8a1ce2e468ec3c793ff992d8e10dfd6`. Nenhuma alteração de
Production foi realizada nesta revisão. Os ganhos SQL de c29 continuam limitados
ao benchmark publicado, não medem o apply/DOM desta versão.

A CI de d571 tem 19 workflows: 16 sucesso, três falhas (Saúde das dependências,
Validar RADAR PDDE e Homologação integral pré-production). Jobs funcionais e
hardening passaram; gate final pré-production falhou e Preview Supabase foi
pulado. A descrição atribui as falhas aos advisories smol-toml/source-map-js;
essa causa ainda deve ser confrontada com logs antes de qualquer decisão de merge.

## Cinco REDs no runtime atual

`tests/unit/operational-school-recovery-invariants.test.js` compõe as autoridades
reais de refresh e Realtime com relógio/fila determinísticos; nenhum sleep longo.
Resultado inicial: **0/5 aprovados**, todos por violação observável do contrato.
O comando existente `npm run test:sync-hardening` passou **57/57** na mesma revisão.

1. Uma leitura escolar falha, depois 30 gestos drenam a pendência: **31 leituras**,
   esperado uma até o cooldown. `refreshSchool` não consulta o cooldown; recebe
   `force:false` do flush e o ignora.
2. Retry escolar final retorna stale: após 30,1 s continua com uma única leitura;
   não agenda a recuperação automática que o caminho global do #408 preserva.
3. Contato pede reconciliação global, em seguida avaliação da escola atual chega
   antes do debounce: só acontece leitura escolar. A segunda agenda apaga a primeira.
4. Reconexão pede global, depois evento escolar chega antes do debounce: mesmo
   problema; a recuperação do período sem garantia de Realtime deixa de ser global.
5. Escolar em voo recebe nova invalidação escolar e global: ao concluir, executa
   outra escolar e consome a pendência global. A recursão própria de refreshSchool
   não usa a união de escopos que markPending já representa.

Isso refuta a conclusão de que o candidato já preserva todas as garantias do #408.
Os testes anteriores verdes continuam válidos para seus cenários; não cobriam
essas intercalações. Não há recomendação de merge no estado RED.

## Decisão de correção

Reutilizar a máquina de refresh existente para a leitura escolar: mesma fila,
edição, cooldown, drenagem e união de escopos, variando o método de leitura.
Remover a execução paralela de política em refreshSchool em vez de adicionar
timers compensatórios. No debounce Realtime, combinar o escopo pendente:
global domina escolar; escolas distintas exigem união conservadora global.

Preservar fallback, dados, migrações, RLS, eventos de retomada e regras funcionais.
Após GREEN dirigido, executar regressões relacionadas e prova com Supabase/Auth/
Realtime real no CI antes de recomendar integração. Medições sustentadas e de
apply/DOM continuam pendentes; melhoria de payload não certifica custo de cliente.

## Trabalho local anterior preservado

Branch `codex/archive-pr410-local-school-apply-2026-10-06`, commit
`5f546af860604d4b9142c1a0f82bfc41b926c2f4`, publicado no remoto. Guarda a exploração
local iniciada em e38e91c3, que foi superada pela implementação atual do #410.
23 testes dirigidos passaram nesse arquivo; não houve certificação E2E dessa
alternativa. Não fazer cherry-pick automático nem retomar aquela branch como
candidato. Ela existe para rastreabilidade e reaproveitamento de contraprovas.
