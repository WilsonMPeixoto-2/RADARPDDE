# Continuidade verificável — Prontuário T0–T6

**Classe:** índice operacional de rastreabilidade, não contrato funcional paralelo. **Primeira consolidação:** 20/11/2026. **Autoridade de execução:** ChatGPT. A branch, o PR e a etapa vigentes constam no [checkpoint](CHECKPOINT.md). Os agentes colaboradores podem escrever em suas próprias branches.

## Rota de retomada em um novo chat ou agente

1. **Ler `AGENTS.md` e `docs/CURRENT_STAGE.md`** para conhecer o produto, as restrições e a frente atual.
2. **Ler [CHECKPOINT.md](CHECKPOINT.md)**, que guarda o último HEAD verificado, o que foi feito, o que não foi comprovado e **o próximo ato objetivo**.
3. **Consultar [registry.json](registry.json)** por `T0T6-Dxxx` (decisões e mudanças de direção) ou `T0T6-Cxxx` (contribuições externas e sua triagem). **Não começar nova análise sem consultar IDs existentes**.
4. Abrir [contrato funcional](../../reference/PRONTUARIO_CORRECAO_CONTRATO.md), [plano original T0–T6](../../superpowers/plans/2026-11-14-prontuario-visual-correcao-integrada.md), [matriz de transição](../../reference/PRONTUARIO_PLANO_TRANSICAO_INTEGRAL_T0_T6.md) e [plano histórico da Release 1](../../releases/2026-11-20-prontuario-t0-t3-release-1.md). O registro não os substitui.
5. **Conferir GitHub ao vivo**: branches, PR, diff, `main`, jobs do SHA e eventuais contribuições pós-checkpoint. Um `HEAD` anotado é uma **fotografia histórica**, não verificação atual.
6. Somente então executar o **próximo ato pendente**. Se não houver evidência de uma decisão ou incorporação, marcar *não confirmado* e investigar; nunca inferir conclusão pelo nome do arquivo ou pelo texto de outro agente.

## Revisões diferenciais de branches colaboradoras

- [Conciliação de 20/11/2026](AUDITORIA_COLABORADORES_20261120.md): SHAs comparados, propostas C019–C022, hipóteses não comprovadas e decisão de não mesclar CSS/código antigo por volume de diff.

## Genealogia verificável desde as ideias de origem

- [Atlas com linha evolutiva, contradições e lacunas](LINEAGE.md)
- [Fontes e requisitos em JSON, incluindo origens exclusivas de outras branches](lineage.json)

**Consulta obrigatória antes de novos planos:** localizar o ID `T0T6-Rxxx`, sua fonte original e transições; conferir o código **real** da release. Não tratar fonte histórica como integralmente vigente ou integralmente superada. Fontes ainda sem revisão integral permanecem marcadas como lacunas, não contam como cobertura comprovada.

## Continuidade **de impacto** entre chats, código, UX e etapas

- [Protocolo de captura, propagação e aceite](DECISION_IMPACT_PROTOCOL.md)
- [Obrigações por decisão, fase e superfície](decision-impact.json)

**Regra obrigatória:** uma decisão aprovada pode continuar com obrigação futura `planned` mesmo que outra parte esteja em código `candidate`. Antes de redesenhar Inventário, Prontuário ou qualquer outra tela, consultar as obrigações das regras anteriores também para testes, relatórios e banco. Rodar `npm run decisions:impact -- --query --phase=T5 --surface=ui` (filtro opcional por `--decision=` ou `--file=`). O teste de CI verifica estrutura, não garante cobertura semântica de todas as conversas ou implementação.

## O que registrar e quando

A [D023](D023_CONTINUIDADE_REMOTA_E_USABILIDADE.md) explicita a manutenção sistemática desta trilha e a usabilidade humana em paralelo à engenharia, em todas as fases. Atualizar em cada avanço material, sem esperar o esgotamento da cota. O sucessor precisa localizar objetivo, decisões/regras, prioridades, autorizações vigentes, alterações, branch/PR/SHA, testes e resultados inclusive desfavoráveis, limites e próximo ato.

