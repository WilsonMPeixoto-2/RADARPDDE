# Revisão causal do PR #409 — 04/10/2026

Estado inicial verificado: candidato `d46f5242977ec83af3f045696a8858e0715e4f54`,
main/Production `d9bf67f7d8a1ce2e468ec3c793ff992d8e10dfd6` (#408).
Workspace anterior #407 preservado sem alterações; revisão em worktree isolado.

## Contraprova confirmada: a resposta provocava outra leitura

`operational-school-navigation-cycle.test.js` integra NavigationHistory,
OperationalContextRefresh e OperationalRealtimeInvalidation reais. Somente
serviço de dados/transporte são simulados; relógio determinístico.

Sequência: A aberta → Broadcast de B → nenhuma leitura → navegar para B
(ou Dashboard) → leitura/aplicação → render via switchView → evento de navegação
para a mesma rota → outra leitura após 2 segundos.

RED em d46: **2 testes falham**, leituras `[2, 2]` em vez de `[2]`.
Causa: commitRoute emitia `radar:navigation-committed` mesmo quando sua própria
comparação reconhecia que a rota não havia mudado. O mapa dirty ainda não tinha
sido confirmado pela Promise do Realtime durante a renderização.

Correção: emitir navegação somente quando o estado navegável efetivamente muda.
Não altera timers, o controlador do #408 nem a política de Broadcast.
GREEN: **14/14** nos dois novos controles, seis controles de relevância e seis de
histórico. Resultado causal: **2 → 1 leituras**, mesma projeção canônica final.
Não extrapolar este microexperimento para custo global de Production.

## Validação ainda em andamento

- Rever novas gerações durante leitura, edição, falha, navegação rápida e retorno.
- Provar relevância com navegador/Auth/RPC/Broadcast reais (o stress original de
  seis escolas usa refresh simulado e rajada síncrona, não seis pessoas sustentadas).
- Investigar falha anterior do ciclo fiscal, run `37177177787`, job `111362146806`:
  painel CONECTADA com razão de viewport 0,9488689; screenshot confirma corte
  inferior. Retry serial também reutiliza banco já alterado. Não reduzir limiar
  de viewport nem interpretar erro de retry como causa inicial.
- Artefato original `11293509095`, SHA256
  `340a6c810b48d909b0422979316b50575327ef2682bf756864647f1dc18ca882`.
- Nenhuma migration aplicada em Production, nenhum merge realizado nesta revisão.

## Candidato para CI após revisão

- 35/35 controles dirigidos: inclui geração nova durante leitura, navegação com
  edição ativa e falha recuperada sem novo gesto. O controlador do #408 permanece
  intacto; uma leitura adiada por edição é recuperada pela sua pendência existente.
- Adicionada jornada real de Controlador + Assistente Federal, escrita pela UI,
  payload recebido pelo SDK, zero leituras/reconstruções da escola alheia durante
  a janela, navegação global com exatamente uma leitura, convergência na mesma
  escola e após reload. Execução pendente na CI, sem afirmar resultado antecipado.
- pgTAP ampliado para executar o trigger e `realtime.send` reais: INSERT, UPDATE,
  DELETE, ausência do conteúdo do registro, lookup de tentativa e fallback sem pai.
  As escritas do teste ficam na transação descartável; não se substituem funções
  do schema Realtime gerenciado. Execução pendente na CI.
- O workflow específico agora publica traces/screenshots e inclui a nova suíte
  temporal. Mantidos limites, invariantes e auditoria de dependências.
- O ciclo fiscal no HEAD inicial d46 terminou **verde** em `37178498478`, sem
  alteração do teste ou limiar de viewport; a homologação `37178498466` também
  passou. O vermelho anterior permanece documentado como intermitência de captura
  ainda sem causa fechada; não há evidência suficiente para alterar CSS do produto.
- Consulta read-only confirmou Production ainda em 58 migrations, última
  `20260930003000`, trigger sem schoolId. Publicação exige a migration candidata.
