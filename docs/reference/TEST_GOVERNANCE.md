# Governança de testes do RADAR PDDE

**Estado:** referência operacional vigente  
**Atualizado em:** 5 de setembro de 2026

## 1. Finalidade

Os testes existem para proteger o comportamento atual do produto. Eles não são uma fonte autônoma de regra de negócio e não podem obrigar o código a reproduzir uma lógica já substituída.

A meta é obter confiança proporcional ao risco, mas a experiência de 05/09/2026 mostrou uma limitação importante: **uma suíte amplamente verde pode continuar deixando defeitos escondidos nas combinações entre fluxos, caminhos paralelos e estados avançados**.

Portanto, a governança de testes passa a ter duas funções diferentes:

1. **certificar regressões conhecidas**;
2. **ajudar a descobrir defeitos desconhecidos por investigação adversarial**.

A segunda função não pode ser substituída pela primeira.

O protocolo completo está em [`../architecture/adversarial-analysis-and-implementation-method.md`](../architecture/adversarial-analysis-and-implementation-method.md).

## 2. Hierarquia de autoridade

Quando houver divergência, usar nesta ordem:

1. comportamento efetivo do produto no SHA/ambiente analisado;
2. código-fonte e cadeia real de execução;
3. Auth, RLS, RPCs, Edge Functions e persistência efetivos do Supabase;
4. contrato funcional vigente e decisões atuais;
5. testes que representam esse contrato atual;
6. documentação corrente reconciliada;
7. documentação histórica, testes antigos e evidências de SHAs anteriores.

Um teste antigo não prevalece sobre código e regra funcional posteriores. Um código atual também não ganha presunção de correção apenas porque o teste correspondente está verde.

## 3. Classificação obrigatória de falha e achado

Toda falha ou divergência relevante deve ser classificada antes de qualquer correção:

- **Defeito de produto:** comportamento atual viola contrato vigente ou prejudica a tarefa real do usuário.
- **Inconsistência de composição:** peças isoladas estão corretas, mas o ponto de entrada real as conecta de forma errada ou contorna uma autoridade.
- **Teste com contrato superado:** expectativa representa regra substituída.
- **Defeito do próprio teste:** fixture, seleção, ordem, timing ou premissa artificial produz falso negativo/positivo.
- **Infraestrutura/ambiente:** runner, rede, navegador, serviço temporário ou ferramenta.
- **Flaky não reproduzível:** falha isolada sem consequência observável e não recorrente.
- **Duplicação arquitetural com risco:** duas autoridades atuais podem divergir, ainda sem consequência reproduzida.
- **Ambiguidade de produto:** duas semânticas plausíveis exigem decisão explícita antes de código.
- **Histórico legítimo isolado:** fixture/migration/fallback preserva compatibilidade e não representa escrita atual.
- **Hipótese ainda não reproduzida:** há indício, mas evidência insuficiente para hotfix.

Não transformar duplicação, ambiguidade ou hipótese em bug por ansiedade de fechar lista. Também não omitir ambiguidade só porque “não é bug”: ela precisa ser comunicada ao responsável pelo produto.

## 4. Estratégia proporcional mínima

Para mudança funcional comum, validar pelo menos:

1. a função aparece para quem deve utilizá-la e é encontrável;
2. a ação é compreensível e executável;
3. o ponto de entrada real alcança a autoridade correta;
4. uma escrita realmente persiste quando a ação grava dados;
5. a informação reaparece coerente após releitura/reload quando material;
6. perfil indevido é bloqueado quando autorização é relevante;
7. a tela posterior reflete corretamente a ação;
8. nenhuma autoridade paralela conhecida produz resultado concorrente.

Isso inclui experiência do usuário, integridade, feedback, navegação e recuperação de contexto.

## 5. Cobertura de sequência, não apenas de função

Para entidades com ciclo de vida, testes não podem ficar limitados a `criar → editar → excluir`.

Quando houver estado avançado em outro subsistema, incluir proporcionalmente:

```text
criar
→ avançar em outro serviço/domínio
→ voltar à origem
→ editar/salvar novamente
→ persistir
→ reload
→ confirmar que o estado avançado sobreviveu
```

Esse padrão deve ser considerado especialmente em:

- Nota Fiscal ↔ Inventário;
- Pendência ↔ novo envio/reanálise;
- consolidação ↔ retificação;
- Assessoria ↔ edição ordinária;
- gestão de equipe ↔ redistribuição/desativação;
- competência ↔ navegação/transversalidade.

## 6. Teste de composição pelo ponto de entrada real

Se uma regra depende de uma autoridade intermediária, o teste deve começar no mesmo ponto usado pelo usuário.

Exemplo:

