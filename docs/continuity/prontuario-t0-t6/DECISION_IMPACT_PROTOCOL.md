# Protocolo de propagação de decisões entre chats, branches, camadas e etapas — RADAR PDDE

**Data:** 20/11/2026 · **Estado:** diretriz aprovada do proprietário registrada no PR #535, sem proclamar implementação funcional completa. **Identificador:** `T0T6-D020`.

## Decisão expressa pelo proprietário

A coerência histórica **não se limita à comparação entre branches**. Uma decisão aprovada num chat do projeto deve produzir consequências normativas e técnicas nos trabalhos executados em **outros chats e outros agentes**, inclusive meses depois. Ela não se extingue porque a primeira parte foi implementada ou porque uma fase futura (por exemplo, layout, exportação, testes ou inventário) ainda não começou.

Esta transcrição é derivada da solicitação formulada pelo proprietário no chat do projeto em 20/11/2026. **Não há permalink imutável do chat aqui no GitHub**; a proveniência textual foi preservada neste documento, mas não deve ser falsamente representada como URL verificada do ChatGPT.

## Autoridade e fonte da verdade

1. **Regra funcional:** `docs/reference/PRONTUARIO_CORRECAO_CONTRATO.md`, ADRs e plano de transição; o novo catálogo de impactos **não altera** contratos.
2. **Decisões e evolução:** `registry.json` (Dxxx); `lineage.json` (Rxxx, fontes versionadas); `decision-impact.json` (Ixxx, obrigações ainda aplicáveis por fase e superfície).
3. **Situação executiva:** `CHECKPOINT.md`, PR e CI por SHA, ambiente efetivamente verificado. Nunca inferir Production de candidata ou testes locais.
4. **Origem entre chats:** o agente que receber/aceitar uma nova decisão registra sua formulação, data, contexto, fonte/referência de conversa quando acessível, condições e alterações anteriores que ela supera, no GitHub **na mesma entrega**. Se a fonte não puder ser recuperada, declarar a lacuna em vez de atribuir falso link. Conversas do ChatGPT, arquivos locais e memória do agente não são automaticamente sincronizados com o GitHub.
5. **Agentes colaboradores:** cada branch pode desenvolver implementação, proposta, código ou testes independentemente. A integração é seletiva; nenhum agente cria interpretação substituta do contrato silenciosamente.

## Ciclo de vida de uma decisão

```text
Fala do usuário / análise / proposta de agente
  -> classificar: proposta, decisão aprovada ou hipótese sem fonte
  -> localizar Dxxx e Rxxx anteriores, conferir regras superseded
  -> registrar Dxxx (ou revisão justificada) + impacto Ixxx por fase e camada
  -> cada implementação atualiza somente suas obrigações atingidas
  -> pendências futuras permanecem abertas e reaparecem em novas fases
  -> validação técnica + visual + relatórios + autorização por release
  -> evidências por SHA e aceite, sem apagar o histórico
```

**Nunca marcar a decisão inteira como concluída só porque uma obrigação de backend foi cumprida.** Em `decision-impact.json` cada obrigação tem `phase`, `surface`, `requirementIds`, `targetPaths`, `status` e critério de aceite. Estados:
- `planned`: obrigação aprovada, prevista para fase futura, ainda não realizada;
- `candidate`: implementação candidata existente, sem certificado de conclusão;
- `gate-pending`: precisa de prova, aceite humano, compatibilidade ou outro gate;
- `preserve`: invariante obrigatório para desenvolvimentos que tocam a superfície;
- `verified`: só com evidência explícita, linkando commit/testes/revisão; **não significa publicada**.

Ao mudar requisito, a decisão original continua rastreável por `supersedes`; uma proposta antiga não vira aprovada por aparecer em outra branch. Nunca remover um impacto obsoleto para esconder a mudança: registrar transição e sucessor antes de encerrar.

## Exemplo operacional: inventário, regras, layout e testes

A decisão já aprovada de flexibilizar correções/exclusões (D002), juntamente da independência entre despesa e bonificação (D011), repercute em **tempos distintos**:

| Fase/superfície | Consequência que deve permanecer coerente | Estado do compromisso |
|---|---|---|
| T3 · domínio/SQL | Excluir NF com bem exclusivo e relações causais de modo seguro, mediante autenticação, transação e RLS; preservando NF vizinha e bonificação | Código candidato com provas de banco local; não é produção |
| T3 · interface | Mostrar objeto, vínculos reais e confirmação do efeito sem pedir justificativa fictícia | Candidato; aceite de interface ainda exigido |
| T5 · inventário | Corrigir lançamento patrimonial equivocado, inclusive estado `Inventariada`, por caminho expressamente autorizado; sem baixas automáticas no SIGMA/SEI | **Obrigação futura, não concluída pela T3** |
| T5 · layout/UX | Ao desenvolver a tela, representar essa ação, o motivo de impossibilidade concreta e o próximo passo; não restaurar a proibição antiga por copiar o protótipo da época | **Obrigação futura** |
| T5 · testes | Verificar autorização, triggers, integridade do bem, NF, bonificação, reload, condições de erro e demais telas afetadas | **Obrigação futura** |

**Importante:** o exemplo não transforma a hipótese do usuário em nova regra específica de inventário. Usa o contrato de flexibilização e o estado do cadastro existentes. `Inventariada` permanece estado terminal nas rotinas ordinárias até a autoridade nova ser efetivamente introduzida e comprovada.

## Consulta obrigatória antes de alterar código, layout, documento ou teste

```bash
npm run check:continuity
npm run decisions:impact -- --query --decision=T0T6-D002
npm run decisions:impact -- --query --phase=T5 --surface=ui
npm run decisions:impact -- --query --file=src/integration/prontuario-operational-ux.js
```

O agente deve relacionar no PR: IDs de decisão Dxxx, requisitos Rxxx, obrigações Ixxx (presentes e futuras), critérios comprovados, implicações em consumidores, conflitos com orientação anterior e **o que continua pendente**. O mesmo dever vale para um novo chat deste Projeto; não depende de lembrar o nome da branch anterior.

## Limitações e gates

O verificador `scripts/check-prontuario-impact.mjs` garante **integridade estrutural** do mapa, não compreensão semântica de todo o código nem leitura automática de todas as conversas. Seu sucesso não substitui os testes de regras, SQL, interface e efeito nas telas, nem a revisão humana. O catálogo contém um **mapeamento inicial**, ainda sujeito à auditoria de abrangência. As lacunas históricas de `lineage.json` continuam abertas.

**Critério de aceite de uma release:** requisitos aplicáveis à release têm comportamento provado, obrigações de UI aceitas pelo proprietário e consumidores/compatibilidade verificados; tarefas futuras ficam expressamente abertas para a release seguinte. Produção, migrations institucionais e a frente de prestação de contas seguem intocadas sem autorização específica.
