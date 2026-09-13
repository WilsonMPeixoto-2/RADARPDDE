# RADAR PDDE 2026 — fechamento da correção arquitetural Supabase

**Data:** 13/09/2026  
**Branch:** `fix/supabase-query-architecture-2026-09-11`  
**Candidato funcional certificado:** `054aeb26f6f0ad12bf66b3965b9adcb59bca1a8a`  
**Base reconciliada da `main`:** `2eff1321a8abaccd46d9627ee2eed060741ce3b7`  
**Merge sintético do PR #300 validado:** `1c0750a3543af8b681a20a4a8fb0d0a35074c42e`

## 1. Conclusão causal

A causa arquitetural não era o Supabase nem o volume atual do PostgreSQL. O RADAR havia adotado o Supabase como fonte oficial, mas parte do frontend ainda conservava o modelo anterior de aplicação local baseada em snapshots amplos: coleções completas eram carregadas para o navegador, estruturas operacionais eram reconstruídas em memória e alguns caminhos ainda podiam persistir ou reler mais dados do que a operação solicitava.

O caso mais evidente foi `administrativeLogs`: histórico secundário de auditoria era buscado na entrada do sistema, embora Login, Dashboard, Análise, Bonificação, Pendências e Notas não precisassem dele. A investigação mostrou que esse caso era um sintoma de uma fronteira de dados incompletamente migrada, e não um defeito isolado dos logs.

A correção consolidada termina essa transição sem reescrever as regras de negócio: o Supabase permanece fonte oficial; o bootstrap traz somente dados estruturais; o contexto operacional é consultado pelo mês e pelas obrigações ativas necessárias; histórico crescente é solicitado pela superfície que o exibe; e gravações remotas atualizam somente o estado afetado.

## 2. Arquitetura resultante

### Entrada e bootstrap

O bootstrap remoto fica restrito a configuração, catálogos, escolas autorizadas, vínculos escola/programa e competências. Perfis e escopos permanecem na camada de autenticação. Avaliações, Pendências, tentativas, contatos, notas e bens pertencem ao contexto operacional e não ao acervo obrigatório do login.

A autenticação e a preparação do ambiente são tratadas como etapas distintas. Falha posterior à autenticação não é apresentada como senha inválida.

### Contexto operacional

A competência selecionada determina a consulta operacional. O sistema carrega os registros daquele contexto e acrescenta somente dependências históricas necessárias para preservar obrigações ainda abertas, incluindo Pendências ativas, bens ainda não inventariados e registros relacionados necessários a reanálise e cálculos agregados.

Trocar de mês consulta o mês solicitado, mantém a escola aberta quando aplicável e restaura a competência anterior se a hidratação falhar. Competências antigas continuam acessíveis sem obrigar a carregar todos os meses na entrada.

### Escritas e estado do navegador

Operações remotas usam persistência autoritativa/especializada e atualização incremental ou seletiva do estado. A unidade de trabalho remota captura e reconcilia as entidades alteradas, em vez de reconstruir o snapshot operacional completo para cada pequena gravação.

No modo Supabase, o navegador não funciona como segundo banco operacional. A hidratação remota é aplicada em memória sem persistir coleções institucionais no `localStorage`; o caminho legado de persistência de snapshot remoto é bloqueado. Preferências e contexto de interface podem permanecer locais conforme seus contratos próprios.

### Histórico e Auditoria

`administrativeLogs` não participa do login nem da navegação operacional comum. Auditoria solicita páginas delimitadas e filtradas no servidor quando a superfície é aberta. O histórico de uma escola é carregado somente quando explicitamente solicitado e pode percorrer as páginas necessárias para preservar meses antigos.

`queryAdministrativeLogs()` passou a falhar de modo fechado quando o contrato de consulta não é suficientemente delimitado. A paginação genérica por identificador exige ordenação determinística, e `loadPage()` exige ordenação e faixa explícitas. O objetivo é impedir que um consumidor aparentemente inocente volte a transformar o Supabase em uma leitura global disfarçada.

Registrar uma ação administrativa acrescenta o novo registro sem reler o histórico inteiro. A exportação Excel usa o serviço de auditoria e não reativa o antigo caminho `persist('logs')`.

O histórico de contatos da escola possui consulta própria sob demanda, inclusive para contatos que não estejam vinculados a uma Pendência específica.

### Fronteira de acesso ao Supabase

Foi adicionado gate arquitetural semântico para impedir acesso direto indevido às tabelas operacionais do Supabase fora da camada de dados. As exceções de autenticação permanecem restritas a `user_profiles` e `user_school_scopes`.

### Sessão e atualização entre usuários

