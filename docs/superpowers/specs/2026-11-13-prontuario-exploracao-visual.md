# Prontuário — avaliação mensal, documentos e regularização

**Classe:** estudo exploratório de design e usabilidade, datado e não canônico.  
**Data:** 13/11/2026, Brasília.  
**Estado:** proposta para avaliação visual do proprietário, sem aprovação de implementação.  
**Base de código conferida:** `main@190e44942d0bb6927d1a7eeb83fb94fc782171b8`.  
**Escopo autorizado:** examinar o produto, registrar a análise remotamente e gerar conceitos visuais. Não alterar código da aplicação, banco, permissões, PRs de implementação ou Production.

## 1. Objetivo e conclusão

Tornar o Prontuário um ambiente de trabalho claro e refinado para os Controladores lançarem bonificação e análise técnica, compreenderem os vínculos das despesas e conduzirem Pendências. A melhoria precisa abranger a entrada, os detalhes e os formulários subsequentes. Uma página inicial bonita seguida por formulários com outra hierarquia não resolve a jornada.

A direção recomendada mantém a avaliação matricial, melhora a composição por programa e oferece aprofundamento contextual por documento. O princípio é **mostrar contexto, avaliação, providência e consequência no lugar em que o usuário decide**.

Não se propõe fundir bonificação e análise, criar uma aprovação geral da escola ou obrigar o operador a percorrer etapas sequenciais. A operação continua baseada nas mesmas entidades e autoridades. O refinamento é expressivo, mas exige trabalho de interação e composição além de CSS.

Referências fornecidas pelo proprietário: a faixa “Saídas sem ação definida” e o card flutuante de programa. Interpretam-se como preferência por hierarquia elegante, lilás discreto, superfícies de apoio bem desenhadas e explicações contextuais. Não são autorização para colocar todas as informações em balões ou todos os controles em cards.

## 2. Evidência, método e limites

Foram lidos o roteador AGENTS, modelo canônico, catálogo de superfícies, CURRENT_STAGE, método de engenharia, gate de frontend, classificação documental, matriz funcional e suas operações relevantes, ADR-055 e ADR-056. CURRENT_STAGE contém checkpoints anteriores ao SHA consultado. Esses checkpoints não foram tratados como estado remoto atual.

A análise foi confrontada com `app.js`, `index.html`, domínio operacional, integrações de Prontuário, avaliação, retificação, Pendências e Qualidade. Foi usada uma cópia isolada do SHA, sem editar os arquivos de produto.

Também foram renderizados três estados no Chromium com **código real da base, em localhost, modo local e dados de fixture**, viewport **1440 × 1000 CSS px**: grade, abertura de Pendência a partir de Incorreto e reanálise de despesa identificada. A preparação dos dados usou o suporte de testes e os serviços locais; a abertura dos formulários usou seus controles reais. Capturas foram refeitas após estabilizar as transições, para não confundir uma imagem intermediária de animação com transparência defeituosa. Não houve erros JavaScript reportados nessa reprodução.

Essas capturas são evidência de apresentação local. **Não são uma nova homologação autenticada de Production, nem prova de persistência Supabase ou de todos os perfis.** O estudo não executou CRUD institucional, migrations, exportações auditadas ou novo deploy. A captura anterior do painel Qualidade foi considerada somente como referência de composição; a faixa remota depende de cliente Supabase e capacidade reais.

Os conceitos gerados têm dados fictícios e não são screenshots executáveis. Não demonstram foco, contraste final, autorização ou persistência. O documento, os contratos atuais e a aprovação futura precisam prevalecer sobre qualquer simplificação do desenho gerado.

## 3. Alternativas consideradas

