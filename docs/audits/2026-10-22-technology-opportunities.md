# Melhorias úteis após a modernização do RADAR

**Classe:** estudo de oportunidades datado; não é especificação aprovada nem handoff de implementação.  
**Data:** 22/10/2026. **Base inspecionada:** `7141489e084691722a1bef814bea0c9c1c5f8023`, após #472/#473.  
**Pedido:** identificar capacidades tecnológicas úteis aos objetivos atuais, sem criar funcionalidades apenas para empregar uma tecnologia.

## 1. Conclusão

Existem oportunidades, mas não há fundamento para uma nova troca de arquitetura. O melhor uso imediato da base atualizada é tornar duas jornadas existentes mais previsíveis: **abrir/recarregar a escola e conseguir operar**; **salvar uma alteração e continuar trabalhando enquanto outra sessão converge**.

Há novidades concretas nos instrumentos: Explorer/Notebooks e consultas de logs/saúde do Supabase; vídeo com FPS configurável no Playwright 1.64. Elas podem ajudar a localizar o custo e a instabilidade antes de modificar a aplicação. Não são, por si, correções de lentidão. Busca em Web Worker está disponível na biblioteca instalada, mas sua adoção depende de demonstrar custo material da busca.

Parte dos ganhos já existe. A busca por palavras, o posicionamento adaptativo dos menus e as transições de navegação estão no código. PostgreSQL 17.11 agrega correções de segurança e confiabilidade. Não classificar essas atualizações como simples burocracia, nem prometer novas funcionalidades de uma atualização menor do banco.

## 2. Método e limites

Foram confrontados AGENTS, modelo canônico, catálogo de superfícies, estado atual, método/gate de frontend, validade documental, runbook de tooling, observabilidade Vercel e avaliação visual histórica de 27/09. O código efetivo foi confrontado com releases e documentação dos fornecedores. #446/#447 e #460 foram consultados diretamente no GitHub.

Esta rodada **não executou benchmark novo, jornada autenticada ou alteração de Production**. Não instalou dependências, não habilitou recursos no projeto hospedado e não modificou runtime, SQL, Auth/RLS ou regras. Observações estáticas abaixo identificam candidatos; não comprovam atraso percebido nem prometem percentual de ganho. As homologações anteriores pertencem aos seus respectivos SHAs.

## 3. O que mudou e o que já é aproveitado

| Recurso | Fato verificado | Consequência para o RADAR |
|---|---|---|
| PostgreSQL 17.6 → 17.11, build Supabase 17.11.0.003 | Release menor de correções; novas funcionalidades estruturais do PostgreSQL 17 precedem esse upgrade | Ganho de manutenção/segurança já existe. Não atribuir JSON_TABLE, recursos do PostgreSQL 18, novo mecanismo de I/O ou aceleração automática da UI a esta troca |
| Supabase SDK 2.118.0 | Release melhora tipagem de campos computados/RPC sem argumentos e adiciona content-encoding para uploads | Tipos foram reconciliados no #472. Upload comprimido não justifica criar armazenamento documental novo: o domínio atual trabalha com referências documentais/Drive |
| Supabase CLI 2.121.0 | Melhorias de stack, logs do gateway local e saída estruturada; `supabase notebooks --help` confirma pull/push | Facilita reprodução e continuidade. Não altera a versão ou desempenho do servidor hospedado por atualizar o pacote local |
| Explorer/Notebooks e Health Advisors | Anunciados na plataforma em 02/10; SQL, logs e notas podem compor uma investigação reproduzível | Novidade de plataforma útil à operação técnica, independente do upgrade do PostgreSQL. O usuário informou ativação do Explorer; não foi aberta uma sessão de Studio nesta análise |
| Fuse.js 7.5.0 | Release corrige ranking, normalização e seleção top-N em empates. `useTokenSearch: true`, `tokenMatch: 'all'` já estão na aplicação | Há aproveitamento funcional real. Não propor novamente busca por múltiplas palavras como recurso ausente |
| Floating UI 1.8.0 | Aplicação já usa `offset`, `flip`, `shift`, `size` e `autoUpdate` | Menus de busca, perfil e alertas já recebem posicionamento adaptativo; isso não comprova que todo modal/drawer esteja coberto |
| Playwright 1.64.1 | 1.64 adiciona FPS configurável a vídeos; 1.64.1 corrige abortos em redirecionamentos CORS sob interceptação | Pode melhorar o instrumento de inspeção. Trace, screenshots e Long Tasks já existem no RADAR; reutilizá-los |
| Axe, MSW 3, TypeScript 7, ESLint/Knip/dependency-cruiser | Ferramentas de análise, testes e tipagem; não são renderizadores da aplicação | Protegem mudanças e ajudam a encontrar falhas. Não justificam migração ampla de linguagem/framework nem ganho de fluidez presumido |
| Vercel Analytics/Speed Insights | Integração vanilla já publicada pelo #415 | Aproveitar dados de campo quando houver amostra suficiente; não adicionar pacote duplicado nem confundir tráfego de CI com uso humano |

