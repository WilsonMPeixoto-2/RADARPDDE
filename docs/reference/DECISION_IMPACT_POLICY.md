# Política transversal de decisões e obrigações do RADAR PDDE

**Vigência de método:** 20/11/2026 · **Escopo:** desenvolvimento de todo o RADAR PDDE, não apenas T0–T6. **Natureza:** governança da mudança, subordinada às decisões funcionais do proprietário e aos contratos canônicos; não modifica automaticamente regras de produção.

## Problema que a política resolve

Uma decisão aprovada pode atravessar **vários chats do Projeto ChatGPT, branches de agentes, PRs, componentes, releases e meses**. Nenhuma entrega isolada comprova que todos os seus efeitos foram aplicados. A decisão não perde vigência por o chat encerrar nem por a etapa de interface, relatório ou teste ser executada depois. O agente executor tem o dever de localizar suas consequências, inclusive negativas: comportamentos que **não podem** voltar a existir.

A autoridade funcional é constituída por `docs/DECISION_LOG.md`, `docs/decisions/*.md`, `docs/reference/SYSTEM_CANONICAL_MODEL.md`, `docs/reference/PRODUCT_SURFACE_CATALOG.md`, matrizes funcionais na sua **fonte JSON**, contratos aprovados e mudanças expressas posteriores. O estado do código e do banco no SHA/ambiente examinado comprova implementação, não revoga silenciosamente uma decisão aprovada que está aguardando implementação.

## Regra de propagação transversal

Toda aprovação material deve conter uma matriz dos **desdobramentos aplicáveis**. Avaliar, sem supor que toda mudança precisa de todos os itens:

| Dimensão | Pergunta obrigatória |
|---|---|
| Domínio e dados | Quais estados, invariantes e vínculos o novo comportamento modifica ou preserva? |
| Banco e autorização | Quais tabelas, migrations, RPCs, RLS, permissões, triggers, versões e auditorias são atingidos? |
| Serviços e sincronização | Qual escritor é autoridade e como o estado converge após gravação, reload, retry e segunda sessão? |
| UI, UX e acessibilidade | Desde a concepção e em paralelo à engenharia, como ações, mensagens, contexto, foco, teclado, temas e layout tornarão a regra compreensível e utilizável? |
| Fluxos relacionados | Há efeitos em NF, Bonificação, Pendências, Assessoria, Inventário, Contatos ou provisória Qualidade? |
| Consultas e exportações | O que muda nas projeções, busca, indicadores, filtros e Excel/relatórios? |
| Testes e provas | Quais testes antigos se tornam inválidos, quais devem ser preservados e quais novos cenários negativos/positivos são exigidos? |
| Comunicação e documentação | Quais manuais, contratos, ADRs, planejamento e instruções para novos agentes precisam refletir a mudança? |
| Releases e compatibilidade | O que pode ser entregue agora, o que fica para etapas futuras e como clientes/versões coexistem? |

**A saída dessa avaliação é um conjunto de obrigações persistentes por área e etapa**, não uma lista única que se torna “concluída” quando algum commit passa no CI. Cada obrigação requer escopo, critério de aceite, responsável/etapa, estado e referência verificável quando concluída. Se uma dimensão não se aplica, justificar o motivo; não ocultá-la como tarefa esquecida.

## Exemplo de coexistência de regras patrimoniais

A decisão histórica de proteger o estado `Inventariada` nas rotinas ordinárias consta do `DECISION_LOG.md` e da ADR-055: edição casual de NF não rebaixa um bem nem apaga inventariação. A flexibilização T0–T6 aprovou **um futuro caminho autorizado de correção explícita** para lançamentos patrimoniais equivocados, inclusive terminais. As regras coexistem durante a transição: proteção antiga nas rotinas ordinárias até substituição comprovada, correção especializada com transação e autorização, e **nada de baixa automática no SIGMA/SEI**. Quando a futura interface for construída, deve respeitar o contrato mais recente **sem perder** as proteções válidas.

O mesmo princípio vale para qualquer decisão: uma melhoria de backend hoje pode exigir tipografia, mensagem, botão, documentação, exportação e testes em outro momento. A dependência não se resolve copiando um layout ou um teste de um SHA antigo.

## Conexão entre chats e agentes — entrada obrigatória

