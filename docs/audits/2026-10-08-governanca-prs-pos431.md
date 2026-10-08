# RADAR PDDE — checkpoint de governança dos PRs após a reconciliação

**Data:** 08/10/2026  
**Natureza:** registro datado de estado e decisão administrativa. Não cria regra de negócio nem substitui `CURRENT_STAGE.md`.  
**Baseline confirmada:** `main` em `6e3b611698a024c6799aa377544961e5c2d1b0e3` após o merge do [#431](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/431).  
**Vercel Production:** deployment `dpl_BLJAtPbhEoMDnxfnS3t4Q7zGggSY`, `READY`, metadados Git no mesmo SHA, alteração documental. Revalidar ao vivo em qualquer execução futura.

## 1. Encerramento da reconciliação

O [#431](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/431) foi integrado depois de seis workflows verdes. Os 15 arquivos alterados pertenciam a `docs/`: reclassificam planos, handoffs, decisões, estados e metadados da matriz funcional. Permissões, regras, JS, CSS, SQL e migrations não foram alterados. A matriz continua com **44 operações: 18 covered, 26 partial, 0 gap e 0 decision**. O ajuste textual da INV-01 reconhece a conclusão do #404 no ambiente de teste com Supabase real; não afirma execução de CRUD em Production.

## 2. PRs encerrados administrativamente, sem merge

| PR | Classificação | Motivo e preservação |
|---|---|---|
| [#430](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/430) | Duplicado | A reconciliação vigente entrou pelo #431. O erro de uma execução de E2E do #430 não foi reclassificado como sucesso. |
| [#292](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/292) | Diagnóstico histórico | PR explicitamente criado para capturas, sem finalidade de merge; suas observações não homologam o layout atual. |
| [#395](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/395) | Plano histórico | Planos A–D de 29/09 não são fila executável após #396/#397/#404/#410/#427/#429. Seus documentos continuam consultáveis no histórico do PR/branch. |
| [#407](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/407) | Laboratório substituído | Experimentos ampliaram custos agregados apesar de ganhos locais. Preservar artefatos da branch; **não integrar** sua migration ou arquitetura experimental. |
| [#409](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/409) | Candidato superado | Invalidação por escola e reconexão seguiram pelos #410/#427/#429. O próprio PR continha falhas nos E2E e migration não publicada. |

O fechamento no GitHub não remove os comentários/commits já registrados, não confirma resolução de todo residual e **não autoriza reaproveitar trechos dessas branches sem revalidar na main atual**.

## 3. PRs mantidos abertos com destino deliberado

| PR | Justificativa para não encerrar ou integrar imediatamente | Próximo critério objetivo |
|---|---|---|
| [#264](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/264) | Atualização ampla de dependências de setembro, anterior à modernização #422 | Inventariar diferenças ainda necessárias, verificar versões e compatibilidade, evitar reverter melhorias recentes |
| [#284](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/284) | Readiness/bootstrap pausado por falhas E2E; remanescentes de polling exigem avaliação por risco | Reproduzir defeito atual, confrontar caminhos já simplificados, não mesclar branch antiga |
| [#324](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/324) | Skill opcional de roteamento que pode duplicar AGENTS e método canônico | Julgar ganho de agente e ausência de conflito documental |
| [#379](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/379) | Supabase CLI 2.119.0 não substitui automaticamente a CLI homologada 2.114.0 | Homologar essa versão exata com pgTAP/RLS e ciclos de banco |
| [#394](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/394) | Draft dos indicadores históricos: bug ainda não reproduzido na versão atual | Inspeção autenticada com dados históricos; revisar consulta e integração com sincronização posterior |
| [#414](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/414) | Patch de @types/node | Rebase e CI proporcional após confirmação de utilidade |
| [#423](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/423) | MSW 2 → 3, atualização major com mudanças de API e ESM | Testes de contratos de mocks/Node/CI, sem atualização automática |
| [#424](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/424) | actions/download-artifact 4 → 8, mudanças de digest e extração | Validar download e leitura de artifacts em workflows reais |

## 4. Próxima frente real de produto

1. Verificar `PROD-UX-08` (drawer desktop com conteúdo longo) em Production autenticada e **somente leitura**.
2. Verificar indicadores históricos do #394 com competências realmente anteriores. Não substituir dados reais por fixture improvisada.
3. Classificar IDs por horário em DirectoryService e pollings residuais por probabilidade, impacto e necessidade. A idempotência fiscal já foi entregue; não reabrir R1–R9.
4. Avaliar jornadas completas do usuário, priorizando clareza, hierarquia de informação, ações visíveis e recuperação de contexto. Escolher pequena frente com prova outside-in.
5. Sem autorização específica, não realizar CRUD em Production nem integrar PRs de manutenção/experimentos.

**Nota de método:** CI verde do #431 certifica a alteração documental e os gates executados. Não fornece prova de jornada humana autenticada nem substitui auditoria visual. Esta observação ainda está pendente.
