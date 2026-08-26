# RADAR PDDE — Handoff canônico do plano mestre pós-PR #200

| Campo | Valor |
| --- | --- |
| Data de referência | 26 de agosto de 2026 |
| Classe documental | Canônico — continuidade técnica, funcional e decisória |
| Baseline de origem | `0965ba8d5749f2ed25b3563a65ebc5da413e7fa5` |
| Origem do baseline | merge do PR #200 |
| Situação | PR #199 e PR #200 integrados; plano pós-auditoria aprovado; correções funcionais restantes ainda não iniciadas |
| Plano textual executável | [`../superpowers/plans/2026-08-26-plano-mestre-correcoes-pos-auditoria.md`](../superpowers/plans/2026-08-26-plano-mestre-correcoes-pos-auditoria.md) |
| Documento integral em Word | [`../reports/2026-08-26-plano-mestre-correcoes-pos-auditoria.docx`](../reports/2026-08-26-plano-mestre-correcoes-pos-auditoria.docx) |
| Integridade do Word | [`../reports/2026-08-26-plano-mestre-correcoes-pos-auditoria.sha256`](../reports/2026-08-26-plano-mestre-correcoes-pos-auditoria.sha256) |

> Este handoff é a porta de entrada curta. O Markdown é a fonte operacional para busca, diff e execução; o Word é a versão integral para leitura e aprovação. Nenhum dos dois autoriza sozinho escrita em Production, migration, mudança de regras do GitHub, merge ou deploy.

## 1. O que aconteceu

O PR #199 versionou o diagnóstico e o primeiro plano, sem implementar correções funcionais. Auditorias independentes posteriores encontraram lacunas e produziram uma especificação mais rigorosa.

O PR #200 corrigiu o incidente crítico em que a análise `Incorreto` podia parar em `PENDENCY_REQUIRED` quando a integração de Pendências não se instalava. Esse hotfix faz parte do baseline e não deve ser reimplementado.

O plano de 26/08 incorpora as auditorias, as decisões do responsável pelo produto e cinco revisões finais. Ele substitui o plano de 24/08 como referência operacional. Os arquivos anteriores permanecem preservados como histórico.

## 2. Estado confirmado no baseline

```text
Repositório: WilsonMPeixoto-2/RADARPDDE
main analisada: 0965ba8d5749f2ed25b3563a65ebc5da413e7fa5
commit curto: 0965ba8
origem: merge do PR #200
```

No baseline:

- o PR #200 está integrado;
- as demais correções funcionais do plano não foram executadas;
- nenhuma migration ou reparo descrito no novo plano foi aplicado por este pacote documental;
- nenhum dado de Production foi alterado por este pacote;
- deployment e Supabase devem ser revalidados no G0, porque são estados mutáveis;
- a proteção formal de `main` deve ser verificada no G0; se indisponível, o plano exige gate manual equivalente.

## 3. Decisão formal

> Plano aprovado em conteúdo e arquitetura após a incorporação das cinco revisões técnicas consolidadas em 26/08/2026. A versão revisada substitui os planos anteriores como referência operacional canônica da frente de correções pós-PR #200.

As cinco revisões incorporadas são:

1. o PR5 inventaria produtores de IDs persistentes, cria gerador compartilhado e elimina fallbacks baseados exclusivamente em `Date.now()`; `DirectoryService` é caso já confirmado;
2. `web-vitals` e `Server-Timing` não entram no PR9A, mas podem ser avaliados depois dele se restar lacuna diagnóstica comprovada; nenhuma telemetria externa fica autorizada;
3. PR3 é executado como PR3.1, PR3.2 e PR3.3, cada qual com RED, gate, revisão, publicação e reversão próprios;
4. PR8 é dividido desde o início em PR8A e PR8B;
5. PR9C não possui meta percentual universal antecipada; cada hipótese recebe orçamento somente após baseline e ruído medidos em PR9A/PR9B.

## 4. Exclusões definitivas

Não incluir, nem como tarefa oculta, dependência ou hardening:

- antigo item 20 da auditoria, sobre autoridade server-side mais ampla;
- proteção de senhas vazadas no Supabase Auth;
- PR #195;
- deduplicação de NF por conteúdo.

Se alguma entrega revelar necessidade inevitável de tocar uma exclusão, parar e pedir nova decisão de produto.

## 5. Regras de negócio que não podem ser alteradas