| Alternativa | Benefício | Custo ou limite | Avaliação |
|---|---|---|---|
| Polir a tabela atual, mantendo toda a estrutura | Menor intervenção e familiaridade | Conserva espaços desproporcionais e separação pouco clara entre resumo e operação | Útil como primeira entrega, insuficiente como visão completa |
| Avaliação matricial por programa com detalhe contextual do documento | Preserva comparação; aproxima identidade, análise, Pendência e vínculos | Exige reorganização controlada de componentes e navegação | **Direção recomendada pelo autor, ainda não aprovada pelo proprietário** |
| Assistente sequencial para bonificação → análise → Pendência | Pode parecer simples no caminho inicial | Induz dependência falsa, atrapalha retornos e casos paralelos | Não recomendado |

Não será criado um novo painel geral de indicadores. A escola e os documentos são o conteúdo principal desta superfície. Indicadores entram apenas quando ajudam a escolher uma ação existente.

## 4. Contratos que o desenho deve tornar compreensíveis

| Fato do produto | Representação proposta | Proteção necessária |
|---|---|---|
| Escola + competência + programa definem a avaliação | Contexto compacto e persistente antes da grade e de cada formulário | Preservar RadarCompetenceContext, retorno, foco e scroll; não criar mês local concorrente |
| Bonificação e análise técnica são dimensões independentes | Colunas e resumos separados com rótulos completos | Nenhum semáforo único de “escola aprovada” |
| Bonificação é editada diretamente em seus controles | Sim/Não e N/A quando aplicável; feedback junto à linha | Não adicionar salvamento geral; preservar clique repetido que desfaz marcação quando permitido e bloqueios existentes |
| Nem todo documento admite N/A | Mesma família visual, opções conforme documento | Extratos não ganham N/A apenas por uniformização |
| Declaração BB Ágil em N/A tem análise efetiva Correto | Exibir Correto, com explicação contextual da regra | Não inventar estado técnico “Não se aplica”; regra em fluxo-operacional.js |
| Consulta Assessoria possui resumo derivado | Valor agregado marcado como calculado e controles na NF de serviço | Não converter resumo em novo controle manual |
| Notas Fiscais têm bonificação agregada e análise individual | Marcação agregada no cabeçalho; situação e ações em cada NF | Preservar registered_invoice_id; não atribuir a todas as NFs uma análise compartilhada |
| Despesas continuam operáveis após consolidação | Explicação discreta quando relevante | ADR-055: não desbloquear bonificação nem limpar resultado consolidado como efeito da despesa |
| Incorreto abre Pendência atomicamente no fluxo correspondente | Um formulário e uma confirmação explícita do efeito conjunto | Cancelar não grava Incorreto solto; reutilizar autoridade atômica |
| Novo envio não resolve | Mostrar Aguardando reanálise como resultado esperado | Não anunciar Resolvida ou marcar sucesso técnico antes de reanálise |
| Reanálise pertence à tentativa válida mais recente | Identidade do documento, envio e apontamento anterior ao lado da decisão | Validar estado, vínculo e versões no serviço; interface não decide elegibilidade sozinha |
| Retificação de lançamento não é regularização | Formulário próprio com Antes → Depois, justificativa e efeito de anulação | Pendência anulada fica Cancelada, com histórico, e não Resolvida por documento novo |
| Qualidade sem Ação Integrada conhecida é provisório próprio | Faixa da conta acima dos programas e detalhe com seleção da ação | Não criar NF ou Pendência antes da identificação; não confundir com a_identificar de programa conhecido |
| a_identificar de programa conhecido já é despesa individual | Identificação pelo novo envio da mesma despesa/Pendência | Preservar IDs e efeitos; novo registro nasce Incorreto + Pendência, sem fabricar backfill legado |
| Patrimônio e Assessoria têm ciclos próprios | Relações identificadas pela NF, com seus próprios estados | NF A não bloqueia NF B; Inventariada permanece terminal |
| Perfil define operação; carteira organiza trabalho | Ações conforme capacidade e estado do registro | ADR-056: não acrescentar impedimento por responsável/carteira escolar |

## 5. Oportunidades de composição e encontrabilidade

