# Auditoria de integração — Supabase e frontend

**Classificação:** referência vigente da baseline funcional do PR #260  
**Atualizado em:** 5 de setembro de 2026

> Para continuidade, comece em [`../../START_HERE.md`](../../START_HERE.md). Esta auditoria descreve a integração técnica atual; não define a fila. O estado funcional corrente está em [`../CURRENT_STATE.md`](../CURRENT_STATE.md).

## 1. Parecer executivo

Supabase é o backend canônico de Production. A integração cobre Auth, RLS, leitura/escrita, operações atômicas, Gestão de Equipe, auditoria, patrimônio e mecanismos de recuperação.

O ponto principal depois dos hotfixes recentes é: **a arquitetura deve ser julgada por operação e por regra vigente, não apenas pela existência das camadas**. Uma falha de teste ou uma frase histórica não autoriza trocar o contrato atual sem reproduzir a divergência no caminho real.

## 2. Percurso geral

```text
interface
→ serviço de aplicação
→ DataService / UnitOfWork / StatePort
→ RepositoryContract
→ SupabaseRepository
→ PostgREST / RPC / Edge Function
→ Auth / RLS / PostgreSQL
→ resposta
→ estado em memória
→ renderização/reconciliação
```

O frontend não recebe chave administrativa. Production opera fail-closed.

## 3. Auth e perfis

Papéis vigentes:

```text
controller
federal_assistant
sme_management
inventory
technical_admin
```

Sessão, perfil, CRE/escopos, serviços e RLS compõem a autorização. Simulação visual de `technical_admin` não troca JWT.

## 4. Gestão de Equipe

```text
formulário
→ DirectoryService
→ TeamAccountGateway
→ team-account-management
→ CORS + JWT + papel
→ Auth Admin
→ RPC transacional
→ diretório/perfil/log
→ resposta/releitura
```

Contrato atual, consolidado ao longo dos PRs #138/#150/#161 e preservado depois:

- CORS fail-closed;
- JWT/papel obrigatório;
- segredo administrativo server-side;
- lookup Auth exato por `resolve_team_auth_user_id_by_email`;
- sem varredura global `listUsers` como caminho normal;
- reutilização de conta somente sem vínculo ativo conflitante;
- ambiguidade rejeitada;
- histórico inativo preservado;
- desativação lógica;
- compensação se Auth já mudou e a etapa seguinte falha.

## 5. Integração por domínio

| Domínio | Serviço principal | Persistência/contrato |
|---|---|---|
| configuração/exercícios | `ConfigurationService` | `app_config`, `competences`, RPCs |
| programas/equipe | `DirectoryService` | `programs`, Edge Function/RPCs |
| escolas/carteira | `SchoolService` | `schools`, `school_programs`, RPCs |
| avaliação mensal | `VerificationService` | `verifications`, RPC + log |
| Pendências | `PendencyService` + integrações especializadas | `pendencies`, `pendency_attempts`, `pendency_contacts`, RPCs |
| Notas Fiscais | `InvoiceService` | `registered_invoices` + efeitos/RPCs |
| patrimônio | `InventoryService` | `assets`, RPCs patrimoniais |
| logs | `AuditService` | `administrative_logs` |
| exportações | integrações de exportação | memória autorizada + auditoria |
| importação | `ImportCoordinator` | staging + promoção/rollback |

## 6. Avaliação mensal

Bonificação, análise e Pendência permanecem independentes.

`VerificationService` protege no-op, N/A, consolidação/retificação e versionamento. Declaração BB Ágil possui regra própria de N/A; extratos não recebem a mesma exceção. Nota Fiscal e Consulta Assessoria usam derivações específicas em vez de uma avaliação agregada livremente editável onde a individualização já foi adotada.

## 7. Pendências

Depois dos PRs #254/#256:

- `Aberta` e `Aguardando reanálise` são ativas;
- novo envio não resolve;
- substituição pode ocorrer em `Aguardando reanálise`;
- reanálise correta resolve e incorreta/arquivo indisponível reabre;
- `Resolvida`/`Cancelada` podem ser reabertas quando autorizado;
- `canceled_at` representa cancelamento terminal atual;
- próximo ator é sincronizado por estado.

As RPCs individuais de NF/Assessoria validam invoice, Pendência, tentativa e contexto. Não há autorização para backfill heurístico de legados.

## 8. Notas Fiscais, `a_identificar` e Assessoria