## 4. Oportunidades priorizadas

### A. Diagnóstico reproduzível da jornada, com retorno direto ao trabalho do Controlador

**Objetivo humano:** abrir a escola, reconhecer o estado verdadeiro, conseguir agir e continuar após salvar.

**Capacidades aproveitáveis:** Notebooks para consultas agregadas de logs/SQL e notas; Health Advisors para sinais de falha; Playwright com vídeo configurável e instrumentos já existentes de rede/Long Tasks. São complementares: banco não mede bloqueio de JavaScript, vídeo não mede commit, HTTP 200 não prova UI pronta.

**Lacuna atual:** Caso A da #460 ainda não distingue conclusivamente produto de espera incorreta de hidratação. #446/#447 preservam sinais de cópias, debounce e fallback, mas não homologam uma correção. Não assumir que todos são a mesma causa.

**Experimento proposto, delimitado:**

1. Na main atual, escolher abertura/reload do Prontuário e gravação de NF com observador em Dashboard; mesma massa representativa, competência, perfis e viewport em controle/candidato.
2. Reutilizar `tests/support/performance-journey-observer.js`, `operational-session-observer.js`, rastreamento de leituras e diagnóstico de escrita. Acrescentar somente os intervalos ausentes entre chegada da resposta, aplicação de estado, render e interação disponível.
3. Registrar leitura global/escolar, payload, início/fim de RPC, tempo de cópia/aplicação, tarefas longas, render, prontidão e convergência enquanto o trabalho acontece. Distinguir resposta antiga cancelada de falha funcional.
4. Guardar consultas, janela e conclusões em um notebook versionável; somente consultas de leitura/estatísticas agregadas, sem credenciais ou registros pessoais no Git. Não resetar estatísticas de Production para fabricar baseline. Não ativar EXPLAIN público ou cancelar sessões pela interface de Connections.
5. Usar vídeos com maior FPS apenas em capturas curtas onde houver dúvida visual; comparar o custo da gravação com execução sem captura antes de usar tempos como resultado de performance. Não elevar gravação de todas as suítes automaticamente.

**Critério de decisão:** terminar com a etapa dominante localizada e uma hipótese refutável. Se o atraso for espera do teste, corrigir o instrumento. Se não houver custo material reproduzido, não abrir refatoração. Só então selecionar uma mudança do runtime; o notebook não vira projeto paralelo interminável de observabilidade.

### B. Reduzir trabalho do navegador no caminho de aplicação de estado

**Evidência estática atual:** `StatePort.captureEntities()` clona o retorno de `readMemoryKeys`; o leitor padrão já clona coleções selecionadas. `applyEntities()` copia entidades, projeta estado, copia a projeção e entrega/retorna outras cópias. `cloneValue` já prefere `structuredClone`.

**Possível benefício:** menor bloqueio após salvar/receber alteração. **Não está medido nesta rodada.** Algumas cópias sustentam isolamento, rollback e concorrência; contá-las não autoriza removê-las.

