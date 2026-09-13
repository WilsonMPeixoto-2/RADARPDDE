# RADAR PDDE 2026 — fechamento da correção arquitetural Supabase

**Data:** 13/09/2026  
**Branch:** `fix/supabase-query-architecture-2026-09-11`  
**Produto validado:** `93a9f24c2d4b24a274d7e071e96b65169a965bbe`  
**Última certificação antes deste documento:** `e6a645d523c6883601689545ba16c8d36de71c54`  
**Base funcional preservada:** merge do PR #299 `d2663f1ae7554516caf315f53b2509fbcd295e01`

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

Registrar uma ação administrativa acrescenta o novo registro sem reler o histórico inteiro. A exportação Excel usa o serviço de auditoria e não reativa o antigo caminho `persist('logs')`.

O histórico de contatos da escola possui consulta própria sob demanda, inclusive para contatos que não estejam vinculados a uma Pendência específica.

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
| `dataImportRuns` classificado como append-only apesar de checkpoints mutáveis | Corrigido: classificado como workflow de manutenção |
| Testes de integração antigos não simulavam `.limit()`/`.gt()` da paginação | Corrigido no simulador; proteção real de paginação mantida |

O custo local de alguns cálculos de interface ainda pode ser micro-otimizado no futuro, por exemplo indexar previamente contatos usados em alertas. Com a nova fronteira contextual, isso deixou de operar sobre o histórico global e não constitui pendência arquitetural para a migração Supabase.

## 4. PR #299, migrations e banco

A branch preserva o merge funcional do PR #299. A auditoria somente leitura encontrou 51 migrations locais correspondentes às 51 registradas no projeto Supabase consultado, incluindo `20260910201500_evaluation_retification_atomic_cancel`.

Foram confrontadas as assinaturas das RPCs operacionais `retify_verification_with_pendency_cancel`, `save_verification_with_log`, `save_invoice_with_effects`, `delete_invoice_with_effects`, `save_pendency_command`, `reanalyze_pendency_with_verification` e `save_asset_with_verification_and_log`. Os consumidores examinados estão alinhados às assinaturas verificadas; as funções observadas são `SECURITY INVOKER`, com execução negada a `anon` e permitida a `authenticated`. Seis corpos conferiram após normalização de espaços; a diferença observada na RPC de reanálise foi apenas de comentários.

Essa verificação não é apresentada como prova matemática de equivalência de todo o schema. Ela é evidência direcionada de que a correção arquitetural e o PR #299 não deixaram incompatibilidade nas RPCs operacionais examinadas.

## 5. Certificação final da branch isolada

A execução GitHub Actions `34745166616`, no commit `e6a645d523c6883601689545ba16c8d36de71c54`, foi concluída com sucesso integral.

Passaram na mesma execução:

- validação de sintaxe dos componentes alterados;
- regressões direcionadas da arquitetura Supabase;
- `npm run check`;
- toda a suíte unitária, executada arquivo por arquivo;
- toda a suíte de integração, executada arquivo por arquivo;
- fronteiras arquiteturais;
- lint de segurança e de E2E;
- matriz funcional, referências de workflows, fornecedores de UI de busca e certificação de fixture Excel;
- verificações estáticas de readiness/alinhamento Supabase;
- configuração de runtime e arquivos gerados;
- typecheck de banco;
- auditoria funcional;
- suíte desktop prioritária em Chromium, incluindo Análise/Bonificação, Pendência atômica, retificação, Notas/Documentos, despesa a identificar, reanálise, troca de competência, contexto remoto, Inventário e UX de erro.

O artefato `architecture-desktop-e6a645d523c6883601689545ba16c8d36de71c54` foi preservado pelo workflow, digest `sha256:3ffcfe7895e51c786a457efcff4894f5b56ea52439bfa8cf1318f3352198a440`.

## 6. Escalabilidade

A mudança principal de escalabilidade é qualitativa: crescimento histórico deixou de aumentar automaticamente o custo do login e das operações correntes. Histórico append-only é paginado/contextual; dados mensais são carregados por competência; obrigações antigas entram apenas quando continuam operacionalmente relevantes; e pequenas escritas não exigem copiar ou reler todo o acervo carregado.

A paginação genérica de leituras completas legítimas usa continuação por identificador em vez de offsets crescentes. Assim, ferramentas de manutenção que realmente precisam percorrer coleções completas também deixam de repetir o custo de pular todas as páginas anteriores.

## 7. Limites desta conclusão

Esta certificação prova a branch isolada pelos contratos, testes de integração e fluxos desktop executados. Ela não declara que o código já esteja em Production.

`main` permanece fora desta correção até autorização explícita. Nenhum merge, migration, alteração de dados, secret, configuração ou deployment de Production faz parte deste fechamento.

A auditoria incremental `ASTRA_AUDITORIA_RADAR_2026.md` deve ser lida como registro investigativo histórico. Seus achados intermediários podem descrever defeitos que foram posteriormente corrigidos. Para o estado vigente desta frente, este documento e `docs/CURRENT_STAGE.md` têm precedência temporal.

## 8. Estado de prontidão

A correção arquitetural está **certificada na branch isolada** para a finalidade desta frente: o RADAR deixa de tratar o Supabase como depósito de snapshots completos e passa a operar com bootstrap estrutural, contexto operacional remoto, histórico sob demanda, persistência incremental e sessão invalidável, preservando os fluxos funcionais prioritários.

Próxima mudança de estado, se autorizada futuramente, é a integração controlada dessa branch. Isso é uma etapa de release/governança separada da correção técnica aqui concluída.