### 5.1 Cabeçalho e orientação

Na reprodução, o cabeçalho escolar permanece grande mesmo durante a leitura da avaliação. O nome da unidade, a apresentação textual e os botões cadastrais disputam espaço vertical com o trabalho.

Proposta: uma identidade escolar compacta, com nome em até duas linhas, código em metadado e ações cadastrais discretas. Depois de rolar, manter apenas contexto necessário, não todo o bloco inicial. Preservar voltar à origem e próxima unidade. A captura conceitual simplifica a navegação global; isso não autoriza retirar busca, exercício, alertas, sair, Guia do Controlador ou outros destinos existentes.

Separar **abas de consulta** de **ações**. Gerar comunicação e Registrar contato não devem parecer abas. O histórico de contatos continua acessível e preserva todos os seus campos. Contadores só aparecem com dados disponíveis e definição inequívoca; não inventar números para preencher o layout.

### 5.2 Competência e programas

Manter seleção da competência inequívoca, sem duplicação de estado. A régua pode mostrar um pequeno indicador de Pendências ativas, acompanhado por texto ou popover com contagem e escopo. Esse indicador é uma nova projeção de apresentação a validar, não uma nova regra de aptidão. Mês selecionado, mês futuro, fora do escopo, sem dados e mês com Pendência precisam ser diferentes.

Não atribuir a cada mês uma única cor baseada em bonificação, análise e Pendências misturadas. A cor verde não pode sugerir ausência de problemas em todas as dimensões.

Cada programa ganha cabeçalho horizontal compacto com seus dois resumos independentes. Preservar a ordem vigente: Básico antes de Qualidade/Equidade e Educação Conectada antes de Escola das Adolescências. A proposta não depende de esconder todos os demais programas numa aba. Pode haver índice de atalhos por âncoras e recolhimento explícito, com estado e pendências visíveis, após aprovação específica da interação.

### 5.3 Grade de bonificação e análise

Substituir a grande célula vertical de contexto por cabeçalho de programa é a mudança estrutural central. Isso devolve largura aos documentos e controles. Usar quatro eixos visuais claros: Documento, Bonificação, Análise técnica e Providência.

Uniformizar altura, borda, tipografia e foco dos controles. A consistência é visual; as opções e permissões permanecem específicas. Um botão selecionado não pode depender apenas de cor. Estados calculados precisam ter aparência de leitura, não de controles desabilitados sem explicação.

Consolidar bonificação fica associado ao programa e explicitamente nomeado. Não criar um botão geral Salvar que sugira que os cliques anteriores ainda estão pendentes. Diferenciar Não preenchido, Não, Não se aplica e Não analisado. Explicação do bloqueio deve ser curta e visível ou acessível por foco/clique, com motivo real do estado.

A opção Correto (Atrasado) continua disponível ou exigida segundo as regras de consolidação/entrega. Não pode desaparecer para encurtar o seletor. Competência futura mantém consulta e restrições existentes, sem induzir lançamentos por novo componente.

### 5.4 Notas Fiscais e relações

O componente atual já individualiza NF, Assessoria e vínculos patrimoniais. A oportunidade é aproximar visualmente essas relações e reduzir superfícies vazias grandes.

Usar linhas de documento com número, descrição, tipo, valor, situação e ação. Expandir detalhes apenas quando necessário. Na NF de serviço, uma região “Relações deste documento” pode apresentar a avaliação fiscal e Consulta Assessoria em linhas independentes. Na NF permanente, mostrar o bem e encaminhamento vinculados. A existência de relação não autoriza transferir a autoridade da operação para outro serviço.

Proposta de painel contextual para a Pendência: identidade, situação, próximo responsável, apontamentos, último envio, histórico e ação elegível. Usar a superfície contextual existente como base. Não abrir um novo drawer paralelo ao drawer já existente. No desktop, uma região complementar de consulta não deve se comportar como modal; formulários de escrita podem permanecer modais.