**Direção condicionada à medição A:** reduzir a quantidade de estado copiado ou a repetição demonstradamente desnecessária dentro da autoridade atual, preservando aplicação atômica, exclusões e resposta autoritativa. Trocar apenas JSON clone por structuredClone não é novidade pendente. Mover tudo para Worker ou acrescentar timers antes dessa prova pode apenas deslocar custo e criar novos estados assíncronos.

**Prova mínima para futura alteração:** mesmo resultado remoto/local/DOM/reload; alteração durante leitura; erro e rollback; resposta antiga após escrita nova; outras escolas preservadas; CPU/tempo até interação menores no mesmo cenário. Reutilizar caracterizações úteis de #447 depois de reconciliar com a main, sem promover comportamentos históricos a contratos imutáveis.

### C. Busca que acompanha o crescimento sem travar a digitação

**Já entregue:** busca por palavras, tolerância a erros, catálogo derivado da sessão e oito resultados. O upgrade 7.5 corrige seleção top-N em empates, pertinente ao limite já usado.

**Possibilidade identificada no código:** `global-search.js:search()` chama `rebuildEngine()` a cada consulta; isso recria catálogo e índice mesmo quando somente o texto digitado mudou. Não foi demonstrado que esse custo incomode o usuário na massa atual.

**Ordem de investigação:** medir construção do catálogo/índice e pesquisa separadamente, durante digitação real. Se reconstrução dominar, avaliar reutilização do índice com invalidação pelas mudanças já existentes, sem cache persistente ou autoridade paralela. Se a busca em si continuar cara, `fuse.js/worker` existe no pacote 7.5.0 e pode ser experimentado em branch isolada.

**Não adotar Worker automaticamente:** a documentação recomenda o caminho simples para catálogos pequenos. Trabalhadores exigem serialização, ciclo de vida, exclusões/atualizações, limpeza no logout e rejeição de resultados antigos. Comparar exatidão e ordem dos resultados, teclado/foco, troca de sessão/contexto e tempo até a lista útil. Não transformar 163 escolas em justificativa automática para busca semântica ou pgvector.

### D. Acabamento operacional com os recursos visuais existentes

**Objetivo:** ler escola/documento/competência e alcançar a ação sem cortes, salto de foco ou perda de contexto.

Floating UI, axe e Playwright podem apoiar o refinamento dos componentes existentes. O posicionamento dos três menus superiores já usa a biblioteca; um drawer de Pendências não é automaticamente o mesmo componente. Reproduzir o residual PROD-UX-08 no layout atual antes de trocar posicionamento/CSS. O #438 já corrigiu rodapés e ações tardias; não reapresentar essas entregas como ausentes.

Para próximos ajustes de componente, combinar inspeção humana, zoom 200%, teclado, retorno de foco, texto longo e estados vazio/erro/salvando. Uma galeria pequena dos **renderizadores reais** pode apoiar a revisão, se houver repetição suficiente; não começar por instalar Storybook ou reescrever o produto em React. A avaliação `docs/evidence/2026-09-27-pr378-tooling/DESIGN_TOOLING.md` permanece referência datada, não lista de compras.

### E. Usar os tipos novos na fronteira que vier a ser alterada

Hoje `tsconfig.database-types.json` verifica o arquivo gerado; não tipa integralmente `supabase-repository.js`. Há oportunidade de conferir argumentos e retornos de RPC com contratos/JSDoc localizados quando uma fronteira for alterada, aproveitando SDK/TypeScript atuais.

Isso pode antecipar incompatibilidades antes do navegador, mas não substitui RLS, validação runtime nem comportamento das operações; RPCs com retorno `Json` não ganham estrutura de domínio completa automaticamente. Não iniciar uma migração geral para TypeScript apenas por haver compilador novo.

## 5. Novidades que não justificam adoção agora