O encerramento da sessão invalida o contexto operacional da conta anterior. A atualização contextual por foco/retorno da página reduz estado antigo entre sessões sem interromper formulários ou gravações em andamento. Conflitos de escrita continuam protegidos pelos mecanismos de versão já existentes.

A solução deliberadamente evita transformar todas as tabelas em streaming permanente. O contexto ativo é atualizado nos pontos em que isso produz benefício operacional real.

## 3. Achados da auditoria e situação final

| Achado | Situação |
|---|---|
| Logs administrativos carregados no bootstrap | Corrigido: leitura somente sob demanda |
| Readiness exigia leitor remoto também no modo local | Corrigido: dependência condicionada à capacidade aplicável |
| Coleções operacionais crescentes no bootstrap | Corrigido: migradas para `remoteLoad: context` |
| Pequena escrita remota reconstruía snapshot completo do navegador | Corrigido: captura/aplicação remota por entidades alteradas |
| Persistência operacional em `localStorage` no modo Supabase | Corrigido: hidratação em memória e barreira ao snapshot remoto legado |
| Exportação Excel podia reativar persistência legada de logs | Corrigido: auditoria via serviço incremental |
| Histórico escolar podia perder meses antigos por limite dos 100 logs recentes | Corrigido: paginação completa somente quando histórico é solicitado |
| Seletor global de competência incompatível com o domínio real | Corrigido e exercitado com módulos reais |
| Contexto mensal omitia dependências de Pendências/bens antigos | Corrigido: dependências históricas ativas entram seletivamente |
| Reanálise/inventário precisavam de notas irmãs do mesmo contexto | Corrigido: dependência contextual sem retorno ao histórico integral |
| Contatos escolares sem vínculo com Pendência desapareciam após recarga | Corrigido: consulta escolar própria sob demanda |
| Índices derivados podiam ficar antigos após patch remoto | Corrigido: reconstrução seletiva quando entidades relevantes mudam |
| Atualização contextual podia interferir em edição/gravação | Corrigido: guardas de atividade, serialização e descarte de resposta obsoleta |
| Logout deixava contexto operacional da sessão anterior | Corrigido: invalidação de sessão e estado operacional |
| Logout E2E esperava mensagem transitória anterior ao reload | Corrigido: testes passam a verificar o estado estável pós-reload |
| `dataImportRuns` classificado como append-only apesar de checkpoints mutáveis | Corrigido: classificado como workflow de manutenção |
| Testes de integração antigos não simulavam `.limit()`/`.gt()` da paginação | Corrigido no simulador; proteção real de paginação mantida |
| Releitura corretiva após falha podia voltar a buscar coleções amplas | Corrigido: reconstrução por contexto, sem retorno ao snapshot global |
| Consultas administrativas/paginação podiam aceitar contrato pouco determinístico | Corrigido: ordenação/limites explícitos e fail-closed |
| Acesso direto a tabelas operacionais podia reaparecer fora da camada de dados | Corrigido: gate arquitetural semântico |

O agrupamento de contatos usados em alertas também foi implementado na revisão complementar, eliminando o filtro de todos os contatos para cada Pendência.

## 4. Reconciliação com a `main` e rollback do PR #299

A `main` foi restaurada em `2eff1321a8abaccd46d9627ee2eed060741ce3b7` após a regressão global de acesso associada ao PR #299. A branch arquitetural havia divergido antes desse hotfix e, por isso, não podia ser integrada por mera confiança no histórico anterior.

A reconciliação foi executada como merge formal em:

`f064c189ff26a4f22357f61dda6e16d218599900`

Esse merge preservou simultaneamente a nova arquitetura contextual e as exclusões introduzidas pelo hotfix da `main`.

Em seguida, o commit:

`7fac373ec4481b5ca5140f923312b9fb7a5f5fee`

restaurou somente dois contratos arquiteturais necessários da retificação manual:

- `incrementalStateEntities: ['pendencies', 'administrativeLogs']`;
- `remoteResultIsAuthoritative: true`.

Isso não restaurou a funcionalidade de retificação de avaliação que havia sido removida pelo rollback.

No merge sintético validado `1c0750a3543af8b681a20a4a8fb0d0a35074c42e`, os artefatos centrais do PR #299 removidos pelo hotfix continuam ausentes, inclusive:

- `src/integration/evaluation-retification.js`;
- `src/integration/evaluation-retification-ui.js`;
- `src/styles/evaluation-retification-ui.css`;
- `supabase/migrations/20260910201500_evaluation_retification_atomic_cancel.sql`;
- testes e documentação diretamente vinculados a essa funcionalidade.

**O PR #300 não altera migrations.** Portanto, esta integração não exige migration nova nem alteração manual de dados em Production.

## 5. Certificação final do candidato funcional

O candidato `054aeb26f6f0ad12bf66b3965b9adcb59bca1a8a` foi exercitado contra a `main` pelo merge sintético `1c0750a...`.

