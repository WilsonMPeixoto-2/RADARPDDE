# RADAR PDDE — Contratos operacionais de uso real

## Objetivo

Esta especificação transforma os aprendizados de Production em invariantes permanentes para alterações que afetem leitura operacional, persistência, refresh, Realtime, bootstrap e sincronização.

## Cenário obrigatório de validação

O RADAR deve ser validado como sistema vivo, não como execução isolada. Os cenários de prova precisam representar vários controladores autenticados mantendo sessões abertas por períodos prolongados enquanto criam lançamentos, corrigem dados, alteram classificações permitidas, excluem itens elegíveis, resolvem/reanalisam Pendências e recebem mudanças feitas por outras sessões.

Os dados do ambiente de prova devem crescer durante a jornada e possuir volume e distribuição próximos de Production, sem copiar dados pessoais. Deve existir histórico de competências, Pendências ativas e encerradas, notas fiscais, tentativas/contatos e patrimônio suficiente para exercitar dependências históricas da leitura contextual.

## Invariantes

1. Uma falha ou timeout de leitura contextual não pode gerar tempestade de retries por foco, clique, fechamento de modal, visibilitychange ou Realtime.
2. Invalidações recebidas durante edição não podem sobrescrever o que o usuário está digitando; a sessão deve convergir depois que a edição terminar.
3. Invalidações recebidas durante uma leitura em voo não podem ser perdidas.
4. Rajadas de alterações de outras sessões devem ser coalescidas quando puderem ser representadas por uma atualização posterior equivalente.
5. A quantidade de leituras completas deve ser observável por sessão e atribuível ao gatilho que as solicitou.
6. Rerender completo deve ser observável e não pode ocorrer para uma leitura que não foi aplicada com sucesso.
7. Criação, correção, exclusão e reanálise devem convergir entre sessões sem F5.
8. Crescimento de dados não pode degradar silenciosamente latência e payload; p50/p95/p99 e tamanho de resposta devem ser medidos antes de mudanças estruturais na leitura.
9. Qualquer novo caminho de leitura deve ser compatível com rollback sem indisponibilidade e sem exigir reversão destrutiva de dados.
10. Gates de uso real são cumulativos: uma frente nova não pode remover ou ignorar contratos operacionais estabelecidos por incidentes anteriores.

## Baseline pós-incidente #406

Baseline funcional protegido: `24f51fbcce413069287236fa78418465df08d267`.

O hotfix #406 contém retries após falha e coalesce de rajadas Realtime, mas não é evidência suficiente de eficiência estrutural. A frente de hardening deve medir o comportamento pós-hotfix antes de alterar a RPC `read_operational_context`.

## Métricas mínimas

Por sessão e por janela de tempo, registrar ao menos:

- solicitações de refresh por motivo;
- tentativas efetivas de leitura;
- skips por edição, throttle, autenticação e competência inválida;
- pendências criadas e drenadas;
- sucessos, falhas e leituras stale;
- rerenders aplicados;
- duração da última leitura e, em testes de jornada, distribuição de duração;
- Broadcasts recebidos/coalescidos e refreshes resultantes;
- payload e latência da RPC em cenários de volume realista.

## Estratégia de rollout

A ordem obrigatória é observabilidade → reprodução → hipótese única → RED → correção mínima → GREEN → regressão → rollout reversível. Nenhuma refatoração estrutural de RPC entra em Production apenas por reduzir o número nominal de requests em um cenário sintético pequeno.