- análise fiscal/Pendência individual usa `registered_invoice_id`;
- `a_identificar` novo é persistido com `Incorreto + Pendência` na operação protegida;
- identificação posterior preserva o mesmo ID;
- `boleto_internet` é tipo de gasto de NF apenas em Educação Conectada;
- Consulta Assessoria é individual por NF de serviço;
- operações atômicas preservam a independência entre NFs irmãs.

## 9. Nota permanente e patrimônio

A integração atual possui dois ramos válidos:

```text
NF permanente + número + processo existente
→ bem Encaminhada / Aguardando Inventariação

NF permanente sem processo
→ bem Não encaminhada
→ encaminhamento posterior
→ Inventariada
```

O PR #257 passou a derivar `encampInventario`; o #258 explicitou NF ↔ bem no Prontuário; o #260 impediu salto indevido, bloqueou edição isolada do número fiscal e acrescentou `save_asset_with_verification_and_log` para sincronizar o encaminhamento posterior com a verificação e o log.

A frase “Não encaminhada → Encaminhada → Inventariada” só se aplica ao ramo que **está Não encaminhada**.

## 10. Escolas e carteira

Nova escola exige identidade institucional real e competência inicial válida. Serviço e banco rejeitam identificadores inválidos/duplicados conforme o contrato.

Controlador não redistribui `controller_id` nem altera identidade institucional pela edição comum. Redistribuição usa fluxo autorizado da Assistente/autoridade técnica apropriada.

## 11. Exportações

Exportações sujeitas à auditoria registram início antes do download. O Excel SME mantém contrato de uma competência, uma aba e 27 colunas A:AA. XLSX de Pendências aplica busca/filtros e não apresenta IDs técnicos.

## 12. Migrations e alinhamento

A baseline funcional do PR #260 contém **46 migrations**. A migration #46 é `20260904040000_functional_reliability_inventory_sync`.

Antes de nova migration:

1. histórico local/remoto;
2. reset descartável;
3. pgTAP/lint;
4. regeneração de tipos;
5. reprodutibilidade;
6. backup/restauração quando aplicável;
7. revisão de grants/RLS;
8. aplicação remota somente com autorização;
9. verificação pós-apply.

## 13. Incidente de readiness do PR #263

A primeira execução do job Supabase local no SHA `617355e1...` falhou apenas na regeneração de tipos/cliente depois de reset, preflight, pgTAP e lint já terem passado.

O **mesmo job foi reexecutado no mesmo SHA, sem qualquer alteração de código**, e passou integralmente, inclusive regeneração/reprodutibilidade, Auth, Edge Function e frontend/RLS.

Classificação: falha transitória de runner/ambiente. Não havia defeito reproduzível de schema ou código a “corrigir”. Alterar o produto para fazer um evento não reproduzível desaparecer teria sido uma mudança sem causa comprovada.

## 14. Dívidas arquiteturais que continuam reais

A integração atual funciona, mas o plano sucessor ainda registra dívidas comprovadas:

- wrapper de performance ainda participa de política funcional de consistência;
- readiness de extensões ainda possui composição/polling que deve ser tornado determinístico;
- NF normal ainda precisa de idempotência durável para retry ambíguo;
- projeções operacionais de Pendências ainda têm cálculos duplicados entre módulos;
- convergência incremental do caminho normal de NF ainda pode ser melhor fechada depois do contrato v2.

Essas dívidas estão em `MASTER_PLAN_CURRENT.md`. Elas não autorizam refazer regras de negócio já homologadas.

## 15. Conclusão

A integração Supabase/frontend da baseline #260 está ativa e coerente com os contratos correntes examinados. A auditoria de continuidade de 05/09 reconciliou a documentação que ainda descrevia checkpoints antigos como se fossem atuais.

Qualquer nova análise deve partir da `main` corrente e do roteiro em `START_HERE.md`, não deste arquivo isoladamente.

## 16. Referências

- [`../CURRENT_STATE.md`](../CURRENT_STATE.md)
- [`SUPABASE_FUNCTIONAL_COVERAGE.md`](SUPABASE_FUNCTIONAL_COVERAGE.md)
- [`SUPABASE_PERMISSIONS_MATRIX.md`](SUPABASE_PERMISSIONS_MATRIX.md)
- [`SUPABASE_DATA_DICTIONARY.md`](SUPABASE_DATA_DICTIONARY.md)
- [`FUNCTIONAL_CONTRACT_MATRIX.md`](FUNCTIONAL_CONTRACT_MATRIX.md)
- [`../runbooks/SUPABASE_CONNECTION.md`](../runbooks/SUPABASE_CONNECTION.md)
- [`../architecture/supabase-readiness.md`](../architecture/supabase-readiness.md)
