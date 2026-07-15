# Contratos transversais de experiência do RADAR PDDE

## Objetivo

Definir capacidades e comportamentos comuns sem escolher framework ou biblioteca. Estes contratos preservam os melhores padrões atuais e orientam a consolidação futura.

## Regras gerais

- preservar formulário após falha;
- impedir duplo envio;
- encerrar loading em `finally`;
- usar feedback não bloqueante para sucesso e informação;
- usar diálogo explícito para ação crítica;
- manter foco previsível e restaurado;
- diferenciar rede, sessão, RLS, conflito, validação e indisponibilidade;
- manter equivalência funcional entre modo local e Supabase.

## C-01 — Loading

### Finalidade

Comunicar operação em andamento sem apagar contexto nem bloquear mais do que o necessário.

### Estados

inativo; inicial; em andamento; parcial; concluído; falhou

### Comportamento

Ativar somente após ação confirmada; manter conteúdo anterior quando seguro; impedir duplo envio; encerrar em `finally`.

### Conteúdo e linguagem

Verbo e objeto: “Salvando pendência…”, “Carregando carteira…”. Evitar “Aguarde” sem contexto.

### Acessibilidade

`aria-busy` no contêiner; status em `aria-live=polite`; foco permanece no controle salvo, salvo navegação.

### Recuperação

Erro oferece tentar novamente ou retornar; dados preenchidos permanecem.

### Evidência atual correta

Serviços de dados e formulários recentes desligam loading após falha.

### Inconsistências observadas

Não há indicador e bloqueio uniformes em todos os formulários.

### Critério de aceite futuro

Nenhuma operação fica presa; duplo envio impossível; estado anterior preservado.

## C-02 — Sucesso

### Finalidade

Confirmar conclusão sem interromper o fluxo.

### Estados

mensagem breve; confirmação persistente quando há consequência posterior

### Comportamento

Toast/região de status não bloqueante; indicar o que mudou e próxima ação quando útil.

### Conteúdo e linguagem

“Pendência registrada. A escola agora aparece em Abertas.”

### Acessibilidade

`role=status`; não mover foco automaticamente; duração suficiente e opção de fechamento.

### Recuperação

Quando houver ação reversível, oferecer desfazer ou link para o registro.

### Evidência atual correta

Alguns fluxos usam `showPendencyNotice`.

### Inconsistências observadas

Configurações ainda usam `alert` de sucesso.

### Critério de aceite futuro

Mensagem específica, não bloqueante e vinculada ao resultado real.

## C-03 — Erro

### Finalidade

Explicar falha, preservar trabalho e orientar recuperação.

### Estados

validação; rede; sessão; RLS; conflito; transação; indisponibilidade; desconhecido

### Comportamento

Mapear código técnico para mensagem funcional; mostrar no contexto do formulário ou página.

### Conteúdo e linguagem

Indicar ação, causa compreensível e próximo passo; nunca expor stack ou segredo.

### Acessibilidade

`role=alert` para falha crítica; foco no primeiro erro ou resumo; associação por `aria-describedby`.

### Recuperação

Tentar novamente apenas em leitura segura; autenticar, recarregar ou revisar campo conforme tipo.

### Evidência atual correta

`error-mapper.js` e `data-error-ux.spec.js` demonstram padrão forte.

### Inconsistências observadas

Padrão não está aplicado uniformemente às telas legadas.

### Critério de aceite futuro

Formulário preservado; foco previsível; mensagem específica para cada classe.

## C-04 — Alerta

### Finalidade

Antecipar condição relevante sem tratar como erro.

### Estados

informativo; atenção; prazo; dependência; risco

### Comportamento

Exibir antes da ação quando influencia decisão; não impedir salvo regra explícita.

### Conteúdo e linguagem

Explicar condição e consequência: “O processo de inventário não está cadastrado; o bem não poderá ser tombado.”

### Acessibilidade

ícone acompanhado de texto; contraste; `role=status` ou `alert` conforme urgência.

### Recuperação

Link para resolver a condição ou continuar conscientemente.

### Evidência atual correta

Avisos de nota de serviço e inventário existem.

### Inconsistências observadas

Muitos são `alert()` bloqueantes e não preservam contexto visual.

### Critério de aceite futuro

Usuário entende risco e ação sem perder formulário.

## C-05 — Confirmação crítica

### Finalidade

Evitar exclusão, cancelamento ou mudança irreversível acidental.

### Estados

aberta; confirmada; cancelada; erro

### Comportamento

Usar alert dialog com título, objeto, consequência e ação destrutiva nomeada.

### Conteúdo e linguagem

Evitar “Tem certeza?”. Nomear registro e efeito.

### Acessibilidade

`role=alertdialog`; foco inicial no cancelamento quando risco alto; Escape cancela; retorno ao acionador.

### Recuperação

Falha mantém diálogo e informa causa; sucesso fecha e atualiza origem.