```text
regra: auditoria persistida antes do download

insuficiente:
testar apenas a função de auditoria

necessário:
clicar no botão real
→ fazer a auditoria inicial falhar
→ confirmar que nenhum download ocorreu
```

O mesmo vale para closures privadas, wrappers, atalhos, APIs expostas em `window`, callbacks, renderers e extensões dinâmicas.

## 7. Testes diferenciais entre superfícies

Quando várias superfícies exibem o mesmo conceito, usar o mesmo registro para comparar:

- status;
- próximo ator;
- data-base;
- idade;
- ação semântica;
- identidade/vínculo;
- estado após reload.

Diferença editorial é permitida. Diferença semântica precisa ser explicitamente intencional ou classificada como achado.

## 8. Quantidade de testes

Regra padrão:

- reutilizar testes existentes antes de criar novos;
- executar primeiro o cenário diretamente afetado;
- usar casos positivos/negativos que respondam ao risco real;
- criar probe focal quando ele é mais barato e mais informativo que uma suíte inteira;
- não repetir suites já aprovadas se nada relevante mudou;
- não criar infraestrutura paralela sem necessidade;
- em auditoria ampla, preservar inventário/evidências/probes para que sessões futuras não refaçam a mesma varredura.

Suite completa, múltiplos navegadores, backup/restauração, Lighthouse e demais gates especializados continuam necessários quando o risco/escopo exigir. **Eles são gate, não substituto da investigação adversarial.**

## 9. Teste superado

Quando uma regra mudar, a mesma entrega deve registrar:

```text
regra anterior → regra vigente → código afetado → testes afetados
```

O teste antigo deve ser atualizado ou removido. Se estiver embutido em suíte histórica extensa, pode ser temporariamente excluído por título exato, desde que:

- razão esteja documentada;
- exista teste atual cobrindo sucessor;
- exclusão não esconda outro comportamento;
- produto não seja alterado para satisfazer expectativa superada.

Além disso, **títulos de testes ativos devem descrever a regra atual**. Assertion útil com título antigo continua sendo documentação enganosa.

## 10. Fixtures, mocks e estados históricos

Toda fixture relevante deve deixar claro se representa:

- novo contrato atual;
- legado/migração;
- estado adversarial deliberadamente inválido;
- cenário sintético de camada isolada.

Não remover fixture antiga apenas porque seu estado não pode mais ser criado hoje. Primeiro verificar se ela testa compatibilidade/normalização. Do mesmo modo, não usar fixture histórica para inferir permissão de escrita atual.

Mocks devem ser avaliados pelo que retiram da cadeia. Se o mock elimina justamente persistence/handler/composição onde o defeito pode existir, o teste não certifica aquela camada.

## 11. SQL/RPC em testes

Ao associar teste a RPC:

1. localizar todas as definições da mesma assinatura;
2. identificar a última vigente na baseline;
3. associar teste sucessor correspondente;
4. não deixar matriz apontar somente para migration superada;
5. preservar migrations históricas sem tratá-las como implementação atual.

## 12. Casos reconciliados

### Reanálise de pendências

Regra vigente: Controlador, Assistente de Verbas Federais e `technical_admin` podem reanalisar; Gestão SME e Inventário permanecem sem a mutação.

Proteção vigente: `tests/e2e/pendency-reanalysis-auth.spec.js` e políticas atuais de acesso/Supabase.

Cenário histórico que afirmava “somente Controlador” não orienta correção atual.

### Administrador técnico em simulação visual

`technical_admin` preserva identidade e autoridade autenticadas durante simulação visual.

### Competência mensal

`RadarCompetenceContext` é fonte canônica. Testes não devem manipular `activeCompetenciaKey` diretamente para simular mudança de mês, salvo fixture explicitamente isolada para outra finalidade e sem pretensão de certificar a navegação real.

### Auditoria

Coleções não devem ser presumidas cronológicas por identificador. Localizar eventos por identidade/contexto/timestamp explícito.

### Reabertura de Pendência

Regra vigente aceita `Resolvida` ou `Cancelada` quando autorizado. Títulos que ainda digam “somente resolvida” são obsoletos, mesmo que a assertion específica continue válida.

## 13. Critério de encerramento

Uma rodada termina quando:

- fluxos afetados foram comprovados proporcionalmente ao risco;
- falhas/achados foram classificados;
- defeitos reais encontrados foram corrigidos ou registrados como abertos;
- testes superados não possuem poder de veto/documentação enganosa;
- caminhos paralelos relevantes foram procurados;
- estados avançados relevantes foram exercitados;
- composição real foi testada quando necessária;
- não existe evidência concreta de regressão relevante não tratada.

Antes de declarar “fechamento confirmado”, registrar:

> **O que foi tentado para provar que ainda estava errado?**

Sem essa resposta, a conclusão máxima permitida é: **“os gates conhecidos passaram”.**