**Evitar duplicação:** quando o detalhe estiver aberto, concentrar a ação principal nele; o item selecionado indica foco. Ao fechar o detalhe, a ação contextual retorna à linha. O mesmo comando pode ter pontos de entrada alternativos em superfícies diferentes, mas não dois botões primários concorrentes no mesmo campo visual.

Não fixar “Reanalisar” para todos os casos. A ação deriva do estado, da tentativa e da capacidade. Manter Visualizar pendência e acesso ao histórico mesmo quando não há escrita elegível. Erros longos quebram por palavras, sem truncamento que oculte o problema.

### 5.5 Cards flutuantes

Aplicações úteis: significado de bonificação versus análise, explicação de um resumo derivado, vínculos de uma NF e motivo de indisponibilidade de uma opção. Sempre apresentar contexto de competência/programa quando necessário.

Informação essencial e ação principal permanecem no fluxo. Popover abre por foco e clique, além de hover quando apropriado; fecha com Escape, retorna foco, respeita limites do viewport e não cobre o comando seguinte. Se possuir ação, deve ter semântica e navegação de popover, não tooltip puramente textual. Uma única superfície flutuante por vez. Reutilizar a infraestrutura existente de posicionamento, sem adotar dependência só pela aparência.

### 5.6 Abrir Pendência a partir de Incorreto

O formulário existente já oferece apontamentos e observações. No conceito, ele é dividido em área de preenchimento e resumo do efeito. A identidade do documento permanece visível. Seleção de erros em grade legível, sem bolinhas externas ou cartões deformados.

No fluxo atômico, o comando proposto “Registrar análise e abrir pendência” descreve o efeito real. Esta redação não deve ser aplicada automaticamente ao formulário de Pendência manual independente. Preservar campos e escolhas específicos desse segundo fluxo, inclusive responsável quando aplicável. Não pré-selecionar erros por conveniência estética.

### 5.7 Novo envio e identificação

Manter data de disponibilização, observação obrigatória e link opcional. O sistema registra uma disponibilização no Drive; o design não inventa upload ou validação do conteúdo remoto. Campo de link não equivale a arquivo conferido.

Resumo lateral deve mostrar o efeito esperado Aguardando reanálise e a providência do Controlador. Para a_identificar, manter os campos adicionais de identificação e suas validações: natureza, número/referência, descrição e valor; boleto de Internet apenas no programa elegível. Preservar o mesmo registro e Pendência.

No provisório Qualidade, a ação é outra: selecionar a Ação Integrada vinculada e identificar pelo formulário fiscal. O registro provisório e o documento resultante conservam seus vínculos próprios. Não reutilizar o novo envio de uma Pendência que ainda não existe.

### 5.8 Reanálise

Na captura estabilizada de 1440 × 1000, a identidade, o envio e o contexto ocupam grande parte do modal antes do resultado. A observação fica abaixo da área inicialmente visível. Isso é uma oportunidade de reduzir deslocamento e comparar evidência com decisão, não prova de ausência do campo.

Proposta: esquerda para documento, último envio, apontamento anterior e histórico; direita para decisão, observação e consequência prevista. Em espaço menor, as regiões passam para uma coluna, com rolagem interna e ações acessíveis.

Três opções visíveis em seleção única podem substituir o dropdown: Documento correto, Documento ainda incorreto, Arquivo não localizado ou inacessível. Isso é uma alteração de interação que preserva os mesmos valores do contrato e precisa de testes de teclado e validação. Nenhuma opção será selecionada automaticamente na abertura.

Ao escolher Incorreto, revelar os erros exigidos. Arquivo indisponível não equivale a uma avaliação do conteúdo. O bloco “Após confirmar” é previsão de efeito e deve usar linguagem futura; sucesso só depois da resposta autoritativa. No caso fiscal ilustrado, a bonificação consolidada permanece preservada.