### Evidência atual correta

Modais acessíveis já controlam foco e Escape.

### Inconsistências observadas

`confirm()` ainda existe em notas e equipe.

### Critério de aceite futuro

Nenhuma ação crítica depende apenas de diálogo nativo; consequência explicitada.

## C-06 — Conflito

### Finalidade

Tratar concorrência sem sobrescrever trabalho de outra sessão.

### Estados

detectado; comparável; recarregado; reaplicado; cancelado

### Comportamento

Bloquear gravação; explicar que o registro mudou; oferecer recarregar e comparar quando possível.

### Conteúdo e linguagem

Informar entidade e instante/ator apenas se autorizado.

### Acessibilidade

Mensagem em `role=alert`; foco na ação de recuperação.

### Recuperação

Recarregar versão; copiar entrada local; repetir após revisão, nunca retry automático de escrita.

### Evidência atual correta

`row_version`, erros canônicos e testes de conflito estão preparados.

### Inconsistências observadas

Interface remota ainda não foi homologada.

### Critério de aceite futuro

Nenhuma escrita silenciosamente sobrescreve versão mais nova.

## C-07 — Sessão expirada

### Finalidade

Proteger dados e permitir retomada segura.

### Estados

válida; expirando; expirada; reautenticando

### Comportamento

Interromper novas leituras/escritas; ocultar dados; abrir gate de autenticação.

### Conteúdo e linguagem

“Sua sessão expirou. Entre novamente para continuar.”

### Acessibilidade

foco no e-mail; `aria-live`; não deixar conteúdo protegido navegável.

### Recuperação

Após login, restaurar contexto não sensível quando seguro; não repetir escrita automaticamente.

### Evidência atual correta

Auth local testa sessão inválida e retorno ao gate.

### Inconsistências observadas

Execução remota é `DF`.

### Critério de aceite futuro

Dados protegidos deixam de ser acessíveis e usuário retoma sem duplicar ação.

## C-08 — Indisponibilidade

### Finalidade

Distinguir serviço fora do ar de erro do usuário.

### Estados

offline; timeout; serviço indisponível; degradado

### Comportamento

Manter leitura cacheada/local quando autorizada; bloquear apenas operações dependentes.

### Conteúdo e linguagem

Nomear serviço e informar se os dados exibidos podem estar desatualizados.

### Acessibilidade

status persistente; contraste; não usar apenas cor.

### Recuperação

Tentar novamente, operar local quando permitido ou sair com segurança.

### Evidência atual correta

Mapeamento de rede e retry de leitura segura preparados.

### Inconsistências observadas

Sem observabilidade real e sem banner global uniforme.

### Critério de aceite futuro

Usuário sabe o que funciona, o que não funciona e se o dado é atual.

## C-09 — Estado vazio

### Finalidade

Explicar ausência de conteúdo e orientar a ação apropriada.

### Estados

base vazia; filtro sem resultado; permissão sem acesso; primeira utilização

### Comportamento

Diferenciar ausência real de filtro restritivo e erro de carregamento.

### Conteúdo e linguagem

Título, motivo e ação: “Nenhuma pendência neste recorte. Limpe filtros ou consulte outra competência.”

### Acessibilidade

estrutura semântica; ação por botão/link; não esconder filtro ativo.

### Recuperação

Limpar filtro, criar item quando autorizado ou abrir ajuda.

### Evidência atual correta

Algumas listas possuem vazio funcional.

### Inconsistências observadas

Pendências e módulos administrativos variam em orientação.

### Critério de aceite futuro

Nenhum vazio é confundido com falha; usuário sabe como prosseguir.

## C-10 — Formulário alterado

### Finalidade

Evitar perda de edição não salva.

### Estados

intocado; alterado; validando; descartando; salvo

### Comportamento

Marcar alterações reais; ao sair, confirmar descarte apenas quando houver perda.

### Conteúdo e linguagem

“Há alterações não salvas nesta configuração.”

### Acessibilidade

estado associado ao formulário; foco no diálogo de saída; teclado completo.

### Recuperação

Salvar, continuar editando ou descartar.

### Evidência atual correta

Formulários de erro preservam campos.

### Inconsistências observadas

Não há contrato global de dirty state.

### Critério de aceite futuro

Navegação não perde dados sem confirmação; falso positivo não bloqueia.

## C-11 — Salvamento

### Finalidade

Representar a transação completa, não apenas clique no botão.

### Estados

pronto; validando; enviando; persistindo; confirmado; falhou

### Comportamento

Validar localmente; desabilitar envio duplicado; usar unidade de trabalho; atualizar UI após confirmação.

### Conteúdo e linguagem

Botão muda para verbo em progresso; sucesso informa entidade.

### Acessibilidade

`aria-busy`; status; foco no primeiro erro ou retorno coerente.

### Recuperação

