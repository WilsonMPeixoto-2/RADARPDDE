# PR #410 — plano de implementação incremental

**Estado:** direção autorizada pelo usuário em 04/10/2026; execução iniciada.
**Base:** `d9bf67f7d8a1ce2e468ec3c793ff992d8e10dfd6`, main e manifesto Production
revalidados em 04/10. O #410 começou em `e562f459...`, somente especificação.
**Design:** [sincronização operacional](../specs/2026-10-04-operational-sync-simplification-design.md).

## Contrato e critérios de decisão

Supabase/RLS permanecem canônicos. O navegador mantém uma projeção descartável.
A direção escolhida é escrita com retorno autoritativo, atualização remota pequena
por escola conhecida e leitura global para contexto global/recuperação.

Aprovar a direção não torna cada detalhe da especificação uma solução provada.
Preservar as proteções do #408 e os REDs úteis do #409; não importar automaticamente
seus controllers, timers ou migrations. Não mexer em Production durante desenvolvimento.

## 0. Caracterização e lacunas antes de ativar

Reutilizar medições agregadas de #407/#409 e distinguir tentativas HTTP, SQL real,
bytes, normalização/aplicação, DOM, Long Tasks e frescor. O stress unitário síncrono
de seis escolas do #409 não equivale a seis usuários sustentados.

Confrontar a especificação com três pontos obrigatórios:

1. `schoolId` identifica contexto, não a origem da escrita. Não ignorar todo evento
   da escola atual depois de salvar. Para dispensar o eco próprio, provar correlação
   inequívoca com a operação/instância e retorno autoritativo completo. Decidir o
   contrato antes de implementar supressão; nenhuma janela temporal arbitrária.
2. `SUBSCRIBED` após foco não prova que nenhum evento foi perdido durante suspensão.
   Preservar recuperação conservadora do #408 até provar continuidade/cobertura;
   revisão leve pode ser avaliada se necessária. Não remover recuperação porque
   o canal apenas aparenta estar saudável.
3. Aplicar fatia não significa apagar indiscriminadamente tudo de uma escola.
   O envelope deve definir competência, históricos solicitados e dependências.
   Preservar dados fora da fatia substituída e remover registros excluídos dentro
   dela. Tentativas pertencem à escola pelo vínculo com Pendência: usar também
   vínculos antigos para remover tentativas cujo pai acabou de desaparecer.

Auditar dependências reais, incluindo Dashboard, Carteira, navegação, alertas,
exportação, Pendências e patrimônio. Escola aberta não equivale ao contexto global.
Não criar budget de produto a partir de um timer da implementação.

## 1. Autoridade de rota — primeiro incremento

- Usar `RadarNavigationHistory.currentRoute()` para novas decisões de sincronização.
- Corrigir Próxima unidade pelo caminho existente `switchView`, mantendo competência.
- Provar rota/URL/escola, Back/Forward, deep links, busca, filtros e retorno com foco/scroll.
- Preservar compatibilidade dos globais enquanto consumidores legados existirem.
- Não acrescentar evento de navegação em toda renderização: o #409 reproduziu
  leituras duplicadas quando refresh reafirmava a mesma rota/seção em voo.

**Primeiro RED/GREEN:** `canonical-routes.spec.js`, botão Próxima unidade.
A baseline exibia a escola seguinte com URL/rota anterior. Mudança de uma chamada
em `app.js`, sem importar runtime experimental do #409.

## 2. Leitura por escola — contrato antes de SQL

Caracterização salva em [escopo escolar](../../evidence/2026-10-04-pr410-school-scope/README.md):
35 pgTAP locais; fechamento histórico/NFs irmãs, programa nulo, saída de cobertura,
contatos sem pai, CASCADE/SET NULL, última NF e RLS. Produção apresenta zero relações
cruzadas nas quatro medições, mas o schema admite NF/bem entre escolas. A nova RPC
deve detectar contexto não isolável/incompleto e sinalizar fallback/falha antes de
aplicar. Contatos gerais consultados separadamente não são completos na RPC atual.

- Examinar `20260929143215_read_operational_context.sql`: mantém Pendências ativas
  e históricos solicitados, bens ativos e contextos ligados, além do mês atual.
- Caracterizar as seis entidades e suas dependências antes de restringir por escola.
- Provar se vínculos legítimos podem atravessar escolas; parar e revisar se houver.
- Criar migration pelo CLI fixado; função `security invoker`, grants mínimos,
  `search_path` explícito, parâmetros/envelope validados e RLS vigente.
