# Revisão do backport operacional #408

**Classe:** evidência temporal da revisão de 03/10/2026; não substitui regras canônicas.

## Estado efetivamente conferido

- PR #408 aberto, não Draft, base `62fe000c7253bb97a31091f1c7dc33407906d554`.
- HEAD inicialmente revisado: `d863f86450caec9746f6eb9f836d877f7ad81034`.
- 35 checks nesse HEAD: 33 aprovados, dois Previews condicionais pulados, nenhum falhou.
- Log de Prontidão completa: 1.247 unitários e oito integrações aprovados, sem falhas/skips.
- Homologação pré-production: [run 37159669356](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/37159669356).
- As revisões publicadas referem-se a versões anteriores. Os cenários apontados foram confrontados com o código atual e com 66 controles locais aprovados.

O recorte é adequado: #408 contém as correções do controlador de refresh e do escopo fiscal, com governança da auditoria de dependências. Não incorpora migration, proveniência do Broadcast, throttle remoto experimental, preservação lógica completa de foco ou CSS anti-flicker do #407. O custo de observadores continua no #407.

## Nova regressão confirmada antes da alteração

Os testes existentes mantinham a primeira leitura em voo ao entregar o segundo sinal da retomada. A revisão testou também a conclusão da leitura entre os sinais:

1. `hidden + blur`;
2. `visible`, leitura aplicada e render concluído;
3. `focus` da mesma retomada, sem alteração remota;
4. avanço do relógio além dos 30 segundos de cooldown.

A ordem inversa (`focus`, resposta concluída, `visibilitychange`) produz o mesmo resultado.

| Variante | Leituras | Renders | Estado pendente final |
|---|---:|---:|---|
| main `62fe000c` | 1 | 1 | sim, sem timer autônomo |
| #408 `d863f864` | 2 | 2 | não |
| Correção desta revisão | 1 | 1 | não |

O estado retornado pelas duas leituras era idêntico. A regressão foi introduzida pela nova drenagem automática de cooldown: ela também agendava oportunidades de foco sem necessidade de reconciliação. Não há evidência aqui da frequência dessa intercalação em Production; a prova é determinística sobre o instalador e controlador reais com relógio/repositório controlados.

## Correção e controles

A autoridade continua no mesmo controlador. Dentro do cooldown, uma oportunidade sem pendência e sem nova suspensão não cria trabalho futuro. `flushPending` conserva a pendência até o ponto já existente em que `refresh` inicia a leitura; isso permite distinguir recuperação necessária de um sinal redundante. Não foi acrescentado outro timer, controller ou wrapper.

Novo teste: `tests/unit/operational-resume-completion.test.js`.

- RED no `d863f864`: duas ordens com **duas leituras/renders quando se esperava uma**; controle de nova suspensão aprovado.
- GREEN: ambas as ordens permanecem em uma leitura/render após 62 segundos simulados.
- Controle: uma nova suspensão dentro do cooldown, com alteração canônica e sem Broadcast, converge automaticamente para a nova revisão.
- Controles relacionados: **69 aprovados**, zero falhas/skips, incluindo invalidação em voo, stale/falha, retry Realtime, timer durante retry, edição, rollback fiscal concorrente e auditoria de dependências.
- Suíte unitária completa local: **1.250 aprovados**, zero falhas/skips.
- `git diff --check` aprovado.

As dependências locais foram reutilizadas de uma instalação com `package.json` e `package-lock.json` idênticos; não houve mudança de dependências.

## Parecer e limites

A direção do backport é aprovada. O HEAD `d863f864` não deve ser confundido com a correção acima: seus checks verdes não detectaram esta nova borda. A recomendação de merge do candidato corrigido depende dos checks no novo SHA, consultáveis no PR #408; resultados antigos não certificam automaticamente uma alteração posterior.

A exceção de tooling aceita um advisory conhecido na cadeia Stylelint e não significa ausência de vulnerabilidades em todas as dependências. Runtime e advisories fora da política continuam bloqueantes. Nenhuma homologação cloud nova ou escrita em Production foi executada nesta revisão.

Os defeitos amplos do #407 permanecem separados. Depois da integração do #408, incorporar a implementação final e seus testes ao #407 sem sobrescrever as correções posteriores de concorrência/retry ao sincronizar as branches. A prova sustentada do #407 não é evidência de custo do #408.
