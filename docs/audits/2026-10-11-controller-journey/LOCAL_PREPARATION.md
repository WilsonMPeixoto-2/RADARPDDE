# Preparação local — não homologação de Production

**Correção de direção em 11/10:** o usuário reiterou que a missão principal é
observar um Controlador legitimamente autenticado na interface real. As jornadas
locais foram pausadas. O ambiente descartável permanece apenas como instrumento
para efeitos irreversíveis e contraprovas, sem substituir a sessão real.

**Autorização superveniente:** o usuário permitiu continuar no ambiente cloud.
As jornadas locais serão retomadas como auditoria controlada da interface; a pausa
acima preserva o histórico, não é impedimento atual. Não equivale a Production.

## O que chegou a ser executado antes da pausa

- Login via formulário real com `controller@radar.local`, Auth local e RLS vigentes;
  service role usada somente pelo bootstrap institucional, nunca pela UI.
- Dashboard e Prontuário observados em Chromium headed, 1440×900; competência Maio.
- Primeira NF sintética criada pelo botão **Adicionar Nota → Salvar Gasto**,
  com bonificação não lançada. Modal fechou e uma linha fiscal apareceu.
- Consulta SQL posterior confirmou NF `TESTE_AUDITORIA_CONSUMO_001`, consumo,
  R$123,45, id `nota-0592baa9-05be-46cf-bbaa-1101db8f5472`, escola `ESC-LOCAL`,
  competência `2026-05`, programa `BASIC` e contexto `ESC-LOCAL::2026-05::BASIC`.
  `bonus_result` permaneceu null, campos manuais vazios; nenhuma Pendência/ativo criado.
- A espera automatizada pelo número **exato** falhou porque a UI apresenta `NF:` e
  truncamento. O banco e screenshot confirmam cadastro; esse timeout não demonstra
  erro do produto. Outras esperas usaram títulos presumidos e também não são
  medições de lentidão. **Não há tempo percebido válido para publicar neste ciclo.**
- Nenhuma edição, exclusão, análise, novo envio, reanálise, exportação ou concorrência
  foi executada nesta rodada. Nenhum desses fluxos está homologado aqui.

## Massa de preparação e resíduos

Seed oficial com duas escolas e programa BASIC. Preparação local adicional:
competência `2026-06`, programa `CONECTADA` e vínculo com ESC-LOCAL;
escola `ESC-AUDIT` (TESTE AUDITORIA — Segunda unidade) da carteira local e BASIC.
Esses dados foram preparados por SQL **somente no descartável**, antes das jornadas,
sem mudar schema, regra, grant, Auth/RLS ou qualquer escola de Production.

O único lançamento sintético permanece no banco descartável para continuidade;
não houve limpeza pela UI. Não apagar logs. Ao encerrar a auditoria, remover a
pilha/volume exclusivos desta frente após salvar evidências úteis; preservar o
container/volume histórico `radar-pr410-characterization`.

## Capturas realmente examinadas

Todas as imagens abaixo foram abertas pelo agente. Contêm apenas login público
ou fixtures sintéticas, sem senha/token. Não representam a sessão do usuário.

- [Login local real](evidence/auth-first-access.png).
- [Dashboard autenticado local](evidence/controller-dashboard-first.png).
- [Notas fiscais vazias](evidence/school-invoices-empty.png).
- [Modal fiscal antes do preenchimento](evidence/consume-modal.png).
- [NF local no momento da pausa](evidence/local-save-paused.png).

Observações locais ainda **não classificadas como defeito**: ação Ver Unidade no
Dashboard requer rolagem horizontal da tabela; descrição/identificador fiscal fica
abreviado; RA do seed possui designation de teste 04.00 e aparece 0ª R.A. A fidelidade
do seed não permite concluir que essa RA é defeito de Production. Reobservar na
sessão real antes de propor qualquer alteração.

Nenhum código de produto foi alterado. Não atribuir a esta preparação melhora de
performance, conclusão A–N ou ausência de regressões em Production.