### 5.9 Editar análise e corrigir lançamento fiscal

Retificação de análise genérica deve mostrar Antes → Depois, contexto, justificativa e declaração de confirmação quando a anulação de Pendência for aplicável. Manter resultado Cancelada com identificação Anulada por edição da avaliação. Não confundir com Resolvida. O botão continua bloqueado enquanto faltar confirmação exigida.

O formulário de editar lançamento fiscal permanece distinto. Exibir “Você pode corrigir” com os campos efetivamente elegíveis; dados protegidos explicam o motivo específico. Mudança de classificação, quando permitida, conserva confirmação e comparação dos efeitos de patrimônio/Assessoria. Não oferecer o formulário genérico de retificação para substituir a análise individual de NF ou Assessoria.

Excluir não acompanha a ação principal como um ícone sempre disponível. Continua dependente da ausência de histórico individual e de patrimônio terminal, com confirmação adequada ao contrato atual. O desenho não cria atalhos de exclusão nem flexibiliza guards.

### 5.10 Contatos, capital e histórico

Aplicar o mesmo sistema de títulos, linhas, contexto e ações sem trocar suas funções. Contato registra comunicação; não prova recebimento de documento. Capital mantém NF/bem/processo/status; não vira editor indiscriminado do patrimônio. Histórico cronológico mantém eventos datados e autoria, não um checklist com etapas concluídas inventadas. Registros Internos conserva seu recorte autorizado.

Contagens são específicas por aba: contatos, bens, Pendências ou eventos não podem compartilhar um número global. Uma pendência fiscal e uma de Assessoria da mesma NF são entidades distintas; contagem precisa explicitar o que conta.

## 6. Direção de arte

**Intenção:** precisão editorial e tranquilidade para trabalho prolongado. O destaque fica na informação e na decisão, com identidade institucional reconhecível.

| Elemento | Proposta inicial a medir no protótipo |
|---|---|
| Fundo | Branco quente `#FAFAFC`; superfícies brancas opacas |
| Texto | Tinta `#252133`; secundário `#686477`, sem reduzir opacidade indiscriminadamente |
| Identidade e seleção | Roxo `#6335B5`, concentrado em ação primária, foco, seleção e poucos acentos |
| Estados | Verde para correto/resolvido, vermelho para incorreto, azul para aguardando reanálise, âmbar para atenção; sempre acompanhados de texto e símbolo |
| Tipografia | Preservar Outfit e Plus Jakarta Sans existentes; títulos 24–28 px, seções 18–20 px, texto operacional 14–16 px, metadados 12–13 px |
| Ritmo | Escala 4/8/12/16/24/32 px; texto alinhado por coluna e baseline |
| Controles | Altura inicial 36–40 px no desktop; foco visível; valores monetários com números tabulares |
| Raios | 10–12 px em superfícies; moderados nos campos; pills principalmente para status curtos |
| Elevação | Linhas e diferenças tonais para hierarquia normal; sombra suave apenas em popover, drawer e modal |
| Ícones | Inventariar a família existente, harmonizar traços e escala; sem biblioteca nova nesta etapa |
| Movimento | Discreto e breve; respeitar redução de movimento; não atrasar ação nem usar animação como confirmação de gravação |

Estes valores são decisões propostas pelo autor, não tokens já aprovados. Conferir contraste nos pares efetivos, incluindo hover, seleção, erro e desabilitado. A imagem gerada não comprova acessibilidade. Preservar a marca original na implementação; a palavra RADAR nas pranchas não é proposta de novo logotipo.

Não recorrer a fotos de escola, decoração volumosa, transparência de formulários, gradientes fortes ou caixas dentro de caixas para produzir a impressão de refinamento. Respiro deve favorecer a comparação sem aumentar desnecessariamente a rolagem. O vazio de NF/Assessoria pode ser uma linha de orientação com ação válida em vez de uma grande área sem informação.