- Pendências continuam transversais a todas as competências.
- Pendência, análise técnica e bonificação são dimensões diferentes.
- `Sim + Incorreto + pendência` é combinação válida.
- Novo envio leva à reanálise; não resolve automaticamente.
- Despesa `A identificar` não vira automaticamente `Não` ou `Incorreto`.
- Pendência ativa não bloqueia consolidação sozinha.
- `Não analisado` não bloqueia consolidação sozinho.
- Sem NF de serviço, Consulta Assessoria converge para `Não se aplica`.
- Duas NFs legitimamente iguais podem existir.
- Abrir detalhe de Pendência não troca a competência global.
- Ir ao Prontuário a partir da Pendência pode trocar a competência de forma explícita.
- `Ver detalhes` permanece durante este programa; sua eventual remoção exige decisão posterior.

## 6. Ordem obrigatória

```text
G0
→ PR1
→ PR2
→ PR3.1
→ PR3.2
→ PR3.3
→ PR4
→ PR5
→ PR6
→ PR6B
→ PR7A
→ PR7B
→ PR8A
→ PR8B
→ PR9A
→ PR9B
→ PR9C
→ encerramento
```

Dependências especiais:

- PR4 somente depois de PR2 publicado, validado e seguido de preflight fresco;
- PR4 atualiza exatamente o conjunto autorizado pelo preflight, não uma quantidade rígida de quatro linhas;
- PR4, PR5 e PR6 só começam depois de PR3.3 quando dependerem do objetivo PR3 concluído;
- PR8A depende de PR5;
- PR8B depende de PR8A publicado e validado;
- PR9C depende de causa e orçamento definidos a partir de PR9A/PR9B.

## 7. Método obrigatório por entrega

Cada PR precisa registrar:

1. **premissa:** o defeito ainda existe no SHA e no ambiente relevantes;
2. **causa:** evidência que liga o comportamento à causa proposta;
3. **invariantes:** regras que não podem mudar;
4. **busca lateral:** chamadores, consumidores, regras equivalentes, strings, eventos e estados fora dos arquivos inicialmente previstos;
5. **RED:** regressão que falha pelo motivo esperado;
6. **implementação mínima:** somente a causa comprovada;
7. **revisão adversarial independente:** contraexemplos, retries, concorrência, estados parciais, compatibilidade, perfis, mobile e acessibilidade conforme o risco;
8. **gates:** testes focados, integração, banco, Preview ou Production proporcionalmente aplicáveis;
9. **publicação e smoke:** ordem, sinais de falha e evidência;
10. **reversão:** procedimento e condição objetiva para acioná-lo.

Não iniciar a entrega seguinte até o gate da atual estar satisfeito.

## 8. Primeira ação exata

Começar por G0, não por alteração de código:

1. buscar e confirmar `origin/main`;
2. confirmar o SHA publicado na Vercel;
3. confirmar Supabase Production, migrations, RPCs e dados relevantes somente por leitura;
4. registrar contagens, candidatos ao reparo, chamadas de invoice e baseline de performance;
5. confirmar proteção de branch/ruleset ou documentar o gate manual substituto;
6. só então abrir a branch isolada do PR1.

O PR1 contém apenas contenção imediata do submit repetido e política mínima de refresh. Não antecipar no-op, migration, idempotência, redesign de Pendências ou refatorações oportunistas.

## 9. Ordem de leitura para outro agente ou ferramenta

1. [`../../AGENTS.md`](../../AGENTS.md);
2. [`../CURRENT_STAGE.md`](../CURRENT_STAGE.md);
3. este handoff;
4. [`../superpowers/plans/2026-08-26-plano-mestre-correcoes-pos-auditoria.md`](../superpowers/plans/2026-08-26-plano-mestre-correcoes-pos-auditoria.md);
5. [`../reports/2026-08-26-plano-mestre-correcoes-pos-auditoria.docx`](../reports/2026-08-26-plano-mestre-correcoes-pos-auditoria.docx);
6. [`../reference/TEST_GOVERNANCE.md`](../reference/TEST_GOVERNANCE.md);
7. [`../reference/FUNCTIONAL_CONTRACT_MATRIX.md`](../reference/FUNCTIONAL_CONTRACT_MATRIX.md);
8. [`../PROJECT_CONTEXT.md`](../PROJECT_CONTEXT.md);
9. [`../DECISION_LOG.md`](../DECISION_LOG.md);
10. arquitetura, ADRs e runbooks citados pela entrega escolhida.

## 10. Regra de continuidade

Não recomeçar o diagnóstico do zero e não executar o plano cegamente. Revalidar premissas contra o SHA e os ambientes atuais, preservar as exclusões e seguir uma entrega por vez.

Se `main`, Vercel ou Supabase tiverem avançado, reconciliar a divergência explicitamente antes de qualquer código ou dado. O baseline `0965ba8` é o ponto de origem do plano, não uma constante eterna.
