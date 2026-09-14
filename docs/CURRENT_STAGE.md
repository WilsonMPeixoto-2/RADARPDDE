# RADAR PDDE — Estado atual do projeto

**Classe documental:** Canônico — estado mutável e retomada futura  
**Atualizado em:** 14 de setembro de 2026

## Pacote final de manutenção de 14/09/2026

O PR #305 restaurou e publicou em Production a edição auditável de avaliações sobre a arquitetura Supabase já certificada. Bonificação permanece editável diretamente por Sim/Não/N/A; correção de análise técnica continua explícita e, quando há Pendência ativa associada a um `Incorreto`, exige confirmação, justificativa, cancelamento atômico da Pendência e preservação do histórico.

A rodada final de manutenção está concentrada no PR #306. Seu escopo é deliberadamente limitado a dependências homologadas, desempenho de carregamento, acabamento visual discreto e reconciliação documental. Não altera regra de negócio, schema, migration, identidade de registros, RLS ou fluxos operacionais.

## 1. Baseline vigente

O PR #300 encerrou a refatoração arquitetural Supabase. O PR #301 encerrou a homologação operacional pós-refatoração e integrou a correção funcional encontrada durante a UAT. O PR #305, posteriormente, restaurou a edição auditável de avaliações sobre essa arquitetura e é o baseline funcional atualmente publicado.

- **PR #305:** merged
- **Merge commit funcional:** `b151f3f27cb28d5165916aa9be4086355742e839`
- **Candidato funcional certificado:** `86db8651134616fe03d6506e7f9bd073e1e1eb3f`
- **Data mode de Production:** `supabase-production`

O PR #305 superou o rollback funcional do PR #299 e reintroduziu a retificação de avaliação de forma auditável, com confirmação visual, preservação de histórico e reconciliação da suíte de testes com o contrato atual.

## 2. Estado de Production e decisão operacional

A aplicação integrada foi publicada em Production pela Vercel em deployment:

`dpl_c9Be1LfZocKVBVmrB5pDHaVB7w3X`

O deployment ficou `READY`, com alias oficial `https://radarpdde-fix.vercel.app/`, ligado diretamente ao merge funcional `b151f3f27cb28d5165916aa9be4086355742e839` do PR #305.

O build de Production registrou:

- `1034` testes;
- `1034` aprovados;
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

**Decisão de release:** o RADAR está liberado funcionalmente para reabertura aos usuários. Não há defeito funcional conhecido bloqueando login, avaliações, notas/despesas, Pendências, novos envios, reanálises, edição auditável e persistência/reload nas jornadas certificadas.

## 3. Certificação funcional de Production

No candidato `86db865...` do PR #305 passaram todos os gates de release relevantes:

- `Ciclos funcionais reais com Supabase` — `34804862031`;
- `Testes E2E Playwright` — `34804862017`;
- `Confiabilidade funcional com Supabase real` — `34804861945`;
- `Supabase readiness` — `34804862065`;
- `Gate remoto de perfis e viewports` — `34804861921`;
- `Retificação auditável direcionada` — `34804861943`;
- `Validar RADAR PDDE` — `34804861959`;
- `CodeQL` — `34804861965`;
- `Saúde das dependências` — `34804861920`;
- `Backup e restauração descartáveis` — `34804862153`;
- `Lighthouse CI` — `34804861971`;
- `Homologação integral pré-production` — `34804861985`.

A rodada do PR #306 é manutenção posterior sobre esse baseline. Enquanto o PR #306 permanecer aberto, seu resultado não substitui o baseline de Production e deve ser lido pelo handoff próprio da manutenção.

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
- edição direta de bonificação e correção auditável da análise técnica;
- ausência de `localStorage` como segundo banco operacional.

## 5. Defeito real corrigido na homologação pós-refatoração

A UAT do PR #301 encontrou um 404 em `register_invoice_document_attempt` quando uma NF sem bem vinculado omitia `p_expected_asset_version` por serializar `undefined`.

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

A conferência somente de leitura realizada em 14/09/2026 por `production_integrity_check()` retornou `healthy`, com `0` problemas agregados. Verificações adicionais de vínculos entre Nota Fiscal, avaliação, Pendência e patrimônio também não apontaram inconsistência.

Advisors não mostraram problema novo relacionado ao release. Permanecem itens independentes:

- `Leaked Password Protection Disabled` — melhoria de Auth a tratar em frente própria;
- oito índices reportados como ainda não utilizados — informação de performance, sem ação durante esta reabertura.

Não remover índices nem alterar Auth como parte desta manutenção.

## 8. Documentação corrente

Handoff da manutenção em validação:

`docs/handoff/2026-09-14-pr306-final-maintenance.md`

Baseline de Production imediatamente anterior:

`docs/handoff/2026-09-13-pr301-production-release.md`

Predecessores relevantes:

- `docs/audits/RESTAURACAO_EDICAO_AVALIACOES_2026-09-13.md`;
- `docs/handoff/2026-09-13-uat-operacional-certificacao-452d972.md`;
- `docs/handoff/2026-09-13-relatorio-tecnico-consolidado-pos-pr300-uat.md`.

Os checkpoints anteriores permanecem históricos e não substituem a verificação do remoto vigente.

## 9. Próxima postura operacional

A frente de correção funcional está encerrada. A partir deste ponto:

- usuários podem utilizar o RADAR sobre o baseline do PR #305;
- novos relatos devem ser tratados como incidentes concretos, com reprodução e evidência;
- não reabrir automaticamente a refatoração arquitetural ou o rollback do PR #299;
- dependências, performance, índices e hardening de Auth devem permanecer frentes próprias, sem alterar silenciosamente regras funcionais já certificadas;
- a dívida residual de LCP deve ser tratada por uma frente específica de carregamento/modularização, não por redução artificial dos limites do Lighthouse.

## 10. Rota de retomada

Ler nesta ordem:

1. `../AGENTS.md`;
2. `reference/SYSTEM_CANONICAL_MODEL.md`;
3. `reference/PRODUCT_SURFACE_CATALOG.md`;
4. este `CURRENT_STAGE.md`;
5. `handoff/2026-09-14-pr306-final-maintenance.md` enquanto o PR #306 estiver aberto;
6. `handoff/2026-09-13-pr301-production-release.md` para o baseline publicado;
7. `reference/ENGINEERING_METHOD.md`;
8. `reference/FRONTEND_USER_VALIDATION_GATE.md`;
9. `reference/STATUS_DOCUMENTOS.md`;
10. matriz funcional/ADRs conforme necessário.

Revalidar sempre `main`, Vercel e Supabase quando uma decisão depender do estado ao vivo.