## 7. Pranchas conceituais

1. Avaliação mensal: contexto compacto, faixa Qualidade, régua, cabeçalho de programa e matriz com seis documentos.
2. Detalhe fiscal: NF e relações individuais, popover explicativo e painel contextual de Pendência.
3. Análise incorreta: apontamentos, observação e efeito atômico da confirmação.
4. Reanálise: último envio e decisão lado a lado, com previsão explícita do resultado.
5. Novo envio: campos de disponibilização e passagem para Aguardando reanálise.
6. Retificação: Antes → Depois, justificativa, confirmação e efeito de anulação.

As pranchas mostram estados diferentes da jornada. Não são um único snapshot de dados simultâneos. Texto de exemplo, escola, valores e datas são fictícios. Um fundo desfocado não é uma segunda referência de estado operacional. Detalhes de geração não prevalecem sobre este documento.

Na revisão visual foram corrigidas as duas primeiras pranchas: BB Ágil N/A agora mostra Correto; o item fiscal em foco deixa de duplicar Reanalisar com o painel aberto. As versões revisadas são a referência desta entrega. Uma revisão independente também confirmou as distinções de BB Ágil, bonificação, reanálise/retificação e Qualidade provisória, sem apontar impedimento material para avaliar esta direção exploratória. Isso não constitui aprovação de implementação.

## 8. Implementação futura delimitada, se aprovada

Não começar por reescrever serviços, schema ou framework. As autoridades atuais continuam intactas. A proposta ainda não é um plano executável aprovado.

Sequência sugerida:

1. Homologar a composição principal e os seis estados, com preferência visual explícita do proprietário.
2. Produzir protótipo navegável isolado com os renderizadores reais e dados sintéticos representativos. Preservar componentes e IDs funcionais até mapear consumidores; classes e DOM podem evoluir conscientemente, não virar invariantes por acaso.
3. Primeiro lote: contexto, cabeçalho de programa, escala tipográfica, controles e vazios. Não misturar alterações em PRs ativos de Pendências.
4. Segundo lote: detalhe fiscal, vínculos e explicações contextuais, preservando handlers e superfícies existentes.
5. Terceiro lote: família de formulários, contemplando abertura, envio, reanálise e retificação juntos, com as diferenças funcionais explícitas.
6. Publicação somente após solicitação/autorização correspondente e homologação da versão candidata. Este pedido atual autoriza documentação e imagens.

A existência de Preview sem Supabase não basta para homologar operações que precisam do backend. O Preview de jornada deve usar Supabase descartável quando houver escrita. Não remover guards remotos para fazer o componente aparecer.

## 9. Critérios de aceitação do futuro candidato

### Percepção humana

- Sem conhecer o código, reconhecer escola, competência, programa, documento e situação.
- Encontrar a próxima ação válida e compreender seu efeito antes de confirmar.
- Distinguir entrega para bonificação, qualidade técnica e estado da Pendência.
- Encontrar resultado, motivo de bloqueio, erro, histórico e retorno ao item original.
- Comparar evidência e decisão sem depender de lembrar um bloco que saiu da tela.
- Preservar descrições e erros longos, nomes de escola em duas linhas, múltiplas NFs e muitos programas.

### Jornadas materiais

| Jornada | Prova exigida |
|---|---|
| Bonificação | Sim/Não/N/A aplicável, desfazer permitido, consolidação e restrição própria preservados |
| BB Ágil N/A | Análise efetiva Correto e restrição correspondente, sem novo enum |
| Incorreto | Confirmar grava análise e Pendência atomicamente; cancelar preserva estado anterior |
| NF A e B | Pendência ou Assessoria da A não bloqueia nem altera B |
| Novo envio | Persistir tentativa e Aguardando reanálise; não resolver |
| Reanálise | Três resultados, erros condicionais, última tentativa e versão válidas |
| Retificação | Justificativa e confirmação, Cancelada por anulação e histórico íntegro |
| Despesa consolidada | Fluxos fiscais continuam disponíveis sem mudar resultadoBonif |
| Qualidade provisória | Reencontrar saída, editar dados conhecidos e identificar uma vez com vínculo correto |
| Classificação/Inventário | Edição elegível mantém efeitos; Inventariada não regride |
| Falha/conflito | Preservar formulário; não duplicar escrita; separar erro de commit confirmado com sincronização pendente |
| Navegação/perfil | Retorno, foco e scroll preservados; capacidades existentes e colaboração transversal mantidas |