Falha restaura memória/armazenamento e mantém entrada.

### Evidência atual correta

Unit of work e serviços preservam rollback.

### Inconsistências observadas

UI legada nem sempre explicita fases.

### Critério de aceite futuro

Uma ação produz no máximo uma mutação; rollback e feedback comprovados.

## C-12 — Foco

### Finalidade

Manter orientação espacial e operar por teclado.

### Estados

entrada; modal; erro; retorno; navegação

### Comportamento

Foco segue intenção: acionador→diálogo→primeiro campo/erro→acionador.

### Conteúdo e linguagem

Rótulos e nomes acessíveis descrevem a ação.

### Acessibilidade

ordem DOM lógica; foco visível; sem foco em elemento oculto; skip quando necessário.

### Recuperação

Após rerender, restaurar por id/âncora; falha aponta erro.

### Evidência atual correta

`modal-accessibility.js` e mobile navigation testam retorno.

### Inconsistências observadas

Itens da sidebar ainda não são elementos nativos.

### Critério de aceite futuro

Todos os fluxos críticos funcionam por teclado sem perda de posição.

## C-13 — Modal

### Finalidade

Concentrar tarefa contextual sem romper navegação.

### Estados

fechado; abrindo; aberto; erro; fechando

### Comportamento

Uma finalidade por modal; título; descrição; ações; scroll interno quando necessário.

### Conteúdo e linguagem

Título orientado à tarefa e botões com verbos específicos.

### Acessibilidade

`role=dialog`, `aria-modal`, labelledby/describedby, trap, Escape e retorno.

### Recuperação

Erro dentro do modal; conteúdo preservado; fechamento não salva implicitamente.

### Evidência atual correta

Modais mais novos atendem ao contrato e possuem E2E.

### Inconsistências observadas

Implementações legadas coexistem.

### Critério de aceite futuro

Axe, teclado, Escape, foco e mobile aprovados.

## C-14 — Menu

### Finalidade

Expor ações ou navegação compacta sem perder contexto.

### Estados

fechado; aberto; item focado; desabilitado

### Comportamento

Abrir pelo acionador; fechar por Escape, seleção, clique externo ou perda controlada.

### Conteúdo e linguagem

Itens com nomes claros e estado atual indicado.

### Acessibilidade

botão com `aria-expanded`/`aria-controls`; roving focus quando menu; retorno ao acionador.

### Recuperação

Ação falha sem fechar silenciosamente quando usuário precisa corrigir.

### Evidência atual correta

Menu móvel possui overlay, Escape e retorno.

### Inconsistências observadas

Dropdowns não compartilham contrato documentado.

### Critério de aceite futuro

Teclado, toque e leitor executam as mesmas ações.

## C-15 — Tooltip

### Finalidade

Explicar controle compacto sem carregar informação essencial.

### Estados

oculto; visível por hover/foco; fechado

### Comportamento

Usar apenas complemento; texto essencial permanece no rótulo ou ajuda.

### Conteúdo e linguagem

Curto, específico e sem instrução crítica exclusiva.

### Acessibilidade

aparece no foco e hover; `role=tooltip`; `aria-describedby`; não prende foco.

### Recuperação

Não exige tooltip para concluir tarefa.

### Evidência atual correta

Há atributos `title` em controles.

### Inconsistências observadas

`title` nativo é inconsistente em toque e acessibilidade.

### Critério de aceite futuro

Informação crítica continua disponível sem hover.

## C-16 — Painel lateral

### Finalidade

Manter contexto enquanto exibe detalhe ou ação extensa.

### Estados

fechado; aberto; alterado; erro; fechando

### Comportamento

Usar quando comparação com a lista de origem é importante; largura e scroll próprios.

### Conteúdo e linguagem

Título identifica entidade; ações permanecem próximas do detalhe.

### Acessibilidade

semântica de diálogo quando modal; foco e Escape; conteúdo atrás inerte se bloqueante.

### Recuperação

Retorno à linha/cartão de origem; preservar filtros e rolagem.

### Evidência atual correta

Sidebar móvel demonstra controle de overlay e foco.

### Inconsistências observadas

Painel de detalhe compartilhado ainda não é contrato central.

### Critério de aceite futuro

Abrir e fechar não perde recorte, posição ou edição.

## Decisão sobre implementação futura

Este documento define capacidades e comportamento. A escolha entre Web Platform, componente próprio, biblioteca headless ou pacote externo será feita por pacote após análise de dependência. Nenhuma biblioteca é aprovada por esta especificação.

## Evidências de referência

- `src/integration/modal-accessibility.js`;
- `src/application/error-mapper.js`;
- `tests/e2e/modal-accessibility.spec.js`;
- `tests/e2e/data-error-ux.spec.js`;
- `tests/e2e/mobile-smoke.spec.js`;
- `tests/e2e/supabase-full-contract.spec.js`.