- Nova RPC deve restringir o trabalho antes da agregação. Chamar a RPC global e
  filtrar seu JSON depois não cumpre o objetivo de custo.
- Repository deve expor a capacidade explicitamente, sem fallback silencioso em erro.

**Provas:** escola permitida/proibida, papel institucional/inativo/anon, mês/histórico,
NF ligada a patrimônio/Pendência e equivalência com a fatia correspondente da leitura
global. EXPLAIN/payload por escola e global em base representativa descartável.

## 3. Aplicação da fatia — autoridade DataService/StatePort

- Inspecionar `DataService.loadOperationalContext/readOperationalContext` e
  `StatePort.applyEntities`; o caminho atual substitui entidades do contexto inteiro.
- Definir envelope completo versus patch parcial, evitando inferir completude pela
  ausência de uma coleção. Envelope incorreto deve falhar sem alterar memória.
- Aplicar criação/edição/exclusão somente no escopo comprovado, de forma atômica,
  preservando outras escolas e dependências fora do escopo.
- Manter escrita autoritativa, fila de escrita, rollback e proteção de resposta antiga.
- Provar leitura da escola concorrendo com escrita, leitura global, troca de
  competência, histórico e sessão. Contexto anterior não pode sobrescrever o novo.
- Medir aplicação/clone/índices: reduzir rede sem reduzir trabalho no cliente não
  encerra a frente. Evitar recriar todas as coleções para mudar uma escola.

**REDs:** exclusão do último registro, exclusão de pai com tentativa, movimentação de
vínculo, resposta lenta após nova escrita, envelope incompleto, erro e rollback.
Estado do banco = projeção = tela = reload.

## 4. Realtime dirigido — substituir uma autoridade

- Ativar somente em ambiente descartável via flag temporário explícito, desativado
  em Production; testar ambos os caminhos durante a migração.
- Escola atual: leitura dirigida coalescida; escola alheia: geração dirty; visão
  global: aplicar escola e recalcular projeção; evento desconhecido: fallback global.
- Navegação é oportunidade de reconciliar, não invalidação nova.
- Geração posterior durante leitura permanece pendente; sucesso confirma somente
  geração coberta. `skipped`, erro ou stale não equivalem a contexto aplicado.
- Edição ativa adia aplicação com recuperação garantida ao terminar.
- Evitar controllers concorrentes emitindo leitura global e dirigida para o mesmo evento.
- Finalizar contrato de origem/efeitos derivados antes de suprimir eco próprio.

**Provas reais:** Controlador/Assistente, outra escola sem reconstrução, mesma escola,
navegação por Próxima unidade e Dashboard, edição, exclusão, evento em voo, falha,
reconnect e reload. Usar os testes como contrato, não como implementação obrigatória.

## 5. Foco, visibilidade e remoção do mecanismo anterior

- Só simplificar fallback quando a cobertura de eventos/suspensão estiver provada.
- Preservar interleavings do #408 nos dois ordenamentos focus/visibility, resposta
  entre sinais, falha/stale, escrita e cooldown. Remover compensações pelo novo
  modelo comprovado, não por deixar de executar os testes.
- Após equivalência e prova de custo, remover os caminhos/timers/wrappers sem função.
- Inventariar antes/depois: autoridades, estados, timers, listeners e wrappers.
  A fase só termina com redução comprovada de complexidade; flag não fica permanente.

## 6. Candidato consolidado e publicação

Executar jornada representativa: quatro Controladores em escolas distintas,
Assistente circulante, visão global; operações consecutivas e simultâneas, perdas
induzidas e reload. Separar stress de mesma escola do uso operacional predominante.
Comparar baseline/candidato em condições iguais e dependências próprias/iguais.

Exigir convergência, persistência, RLS, foco/scroll/seleção e ausência de flicker;
medir leituras, payload, SQL, DOM, Long Tasks e latência. Documentar budgets com
fundamento de produto. CI verde isoladamente não autoriza publicação.

Somente depois: revisão do diff exato, main, migrations, reversão e CI relevante.
Supabase staging pago exige custo/opções e confirmação explícita do usuário.
Migration/produção seguem etapa de release autorizada e verificação do manifesto.
Salvar checkpoints coerentes no remoto; raw traces/vídeos em Actions artifacts e
resumos/hashes no Git. Não fabricar testes de Production por falta de ambiente.