Todos os workflows acionados pelo PR concluíram com sucesso:

- `Testes E2E Playwright` — run `34765921584`;
- `Homologação integral pré-production` — run `34765921540`;
- `Validar RADAR PDDE` — run `34765921577`;
- `Retificação auditável direcionada` — run `34765921493`;
- `Homologação do Excel SME` — run `34765921653`;
- `CodeQL` — run `34765921607`;
- `Confiabilidade funcional com Supabase real` — run `34765921568`;
- `Lighthouse CI` — run `34765921511`;
- `Ciclos funcionais reais com Supabase` — run `34765921536`;
- `Supabase readiness` — run `34765921527`;
- `Gate remoto de perfis e viewports` — run `34765921507`;
- `Contratos-fonte do Excel SME` — run `34765921574`;
- `Validar snapshot canônico do RADAR` — run `34765921554`;
- `Saúde das dependências` — run `34765921593`.

A suíte unitária alcançou **1.018 testes aprovados, 0 falhas**, além das suítes de domínio, integração e jornadas reais autenticadas contra Supabase descartável.

A homologação remota cobriu, entre outros, autenticação/RLS, escrita, reload e releitura, Análise/Bonificação, Pendências, reanálise, Notas/Documentos, retificação cadastral permitida, despesa a identificar, Inventário, contexto por competência, perfis e viewports.

## 6. Lighthouse e decisão de performance

Antes da última otimização, duas medições independentes colocaram o LCP desktop ligeiramente acima do piso interno de 3,5 s, aproximadamente entre 3,59 s e 3,63 s. A investigação mostrou que o maior elemento era textual e que a cadeia de descoberta das fontes/CSS contribuía para o atraso.

O commit `054aeb26...` fez uma otimização conservadora: antecipou a descoberta das fontes principais sem alterar regras de negócio, arquitetura de dados ou comportamento funcional.

No run `34765921511`, a mediana de três execuções desktop resultou em:

- Performance: **78%**;
- Acessibilidade: **100%**;
- Boas práticas: **100%**;
- FCP: **737 ms**;
- LCP: **3,46 s**;
- Speed Index: **1,29 s**;
- TBT: **0 ms**;
- CLS: **0,082**;
- TTI: **3,46 s**.

O piso desktop foi aprovado.

No mobile, o LCP medido foi **16,48 s**, acima do piso de 15 s. O próprio gate preserva esse resultado como dívida conhecida e **não bloqueante**, porque o alvo operacional homologado do RADAR é desktop. A evidência não foi ocultada nem o limite foi artificialmente relaxado.

A decisão de release é não introduzir mudança arquitetural ou regressão funcional para perseguir milissegundos depois de o desktop ter atendido o piso configurado. Otimizações adicionais de bundle/CSS podem ser tratadas em frente própria e mensurável.

## 7. Escalabilidade

A mudança principal de escalabilidade é qualitativa: crescimento histórico deixou de aumentar automaticamente o custo do login e das operações correntes. Histórico append-only é paginado/contextual; dados mensais são carregados por competência; obrigações antigas entram apenas quando continuam operacionalmente relevantes; e pequenas escritas não exigem copiar ou reler todo o acervo carregado.

A paginação genérica de leituras completas legítimas usa continuação por identificador em vez de offsets crescentes, com ordem determinística obrigatória. Ferramentas de manutenção que realmente precisam percorrer coleções completas deixam de repetir o custo de pular todas as páginas anteriores.

## 8. Limites desta conclusão

Esta certificação comprova o candidato funcional e o merge sintético do PR contra a `main`; ela não equivale, por si só, à confirmação de que Production já foi atualizada.

A integração e o deployment ainda precisam ser observados até que:

1. o PR #300 esteja efetivamente integrado;
2. a `main` aponte para o merge resultante;
3. a Vercel publique o SHA integrado em Production;
4. o deployment esteja `READY`;
5. um smoke check não destrutivo do endereço oficial seja concluído.

A auditoria incremental `ASTRA_AUDITORIA_RADAR_2026.md` deve ser lida como registro investigativo histórico. Seus achados intermediários podem descrever defeitos que foram posteriormente corrigidos. Para o estado vigente desta frente, este documento e `docs/CURRENT_STAGE.md` têm precedência temporal.

## 9. Estado de prontidão

A correção arquitetural está **certificada para integração**: o RADAR deixa de tratar o Supabase como depósito de snapshots completos e passa a operar com bootstrap estrutural, contexto operacional remoto, histórico sob demanda, persistência incremental e sessão invalidável, preservando os fluxos funcionais prioritários e o rollback de acesso da `main`.

Não existe bloqueio técnico remanescente identificado nesta frente para o merge controlado do PR #300.
