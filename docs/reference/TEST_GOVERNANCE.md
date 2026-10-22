# Governança de testes do RADAR PDDE

**Estado:** referência operacional vigente  
**Atualizado em:** 22 de outubro de 2026

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

Toda falha relevante deve receber diagnóstico explícito antes de qualquer correção.
A classificação pode ser revista quando surgirem novas evidências:

- **Defeito de produto:** comportamento atual viola o contrato vigente ou prejudica o usuário. Corrigir o produto e manter regressão adequada.
- **Teste com contrato superado:** a expectativa representa uma regra substituída. Atualizar, remover ou retirar o teste da execução; nunca reverter o produto para satisfazê-lo.
- **Defeito do próprio teste:** fixture, seleção de registro, ordem, timing ou premissa artificial produz falso negativo. Corrigir o teste.
- **Infraestrutura/ambiente:** falha de runner, rede, navegador, serviço temporário ou ferramenta. Não tratar como defeito funcional sem reprodução no produto.
- **Flaky não reproduzível:** falha isolada que passa na repetição já prevista pela própria suíte e não apresenta consequência observável. Registrar apenas se ganhar recorrência.

- **Resultado inconclusivo:** não há evidência suficiente para distinguir produto,
  teste, fixture, ambiente ou interleaving. Preservar o resultado e indicar a
  contraprova necessária; não anunciar sucesso ou regressão nem relaxar a asserção.

O registro da frente deve ligar comportamento esperado, fonte do contrato,
evidência observável e decisão de alterar produto/teste ou continuar investigando.
Mudar uma expectativa exige explicar por que a anterior não representa mais a
jornada vigente. Comparações de performance exigem baseline e candidato completos
e comparáveis; preparação incompleta de um lado invalida os deltas daquele run.

### Evidências de CI e falhas externas (caso GHCR, 18/10/2026)

Um job vermelho por limite do registry Docker não autoriza modificar comportamento, remover gate, desabilitar typegen, atualizar indiscriminadamente dependências nem declarar aprovação de steps pulados. Registrar **SHA + run + job + passo + erro**, distinguir causa externa de falha SQL/RLS, e exigir contraprova na execução que volta a passar. A solução validada no PR #449 usa GHCR exclusivamente na geração local de tipos, documentada no [runbook de CI](../runbooks/CI_TOOLCHAIN_REGISTRY.md). Não generalizar o workaround para outras operações.

**Contraprova obrigatória para contratos de banco:** um pgTAP vermelho não prova, isoladamente, que uma atualização do tooling regrediu o sistema. Em 18/10, os testes 32/33 de service_role reprovaram a CLI 2.121.0, porém consultas somente de leitura constataram que seus resultados coincidiam com os grants efetivos de Production e contrariavam a expectativa do teste. Antes de alterar política, grants, asserção ou bloquear uma versão definitivamente, confrontar **ACL efetiva do banco correto + migration versionada + contrato funcional + bootstrap real**. A [auditoria datada](../audits/2026-10-18-supabase-cli-rls-parity.md) registra as evidências e hipóteses em aberto; ela não autoriza corrigir SQL às cegas.

Um teste E2E que falha em geometria ou timing e passa no retry deve manter a falha inicial rastreável. Passagem posterior não prova inexistência de defeito, assim como a presença do controle no DOM não prova usabilidade ou acionamento efetivo. Separar **resultado automatizado**, **causa classificada** e **homologação outside-in efetivamente realizada**. Nunca rotular skip ou não executado como green.

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

Para UI, teste automatizado é evidência de comportamento, não substituto de julgamento. Um teste pode confirmar que um botão existe e é clicável enquanto a tela continua ruim para um ser humano. Quando a mudança for percebida pelo usuário, combinar a automação com a leitura humana outside-in definida em FRONTEND_USER_VALIDATION_GATE.md.

## 5. Quantidade de testes

Regra padrão:

- reutilizar testes existentes antes de criar novos;
- executar primeiro o cenário diretamente afetado;
- usar um caso positivo e, quando a permissão for material, um caso negativo;
- para escrita, verificar persistência/releitura apenas onde ela comprova risco real;
- executar um gate base proporcional ao escopo;
- não repetir suites já aprovadas se o código coberto por elas não mudou;
- diante de mudança legítima do gerador (por exemplo, TypeScript da CLI Supabase 2.121), comparar **contrato semântico** e manter testes capazes de reprovar mudanças reais de campo, tipo, opcionalidade ou autorização. Teste antigo não deve exigir igualdade cosmética se isso não é invariância de produto;
- atualização **somente documental** que reconcilia estado datado deve reaproveitar evidências por SHA/run e os checks automáticos da branch quando houver, sem solicitar manualmente um novo ciclo funcional/CRUD ou uma repetição geral de testes só para mudar o texto;
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
6. mudanças de fonte, antialiasing ou plataforma devem ser classificadas antes de aceitar novo baseline;
7. snapshot verde não prova hierarquia, clareza ou compreensão humana;
8. estado vazio não certifica layout populado; usar dados representativos quando densidade ou comprimento puderem alterar composição;
9. toda captura usada como evidência material deve ser efetivamente aberta e inspecionada;
10. defeito visível como clipping, sobreposição, overflow ou ação materialmente escondida bloqueia conclusão mesmo que o diff visual esteja estável em relação a um golden antigo.

## 10. Locks e paralelismo

Os locks por recurso introduzidos no Playwright 1.63 seguem disponíveis na versão atual **1.64.1**. O RADAR os utiliza somente onde testes compartilham estado material.

- não elevar paralelismo global de suíte que depende de estado compartilhado;
- serializar o recurso, não o repositório inteiro;
- manter cenários puramente visuais/isolados paralelos quando seguro;
- nomear o lock pelo recurso compartilhado.

## 11. Trace enriquecido

Configs Playwright relevantes preservam screenshots, DOM snapshots, ARIA snapshots, screen snapshots e sources. Nas suítes grandes, a gravação rica ocorre em `on-first-retry` para evitar custo permanente de CPU/memória; o projeto visual pequeno pode usar `retain-on-failure-and-retries`. Trace é instrumento de diagnóstico; não autoriza alterar regra, tolerância ou CSS sem causa reproduzida.

**Oportunidade ainda não implementada:** em diagnóstico pontual da issue #460,
avaliar captura do trace da **primeira falha** com configuração separada e
fixtures isoladas. A política atual das suítes grandes é `on-first-retry`
por custo; não afirmar que já preserva todos os instantes da primeira
execução, nem alterar globalmente trace, retry, timeout, tolerância ou
snapshots para satisfazer um job.

## 12. Navegador MCP para agentes

Playwright MCP pode ser usado para reprodução interativa e homologação navegada. `playwright` usa navegador isolado; `playwright-session` reutiliza sessão existente quando SSO/2FA/cookies são parte material da prova. O MCP não ganha autoridade de negócio nem autoriza escrita em Production por inferência.
