# RADAR PDDE — Estado atual do projeto

**Atualizado em:** 7 de setembro de 2026  
**Classe documental:** Canônico — estado corrente e retomada futura

## 1. Checkpoint corrente

Este arquivo registra o estado lógico atual. SHA de `main`, deployment Vercel e integridade do Supabase são valores voláteis e devem ser revalidados no remoto antes de qualquer operação que dependa deles.

A cadeia funcional de hotfixes #265–#279 permanece encerrada. O PR #282 retirou a autoridade funcional do módulo de performance. A frente de 07/09, integrada pelo PR #284, corrige a arquitetura de bootstrap/readiness e o bloqueio desnecessário do pós-login desktop.

Nenhuma dessas frentes deve ser reaberta com base em planos históricos sem evidência nova no código ou em Production.

## 2. Correções arquiteturais já encerradas

### R1 — autoridade funcional fora de performance

**Concluída pelo PR #282.**

`operational-write-performance.js` é observador. Autoridade de resultado/commit remoto, entidades incrementais e reconciliação funcional pertencem aos serviços/DataService e às integrações funcionais correspondentes.

### R2 — bootstrap e readiness

**Concluída pelo PR #284.**

O frontend agora possui `RadarApplicationReadiness` para capacidades explícitas de autenticação, dados, serviços, runtime de UI, competência e navegação. Os pollings de readiness que participavam do caminho corrigido foram substituídos por eventos/Promises/capacidades determinísticas.

Também foram corrigidos:

- autoridade duplicada de carregamento de `navigation-history.js`;
- espera do Dashboard por `administrativeLogs`;
- ausência de dependência explícita da tela Registros Internos para seus próprios dados;
- instaladores finais que criavam intervalos mesmo quando a instalação imediata já era possível.

A hidratação tardia continua fail-closed para entidades sem aplicação incremental comprovada. Nesta frente somente `administrativeLogs` foi autorizado.

Na medição autenticada controlada da branch, a mediana login → Dashboard utilizável foi 492,1 ms em três execuções com Supabase descartável real. Esse valor é diagnóstico local, não telemetria de Production.

## 3. Correções reais ainda conhecidas

A fila funcional remanescente é curta e explícita:

| Frente | Estado | Problema real |
|---|---|---|
| **Pendências** | Pendente | `operational-projection.js` e `pendencias-view-model.js` ainda podem calcular data-base/tempo de espera de modo diferente após reabertura ou reanálise incorreta. |
| **Nota Fiscal** | Pendente | `invoice:save` e `invoice:remove` ainda precisam completar a convergência autoritativa/incremental para evitar releituras amplas e janelas residuais de estado pós-escrita. |

Depois dessas duas correções, executar equivalência/revisão final e somente otimizar novos gargalos se medição demonstrar necessidade.

## 4. Itens que não são bugs funcionais atuais

### Dependências

O PR #264 é manutenção separada. As vulnerabilidades npm moderadas conhecidas pertencem a essa frente e não devem ser misturadas a correções de produto.

### ADR-051

Hardening adicional de `registered_invoices` permanece separado. Não há evidência atual de corrupção causada por essa dívida.

### Auth

O advisor de segurança do Supabase para proteção contra senhas vazadas é hardening de conta, não bug funcional do fluxo atual.

### Índices do banco

Avisos `unused_index` são sinais de observação. Não autorizam remoção sem medição.

## 5. Guardrails vigentes

Preservar:

- bonificação de NF agregada, análise/Pendência individual por `registered_invoice_id`;
- resumo técnico derivado com precedência vigente;
- `a_identificar` novo nasce `Incorreto + Pendência` atomicamente e legados legítimos não recebem backfill fabricado;
- `boleto_internet` somente como tipo de gasto de Notas Fiscais em Educação Conectada;
- Consulta Assessoria individual por NF de serviço;
- Pendências transversais a competências;
- bonificação, análise e Pendência como dimensões independentes;
- `Inventariada` terminal;
- competência global canônica via `RadarCompetenceContext`;
- Production fail-closed;
- commit remoto confirmado não é repetido para recuperar falha local;
- layout aprovado de Prontuário/Pendências;
- comunicação externa sem o nome interno `RADAR PDDE`;
- Supabase CLI 2.116.0 rejeitado enquanto a regressão documentada não for superada por nova homologação;
- Lighthouse com três rodadas, mediana e thresholds vigentes;
- novo lazy loading somente com consumidor mapeado, aplicação incremental segura, estado de loading/falha e regressão da superfície.

## 6. Precedência para determinar o presente

1. código do SHA atual;
2. Supabase/Auth/RLS/RPCs/Edge Functions e Vercel efetivos;
3. decisões vigentes;
4. testes atuais que representam o contrato;
5. este documento canônico;
6. auditorias, planos e checkpoints históricos.

Documentos históricos permanecem como evidência do seu momento, não como fila automática de implementação.

## 7. Retomada

Ao retomar o projeto:

1. ler `AGENTS.md`;
2. ler este arquivo;
3. ler `reference/ENGINEERING_METHOD.md`;
4. revalidar `main`, Production e Supabase;
5. continuar somente a primeira correção real ainda aberta da seção 3;
6. não iniciar nova auditoria ampla antes de concluir a fila conhecida, salvo evidência concreta de regressão ou incidente.
