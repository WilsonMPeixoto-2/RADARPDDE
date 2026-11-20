# Conciliação diferencial das branches colaboradoras — T0–T6

**Data da consulta:** 20/11/2026, após o commit `6ed30db5` no PR #535. **Natureza:** auditoria independente de proveniência; não é nova especificação funcional. **Método:** `compare_commits` entre as branches e `release/prontuario-t0-t3-20261120`; leitura de documentos selecionados e de código/testes no SHA; hashes de arquivos para excluir reaproveitamento duplicado.

## 1. Atualizações efetivas desde a última triagem

| Fonte | HEAD conferido | Resultado contra PR #535 | Decisão |
|---|---|---|---|
| Antigravity [#534](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/534) | `054d3bc4`, 20/11 17:07 UTC | `ahead=0, behind=13`, histórico já contido na Release 1 | **Nenhum código novo** a incorporar. Continuar revisão após novos pushes. |
| Revisão Antigravity [#532](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/532) | `2235821c`, 20/11 02:44 UTC | `ahead=16` por histórico divergente antigo; arquivo `service-advisory-pendency.js` e `schema.test.sql` têm **mesmo blob SHA** da Release 1 | **A-01 já absorvida**. As demais diferenças são comparáveis à implementação posterior; não substituir por arquivos de baseline antiga. |
| Manus SQL/cliente | `f0fa7335`, 15/11 03:32 UTC | `ahead=0`, história inteiramente incorporada | Nenhum merge. |
| Manus T1 reconstruída | `300ac6d1`, 15/11 03:45 UTC | `ahead=1` histórico; `tests/e2e/sme-access-governance.spec.js` tem **mesmo blob SHA** da Release 1 | Teste SME já incorporado; não repetir. |
| Manus auditoria independente | `a87e9e0e`, 15/11 03:34 UTC | divergência histórica de sondas e capturas | Evidência datada; não importar migration original nem dados antigos como base nova. |
| Gemini revisão | `d55747b9`, 17/11 04:54 UTC | 1 relatório adicional exclusivo e base antiga | Diagnóstico Dependabot/tooling fora desta release, registrado em C018? **Não**: já distinguido nas fontes de manutenção e relatórios do registro. |
| Gemini plano comparativo | `166aad44`, 14/11 23:10 UTC | 1 plano exclusivo | Cinco propostas já triadas em C013–C017, não há implementação inédita. |
| PR #515, visual Pendências | `08bddb19`, 14/11 06:30 UTC | 4 documentos históricos de Prontuário/UX, CSS de Pendências independente | Classificação explícita em C019–C022; **somente referências relevantes**, não merge CSS. |

**Fato confirmado:** nenhuma das branches colaboradoras examinadas avançou em HEAD desde a fotografia anterior registrada em 20/11. Isso não significa inexistência de análises úteis mais antigas: os documentos do PR #515 ainda não estavam classificados individualmente.

## 2. Análise de mérito das contribuições ainda não consolidadas

**Plano Mestre Unificado de 14/11 (C019):** suas cinco recomendações coincidem materialmente com as propostas Gemini já capturadas por C013–C017. Copiar o plano inteiro produziria concorrência de autoridade e repetiria instruções de pré-implementação hoje superadas. Preservar como fonte histórica indexada.

**Arquitetura Visual do Prontuário de 13/11 (C020):** recomenda separar visualmente Bonificação e Análise Técnica e ligar cada NF ao seu desdobramento de Assessoria ou Inventário. O HEAD atual já contém `decorateInventoryLinks()` e `moveServiceAdvisoryControls()` em `src/integration/prontuario-operational-ux.js`. A melhoria ainda não comprovada é a **qualidade real da comunicação visual** no navegador e a legibilidade dos vínculos em T1. Aproveitar como critério de inspeção humana, não como motivo para um CSS adicional sem screenshot comparado.

**Diagnóstico de BONIFICAÇÃO INAPTA de 12/11 (C021):** contém um caso operacional real, preservado na branch de origem, que não deve ser transferido para fixtures. A leitura do HEAD atual mostra que `evaluateBonification()` recebe exclusivamente valores de `bonificacao`; não lê diretamente `a_identificar`, `fiscalNotes` ou `analise`. Um `encampInventario === 'Não'` implica `inapta` pela regra genérica de qualquer marca negativa — mas isso não comprova que um `Não` tenha sido gravado automaticamente ou que o estado exibido seja derivado dele. `getProgramBonificationStatus()` também prioriza `resultadoBonif` persistido. **Conclusão:** registrar como hipótese e proteção de regressão de domínio com dados sintéticos; não corrigir diretamente um registro institucional nem criar N/A automático sem a prova causal e a decisão funcional de T4.

**Mapa Geral UX de 13/11 (C022):** itens de Dashboard, Carteira, Competências, Pendências e Inventário pertencem a outras frentes. O documento só informa a leitura de composição da T1, não autoriza incorporar o PR #515 ou redesenhar telas fora da release.

**Revisão #532 / Manus T1:** comparação de **blob SHA idêntico** para arquivos-chave comprova reaproveitamento; contagem Git de commits à frente em branches divergentes não equivale a novidade funcional. Não fazer cherry-pick.

## 3. Critério para incorporação

- **Incorporar agora:** somente o teste de regressão da separação Bonificação x análise e o vínculo documental das propostas C019–C022; nenhum código funcional novo foi identificado como provado e compatível no período.
- **Validar na própria T1:** qualidade dos conectores visuais NF → Assessoria/Inventário e contexto de `a_identificar`; exige screenshot real, aceite humano e não atualizar o golden antes disso.
- **Requer análise específica T2:** proposta de normalizar `Correto (Atrasado)`, ainda `pending-review` C014 — não copiar mudança sem revisar o contrato de atraso.
- **Conservar para T4/T5:** troca coordenada de classificação, saneamento de pendências legadas, navegação após `delete_context` (C015–C017).
- **Não misturar:** PR515 CSS da fila, PR522 parágrafos, PR523 incidente Auth, upgrades de dependências, auditoria documental PDDE e registros institucionais no Supabase.

## 4. Trilha de execução e limites

O código de produção **não** foi alterado. O teste adicional de domínio de Bonificação/Análise é sintético, lê apenas funções puras e não consulta o Supabase institucional. A adição de rastreabilidade NÃO encerra o gate visual da T1. O CI do PR #535 no SHA `6ed30db5`: 15 checks aprovados, 2 skipped e 1 falha de golden `Desktop homologado`. Não mudar o snapshot para torná-lo verde.

**Próxima ação:** finalizar CI do SHA atual após a inclusão de testes e deste registro, homologar visualmente T1 no ambiente real isolado e avançar cobertura de consumidores T2/T3. Reavaliar branch #534 se seu HEAD mudar.
