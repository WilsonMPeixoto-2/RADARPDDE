# Retorno autoritativo e supressão do Broadcast próprio

**Data:** 03/10/2026. **Escopo:** investigação do PR #407. Auditoria iniciada
no HEAD `67561172f2274b7e4c3345e53f257510ba24b708`; correção localizada
consolidada sobre o checkpoint `7c0b84ef` da mesma frente. O hash definitivo
da entrega deve ser consultado no commit que contém este documento.

## Conclusão comprovada

A supressão do eco próprio não substitui o contrato de persistência. O
DataService já distingue resultado autoritativo, commit autoritativo e retorno
incompleto. Não foi reproduzida nesta auditoria perda de efeito derivado causada
pelo atraso de reconciliação própria de 30 segundos. Foi reproduzida uma leitura
contextual desnecessária no registro de novo envio fiscal.

`PendencyService.registerInvoiceDocumentAttempt` declarava `assets` em todos
os envios, mesmo quando nenhum patrimônio podia mudar. A RPC devolve
`asset: null` nesses casos. `mergePersistedResult` ignora valores nulos e a
verificação de completude interpreta `assets` como entidade faltante. O resultado
já havia atualizado invoice, Pendência, tentativa, verification e log, mas o
DataService iniciava outra leitura completa do contexto.

## Contratos atuais e provas existentes

| Fluxo | Retorno/estratégia atual | Evidência e limites |
| --- | --- | --- |
| Avaliação/consolidação | `VerificationService` declara resultado autoritativo; verification e log retornados | `verification-authoritative-result-contract.test.js`, `data-service-authoritative-result.test.js`, jornada sustentada de avaliação |
| NF comum/permanente, edição/exclusão | `InvoiceService` declara commit autoritativo; plano local aplica efeitos e remoções; RPC retorna invoice/asset/verification ou IDs removidos | `invoice-service.test.js`, `supabase-functional-reliability.spec.js`, `supabase-invoice-lifecycle-reliability.spec.js` |
| Novo `a_identificar` | invoice, Pendência, verification e log no retorno específico | `invoice-service.test.js`; RPC `save_unidentified_expense_with_pendency`; matriz real de identificação |
| Identificação/novo envio fiscal | invoice, Pendência, tentativa, verification, log e asset opcional | Nova reprodução com serviços/porta/bridge reais descrita abaixo; matriz UI/Supabase existente |
| Reanálise fiscal/Assessoria | Entidades individuais e resumo mensal no retorno específico | `pendency-service.test.js`, suítes SQL de análise individual/Assessoria e lifecycle |
| Pendência genérica/envio/cancelamento/reabertura | Resultado autoritativo; reanálise genérica usa commit autoritativo | `remote-operational-commands.test.js`, `pendency-service.test.js` |
| Contato | contact e log; identificador idempotente explícito | `remote-operational-commands.test.js:78`, `save_pendency_contact_with_log` |
| Patrimônio | asset e log; encaminhamento vinculado retorna também verification | `inventory-service.test.js`, `save_asset_with_verification_and_log`, jornada real patrimonial |
| Retificação de análise | verification, Pendência cancelada e log | `supabase-evaluation-retification.spec.js:139`, retorno RPC, UI e reload |
| Retificação de NF | Reutiliza `InvoiceService.save`; não cria outra autoridade de escrita | `auditable-retification.js:143`, testes reais de classificação/projeções |

Pontos de código relevantes:

- `src/application/data-service.js:213`: merge do retorno persistido.
- `src/application/data-service.js:799`: completude das entidades e decisão de
  releitura corretiva. Um writer sem marcador autoritativo mantém a reconciliação
  normal; ausência do marcador não implica silenciosamente esperar 30 segundos.
- `src/application/data-service.js:870`: commit confirmado, aplicação local e
  sincronização pendente possuem estados separados.
- `src/application/state-port.js:34`: entidades operacionais têm aplicação
  incremental; Pendência/tentativas compartilham bundle para preservar histórico.
- `src/integration/operational-realtime-invalidation.js:200`: proveniência
  própria exige usuário e instância. Ela não é autorização de leitura/escrita.
- `tests/unit/r1-service-command-authority.test.js`: já existe proteção estática
  dos contratos de autoridade. Não foi criado outro validador equivalente.

## RED, contraprovas e correção localizada

