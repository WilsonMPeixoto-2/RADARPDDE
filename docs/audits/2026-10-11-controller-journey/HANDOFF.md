# Handoff — auditoria imersiva do Controlador

## Checkpoint superveniente — comparação encerrada em 13/10

[Conclusão e limites](FRESHNESS_COMPARISON_2026-10-13.md): 44 gravações confirmadas
em cada versão; main/candidato convergem, mas atualização remota durante atividade
chega a 23,67/24,85 s. Uma leitura por sessão, zero aborts em ambas. Não demonstra
regressão do #438 nem explica os 46 cancelamentos do gate histórico. Runtime de
sincronização idêntico à main. Não alterar timers a partir deste ensaio.
22 workflows de 99fa423c verdes; comparação longa concluída com quatro advertências,
baseline #408, sem certificação de superioridade de custo. Supersede os estados
"em andamento" abaixo. Sem merge/deploy, migration 61 ainda pendente em Production.


## Checkpoint final desta rodada13/10 — diagnóstico e salvamento

Runtime do seletor publicado em730d5d99: catálogo completo da sessão, Auth3/3,
13E2E navegação aprovados (1skip mobile). Contratos antigos reconciliados com
justificativa individual. A última rodada unitária terminou1.361/1.361, após provar
e corrigir somente o relógio dos três testes de retry; runtime Realtime intacto.
Ver DIAGNOSTIC_CLASSIFICATION_2026-10-13.md para causas, REDs e decisões.

CI730:15success/1falha de preparação Docker/5em andamento na última consulta.
Comparação38355640318 ainda executa baseline/candidate. O run anterior38325720764
falhou em signIn opacity0 e permanece inconclusivo, artefatos indisponíveis ao
executor (Forbidden). Não modificar asserção nem publicar deltas daquela execução.
Próximo passo: conferir resultados/artefatos do38355640318 e CI final; tratar
preparação Docker separadamente de produto. Sem merge/deploy; performance aberta.


## Checkpoint vigente13/10 — preservação antes de continuar

Correção do catálogo escolar e evidências Auth foram salvas antes da próxima
investigação. Ver [classificação de cada falha](DIAGNOSTIC_CLASSIFICATION_2026-10-13.md).
3/3 Auth e16dirigidos passaram. Rodada ampla1359/1360 teve falha de retry baseada
em15ms reais; causa pendente. E2E desktop teve count2 obsoleto, já reconciliado com
catálogo completo, repetição pendente. Baseline38325720764 incompleta na preparação:
sem comparação de performance e sem ajuste de opacidade. Nada pronto para merge.


## Checkpoint vigente — revisão individual de 12/10

