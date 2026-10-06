# Revisão causal do candidato d571a26a

## Checkpoint GREEN certificado

Os cinco REDs foram corrigidos no mesmo mecanismo de refresh existente. A leitura
escolar passa pelo mesmo fluxo de cooldown/edição/inflight/fallback da global.
O debounce conserva a união de escopos. Duas fontes alteradas: saldo de **45 linhas
removidas**; nenhum novo timer. 44 testes escolares/Realtime passaram, assim como
os 57 controles do hardening anterior. Sintaxe, lint das fontes e referências dos
workflows passaram. A suíte completa passou **1.294/1.294, zero skips**.
O candidato funcional é `a6a021203f508bc4fbccd65cb014c12fd600d138`.

O gate específico inclui agora as cinco contraprovas permanentes. A suíte nativa
ganhou um cenário com duas sessões, escrita real, primeiro request escolar falhando
por HTTP 500 induzido e 30 eventos DOM de clique antes da convergência. Esperado:
uma tentativa com falha + um retry real, sem avalanche. **Comprovado no CI:**
run [37464186737](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/37464186737),
63 contratos + quatro E2E reais aprovados. O run de readiness
[37464186471](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/37464186471)
também passou (três jobs): **655 pgTAP/40 arquivos, 17 Auth/RLS/frontend**, incluindo
o E2E novo. Attachment real registra 30 gestos, duas tentativas escolares, intervalo
de 2.006 ms; a segunda percorreu o Supabase real. Não confundir esse retry explícito
com os 30 gestos, que não dispararam outras tentativas. Identificadores, resumo,
artifact/hash em [native-ci.json](native-ci.json).

Continuam pendentes para decisão final: demais jobs em andamento no último
checkpoint, remediação isolada das dependências, jornada sustentada/medição do
cliente e homologação hospedada quando necessária. Nenhum merge/deploy foi feito.

As duas imagens do artifact nativo foram abertas: `realtime-write-abort-prontuario`
mostra escola/competência e resultado aplicado; o recorte anterior
`realtime-write-abort-extcc-row` aparece atenuado. Isso não mede a duração da
transição nem autoriza afirmar ausência de flicker. Antes de certificar essa
dimensão, capturar frames/opacidade durante refresh silencioso no candidato e
contrastar com navegação intencional. Não importar o CSS experimental do #407
sem essa contraprova. O artifact acima preserva as capturas para reprodução.

Os logs confirmam a causa do bloqueio de dependências: `smol-toml@1.8.0` via Knip
(`GHSA-r4xh-jqrq-34v2`) e `source-map-js@1.2.1` via Stylelint/PostCSS/css-tree
(`GHSA-68fv-2mgg-jv7q`). Audit runtime sem vulnerabilidades bloqueantes. Em 06/10,
ambos têm `fixAvailable:true`; registro público consultado oferece 1.9.0 e 1.2.2.
Orientação: atualizar somente a resolução transitiva em checkout separado, conferir
diff do lock e validar ferramentas/auditoria; não liberar advisory nem mudar regras
do produto. Não foi alterado package-lock ou instalada versão nova nesta rodada.

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

## Remediação das dependências — continuação autorizada

Atualização restrita do lockfile: smol-toml 1.8.0 → 1.9.0 e source-map-js
1.2.1 → 1.2.2. Nenhuma dependência direta, override, runtime ou política alterada.
Instalação limpa `npm ci` aprovada; auditoria atual aceita somente a cadeia
Stylelint já documentada (seis ocorrências do advisory anterior), sem
vulnerabilidade bloqueante de runtime. Stylelint, Knip no escopo do CI e os
14 testes da política passaram. O relatório bruto permanece fora do Git.
A certificação sustentada/visual e o CI do próximo candidato ainda são pendentes.


## Flicker e gate sustentado — RED/GREEN de 06/10

O teste de frames reaproveitado como contraprova do #407 falhou no #410 atual:
refresh do mesmo Prontuário teve opacidade mínima **0**, esperado >=0,95.
A causa atual é `.tab-content-panel.active` reaplicar `fadeIn` quando o renderer
recria o painel. Override restrito aos painéis diretos do workspace escolar remove
a animação; não altera navegação, dados ou outras superfícies. GREEN: teste de
frames/troca de abas + dois testes de scroll (3/3). Screenshot final aberta:
escola, competência, abas e avaliação permanecem legíveis e sem cortes novos.

Adicionado gate sustentado baseado somente nos instrumentos/fixtures do #407,
sem trazer seu runtime experimental. Seis sessões: três escritores (avaliação,
CRUD fiscal, avaliação), dois observadores escolares e Dashboard; quatro identidades
Controlador. Contabiliza RPC global **e escolar**, payload, SQL baseline/delta,
Long Tasks, apply/render, DOM, frames, erros, reconexão e reload. Removidos os
orçamentos baseados nos timers experimentais de 5s/2s; o comparador mantém custos
explícitos e invariantes funcionais. O erro induzido agora segue uma mudança na
escola realmente observada, pois mudança em outra escola deve ser diferida.
Baseline comparativa passa a main pós-#408 `d9bf67f7`, com seu próprio lockfile.
A execução ainda deve ser concluída e interpretada; instrumentação não é prova.

O início local do Supabase falhou por espaço insuficiente na imagem PostgreSQL.
Não é falha do produto. Usar o runner nativo descartável e seus artifacts; não
substituir por banco de Production nem considerar a jornada pulada como verde.
