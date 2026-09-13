# RADAR PDDE — Estado atual do projeto

**Classe documental:** Canônico — estado mutável e retomada futura  
**Atualizado em:** 13 de setembro de 2026

## Frente autorizada após a reabertura

Wilson solicitou restaurar as opções de edição do PR #299, com melhor orientação e confirmação visual, sobre a arquitetura atual. Essa decisão explícita substitui a restrição anterior de não restaurar a funcionalidade. Trabalho isolado em `feat/restore-evaluation-editing-2026-09-13`; Production permanece na versão liberada. Não há autorização de merge, deploy ou aplicação de migration em Production nesta frente.

Checkpoint incremental: [`audits/RESTAURACAO_EDICAO_AVALIACOES_2026-09-13.md`](audits/RESTAURACAO_EDICAO_AVALIACOES_2026-09-13.md). A homologação desta restauração ainda está em andamento.

## 1. Baseline vigente

O PR #300 encerrou a refatoração arquitetural Supabase. O PR #301 encerrou a homologação operacional pós-refatoração e integrou a correção funcional encontrada durante a UAT.

**PR #301:** merged  
**Merge commit funcional:** `39cd984206b33c7d2a6d7084e23597f964235c9a`  
**Candidato funcional certificado:** `452d97267348957f7155fc77bb139a4adafd766b`  
**Data mode de Production:** `supabase-production`

O rollback do PR #299 permanece preservado; a funcionalidade de retificação de avaliação removida naquele rollback não foi reintroduzida.

## 2. Estado de Production e decisão operacional

A aplicação integrada foi publicada em Production pela Vercel em deployment:

`dpl_DKGa7PqP6KqiDrrWeevReEhyrKLS`

O deployment ficou `READY`, com alias oficial `https://radarpdde-fix.vercel.app/`, a partir do commit documental `de336d20f514818c42a3ad403720c6b606065868`, que está diretamente sobre o merge funcional do PR #301 e não altera runtime.

O build de Production registrou:

- `1020` testes;
- `1020` aprovados;
- `0` falhas;
- artefato `supabase-production`;
- deployment concluído sem erro.

Smoke técnico do endereço oficial:

- HTTP `200`;
- runtime de Production carregado;
- tela institucional de login presente;
- nenhum erro/fatal encontrado nos logs do deployment no intervalo pós-publicação.

Smoke independente com TinyFish:

- endereço oficial abriu normalmente;
- tela institucional de login reconhecida;
- nenhum bloqueio técnico detectado antes da autenticação;
- não houve login porque não existia sessão ativa no Browser Context Profile nem credencial segura no vault;
- nenhuma credencial manual foi solicitada e nenhuma mutação foi executada.

Antes desta publicação, Work/Astra já havia comprovado login real em Production e abertura do Prontuário da Ary Barroso com avaliações reais. Naquela sessão ocorreu uma mensagem transitória de falha ao carregar escopos antes da recuperação; ela não se reproduziu no smoke público atual, mas também não foi reclassificada como inexistente.

**Decisão de release:** o RADAR está liberado funcionalmente para reabertura aos usuários. Não há defeito funcional conhecido bloqueando login, avaliações, notas/despesas, Pendências, novos envios, reanálises e persistência/reload nas jornadas certificadas. Lighthouse não é critério bloqueante desta decisão.

## 3. Certificação funcional

No candidato `452d972...` passaram:

- `Ciclos funcionais reais com Supabase` — `34783607506`;
- `Testes E2E Playwright` — `34783607552`;
- `Confiabilidade funcional com Supabase real` — `34783607532`;
- `Supabase readiness` — `34783607627`;
- `Gate remoto de perfis e viewports` — `34783607483`;
- `Retificação auditável direcionada` — `34783607632`;
- `Validar RADAR PDDE` — `34783607599`;
- `CodeQL` — `34783607516`;
- `Saúde das dependências` — `34783607562`.

A homologação integral pré-production passou migrations, Auth/RLS/pgTAP, backup/restauração, segurança, prontidão, Playwright completo e Excel/OOXML; seu único vermelho foi Lighthouse desktop, expressamente não bloqueante nesta liberação.

