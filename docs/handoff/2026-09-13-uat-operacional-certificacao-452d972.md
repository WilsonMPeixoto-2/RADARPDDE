# RADAR PDDE 2026 — certificação operacional do candidato `452d972`

**Data:** 13/09/2026  
**Branch:** `test/operational-uat-supabase-2026-09-13`  
**PR:** #301 — UAT operacional Supabase e observabilidade pós-refatoração  
**Candidato funcional certificado:** `452d97267348957f7155fc77bb139a4adafd766b`  
**Classe:** handoff corrente da frente ativa até integração/fechamento do PR #301

## 1. Conclusão executiva

A rodada de homologação operacional atingiu o objetivo principal desta frente: provar jornadas reais do RADAR pela interface, com Auth/RLS e Supabase descartável reais, confrontando o estado visível com persistência remota e releitura após reload.

No candidato `452d972...`, os gates funcionais principais estão verdes. O workflow `Homologação integral pré-production` permanece globalmente vermelho apenas porque o job de Lighthouse desktop excedeu o piso interno de performance; todos os demais jobs daquela homologação passaram. Por decisão operacional expressa do responsável pelo projeto, pequenas oscilações de Lighthouse não bloqueiam a reabertura do sistema. Performance permanece dívida separada, não critério de saúde funcional.

Não há defeito funcional conhecido aberto nas jornadas operacionais exercitadas abaixo.

## 2. Correção funcional real descoberta durante a UAT

A UAT de novo envio de Pendência fiscal revelou um erro real no contrato entre aplicação e RPC Supabase.

Quando uma NF não possuía bem patrimonial associado, `p_expected_asset_version` era enviado como `undefined`; a serialização removia o argumento e o PostgREST não encontrava a assinatura de `register_invoice_document_attempt`, retornando 404.

Correção em `src/application/pendency-service.js`:

```diff
- p_expected_asset_version: persistence.expectedAssetVersion,
+ p_expected_asset_version: persistence.expectedAssetVersion ?? null,
```

Foi adicionado `tests/unit/pendency-rpc-argument-contract.test.js` para impedir regressão. A correção não altera migration, schema nem regra de negócio: o banco já aceitava `null`; a aplicação apenas passou a preservar o argumento obrigatório.

## 3. Erros de automação classificados e corrigidos

Falhas intermediárias da nova UAT não representavam defeitos do produto:

- seletor genérico `Editar` confundia `Editar NF` com `Editar análise`;
- testes tentavam clicar em ações da linha enquanto o drawer operacional estava aberto;
- a automação observava `#pendency-preview-drawer` em situações em que a tela de Pendências usa `#pendency-detail-drawer`;
- após resolução de `a_identificar` e Boleto Internet, a UAT esperava um `<select>` editável, mas a interface corretamente apresentava o estado final de leitura `Correto`.

Os helpers foram ajustados para interagir com os controles efetivamente visíveis ao usuário e para validar também o estado remoto após reload, sem `force: true` e sem sleeps arbitrários.

## 4. Jornadas operacionais comprovadas

O workflow `Ciclos funcionais reais com Supabase` run `34783607506` concluiu com sucesso no candidato `452d972...`.

A cobertura inclui, entre outros:

1. login real no ambiente descartável até dashboard utilizável;
2. `administrative_logs` fora do bootstrap e carregamento sob demanda em Registros Internos;
3. avaliação documental pela interface, convergência em `verifications`, ausência de banco operacional concorrente em `localStorage` e restauração após reload;
4. consumo: cadastrar NF, analisar, editar descrição/número/valor, reload, excluir e confirmar exclusão remota;
5. serviço/Consulta Assessoria: duas NFs independentes, envio individual, Pendência, novo envio, reanálise incorreta, nova tentativa, reanálise correta, isolamento entre notas e reload;
6. `a_identificar`: abertura atômica como Incorreto + Pendência, edição preservando vínculo, identificação no novo envio, reanálise e estado final após reload;
7. Boleto Internet em Educação Conectada: cadastro individual, Pendência, novo envio, reanálise e restauração do estado `Correto`;
8. ciclo administrativo de Pendência: registrar contato, persistir em `pendency_contacts`, reload, cancelar com justificativa, confirmar status/log, reload, reabrir com novo erro, confirmar status/log e preservar contato/histórico;
9. reanálise autenticada e lifecycle remoto de notas e avaliações já existentes na bateria funcional.

Critério aplicado às mutações:

