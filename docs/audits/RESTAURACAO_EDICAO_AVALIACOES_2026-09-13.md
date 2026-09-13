# Restauração da edição de avaliações — diário incremental

## Estado atual

- Base: `main` em `6da114fedfa963b4558ade2d9a258cb856e08a72`, posterior ao merge do PR #301.
- Branch isolada: `feat/restore-evaluation-editing-2026-09-13`.
- Último bloco: reconstrução do contrato perdido no rollback do PR #299.
- Próximo bloco: restauração seletiva, adaptação à persistência contextual e prova da jornada de edição.
- Pendente: validação de UI → Supabase → atualização imediata → reload, concorrência e falhas.

## Decisão vigente do usuário

Wilson solicitou expressamente restaurar as possibilidades amplas de edição do PR #299 e melhorar encontrabilidade, orientação e confirmação visual. Esta autorização substitui a restrição temporal anterior de não restaurar essa funcionalidade. Não autoriza merge, deploy, migrations ou mutações de teste em Production.

## Bloco 1 — baseline e contrato

O PR #301 foi integrado em `39cd984...`, com candidato funcional `452d972...`. O estado vigente registra reabertura operacional e correção do argumento RPC ausente no novo envio de NF sem patrimônio. A UAT antiga em `2806996...` é evidência intermediária superada; não deve orientar uma nova correção dos mesmos testes.

O PR #299 (`d2663f1...`) acrescentava:

- desfazer Sim/Não/N/A para não preenchido, com auditoria;
- corrigir análise técnica lançada por engano;
- anular atomicamente a Pendência criada por análise incorreta, com confirmação, justificativa e preservação do histórico;
- detalhar alterações cadastrais de Pendências no log;
- ações explícitas no Prontuário e identificação da retificação no histórico.

Arquivos examinados: `verification-service.js`, `product-extensions-bootstrap.js`, versões do PR #299 de `evaluation-retification.js`, `evaluation-retification-ui.js` e RPC `retify_verification_with_pendency_cancel`.

Invariantes: notas e Assessoria continuam individualizadas; documento novo continua pelo fluxo novo envio/reanálise; permissões e competências permanecem protegidas; logs não entram no bootstrap; retorno remoto deve atualizar as entidades afetadas sem leitura global. A restauração não substitui os módulos atuais pelo snapshot antigo do PR.

Riscos identificados para correção durante a restauração: o modal anterior anunciava sucesso apenas por `ok`, sem considerar falha de reconciliação; permitia fechar/alterar campos durante a gravação; atualizava somente controles da linha, podendo deixar derivados visuais antigos. Prioridade alta, ainda sujeitos à prova direcionada.

## Bloco 2 — restauração e provas iniciais

- A RPC foi localizada em Production por consulta somente de leitura, com os seis argumentos esperados. Nenhuma escrita remota foi feita.
- A migration histórica foi recolocada, intacta, para reproduzir esse schema na pilha descartável; tipos e verificações de alinhamento foram reconciliados.
- Os testes restaurados inicialmente falharam por ausência do módulo (RED). Depois da implementação, 17 testes direcionados passaram: retificação, anulação formal, versões, perfis, competência futura, consolidação e loader.
- O modal agora considera `stateSync.refreshRequired`, impede duplo envio e fechamento durante a gravação, mostra antes/depois, contexto e orientação, e mantém falha visível.
- Guardas adicionais impedem desfazer entrega deixando Pendência ativa/análise neutra ou notas sem marcação de entrega. Formulário antigo não sobrescreve uma versão já alterada na projeção.
- A instalação local do Chromium não conseguiu baixar o executável (timeout de rede); a execução real será feita na pilha de CI já usada pelo projeto.
- Próxima prova: Playwright local de interface e jornada autenticada no Supabase descartável. Não considerar a restauração homologada antes desses resultados.

## Bloco 3 — primeira prova de frontend

PR de trabalho: #305, Draft. Candidato inicial `b43b2bc...`.

- Gate direcionado `34790359033`: **7 jornadas de frontend aprovadas**, incluindo edição/anulação e desfazer, além das regressões de NF e Pendência manual; 17 testes de regras também aprovados.
- Fronteiras arquiteturais e alinhamento Supabase aprovados localmente.
- Comparação somente de leitura: hash MD5 do corpo da RPC em Production **idêntico** ao arquivo restaurado (`8fbc66fdf7781f8b408cd003926640ea`); security invoker, execução autenticada, migration histórica registrada. Não é necessária mudança dessa função em Production para restaurar o frontend.
- A primeira UAT remota (`34790359071`) parou na preparação: a nova escola de teste não tinha INEP/CNPJ/SICI obrigatórios. Corrigida a fixture descartável. Nenhuma jornada foi executada nesse run; não é falha de login do produto.
- O lint detectou dois templates HTML dinâmicos restaurados. Foram substituídos por templates estáticos + textContent/atributos/option do DOM, sem aumentar tolerância do lint ou desativar regra.
- Acrescentadas jornadas de erro visível, bloqueio durante gravação e aviso de atualização após commit confirmado.