Correções locais anteriores preservadas no remoto em06ab5d7f. A proposta do outro
agente (#441,7221811d) foi revisada **somente pelo agente principal**, sem subagentes.
Ver [avaliação e limites](INDEPENDENT_REVIEW_2026-10-12.md).

As seis contraprovas externas foram aproveitadas com autoria identificada. Na
árvore local inicial restaram três REDs; as12 provas/controles importadas passaram
após correção. Acrescentados dois controles do catálogo e um da hidratação remota.

Correções consolidadas: filtros manuais usam navegação autorizada; render não
reaplica rota anterior; página tardia recebe filtro autorizado do bootstrap;
seletor mantém escola do catálogo mesmo sem Pendências; refresh de competência
reaplica rota atual com replace, preservando contexto antes de abrir Prontuário.
Não houve novo controller/timer/estado temporal, dependência ou mudança Auth/RLS.

**Validação final local:**1.359/1.359 unitários;24 E2E dirigidos aprovados,1 pulado
(exclusivo mobile no projeto desktop);3/3 Auth/Supabase reais, incluindo app.js
retido11s, seleção/limpeza/reload e contatos/cancelar/reabrir. A falha anterior de
retorno Prontuário→Pendências passou sem relaxar sua asserção. Sintaxe verde; lint
E2E0erros/8warnings de skips existentes. Captura da escola autorizada sem Pendências
inspecionada em1440×900, seletor/rota/URL iguais e0pageerrors.

**Ainda Draft, sem merge/deploy.** Conferir CI do novo HEAD; resultados de53f ou3fca
não certificam esta árvore. A–N continua parcial. Não afirmar ganho de velocidade:
as medidas e fronteira do PR de performance estão na avaliação vinculada acima.
O desperdício de bootstrap observado no catálogo sintético está documentado, não
corrigido nem demonstrado como causa principal em Production.

Próximo agente: conferir CI exata; investigar falhas reais sem relaxar contratos;
completar jornadas/inspeções remanescentes do438 e homologação da migration61 antes
de merge. Não reaplicar mudanças do441 nem repetir seus experimentos já incorporados.


## Checkpoint de continuidade — 12/10, revisão pessoal da proposta externa

O trabalho local anterior foi recuperado intacto. A correção candidata remove da
ponte de foco a leitura da rota antiga durante render e encaminha seleção/limpeza
escolar para a navegação autorizada existente; não publica rota antes de autorizar.
Foi demonstrada a divergência de rota também na main 113841bd, sem atraso artificial.

Validação desta árvore: **1.344/1.344 unitários**, 16 controles dirigidos, duas
jornadas autenticadas de filtro/Voltar/Avançar aprovadas. **Regressão ampliada NÃO
concluída: 23 aprovados, 1 pulado, 1 falha** no retorno Prontuário → Pendências
(escola não aparece na URL). Evidências completas pequenas em evidence/*results.txt
 e navigation-focused-e2e.txt. Não classificar o candidato como pronto.

O PR independente #441, HEAD 7221811d, foi produzido por OUTRO agente. Seu relatório
foi lido: quatro contraprovas de navegação e duas do seletor sem registros. Os testes
VM e timelines Auth serão confrontados com o código atual; não incorporados como
certificação própria nem repetidos integralmente sem necessidade. A hipótese de
página tardia NÃO explicou o seletor vazio nas timelines desse agente: o estado
interno estava certo e faltava a opção HTML. Esta nova revisão é feita somente pelo
agente principal, conforme pedido explícito do usuário.

### Lentidão: conclusões limitadas, investigação não encerrada

`evidence/startup-navigation-comparison.json` contém três amostras por fase/variante:
login até UI básica mediana main 1342 ms / candidato 1187,5 ms; reload autenticado
1483 / 1436 ms. Amostra pequena, executor variável, HTTP sem cache: **não prova ganho
de fluidez**. Ambas executam 12 REST e duas RPC globais (59.814 + 73.353 bytes).
Rastreamento separado e DataService.bootstrap mostram prefetch de 2026-09 e leitura
posterior de 2026-05, resolvida pelo catálogo da fixture. É desperdício causal no
caso calendário/catálogo divergentes, não demonstra frequência em Production.

Com app.js retido 11s, ambas as variantes perderam APIs CycleBDashboard,
CycleBCarteira, Task10Alerts e ModalAccessibility. Isso comprova ausência de
capacidades sob atraso, não seu impacto visual nem causa de lentidão normal.
Não corrigir esses módulos em lote. O caminho de performance requer jornada,
profiler da aplicação de estado/render e dados representativos, possivelmente
em PR separado. Instalação resiliente não equivale a aplicação mais rápida.

### Próximo passo

Confrontar proposta do seletor com catálogo autorizado; resolver causalmente a
regressão de retorno antes de CI final. Preservar as garantias de patrimônio,
contatos, autorização e contexto transversal. PR #438 permanece Draft, sem merge
ou deploy. A auditoria A–N e a causa principal da lentidão continuam abertas.

## Checkpoint anterior — 12/10/2026, retomada e salvamento por cota

Remoto foi incorporado por fast-forward de `0ee97f50` para **`3fcaeada`**:
única diferença era a 61ª migration na verificação pós-aplicação. **21 workflows
terminaram success** nesse SHA; smoke autenticado Production continua desabilitado
no job, portanto não representa uso real. Main segue `113841bd`; nenhum merge,
deploy ou alteração em Production nesta retomada. O #440 repetiu as contraprovas
SQL independentes do #439 sobre a proteção terminal e seu readiness ficou verde.

**Novo defeito reproduzido na interface autenticada:** reter somente `app.js` por
11s faz os três módulos Task9 desistirem da instalação. Após login, a interface
abre “Passivo e Regularizações de Pendências”, em vez da página operacional atual;
ações de contato e pontes dependentes ficam ausentes. Isso é atraso de script,
não o login tardio já corrigido. RED externo em `73597753` confirmado; revisão
independente desta retomada concordou com a causa e alertou para os dependentes.

Correção candidata salva: os três instaladores Task9 usam lifecycle existente,
sem polling/deadline, incluindo DOMContentLoaded durante `interactive`. **16/16
unitários focados verdes** e prova Auth inicial **1/1, 17s** (heading, exportação,
abas). O controle unitário antigo esperava ausência até um tick de polling: foi
atualizado para exigir instalação direta nos eventos, preservando delegação única.

**Não está pronto para merge.** Ao ampliar o E2E para rota escolar → limpar filtro
→ voltar → avançar, surgiu falha: depois de avançar o filtro continua ESC-LOCAL.
Ainda não foi distinguido defeito de navegação de expectativa incorreta sobre
replaceState/pushState. Não relaxar a asserção nem empilhar patch: verificar URL,
rota, histórico e controle sem atraso. A jornada longa de login/contatos passou; a rodada final teve uma aprovação
e uma falha, em um minuto. O novo CI ainda não certificou o
candidato. O JSON `evidence/task9-delayed-app-checkpoint.json` guarda causa,
limites, runs e hashes. Logs privados em `/workspace/scratch/controller-private/`.

Próximos passos, nesta ordem:
1. Revalidar HEAD/worktree/CI e ler resultado `late-readiness-full-green.log`.
2. Investigar a asserção voltar/avançar, confrontando navegação normal e lenta.
3. Verificar foco/filtro/atalhos cross-view e contato no cenário lento; rodar
   regressões relacionadas e depois CI do candidato consolidado.
4. Reconciliar JOURNEYS/CAUSAL_FINDINGS antigos com as provas de patrimônio,
   bonificação, exportações e reconexão já registradas. A–N ainda não concluída.
5. Prosseguir com boleto incorreto/correção, navegação e medidas de tempo percebido,
   sem reabrir alterações históricas ou declarar fluidez Production comprovada.

Ambiente: servidor snapshot em4176, Supabase descartável saudável, migration61
já aplicada. Config Playwright privado recebeu proxy com bypass localhost para
reproduzir Auth neste executor; nenhuma credencial foi versionada. Não imprimir
error-context de login: snapshots ARIA podem incluir valor de campo password.
Outros deadlines no loader são risco relacionado ainda não reproduzido por
superfície; não ampliar automaticamente esta correção.

## Checkpoints anteriores — históricos

**Checkpoint superveniente — 11/10, 22:45 Brasília:** proteção terminal implementada
no candidato, aplicada somente no Supabase descartável. `InvoiceService.remove`
nega a remoção conhecida antes da fila e revalida o bem/vínculo atuais dentro da
mutação. Migration 61 reutiliza a função terminal para DELETE de bem e acrescenta
proteção da NF com lock patrimonial, inclusive RPC com `p_delete_linked_asset=false`.
Sem mudança de Auth/RLS/perfis. Prova antes/depois:

- três REDs unitários (terminal conhecido, inventariação durante espera, troca de
  vínculo durante espera); **58 testes relacionados GREEN**;
- quatro REDs SQL, agora **18/18 GREEN**; **41 arquivos pgTAP GREEN** com seed
  pré-Auth isolado por transação, sem desabilitar triggers;
- duas sessões PostgreSQL: DELETE espera inventariação em voo e é recusado após
  commit, NF e bem preservados (`terminal-lock-proof.json`);
- E2E novo com dois perfis reais: Controller cria NF, Inventário conclui pela UI,
  Controller recebe atualização, exclusão recusada com **zero RPC de remoção**,
  edição de valor permitida, reload conserva NF/bem/autoria/data; **1/1, 14,6 s** na versão final, incluindo valor do bem e processo patrimonial.

`terminal-deletion-green.json` indexa logs/hashes e limites. O pgTAP inicial amplo
em base já usada pela auditoria falhou por dados extras/seed pós-Auth e pela fixture
de exclusão terminal; foi preservado. Contexto agora testa NF de consumo em escola
separada, mantendo intacta a contraprova de vínculo cruzado. Import/rollback usa
bem pré-terminal; não criar bypass para apagar patrimônio inventariado. Os três
gates executam a nova jornada depois de import/rollback, junto ao login tardio.

Todos os gates aplicáveis do checkpoint **52efc260** ficaram verdes, inclusive o
E2E legado. Isso supera o vermelho de 6139 sem mudança de deadline/asserções.
A nova CI com migration 61 ainda precisa certificar o candidato final. A rodada
unitária ampla local terminou com **1.341 aprovados, zero falhas/skips** após incluir
a migration no índice Git. Antes disso o inventário comparava 60 arquivos tracked
com 61 no diretório; esse erro foi preservado e resolvido sem alterar o teste.

Próximo agente: conferir HEAD/CI reais; não reaplicar a migration no descartável
sem consultar `schema_migrations`. Production segue na migration 60. Antes de
publicar, homologar a migration pelo fluxo normal, revisar diff exato e contratos
de importação/backup. A missão A–N continua parcialmente caracterizada; CI verde
não representa observação autenticada de Production nem encerra todos os itens
visuais residuais. Os registros sintéticos terminais novos foram conservados.

**Checkpoint superveniente — 11/10, 19:40 UTC:** salvar este estado antes de
qualquer validação longa. Contato interno recebeu proteção contra submit
concorrente reutilizando `critical-action-guard`: RED com duas RPCs/dois contatos
para um duplo clique; GREEN com uma RPC/um contato, segundo contato legítimo e
reload. Foram aprovados 18 unitários focados, oito E2E de Pendências e uma jornada
Auth real (38,6 s). Isso não garante idempotência de retry após commit remoto com
resposta perdida. Evidência: `evidence/contact-submit-guard.json`.

O mesmo corte do footer foi reproduzido em novo envio e cobrança; a correção
`bottom:0` ficou restrita aos três corpos sem padding, na folha vigente. **17/17**
E2E de identidade/rodapé passaram, com inspeção visual. A reanálise autenticada em
1280×720 persistiu o resultado incorreto e preservou NF/Pendência/tentativa após
reload. Evidência: `evidence/corrective-footer-scope.json`.

Bonificação/retificação tardia, edição/exclusão de consumo após retificação,
exportação institucional XLSX e recuperação após perda real de Realtime foram
executadas em sessões legítimas do descartável. A reconexão produziu uma leitura
global HTTP 200 de 49.605 bytes, sem F5; Dashboard convergiu de uma para duas escolas
com Pendências. A exportação da Assistente tem quatro planilhas e 41.021 bytes;
ExcelJS conferiu competência, dados e metadados. Resumos sanitizados estão em
`evidence/`; não são observação de Production nem inspeção do Excel nativo.

**Bloqueio novo confirmado:** exclusão ordinária de `AUD-PERM-01` apagou a NF e o
bem Inventariada no descartável, HTTP 200. O `audit_events.old_record` comprova
estado terminal no DELETE, sem downgrade. Falha herdada da main, não causada por
este PR. Trigger terminal cobre apenas UPDATE; serviço/planner/RPC não negam essa
exclusão. Evidência durável: `evidence/terminal-inventory-delete-red.json`.
Proteções local serializada e backend estão em investigação; ainda não aplicadas.
Não recriar os registros perdidos para mascarar o RED. Production permaneceu intacta.

CI do HEAD publicado `6139fe79`: **18/19 workflows verdes**, incluindo readiness,
Supabase real, ciclos, uso sustentado e pré-production. E2E desktop ficou vermelho:
212 aprovados, 65 pulados, um timeout no caso legado
`unidentified-expense-user-journey.spec.js:27`. O mesmo teste original passou
isoladamente na main (12,60 s) e candidato (12,72 s), sem alterar deadline ou
asserções. A causa exata do timeout CI não foi reproduzida; acesso ao trace remoto
falhou por proxy. Preservar esse vermelho e repetir CI proporcionalmente; não
aumentar timer para fabricar GREEN. Evidências `ci-6139.json` e
`legacy-ci-duration-review.json`. Os parágrafos seguintes são checkpoints históricos.

**Checkpoint corrente de continuação:** UI cloud autenticada autorizada. PR #438
Draft; main/Production intactas. Duas correções candidatas e seus REDs estão no
worktree: identidade documental e readiness após login tardio. Ciclo real tardio
criou NF/Pendência, registrou contato, cancelou e reabriu sem reload: GREEN (1 min).
Suíte unitária completa: **1.333 aprovados, zero falhas/skips**. Não confundir
esse checkpoint com certificação integral A–N ou com observação autenticada de
Production. Ler primeiro [CAUSAL_FINDINGS.md](CAUSAL_FINDINGS.md) e
[JOURNEYS.md](JOURNEYS.md); os blocos antigos abaixo preservam a sequência da
investigação e contêm afirmações temporais já superadas.

Checkpoint seguinte: rodapé da reanálise corrigido após RED de hit-test em
1280×720 e comparação baseline/candidato; **12/12** contratos de identidade/rodapé
passaram. A inspeção autenticada desse CSS ainda está pendente. A CI do
`a5961944` passou a jornada tardia, mas a importação posterior tentou excluir sua
NF com histórico protegido e foi corretamente rejeitada. A jornada foi movida,
sem alterar asserções, para `supabase-late-auth-actions.spec.js`, executada como
último passo dedicado depois de import/rollback em três gates. Não apagar
histórico nem mudar a regra de importação para fabricar GREEN. Diagnóstico em
`evidence/auth-test-isolation.json`; a nova CI limpa ainda precisa confirmar.

Outro vermelho de `a5961944`, run `38165984970`: o caso Conectada persistiu,
recarregou e passou os contratos funcionais; falhou ao exigir painel inteiro
no viewport (ratio 0,94886893). O retry serial encontrou os dados legítimos já
gravados e falhou na expectativa inicial vazia. Investigar a captura original
antes de modificar produto ou teste. Não considerar esse retry causa-raiz.

Pendências atuais: inspeção Auth de modais em 1280×720, repetição dos dois E2E
legados que excederam 30s sob carga, bonificação/consolidação/retificação tardia,
reconexão e exportação institucional. Não aumentar deadlines dos testes legados
nem declarar falso positivo corrigido sem prova. O teste Auth novo usa 90s porque
inclui Auth e cinco commits reais, além das interações; seu RED original terminou
na ausência de contato, antes de acrescentar esse ciclo completo.

Etapa 5 autorizada em 11/10/2026: explorar jornadas A–N pela UI real, observar
fora para dentro, conferir persistência/reload/projeções e corrigir achados
fundamentados. Testes históricos verdes não encerram a missão.

Main: `113841bda52ce3bbda228524daf9a7464f12b462`, pós-#437.
Branch/worktree e capacidades: [ENVIRONMENT.md](ENVIRONMENT.md).
O trabalho anterior `7ca3d736` permanece na branch
`audit/operational-readiness-2026-10-07`; não foi descartado nem incorporado cegamente.

## Regras de execução

- Ler a ordem de AGENTS.md. Documentos funcionais/metodológicos estáveis conferidos
  sem alterações desde `a5a67d34`; CURRENT_STAGE/STATUS e reconciliação foram relidos.
- PRs contextualizados: #397, #403, #404; #406, #408, #410, #427, #429;
  #415, #426, #431, #433–#437. Conferir diffs/discussões materiais antes das jornadas.
- Respeitar independência fiscal/bonificação, identidade da NF, histórico individual,
  patrimônio terminal, autoridade de rota/competência, RLS e recuperação global.
- Usuário autoriza ciclos sintéticos reversíveis em Production **autenticada**.
  Não criar usuário/resetar senha de Production nem acessar a UI com service role.
  Após a pausa para navegador pessoal, o usuário autorizou expressamente continuar
  **neste ambiente cloud**; executar a UI autenticada do descartável e distinguir
  seus resultados de observação de Production.
- Histórico imutável, Pendências e patrimônio terminal: somente descartável.
- Capturas/trace/vídeo devem ser abertos e examinados, não apenas produzidos.
- Analisar impactos transversais; duas tentativas sem convergência exigem reavaliar.
- Nenhum problema foi corrigido ou encerrado neste checkpoint de preparação.

## Estado executado

1. Anexos da missão e diretriz sistêmica lidos; branch nova criada da main atual.
2. Dependências do lockfile instaladas sem upgrade; Chromium correspondente instalado.
3. Xvfb auxiliar e Chromium headed/CDP/ARIA provados com página de diagnóstico.
4. MCP registrado e servidor/cliente JSON-RPC provados; login Production e Dashboard local capturados e examinados. Chrome pessoal não conectado à máquina cloud.
5. GitHub/Vercel/Supabase SQL e smoke público revalidados sem escrita.
6. Startup Supabase descartável e incidentes de infraestrutura registrados em ENVIRONMENT.md; configuração copiada para
   `/workspace/scratch/controller-supabase`, project_id próprio; nenhum projeto
   remoto alterado. Excluídos somente serviços auxiliares não necessários à jornada.

## Próximas ações da preparação original — superadas pela correção abaixo

1. Conferir `/workspace/scratch/controller-supabase-start.log`, redigindo tokens
   antes de imprimir; não versionar status env/credenciais locais.
2. MCP isolado já provado. Servidor localhost:8931, display :99; não reinstalar. Cliente auxiliar `/workspace/scratch/controller-mcp.mjs`.
3. Preparar identidades locais pelo bootstrap já existente e build Preview contra
   localhost; serviços/Admin são preparação, todas as ações de jornada pela UI.
4. Começar por A (orientação) com screenshot examinado antes de DOM/código; depois
   B–H, I–M e exploração N, incluindo sessões concorrentes e arquivos exportados.
5. Registrar tarefa/caminho/interação/resposta/tempo/persistência/experiência/achado
   em JOURNEYS.md. Nenhuma jornada autenticada está executada neste checkpoint.
6. Para cada falha atual: reprodução, autoridade/impacto, RED proporcional, correção,
   jornada repetida, revisão crítica e CI; não implementar hipóteses antigas.

Preservar commits/push por avanço material. Dados brutos ficam fora do Git;
versionar síntese, índices, hashes e capturas representativas sem credenciais.

## Atualização de preparação

O usuário escolheu conectar Chrome pessoal; foi orientado a usar extensão oficial
Playwright MCP + servidor `playwright-session` no Codex Desktop **na mesma máquina**
e entrar no RADAR diretamente. A sessão cloud não passou a controlar esse Chrome.
Não solicitar senha/token. Essa orientação foi seguida por pausa e, depois, pela
autorização de continuidade no cloud descrita no último bloco deste documento.

Ferramentas auxiliares estão em `/workspace/scratch/controller-tools`.
O servidor local de orientação usa 4175 em modo local, sem Auth; a árvore isolada
real da auditoria `.radar-snapshot/controller-ui` será servida em 4176 com configuração
Supabase localhost. Não alterar o config.runtime.js versionado para essa preparação.

## Direção vigente após intervenção do usuário — 11/10

**Direção histórica, superada pela autorização cloud no bloco seguinte.** O usuário
apontou o desvio: a missão não é substituir o operador real por uma auditoria cloud
com fixtures. As jornadas locais foram pausadas e não serão utilizadas como prova
de Production. Não retomar a lista local A–N como se fosse o pedido corrente.

Preparação concluída e observações limitadas: [LOCAL_PREPARATION.md](LOCAL_PREPARATION.md).
Nenhum defeito do produto foi confirmado ou corrigido; não houve escrita de Production.
PR de continuidade: [#438](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/438), Draft.

### Retomada pelo Codex Desktop local

1. Abrir o repositório em ambiente **local** do Codex Desktop; obter a branch
   `audit/controller-journey-2026-10-11` sem descartar mudanças locais. Usar worktree
   separada quando necessário. A sessão atual /workspace é cloud.
2. A extensão foi **confirmada instalada pelo usuário**. Link oficial:
   https://chromewebstore.google.com/detail/playwright-extension/mmlmfjhmonkocbjadbfplnigmagldckm
3. A branch contém `.codex/config.toml`, equivalente a `.mcp.json`, para clientes
   Codex que carreguem configuração de projetos confiáveis. Se não carregarem:
   `codex mcp add playwright-session -- npx -y @playwright/mcp@0.0.82 --extension`
   e conferir `codex mcp list`. Reabrir a sessão se necessário para as ferramentas
   aparecerem no turno. Não presumir ativação por arquivo ou por registro CLI.
4. O responsável entra em https://radarpdde-fix.vercel.app diretamente no Chrome.
   Na primeira chamada MCP, aprova a conexão e seleciona essa aba. Nunca enviar
   senha, cookies, storageState, JWT ou token da extensão pelo chat/Git.
5. Provar conexão com snapshot + screenshot **examinado** da tela autenticada,
   identificando perfil, rota, competência e SHA. Não usar tela de login como prova.
6. Iniciar A e prosseguir pelas jornadas reais autorizadas. Reversíveis sintéticas
   em Production exigem estado anterior e cleanup; irreversíveis no descartável.

Não expor CDP/browser pessoal à Internet para contornar a separação cloud/Desktop.
Instalação foi confirmada; seleção de aba/conexão ainda não. O estado ambient de
uma aba aberta não equivale a conexão MCP estabelecida.

## Direção vigente — continuidade cloud autorizada

Após confirmar a extensão, o usuário instruiu: **“pode continuar neste ambiente
mesmo”**. Portanto a pausa principal foi levantada para jornadas na interface
autenticada local preparada. Não esperar migração ao Desktop para prosseguir,
nem chamar os resultados sintéticos de homologação da sessão pessoal/Production.

Recurso integrado encontrado: habilidade Browser do executor. Foi lida antes de
qualquer nova automação; exige ferramenta de execução específica que não consta
do catálogo após duas buscas. Flags de navegador já ativas, socket de gerenciamento
ausente; não há conexão integrada provada. A preparação Playwright MCP isolada
continua disponível como instrumento auxiliar para a UI cloud.

Configuração portátil adicionada: `.codex/config.toml`, mesmos comandos/argumentos
fixados de `.mcp.json`, sem credenciais, hooks ou alterações de políticas. TOML e
equivalência verificados. `codex mcp get` confirma o registro global; não comprova
carregamento do arquivo no Desktop pessoal ou ferramentas no turno aberto.

Próximo passo: retomar A–N pela UI do Controlador local, registrar capturas
examinadas, rede e persistência; corrigir somente defeitos atuais reproduzidos.
Manter checkpoints remotos por avanço material e preservar a massa/resíduos locais
documentados em LOCAL_PREPARATION.md até conferência/cleanup.

Checkpoint de jornadas: [JOURNEYS.md](JOURNEYS.md). Consumo/novo envio/reanálise,
Inventário terminal em segunda sessão, Assessoria e contexto histórico, boleto e
duplo clique de despesa provisória conferidos. A–N ainda parciais. Nenhuma alteração
funcional realizada. Próximas ações: identificação mantendo IDs, ação terminal
protegida, contexto/navegação/agregados/concorrência e clareza dos modais fiscais.
MCP auxiliar apresentou limite de continuidade de modal; usar Playwright nativo do
lockfile no cloud para prosseguir, sem alterar runtime/Auth/RLS. A habilidade do
navegador integrado foi lida, mas sua ferramenta continua indisponível no catálogo.

Achados prioritários: [CAUSAL_FINDINGS.md](CAUSAL_FINDINGS.md). RED real de login
tardio: ações de Pendência/retificação não se instalam após expirar 10s pré-auth.
RED de identidade documental: seis cenários de apresentação. Não confundir RED
com implementação concluída. Revisão independente da instalação em andamento.