```text
controle visível na UI
→ ação real do usuário
→ persistência Supabase
→ relações/efeitos derivados
→ atualização visível
→ reload
→ mesma verdade remota e visual
```

## 5. Gates do candidato `452d972...`

Aprovados:

- `Ciclos funcionais reais com Supabase` — `34783607506`;
- `Testes E2E Playwright` — `34783607552`;
- `Confiabilidade funcional com Supabase real` — `34783607532`;
- `Supabase readiness` — `34783607627`;
- `Gate remoto de perfis e viewports` — `34783607483`;
- `Retificação auditável direcionada` — `34783607632`;
- `Validar RADAR PDDE` — `34783607599`;
- `CodeQL` — `34783607516`;
- `Saúde das dependências` — `34783607562`.

`Homologação integral pré-production` — `34783607517`:

- migrations em PostgreSQL limpo: **sucesso**;
- Supabase local, Auth, RLS e pgTAP: **sucesso**;
- dependências e segurança: **sucesso**;
- backup/restauração descartáveis: **sucesso**;
- prontidão completa: **sucesso**;
- Playwright completo: **sucesso**;
- Excel SME/OOXML/rota pública local: **sucesso**;
- Lighthouse móvel/desktop: **falha somente no piso de performance desktop**;
- gate final herdou o vermelho do Lighthouse.

Essa falha de performance não deve ser reinterpretada como defeito de autenticação, persistência, banco, RLS ou jornada operacional.

## 6. Production já observada nesta frente

Durante a execução em Work/Astra, o site oficial aceitou login real e permitiu abrir o Prontuário da Ary Barroso com avaliações reais. Antes da navegação bem-sucedida apareceu uma mensagem transitória `Não foi possível carregar os escopos de escolas`; a sessão posteriormente se recuperou e a unidade abriu normalmente.

Classificação atual: ocorrência transitória de carregamento, sem evidência de bloqueio persistente. Registrar para observação futura, mas não tratá-la como falha permanente sem reprodução.

Nenhuma mutação operacional de homologação foi autorizada em Production. Escritas continuam restritas ao Supabase descartável de CI.

## 7. Matriz funcional: como interpretar as operações ainda `partial`

A matriz canônica possui operações `partial`. Pela definição vigente, `partial` não significa defeito conhecido nem bloqueio automático; significa que uma prova adicional específica ainda não foi elevada ao mesmo nível de evidência.

A nova UAT fortalece especialmente `PEND-01`, `PEND-04`, `PEND-05`, `PEND-06`, `INV-03` e `INV-04`. Entretanto, não reclassificar automaticamente itens que ainda exigem autoria explícita, idempotência, negativa por todos os perfis ou observação recorrente em Production.

Ações administrativas menos frequentes, como criação de exercício, alteração de parâmetros SME, programas e redistribuição de carteiras, continuam protegidas pela suíte E2E completa, serviços, RLS/RPCs e gates remotos, mas algumas mantêm cobertura `partial` porque a matriz exige ensaio controlado específico de escrita + autoria + reversão/releitura.

Isso é dívida de evidência, não defeito funcional conhecido.

## 8. Critério de release desta frente

Para reabrir o RADAR aos usuários, o critério funcional passa a ser:

- núcleo operacional crítico verde em UAT real;
- E2E completo verde;
- Auth/RLS/Supabase/readiness verdes;
- nenhuma regressão conhecida em notas, avaliações, Pendências, reanálise, `a_identificar`, boleto e persistência/reload;
- integração do PR #301 na `main`;
- Vercel Production `READY` no SHA integrado;
- smoke não destrutivo do endereço oficial após o deploy.

Lighthouse não é bloqueante por decisão operacional desta rodada.

## 9. Próximos passos imediatos

1. atualizar `CURRENT_STAGE.md` e `STATUS_DOCUMENTOS.md` para apontar este handoff;
2. atualizar o corpo do PR #301 com o estado certificado;
3. integrar o PR #301 quando o conjunto exigido de checks permitir;
4. confirmar `main` e deployment Production no mesmo SHA integrado;
5. executar smoke não destrutivo do site oficial;
6. somente depois comunicar reabertura aos usuários.

O predecessor detalhado continua sendo `docs/handoff/2026-09-13-relatorio-tecnico-consolidado-pos-pr300-uat.md`. O checkpoint `4a7a41dc` permanece como histórico intermediário e deixa de ser o handoff corrente quando este arquivo for apontado por `CURRENT_STAGE.md`.