Desktop prioritário: 1280×720, 1440×900 e 1920×1080 CSS px, incluindo zoom relevante. Validar teclado, Escape, popover, fechamento e retorno de foco; formas de escrita são modais e consulta contextual pode ser complementar. Na redução de largura, manter todos os controles e permitir rolagem interna onde apropriado. Não impor que toda tabela caiba sem scroll.

Testes devem proteger comportamentos aprovados e integridade, não congelar geometria ou seletor antigo. Atualizar expectativas visuais somente após aceitar a mudança deliberada. CI verde não substitui captura navegada e julgamento artístico. A análise atual não executa nem declara aprovados esses gates futuros.

## 10. Pontos de implementação e evidência no SHA analisado

Todos os links abaixo fixam o SHA para preservar a rastreabilidade desta análise.

- [Grade, documentos, NF e Assessoria em app.js](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/190e44942d0bb6927d1a7eeb83fb94fc782171b8/app.js#L10262): seis documentos, capacidades, condições e ações individuais.
- [Reanálise em app.js](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/190e44942d0bb6927d1a7eeb83fb94fc782171b8/app.js#L9093): abertura, última tentativa e integração com serviço.
- [Formulários em index.html](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/190e44942d0bb6927d1a7eeb83fb94fc782171b8/index.html#L455): abertura, envio e reanálise.
- [Domínio operacional](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/190e44942d0bb6927d1a7eeb83fb94fc782171b8/src/domain/fluxo-operacional.js#L130): status de bonificação, BB Ágil e estado efetivo.
- [Integração de UX do Prontuário](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/190e44942d0bb6927d1a7eeb83fb94fc782171b8/src/integration/prontuario-operational-ux.js): ordem dos programas, vínculos patrimoniais, competência futura e Correto (Atrasado).
- [Retificação de avaliação](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/190e44942d0bb6927d1a7eeb83fb94fc782171b8/src/integration/evaluation-retification-ui.js#L225): comparação, impacto, confirmação, justificativa e feedback.
- [Abertura atômica](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/190e44942d0bb6927d1a7eeb83fb94fc782171b8/src/integration/atomic-analysis-pendency.js): coordenação da análise Incorreto com a Pendência.
- [Qualidade provisória](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/190e44942d0bb6927d1a7eeb83fb94fc782171b8/src/integration/quality-provisional-ux.js): conta, programa, registro e identificação.
- [Independência de despesas](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/190e44942d0bb6927d1a7eeb83fb94fc782171b8/docs/decisions/ADR-055-independencia-despesas-bonificacao.md) e [colaboração transversal](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/190e44942d0bb6927d1a7eeb83fb94fc782171b8/docs/DECISION_LOG.md#L755).

Operações relacionadas: VER-01–04, INV-01–04, PEND-01–03 e READ-03. Consultar serviços e matriz vigentes novamente antes de implementar. As migrations versionadas descrevem contratos de backend; este estudo não afirma ter auditado o schema remoto atual.

## 11. Encerramento do estudo

Entrega autorizada: diagnóstico fundamentado, direção artística, alternativas, mapa de oportunidades por estado, invariantes e conceitos visuais. Sem implementação, merge, deploy ou alteração institucional. Não se modifica CURRENT_STAGE nem o catálogo canônico para apresentar uma proposta ainda não aprovada como realidade do produto.
