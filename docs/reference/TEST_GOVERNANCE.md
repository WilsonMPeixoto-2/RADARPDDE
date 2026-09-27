# Governança de testes do RADAR PDDE

**Estado:** referência operacional vigente  
**Atualizado em:** 26 de setembro de 2026

## 1. Finalidade

Os testes existem para proteger o comportamento atual do produto. Eles não são uma fonte autônoma de regra de negócio e não podem obrigar o código a reproduzir uma lógica já substituída.

A meta é obter confiança proporcional ao risco, não maximizar a quantidade de execuções nem manter o projeto indefinidamente em estado de “quase concluído”.

## 2. Hierarquia de autoridade

Quando houver divergência, usar nesta ordem:

1. código-fonte atual do SHA analisado e comportamento efetivo do ambiente correspondente;
2. Auth, RLS, RPCs, Edge Functions e persistência efetivos do Supabase;
3. contrato funcional vigente e decisões atuais;
4. testes que representam esse contrato atual;
5. documentação histórica, testes antigos e evidências de SHAs anteriores.

Um teste antigo não prevalece sobre código e regra funcional posteriores.

## 3. Classificação obrigatória de falha

Toda falha relevante deve ser classificada uma única vez antes de qualquer correção:

- **Defeito de produto:** comportamento atual viola o contrato vigente ou prejudica o usuário. Corrigir o produto e manter regressão adequada.
- **Teste com contrato superado:** a expectativa representa uma regra substituída. Atualizar, remover ou retirar o teste da execução; nunca reverter o produto para satisfazê-lo.
- **Defeito do próprio teste:** fixture, seleção de registro, ordem, timing ou premissa artificial produz falso negativo. Corrigir o teste.
- **Infraestrutura/ambiente:** falha de runner, rede, navegador, serviço temporário ou ferramenta. Não tratar como defeito funcional sem reprodução no produto.
- **Flaky não reproduzível:** falha isolada que passa na repetição já prevista pela própria suíte e não apresenta consequência observável. Registrar apenas se ganhar recorrência.

## 4. Estratégia proporcional

Para uma mudança funcional comum, validar somente o necessário para responder às perguntas abaixo:

1. a função aparece para quem deve utilizá-la e é encontrável;
2. a ação é compreensível e pode ser executada sem bloqueio de interface;
3. o backend/serviço correto é alcançado;
4. uma escrita realmente persiste quando a ação grava dados;
5. a informação reaparece de forma coerente após atualização/releitura quando isso for material;
6. um perfil indevido é bloqueado quando a autorização for parte relevante do risco;
7. a tela posterior reflete corretamente a ação realizada.

Isso inclui experiência do usuário: visualização, encontrabilidade, legibilidade, coerência de dados, feedback, navegação e recuperação de contexto.

## 5. Quantidade de testes

Regra padrão:

- reutilizar testes existentes antes de criar novos;
- executar primeiro o cenário diretamente afetado;
- usar um caso positivo e, quando a permissão for material, um caso negativo;
- para escrita, verificar persistência/releitura apenas onde ela comprova risco real;
- executar um gate base proporcional ao escopo;
- não repetir suites já aprovadas se o código coberto por elas não mudou;
- não criar infraestrutura de teste nova sem risco concreto que a justifique;
- não iniciar uma segunda rodada integral apenas porque um job não relacionado ficou vermelho.

Suite completa, múltiplos navegadores, backup/restauração, Lighthouse e demais gates especializados são usados quando a mudança realmente toca essas áreas, em release relevante ou em auditoria expressamente autorizada. Não são checklist automático para toda alteração pequena.

## 6. Teste superado

Quando uma regra mudar, a mesma entrega deve registrar:

```text
regra anterior → regra vigente → código afetado → testes afetados
```

O teste antigo deve ser atualizado ou removido. Se a remoção imediata for desproporcional porque o caso está embutido em uma suíte histórica muito extensa, ele pode ser temporariamente excluído da execução por título exato, desde que:

- a razão esteja documentada;
- exista teste atual cobrindo o contrato sucessor;
- a exclusão não esconda outro comportamento do mesmo fluxo;
- o produto não seja alterado para preservar a expectativa superada.

