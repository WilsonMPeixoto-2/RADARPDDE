# PR #397 — continuação e provas de independência operacional

**Estado:** investigação e candidato em desenvolvimento; sem merge, aplicação remota ou publicação nesta execução.
**Início:** 30/09/2026 (Brasília).
**Base revalidada:** `main@a38eeef6c36e99be1777ce957d459bc40cdaca02`.
**Candidato recebido:** `631be4f5569b8f9f555b5fc3c0cbfd055260cea3`, branch `fix/decouple-expenses-bonification`, PR #397 aberto/Draft. Merge-base igual à main. Checkout inicialmente limpo; stash histórico de PROD-UX-08 preservado.

## Objetivo e mapa causal antes das alterações

O operador autorizado deve trabalhar a despesa no Prontuário da escola, competência e programa visíveis, mesmo sem lançamento ou após consolidação da bonificação. A bonificação manual e seu resultado continuam sob `VerificationService`; projeções operacionais continuam derivadas pelas autoridades existentes.

| Operação | Autoriza / escreve / deriva / apresenta | Persistência e convergência | Dependência retirada / proteção preservada |
|---|---|---|---|
| NF comum: cadastrar, editar, excluir, análise elegível | controles do item em `app.js` → `InvoiceService` → `invoice-effects`/análise individual → `DataService`/`UnitOfWork` | mapper/bridge → `save_invoice_with_effects[_v2]` ou `delete_invoice_with_effects` → helper privado → retorno canônico → projeção e `read_operational_context`/reload | retirar bonificação/consolidação como gate e reabertura incidental; preservar capacidade, escopo, contexto, versão, intenção, histórico e efeitos patrimoniais |
| Primeira despesa / a_identificar | ação contextual → `InvoiceService.save[UnidentifiedExpenseWithPendency]` → planner; bootstrap injeta `ensureProgramVerification` | `save_invoice_with_effects_impl` materializa contexto; `save_unidentified_expense_with_pendency` agrega Incorreto + Pendência; UoW deve conter todas as mutações | nenhum clique prévio em Sim; contexto local vazio é descartável; falha não confirma invoice/Pendência/bem/log/bonificação |
| Pendência fiscal / envio / identificação / reanálise | acesso no item/drawer/fila → `PendencyService` e integração fiscal | RPCs individuais + wrappers públicos + helper NF + `save_pendency_command`/reanálise; resposta/versionamento → releitura | bonificação não autoriza; novo envio não resolve; mesma invoice/Pendência; tentativa válida; nenhuma NF irmã bloqueada |
| Assessoria individual | edição ordinária em `InvoiceService`; Incorreto/abertura/reanálise em `service-advisory-pendency`; envio em `service-advisory-corrective-submission` | RPCs especializadas → helper de NF / Pendência → agregado de consultas | preservar autoridades distintas, isolamento por NF, histórico e tentativa; projeções consAssessoria/consEnviada permanecem derivadas |
| Permanente / Inventário | `invoice-effects` e `InventoryService` | NF/bem transacionais, projeção encampInventario; triggers e releitura contextual | preservar vínculo e estado terminal Inventariada; projeção operacional não reabre consolidação |
| Bonificação / telas gerenciais / exportação | `VerificationService` mantém edição/consolidação/retificação; consumidores usam bonificacao/resultadoBonif | RPC própria de verification; projeções gerenciais/exportação de contexto | operação de despesa não substitui lançamento manual ou resultado; atualizar resumo técnico é permitido; investigar propagação a consumidores |

`DataService` é autoridade de aplicação, staleness e fila; `StatePort`/bridge incorporam resposta canônica. Realtime somente invalida. Wrappers de feedback/scroll/medição não recebem autoridade de negócio. A ordem de bootstrap e os consumidores não alterados continuam no mapa de revisão.

## Propriedade dos campos