| Evento material | Registro obrigatório na mesma entrega remota |
|---|---|
| Nova regra/decisão do proprietário, objetivo alterado, reversão de proposta | Nova entrada `T0T6-Dxxx`; quando superar anterior, usar `supersedes` e marcar a anterior `superseded`; vincular contrato/plano se for mudança funcional |
| Nova revisão, código, insight ou teste de Antigravity/Manus/Gemini/outros | Nova ou atualizada `T0T6-Cxxx` com origem (branch + SHA/PR), diagnóstico, status e motivo; se incorporada, **evidência de commit/PR** |
| Red/Green, correção funcional, alteração de gate, aprovação visual | Atualizar `CHECKPOINT.md` com SHA/URL de job e consequências; registro de decisão quando mudar regra ou avaliação |
| Novo ponto de interrupção, fim de sessão, handoff entre chats ou ferramenta | Atualizar `CHECKPOINT.md` **antes de encerrar**, dar commit/push e confirmar URL/SHA remoto; registrar próximo passo sem depender da conversa |
| Release, merge, migration e deploy autorizados | Registrar separadamente estado de branch/CI/backup/banco/versão Vercel, autorização, artefatos e evidência pós-deploy. Nunca confundir candidato, validado ou publicado |

**Frequência:** no mesmo commit/PR da alteração **material**, no fechamento de cada ciclo e sempre antes da passagem de contexto. Não exigir reabrir planejamento para cada comentário menor. Preservar histórico: mudar status acrescentando fonte/justificativa, sem apagar a trilha anterior. Não deixar três arquivos dizerem “vigente” para SHAs diferentes.

**Conferência de passagem:** confirmar que o ref/PR e os arquivos podem ser lidos no GitHub antes de declarar a continuidade registrada. Distinguir arquivo local, commit remoto, PR integrado e release publicada. Se houver impedimento de gravação remota, declarar o que permanece local e como recuperar, sem encerrar como sincronizado. A troca de agente não revoga autorizações existentes nem dispensa suas condições. Não publicar credenciais ou documentos/dados escolares identificáveis; manter referências autorizadas às evidências privadas.

## Como classificar uma sugestão de colaborador

- `pending-review`: ainda exige comparação com contrato/código/testes;
- `accepted-for-validation`: ideia aceita como requisito de teste ou investigação, **sem afirmar implementação**;
- `incorporated`: absorvida, com prova de commit/PR;
- `reference`: importante como evidência ou diagnóstico histórico, já coberta ou não aplicável como código novo;
- `rejected`: contraprova e fundamento; não reapresentar sem nova evidência;
- `deferred`: mérito potencial, escopo da release seguinte, não descartar.

O registro mantém **decisão do produto** distinta de **estado de implementação**. A integração de código não prova autenticação real, homologação visual, publicação ou saneamento de dados.

## Escopos segregados

[D024 — esclarecimento de D022](D024_ESCOPO_AUDITORIA_AGENTICA.md): D024 esclarece exclusivamente o alcance documental de D022: profissionalizar o fluxo agêntico existente SharePoint/OneDrive → análise cruzada → Pendências e registros autorizados no RADAR → conferência de cobertura e resultados. Não desenvolver extrator local, importador JSON, página independente ou módulo documental neste ciclo; experimentos são referências exploratórias. Evolução para usuários exige plano e aprovação prévios; planejamento agêntico posterior à consolidação T6. Sem novas permissões.

Esta frente cobre exclusivamente a evolução visual e flexibilização de regras **T0–T6**. Não absorve automaticamente PRs de upgrade de pacotes/Dependabot/CI nem a operação institucional de análise documental do PDDE (Drive, despesas, avaliações e Pendências reais lançadas no RADAR/Supabase). Tests T0–T6 usam ambiente **Docker Supabase isolado** com fixtures sintéticas; a operação institucional deve continuar normalmente.

## Validação

O verificador `scripts/check-prontuario-continuity.mjs` e testes em `tests/unit/prontuario-continuity.test.js` checam formato, IDs, relações `supersedes`, proveniência, integridade dos caminhos locais e ponteiros da rota. Validam **consistência documental**, não reproduzem banco, UI ou aprovação humana.

**Ponto de atenção para futuro:** o conteúdo deste diretório deve ser migrado/atualizado para R2 (T4) e R3 (T5) pela mesma rota, sem criar uma série de arquivos de “estado atual” concorrentes.