## 4. Jornadas operacionais comprovadas

A prova de mutação segue:

```text
UI real
→ persistência Supabase
→ relações/efeitos derivados
→ UI coerente
→ reload
→ mesma verdade
```

Foram comprovados, entre outros:

- login/contexto e auditoria sob demanda;
- avaliação documental → Supabase → reload;
- consumo: criar, analisar, editar, recarregar e excluir;
- serviço/Consulta Assessoria individual por NF, com isolamento entre notas;
- Pendência, novo envio, reanálise incorreta, nova tentativa e resolução;
- `a_identificar` com abertura atômica, edição preservando vínculo, identificação posterior e resolução;
- Boleto Internet em Educação Conectada;
- contato, cancelamento e reabertura de Pendência com preservação do histórico após reload;
- ausência de `localStorage` como segundo banco operacional.

## 5. Defeito real corrigido

A UAT encontrou um 404 em `register_invoice_document_attempt` quando uma NF sem bem vinculado omitia `p_expected_asset_version` por serializar `undefined`.

Correção integrada:

```text
p_expected_asset_version: persistence.expectedAssetVersion ?? null
```

Foi criada regressão específica em `tests/unit/pendency-rpc-argument-contract.test.js`. Não houve migration nem mudança de regra de negócio.

## 6. Matriz funcional e limites honestos da conclusão

Operações ainda classificadas como `partial` na matriz continuam como dívida específica de evidência, não bug conhecido nem bloqueio automático. Não promover automaticamente itens que ainda exijam autoria explícita, idempotência, negativas completas por perfil, reversão controlada ou observação recorrente em Production.

A ausência de credenciais técnicas no TinyFish impediu um novo smoke autenticado pós-deploy por cinco perfis. Isso é uma limitação da evidência, não uma falha observada do produto. A autorização/RLS e os cinco perfis foram exercitados nos gates remotos descartáveis, e houve login real anterior em Production pelo Work/Astra.

## 7. Supabase Production

Projeto `RADAR PDDE 2026` (`scnryinorqeucbfkioxo`) observado como `ACTIVE_HEALTHY` após a publicação.

Advisors não mostraram problema novo relacionado ao release. Permanecem itens independentes:

- `Leaked Password Protection Disabled` — melhoria de Auth a tratar em frente própria;
- oito índices reportados como ainda não utilizados — informação de performance, sem ação durante esta reabertura.

Não remover índices nem alterar Auth como parte desta liberação.

## 8. Documentação corrente

Handoff final desta frente:

`docs/handoff/2026-09-13-pr301-production-release.md`

Predecessores relevantes:

- `docs/handoff/2026-09-13-uat-operacional-certificacao-452d972.md`;
- `docs/handoff/2026-09-13-relatorio-tecnico-consolidado-pos-pr300-uat.md`.

O checkpoint `4a7a41dc` é histórico intermediário.

## 9. Próxima postura operacional

A frente de correção/liberação está encerrada. A partir deste ponto:

- usuários podem voltar a utilizar o RADAR;
- novos relatos devem ser tratados como incidentes concretos, com reprodução e evidência;
- não reabrir automaticamente a refatoração arquitetural nem restaurar PR #299;
- não misturar upgrades de dependência, otimização de Lighthouse, índices ou hardening de senha com incidentes funcionais futuros.

## 10. Rota de retomada

Ler nesta ordem:

1. `../AGENTS.md`;
2. `reference/SYSTEM_CANONICAL_MODEL.md`;
3. `reference/PRODUCT_SURFACE_CATALOG.md`;
4. este `CURRENT_STAGE.md`;
5. `handoff/2026-09-13-pr301-production-release.md`;
6. `reference/ENGINEERING_METHOD.md`;
7. `reference/FRONTEND_USER_VALIDATION_GATE.md`;
8. `reference/STATUS_DOCUMENTOS.md`;
9. matriz funcional/ADRs conforme necessário.

Revalidar sempre `main`, Vercel e Supabase quando uma decisão depender do estado ao vivo.