## 7. Casos reconciliados em 9 de agosto de 2026

### Reanálise de pendências

Regra superada: somente Controlador reanalisava pendência aguardando.

Regra vigente: Controlador, Assistente de Verbas Federais e `technical_admin` podem reanalisar; Gestão SME e Inventário permanecem sem a mutação.

Proteção vigente: `tests/e2e/pendency-reanalysis-auth.spec.js` e políticas atuais de acesso/Supabase.

O cenário histórico com título **“aba Pendências só expõe reanálise documental aguardando ao Controlador”** não representa mais o produto e não deve bloquear CI nem orientar correção funcional.

### Administrador técnico em simulação visual

Regra vigente: `technical_admin` preserva a identidade e a autoridade autenticadas mesmo quando escolhe um dos quatro perfis funcionais para simular a apresentação da interface. A simulação altera o recorte visual, não reduz a autoridade real nem troca o JWT.

### Competência mensal

Regra vigente: `RadarCompetenceContext` é a fonte canônica. Testes não devem manipular `activeCompetenciaKey` diretamente para simular mudança de mês; devem selecionar a competência pelo contexto global.

### Auditoria

Coleções retornadas por repositório não devem ser presumidas cronológicas quando a consulta está ordenada por identificador. Testes que precisam localizar o evento de uma ação devem usar identidade do ator, contexto ou timestamp explícito, e não `reverse()` sobre UUIDs.

## 8. Critério de encerramento

Uma rodada de validação termina quando:

- os fluxos afetados foram comprovados em nível proporcional ao risco;
- eventuais falhas foram classificadas;
- defeitos reais encontrados foram corrigidos;
- testes superados não permanecem com poder de veto sobre o produto;
- não existe evidência concreta de regressão relevante ao usuário.

Ausência de cobertura máxima, existência de teste histórico ou um job não relacionado ao escopo não transforma automaticamente o sistema em “inacabado”.

## 9. Regressão visual canônica

O RADAR mantém um conjunto pequeno de baselines visuais críticos em Playwright. Eles protegem composição visual estável, não cada pixel de cada tela.

Baselines vigentes: Dashboard, Pendências, Prontuário, modal de Despesa a identificar, drawer/feedback de Despesa a identificar e modal de reanálise.

Regras:

1. o gate canônico roda em Chromium/Linux, viewport 1440×900;
2. `toHaveScreenshot()` complementa a jornada real; não substitui navegação, persistência ou inspeção humana quando material;
3. golden só pode ser atualizado quando a mudança visual é intencional e o diff foi revisado;
4. não aumentar tolerância apenas para obter verde;
5. conteúdo efêmero deve ser sincronizado/capturado dentro do seu estado real, não artificialmente congelado para mascarar corrida;
6. mudanças de fonte, antialiasing ou plataforma devem ser classificadas antes de aceitar novo baseline.

## 10. Locks e paralelismo

Playwright 1.63 permite locks por recurso. O RADAR usa locks somente onde testes compartilham estado material.

- não elevar paralelismo global de suíte que depende de estado compartilhado;
- serializar o recurso, não o repositório inteiro;
- manter cenários puramente visuais/isolados paralelos quando seguro;
- nomear o lock pelo recurso compartilhado.

## 11. Trace enriquecido

Configs Playwright relevantes preservam screenshots, DOM snapshots, ARIA snapshots, screen snapshots e sources. Nas suítes grandes, a gravação rica ocorre em `on-first-retry` para evitar custo permanente de CPU/memória; o projeto visual pequeno pode usar `retain-on-failure-and-retries`. Trace é instrumento de diagnóstico; não autoriza alterar regra, tolerância ou CSS sem causa reproduzida.

## 12. Navegador MCP para agentes

Playwright MCP pode ser usado para reprodução interativa e homologação navegada. `playwright` usa navegador isolado; `playwright-session` reutiliza sessão existente quando SSO/2FA/cookies são parte material da prova. O MCP não ganha autoridade de negócio nem autoriza escrita em Production por inferência.
