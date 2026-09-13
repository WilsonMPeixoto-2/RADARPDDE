# UAT operacional pós-release — RADAR PDDE

Data: 13/09/2026. Registro incremental, não constitui nova regra canônica.

## Estado atual

- Prioridade de Wilson: verificar acesso e jornadas reais, confirmação visual, gravação Supabase e recuperação após reload. Observabilidade/capacidade/dependências ficam depois da saúde operacional.
- Base funcional publicada: PR #300 / `1a149174`. Main observada em `a2e961a` (PR #302, somente seis arquivos documentais). PR #301 Draft, branch `test/operational-uat-supabase-2026-09-13`, HEAD inicial desta retomada `4a7a41d`.
- Próximo: ampliar UAT de formulários reais para modalidades de notas, Assessoria, Pendências, identificação, Inventário, falha de gravação e navegação temporal; preservar evidências de sucesso também.
- Nenhuma escrita operacional em Production autorizada/executada nesta retomada. Ensaios de gravação usam Supabase descartável do workflow.

## Bloco 1 — contraprova do checkpoint recebido

O relatório recebido apontava `920c7230` e expectativa visual errada. O GitHub já contém `4a7a41d`: a classe foi corrigida e a consulta remota aguarda convergência. [Ciclos 34772406774](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/34772406774), job 103764308511: **5 aprovados em 26,8 s**. Inclui dois UAT (login/contexto/auditoria; avaliação UI/banco/storage/reload), reanálise autenticada, ciclo de nota e persistência de avaliação. Não repetir a correção já feita.

A revisão de `supabase-operational-uat.spec.js` confirma entrada por formulário real, observação HTTP, ausência de logs no bootstrap e consulta explícita ordenada/limitada da Auditoria. O segundo cenário aciona Sim/Correto e compara Supabase/reload. Outros testes reais existentes contêm chamadas diretas a serviços; são prova de persistência, mas não de toda a encontrabilidade/interação visual pedida por Wilson.

`Homologação integral pré-production` falhou no job 103764291088 ao regenerar tipos: container exit 125. A pilha já havia passado o lint do schema; houve rate limits no registry. Classificação: falha de infraestrutura, sem evidência de defeito operacional nesse ponto. Lighthouse também está vermelho e será tratado após as jornadas funcionais, sem esconder o resultado.

A aplicação oficial abriu no navegador e exibiu o formulário institucional e a mensagem estável “Entre para acessar o RADAR PDDE.”. Não havia sessão autenticada disponível nesse navegador. Abrir o manifesto pelo navegador foi bloqueado pelo cliente; isso não prova indisponibilidade do site nem falha do produto.

## Provas e limites de liberação

- Não confundir site READY, monitor verde, login visível ou teste de serviço com usuário autenticado executando todos os formulários.
- Critério por jornada: ação UI → commit confirmado → registro/relacionamentos remotos → UI imediata → reload/contexto → mesma verdade.
- Não restaurar artefatos do PR #299 que foram deliberadamente retirados na reconciliação posterior. O diário antigo pertence à base anterior e não será publicado sobre a nova fase.
- As novas provas serão registradas neste arquivo antes de cada bloco seguinte.

## Bloco 2 — ampliação das jornadas, antes de executar

Incluídos quatro cenários adicionais no UAT: consumo (cadastro/análise/retificação/exclusão), serviço/Assessoria com duas notas e dois ciclos de reanálise, a identificar com retificação/vínculo/identificação e Boleto de Internet. Todas as mutações partem dos formulários reais; consultas diretas são somente verificações do resultado, com filtros e limite. Uma escola e Educação Conectada são provisionadas exclusivamente por SQL de fixture no PostgreSQL local de CI, sem migration e sem Production.

O workflow passa a preservar artefatos de sucesso, não apenas falha. Cada nova jornada também observa ausência de GET de logs e de leituras sem contexto durante operações. A existência do teste ainda não é aprovação: aguardar sua execução e distinguir falha de produto de erro de fixture/asserção.

**Lacuna Production confirmada:** monitor autenticado agendado 34768480715 está verde, mas a etapa “Cinco perfis × seis leituras reais” foi **ignorada**. O job executado foi “Provisionamento protegido pendente”. Logo, esse verde não prova login de usuários no site oficial. Não criar contas nem acessar secrets para contornar esse estado.
