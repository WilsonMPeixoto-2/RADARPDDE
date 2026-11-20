# RADAR PDDE — Release 1 (T0–T3): contrato único de execução, provas e publicação

**Registro operacional:** 20/11/2026. **Classe:** plano executável da PRIMEIRA entrega incremental; complementa, não altera, o contrato funcional T0–T6.  
**Branch de release:** `release/prontuario-t0-t3-20261120`, [PR #535](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/535) (Draft, SEM merge).  
**Código de origem:** [PR #534](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/534), `audit/antigravity-argon-prontuario-20261115@054d3bc4`.  
**Integração oficial de origem:** `fix/prontuario-integrado-validado-20261115@20409c12`.  
**Produção preservada no corte:** `main@69954645`; verificar novamente no gate de publicação.

## 1. Decisão de entrega incremental (proprietário, 20/11)

A ordem de implementação e publicação passa a ser:

1. **Release 1: T0–T3** — concluir, testar, homologar visualmente, integrar, instalar backend compatível, publicar frontend e comprovar utilização real dos comandos de correção/exclusão.
2. **Release 2: T4** — bonificação consolidada, estado `Alterações pendentes de consolidação`, `Consolidar alterações`, `clear_item_history` e `delete_context`; migration, CI, aceite e deploy próprios.
3. **Release 3: T5** — edição/exclusão granular de tentativas, reanálises, contatos e patrimônio; migration, CI, aceite e deploy próprios.
4. **T6 transversal** — executar gates de regressão, autorização, acessibilidade, exportação, compatibilidade, recuperação e produção **em cada release**. T6 final integra o conjunto sem bloquear antecipadamente a entrega de T0–T3.

**Não recriar T0–T3, não retroceder as regras aprovadas e não aguardar T4/T5 para colocar a Release 1 em uso.** Os comandos ainda reservados para T4/T5 devem continuar retornando `ACTION_NOT_AVAILABLE`, sem botões que prometam funcionalidade inexistente.

## 2. Precedência: uma única fonte por categoria

| Fonte | Finalidade e limites |
|---|---|
| [Contrato aprovado](../reference/PRONTUARIO_CORRECAO_CONTRATO.md) | Regra de negócio, correção assistida sem bloqueios históricos arbitrários, ADR-055/056. |
| [Plano funcional original T0–T6](../superpowers/plans/2026-11-14-prontuario-visual-correcao-integrada.md) | Escopo completo e critérios de aceite, **agora executados em três releases**. Checkboxes anteriores não provam conclusão. |
| [Matriz de transição](../reference/PRONTUARIO_PLANO_TRANSICAO_INTEGRAL_T0_T6.md) | Cada rota antiga, nova autoridade, efeitos e consumidores. |
| **Este documento** | Ordem e gates de publicação da Release 1; arquivo único para retomar a execução incremental. |
| [Handoff de provas por SHA](../handoff/2026-11-15-prontuario-integracao-verificada.md) | CI e código efetivamente verificados; seções antigas são históricas. |
| [Direção visual original](../superpowers/specs/2026-11-13-prontuario-exploracao-visual.md) | Seis estados conceituais; somente princípios compatíveis com a flexibilização de 14/11; não é aceite visual do resultado atual. |
| [Estado mutável](../CURRENT_STAGE.md) | Branch, SHA, PR, checks e estágio vigente, sem sobrescrever contrato funcional. |

Nenhum relatório Argon/Manus/Gemini/Antigravity, PR Draft ou captura isolada tem autoridade para substituir a regra aprovada ou o código/SQL da versão que será publicada.

## 3. Reaproveitamento comprovado e fontes separadas

| Origem | Decisão nesta release |
|---|---|
| [PR #534](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/534) | **Fonte única de código T1–T3**, incluindo Auth/RLS Docker, 77 pgTAP, três disputas determinísticas e E2E com F5/segunda sessão. Fixar o SHA base; adaptar somente divergências reais. |
| [PR #532](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/532) | A-01, reconciliação incremental de Assessoria e testes já incorporados em #534. **Não mesclar uma segunda vez.** |
| [PR #517](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/517) | Rota documental já integrada à main; atualizar ponteiros, não reaplicar o PR. |
| [PR #516](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/516) | Destaque “Saídas sem ação definida” do Qualidade já integrado à main; preservar. |
| [PR #515](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/515) | Layout de Pendências e gaveta *em frente própria*, não importado; evitar colisão CSS e preservar semântica drawer desktop complementar/mobile modal. |
| [PR #522](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/522) | Parágrafos de observações em Pendências, Draft independente; não substituir o CSS da candidata por inteiro. |
| [PR #523](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/523) | Hotfix Auth/timeout de incidente, isolado; não introduzir nesta release sem decisão específica. |
| `audit/gemini-revisao-critica-e-sugestoes-20261115@d55747b9` | Auditoria datada; contratos de tooling considerados, sem necessidade de segundo merge integral. |
| Branches Argon e Manus de 14/11 | Fixtures de T0 e helper T5 já preservados; não recuperar migrations inseguras nem tarefas futuras como se fossem concluídas. |

## 4. Inventário visual e de evidências

- **Seis pranchas de 13/11:** avaliação mensal, detalhe fiscal, análise incorreta, reanálise, novo envio e retificação, descritas na [seção 7 da especificação visual](../superpowers/specs/2026-11-13-prontuario-exploracao-visual.md#7-pranchas-conceituais). **O repositório contém a descrição textual, mas não contém os seis arquivos de imagem nessa pasta**; não afirmar que imagens geradas em sessões anteriores estão versionadas. Não reconstruí-las como se fossem screenshots reais.
- **Capturas reais T1:** os artefatos do job visual dos PRs #532/#534 permitem comparar Prontuário pré-T1 e T1. No HEAD #534, `tests/e2e/global-visual-polish.spec.js` ainda difere de `prontuario.png` (aproximadamente 2% dos pixels versus tolerância de 1%). O snapshot pré-T1 não é especificação imutável: **inspecionar a nova grade e aprovar visualmente antes de alterar o golden**, sem ampliar limiar para aprovar artificialmente.
- **Ponto observado para decisão humana:** a coluna de contexto + faixa horizontal de programa da nova T1 aumenta a altura anterior aos registros fiscais em 1440×900. Medir acesso a NFs, densidade, foco, zoom, dark mode e 1280/1440/1920/390 px; não remover estrutura só para satisfazer imagem antiga.
- **Qualidade:** CTA e destaque do #516 são parte do código publicado; a exclusão de NF deve reabrir saída identificada e permitir nova identificação com F5/segunda sessão, sem misturar com `a_identificar`.
- Guardar no próprio PR de release os links dos **artifacts por SHA** e a decisão humana sobre cada tela. Uma captura passada de build distinto é referência, não aceite deste commit.

## 5. Escopo fechado da Release 1

- **T0:** contrato de casos, fixtures sintéticas, NF A/B, Assessoria, Bem exclusivo/compartilhado, Qualidade provisória, `a_identificar`, contexto mensal, perfis e expectativas de antes/depois.
- **T1:** grade horizontal com escola, competência, programa, Documento/Bonificação/Análise/Providência; NF identificada atualmente em Prontuário, Pendências, Passivo, Busca e exportação quando afetada; preservar `documentSnapshot` histórico.
- **T2:** `correct_analysis`, `clear_analysis`, `delete_pendency` com prévia, resultado atômico e nota opcional; evitar falsa resolução; perfil SME leitor; reanálise genuína permanece distinta.
- **T3:** `delete_invoice` com alcance/recibo idempotente, recomposição por ID, preservação de NF vizinha, bonificação consolidada independente, contato geral e patrimônio compartilhado; reabrir provisória Qualidade e proteger inventário externo.
- **Excluídos:** `correct_bonification`, `clear_item_history`, `delete_context`, `delete_attempt`, `correct_attempt`, `delete_review`, `correct_review`, `delete_contact`, `correct_contact`, `correct_inventory`, `delete_asset` e outras ações reservadas T4/T5.

## 6. Gates de execução — concluir uma vez, com evidência

| Gate | Evidência mínima | Situação inicial |
|---|---|---|
| G0 — código e fontes | #534 fixado, contrato/fixtures compatíveis, dependências atuais; sem mesclar #532 ou #516 duplicados. | **Preparado** no SHA 054d3bc4; revisão da release em andamento. |
| G1 — backend | 63 migrations em **Docker descartável**, 77 pgTAP focalizados + suíte geral, RLS/7 perfis, concorrência, idempotência, replay de cliente antigo, travamento de dependentes. | **Provas relevantes já aprovadas** no #534; confirmar no HEAD final da release. |
| G2 — frontend e consumidores | CLI/UI reais, F5/2ª sessão, NF A/B, Assessoria, Qualidade, Pendências, Passivo, Busca, Inventário, Excel; screenshot e decisão explícita do proprietário. | **Pendente aceite humano e cobertura de superfícies remanescentes.** |
| G3 — ativação controlada | Código T0–T3 compilado com flag **OFF padrão** e opt-in explícito de release; lado cliente e banco compatíveis; recurso inacessível em clientes/ambientes não liberados. | **Em implementação no #535.** |
| G4 — instituição e publicação | Backup/restore, migração inspecionada, compatibilidade de clientes, deploy no mesmo SHA, ativação após backend, smoke com perfis reais, observabilidade, procedimento de interrupção e de recuperação. | **Não realizado; exige decisão de publicação própria.** |

**Roteiro de implantação proposto:** (a) concluir G0–G3; (b) decisão expressa de publicação; (c) backup e validação de migração no Supabase institucional; (d) migration 63 compatível, depois frontend de produção com recurso OFF; (e) confirmar integridade e login; (f) habilitar o opt-in de release (novo build configurado e testado) somente se G4 autorizado; (g) executar as jornadas em produção com perfis e dados controlados. Rollback de frontend não reverte transações já aplicadas; restauração de dados e alterações posteriores à migração exigem plano próprio.

## 7. Política contra loop de agentes

1. **Um escritor ativo por branch**; o #535 é o candidato de release, #534 fica como origem e #532 como prova histórica. Não editar os três simultaneamente.
2. Não repetir CI aprovado no mesmo SHA por rotina; repetir apenas quando código ou condição relevante mudar.
3. Um defeito demonstrado → caso RED focalizado → correção → GREEN → consumidores adjacentes; nunca mudar testes para disfarçar comportamento errado.
4. Não iniciar T4/T5 antes de liberar/estabilizar a Release 1. Nenhuma decisão de visual/escopo posterior pode reintroduzir justificativas ou guardas indevidos.
5. Cada registro de checkpoint contém SHA, operação, ambiente, teste/artefato, evidência, responsável por aceite e resultado; nenhuma palavra “concluído” antes do gate correspondente.

**Próximo ato concreto:** implementar e verificar o opt-in de publicação de T0–T3 (default OFF), concluir homologação visual T1 e reconciliação das rotas/consumidores T2/T3. Depois promover, mediante autorização, a release para o caminho institucional.