| Campo/grupo | Proprietário e regra nesta frente |
|---|---|
| notaFiscal em bonificacao/bonification | lançamento manual por VerificationService; preservar exatamente, inclusive ausência, vazio, Não e N/A |
| resultadoBonif / bonus_result | consolidação/retificação por VerificationService; despesa não possui este campo, inclusive null/string vazia |
| extCC, extINV, declBBAgil e demais marcações manuais | preservar; não preencher por inferência nem por snapshot incompleto |
| consAssessoria e consEnviada | projeções das consultas individuais, derivadas pela regra preexistente; não congelar o contêiner inteiro |
| encampInventario | projeção dos bens vinculados pela autoridade patrimonial vigente; preservar terminalidade |
| análise fiscal/Assessoria, Pendência, tentativa, bem, log | efeitos próprios, identidade/versionamento e autoria canônicos |

## Classificação inicial e plano verificável

| Requisito/risco | Evidência recebida e revalidada | Situação / próximo passo |
|---|---|---|
| CI de matriz/nomenclatura/readiness | JUnit do run 36635694371, artefato unit-tests-report; reprodução local | Markdown gerado diverge; conferir fonte/gerador, regenerar oficialmente e executar verifier |
| unitário de exclusão permanente | mesmo JUnit, teste invoice-effects:325; reprodução local: apta recebido, vazio esperado | contrato de reabertura superado pela ADR-055; preservar assertions de exclusão do bem e provar resultado apta intacto |
| E2E/visual interrompidos no clique | logs citados + seletores globais em quatro arquivos; dois programas legítimos | delimitar programa/documento/registro semanticamente; executar jornada após desbloquear seleção; goldens ainda não são evidência de divergência visual |
| campos manuais na escrita | createPersistence recebe verification inteira do snapshot; mapper normaliza resultado vazio para null; SQL atual aceita bonus_result presente | risco causal localizado; construir reprodução do patch real e contraprova com consolidação existente antes de alterar fronteira |
| primeira despesa local | ensureContextVerification chama helper mutável antes de DataService.execute | hipótese de projeção sobrevivente a rollback; teste com UoW/bridge reais e rejeição, validação posterior e falha de reconciliação |
| primeira despesa remota | SELECT FOR UPDATE sobre contexto ausente + INSERT; pgTAP atual 13 assertions positivas/admin/replay serial | provar concorrência controlada, rollback intermediário, perfis/escopo, contexto remoto omitido e idempotência; conflito explícito pode ser correto |
| preservação de #396 | main contém read_operational_context; candidato não modifica DataService/consulta | atacar releitura/reload/troca de contexto/resposta tardia no caminho alterado; sem bootstrap global/cache paralelo |
| aceitação desktop | ainda sem nova captura | executar controles reais, 1440×900 e 1366×768; abrir capturas e registrar leitura humana; PROD-UX-08 continua separado |

Hipóteses materiais serão registradas como invariante → reprodução/mecanismo → autoridade → mudança mínima coerente → vizinho permitido/proibido → resultado. Não adicionar wrapper, polling, retry ou RPC paralela para contornar falhas.

## Ambiente e limites já constatados

- Node local 24.19.0, npm 11.17.0; dependências homologadas preservadas.
- Docker não está instalado neste host e WSL informa não estar instalado. Provas de PostgreSQL/Supabase reais usarão os runners descartáveis existentes do repositório, com evidência por SHA/job/artefato.
- Conector Supabase retorna zero projetos; acesso administrativo de leitura solicitado para confirmar histórico de aplicação. Nenhuma migration remota foi executada; não presumir estado do schema compartilhado.
- #395 foi lido em `44e0b59f4c002e7c5ed34ae320132a11b606acc1` como contexto metodológico, sem executar seus planos. #394, PROD-UX-08 e evolução visual ampla continuam frentes separadas.
- Merge/Production exigem autorização específica desta frente, conforme prompt atual. O candidato será preparado e publicado na branch do #397; plano de publicação precede qualquer pedido necessário.

## Checkpoint 1 — reprodução inicial

`node --test --test-reporter=dot tests/unit/functional-contract-matrix.test.js tests/unit/invoice-effects.test.js` reproduziu as duas falhas do JUnit. O comando de teste retornou falha; os comandos de inspeção seguintes não mudam essa conclusão. Nenhuma alteração de runtime feita neste checkpoint.

A confirmação do merge-ref e a contagem da CI serão vinculadas ao checkout efetivamente executado. O estado verde de um agregador ou de um job que parou cedo nunca será promovido a prova da jornada inteira.