- WebMCP experimental do Playwright 1.64: permite testar ferramentas registradas pela página. O RADAR não precisa expor novas ações a agentes para validar sua interface humana. Não confundir acesso ao protocolo com cobertura de UX.
- OrioleDB/configurações alternativas do stack local: novidade da CLI não demonstra benefício ao workload institucional nem paridade com o banco hospedado. Nenhuma troca de engine proposta.
- Upload com content-encoding do SDK: requer um caso real de armazenamento/upload; não criar essa funcionalidade para exercitar a API.
- Filas, pg_cron, materialized views, índices novos, busca vetorial ou IA documental: nenhuma necessidade foi comprovada nesta análise. Alguns desses recursos são antigos e não surgiram no upgrade 17.6→17.11.
- Novas animações: View Transitions e reduced-motion já existem. Refresh silencioso não deve reapresentar a tela; não usar animação para esconder atraso.
- Planos pagos, novo framework ou infraestrutura adicional: sem justificativa atual para esta avaliação.

## 6. Decisão proposta e fronteira de continuidade

Priorizar **A para localizar o custo**, seguida de **uma única correção B ou de prontidão**, conforme a causa observada. C é uma oportunidade localizada, de prioridade dependente da medição. D pertence a uma jornada visual delimitada. E acompanha uma alteração material na fronteira de dados.

O resultado desejado não é instalar mais tecnologias: é o Controlador conseguir abrir, editar, salvar e seguir trabalhando com menos espera e contexto íntegro. Para cada experimento exigir: problema/objetivo, caminho atual, hipótese, controle, medida antes/depois e resultado funcional. Não declarar ganho com CI verde, menor payload isolado ou benchmark de outra baseline.

Este estudo não muda prioridades suspensas (indicadores mensais), não faz merge dos diagnósticos #446/#447 e não declara o Caso A da #460 resolvido. Não há implementação ou handoff de execução novo autorizado por este documento. A próxima frente deve ter escopo próprio e critério de parada.

## 7. Fontes e pontos de código

Fontes primárias consultadas em 22/10/2026; novidades distintas não devem ser atribuídas à mesma atualização:

- [PostgreSQL 17.11: release menor e correções](https://www.postgresql.org/docs/17/release-17-11.html).
- [Supabase SDK 2.118.0](https://github.com/supabase/supabase-js/releases/tag/v2.118.0).
- [Supabase CLI 2.121.0](https://github.com/supabase/cli/releases/tag/v2.121.0).
- [Supabase: Notebooks, logs, Health Advisors e Connections](https://supabase.com/blog/select-2026-operate-with-confidence).
- [Notebooks: anúncio do preview](https://github.com/orgs/supabase/discussions/49916).
- [Fuse 7.5.0: correções de ranking](https://github.com/krisk/Fuse/releases/tag/v7.5.0).
- [FuseWorker: uso e condições](https://www.fusejs.io/web-workers.html); export confirmado no pacote local 7.5.0.
- [Floating UI: size](https://floating-ui.com/docs/size) e [autoUpdate](https://floating-ui.com/docs/autoupdate).
- [Playwright 1.64: vídeos e WebMCP](https://playwright.dev/docs/release-notes#version-164); [1.64.1: correções](https://github.com/microsoft/playwright/releases/tag/v1.64.1).

Autoridades conferidas na base: `src/domain/global-search-index.js` (`createSearchEngine`), `src/integration/global-search.js` (`rebuildEngine`, `search`), `src/integration/floating-ui-bootstrap.js` (`createPositionOptions`), `src/integration/view-transitions.js`, `src/application/state-port.js` (`captureEntities`, `applyEntities`), `src/data/repository-contract.js` (`cloneValue`), `src/data/supabase-repository.js` (AbortSignal), `tsconfig.database-types.json`, `tests/support/operational-session-observer.js`, `tests/support/performance-journey-observer.js`, `src/integration/operational-write-performance.js` e `docs/reference/VERCEL_OBSERVABILITY.md`.

`supabase notebooks --help` foi executado apenas para confirmar os comandos disponíveis. Nenhum pull/push de notebooks, consulta operacional ou ação de plataforma foi executado nesta análise.