1. **Capturar a aprovação** no próprio turno: texto/alcance, data, origem (permalink do chat quando disponível; caso contrário, registro local fiel e limite de proveniência), decisão anterior afetada e critérios do proprietário.
2. **Consultar decisões existentes** antes de criar uma D/ADR nova: pode ser detalhamento, correção, revisão, supersessão ou proposta já analisada.
3. **Definir os efeitos do futuro**: código, telas, documentação, testes, relatórios e releases atuais/futuras. Identificar o que deve permanecer verdadeiro. Registrar explicitamente `planned` quando uma área ainda não está sendo implementada.
4. **Registrar no GitHub remoto** em conjunto com a alteração. Não deixar a única fonte numa conversa, prompt de agente, pasta temporária ou memória. Chats do ChatGPT **não são automaticamente sincronizados entre si nem com GitHub**.
5. **Retomar pela regra, não pelo agente:** em novo chat, carregar documento canônico, mapa de impactos, SHA atual, decisões supervenientes e obrigações abertas antes de modificar qualquer arquivo. Verificar sua relevância também para telas vizinhas e trabalho futuro.
6. **Validar por camadas e por release:** cada PR descreve obrigações cumpridas e não cumpridas, testes/CI por SHA e aceite humano. Candidato, aprovado e publicado são estados distintos.

### Registro contínuo e passagem de trabalho — reforço de 25/11/2026

A [D023](../continuity/prontuario-t0-t6/D023_CONTINUIDADE_REMOTA_E_USABILIDADE.md) reafirma dois deveres permanentes: continuidade remota e usabilidade humana em paralelo à engenharia. A cada avanço material e antes de transferir a execução ou encerrar a entrega, atualizar a trilha remota existente com decisões e regras recebidas, prioridades, alternativas adotadas ou descartadas e seu motivo, autorizações já concedidas, branch/PR/SHA, testes executados e seus resultados, limites da prova, estado das tarefas e próximo passo concreto. Não esperar o esgotamento da cota do agente para registrar trabalho recuperável.

Reutilizar registro, checkpoint e evidências da frente, sem criar fontes concorrentes nem registrar cada chamada de ferramenta. Confirmar a gravação remota antes de afirmar que o trabalho está disponível ao próximo agente; quando não for possível, declarar precisamente o que ainda não foi sincronizado. A troca de agente não invalida decisões ou autorizações anteriores dentro do alcance registrado. Preservar resultados negativos e separar **proposto, implementado, testado, inspecionado, aceito e publicado**.

O sucessor deve conseguir responder, a partir do GitHub: qual objetivo está vigente, qual regra o governa, o que mudou, por que mudou, em qual versão, quais provas existem, o que permanece incerto e qual ação vem a seguir. Referências a evidências privadas devem respeitar o acesso autorizado; não publicar credenciais, documentos ou dados escolares identificáveis. Uma atualização exclusivamente documental não exige repetir testes funcionais já válidos nem produzir ciclos de commits apenas para registrar o próprio SHA.

O catálogo `docs/continuity/prontuario-t0-t6/decision-impact.json` é a **primeira implantação** desta política; decisões e obrigações atuais estão na sua fonte estruturada, inclusive as que atravessam releases. `npm run decisions:impact -- --query --phase=T5 --surface=ui` consulta os compromissos pertinentes. O catálogo **não cobre exaustivamente todos os ADRs ou todos os chats históricos do RADAR**; cada frente deverá adotar o mesmo padrão sem criar um segundo contrato concorrente.

## Consistência na revisão de PRs e entre branches

Uma revisão não verifica só se o código compila. Para as superfícies alteradas, deve confrontar decisões anteriores e supervenientes, identificar ações/campos/serviços/testes que continuam sob regra antiga, e classificar cada divergência como **mantida intencionalmente**, **substituída e comprovada**, **pendente futura**, **proposta não aprovada** ou **defeito**. Importar cherry-pick de outra branch não significa aprovar sua interpretação do contrato.

Quando uma mudança de regra exigir implementação distribuída, o PR atual pode entregar apenas a parte autorizada desde que registre o restante de modo que o próximo agente seja obrigado a consultá-lo. Para evitar regressões ocultas, preservar testes negativos de autoridade e vizinhos. Atualizar **as fontes JSON geradoras** da matriz funcional antes de editar seu Markdown gerado.

## Limite das ferramentas de automação

O script `check-prontuario-impact.mjs` verifica vínculos, IDs, existência de arquivos e estados; **não interpreta automaticamente todos os documentos, conversas ou semântica das telas**. CI verde não prova que toda aprovação foi recuperada, que o layout representa a regra ou que o sistema institucional foi atualizado. Estas provas continuam sendo exigências independentes.

**Fronteiras:** a evolução funcional T0–T6, a manutenção de ferramentas/dependências e a operação de auditoria documental com dados institucionais continuam independentes. Uma aprovação de governança transversal não autoriza alteração de dados reais, migrations remotas, deploy ou acesso à documentação das escolas.