Novo arquivo: `tests/unit/operational-document-attempt-authority.test.js`.
Usa **PendencyService, DataService, UnitOfWork, StatePort e bridge canônico reais**.
Somente RPC/Auth/relógio são controlados na fronteira; não é uma prova de SQL real.
As versões retornadas diferem da mutação otimista para provar aplicação do
resultado remoto, e as projeções derivadas são conferidas antes de julgar custo.

| Caso | Antes | Depois |
| --- | --- | --- |
| Novo envio de NF de consumo | Estado correto; 1 leitura contextual desnecessária; RED | Estado correto; 0 leituras; GREEN |
| `a_identificar` → serviço | Assessoria e estado corretos; 1 leitura contextual; RED | Assessoria imediata correta; 0 leituras; GREEN |
| `a_identificar` → permanente | Asset retornado e resumo aplicados; 0 leituras | Mesmo resultado, escopo de assets preservado |
| Novo envio de permanente já identificado | RPC não altera asset; declaração ampla causava leitura pelo mesmo mecanismo | Bem e vínculo preservados; 0 leituras |
| `a_identificar` anômalo com patrimônio anterior | RPC rejeita; rollback integral comprovado | Rejeição/rollback integral mantidos |
| Retorno sem verification necessária | Deve fazer releitura corretiva | Continua com 1 leitura corretiva; resultado final autoritativo aplicado |

A alteração usa a autoridade `validateInvoiceIdentification` já existente para
determinar o escopo **antes** de entregar o comando ao DataService. `assets` fica
declarada quando a identificação cria patrimônio permanente ou quando um
`a_identificar` anômalo já carrega `bemId` e precisa ter sua mutação patrimonial
restaurada após rejeição. A declaração não é alterada depois da captura da
UnitOfWork, nem a verificação de completude é relaxada globalmente.

Guardas efetivas da RPC em
`supabase/migrations/20260922234500_fix_permanent_identification_asset_description.sql:116`:

- `a_identificar` com patrimônio anterior é rejeitado;
- identificação não permanente não pode criar/manter vínculo patrimonial;
- documento já identificado não pode trocar tipo, descrição, número, valor,
  vínculo nem fornecer `p_asset` no novo envio;
- identificação permanente exige patrimônio novo correspondente.

Portanto, esta mudança não autoriza conversão de permanente para consumo nem
remoção de bem pelo fluxo de novo envio. Retificação/classificação ordinária
mantém sua autoridade e suas restrições próprias.

Comandos executados:

```sh
node --test --test-reporter=tap tests/unit/operational-document-attempt-authority.test.js
node --test --test-reporter=tap tests/unit/operational-document-attempt-authority.test.js tests/unit/pendency-service.test.js tests/unit/invoice-service.test.js tests/unit/inventory-service.test.js tests/unit/remote-operational-commands.test.js tests/unit/r1-service-command-authority.test.js tests/unit/data-service-authoritative-result.test.js tests/unit/remote-incremental-data-service.test.js
```

Primeira prova causal: **4 casos, 2 RED por leitura 1 em vez de 0, 2 controles
aprovados**. TAP preservado em
`/workspace/scratch/document-attempt-authority-red.tap` durante a sessão.
Após correção e ampliação dos controles: **75 testes aprovados, zero falhas/skips**.
TAP em `/workspace/scratch/document-attempt-authority-green.tap`.
O RED pode ser repetido com o novo teste e a versão de PendencyService anterior
ao commit desta correção; a evidência não depende de conservar o workspace.

## Limites e continuidade

Os testes existentes de SQL/E2E verificam efeitos derivados e reload, mas não
bloqueiam a leitura contextual em cada fluxo enquanto o próprio Broadcast é
ignorado. Não declarar universalmente que todos os writers dispensam releitura.
A nova prova causal cobre o registro de novo envio e preserva a reconciliação
quando o retorno realmente está incompleto.

A prova em Supabase real descartável do candidato consolidado deve exercitar
novo envio/identificação/permanente e comparar estado local, remoto e reload.
O workload sustentado principal só cobre avaliação e CRUD fiscal; não atribuir
eventual redução de seu custo a esta correção sem uma operação de novo envio.
Cloud e toda a jornada prolongada de Pendências/patrimônio continuam dependendo
da execução efetiva e do ambiente disponível.

Esta auditoria não determina automaticamente Draft ou merge. A decisão final
pertence à validação agregada do candidato exato, banco/Auth/RLS, interface,
concorrência, custos e riscos correntes, conforme a autorização atual do usuário.
