# RADAR PDDE — fechamento pós-PR #237 e saneamento de CI

**Data:** 31 de agosto de 2026  
**Classe documental:** Canônico — estado corrente após PR #237  
**Baseline de entrada:** `cb6895635e72730659e702fba5af033ed993e1e7`

## 1. Estado corrente

O conjunto posterior ao PR #215 avançou até o PR #237. A `main` incorporou:

- PR #218 — autoridade dos fluxos críticos pós-PR215;
- PR #219 — preservação do contexto individual na reanálise;
- PR #221 — canonização do contexto das Pendências críticas;
- PR #222 — instalação determinística das extensões críticas;
- PR #223 — correção das colunas da Consulta Assessoria;
- PR #224 — correção da bonificação da Consulta Assessoria;
- PR #225 — exibição completa da bonificação da Consulta Assessoria;
- PR #226 — abertura do RADAR na competência do mês corrente;
- PR #227 — polimento da competência e documentos do Prontuário;
- PR #230 — respiro entre programas e reorganização dos dados da escola;
- PR #232 — dados da unidade em cartões visuais;
- PR #233 — composição do resumo da unidade;
- PR #234 — fechamento da validação visual do PR #233;
- PR #235 — modernização dos modais e detalhe de Pendências;
- PR #237 — refinamento visual aprovado das superfícies de Pendências.

Os PRs #220, #228 e demais rascunhos/redundâncias fechados sem merge não integram o baseline.

## 2. Auditoria das falhas de CI na virada de mês

A execução em 31/08–01/09 revelou falhas que pareciam cinco defeitos funcionais independentes. A classificação correta é:

1. expectativas fixas em agosto/2026 nos testes de gestão de exercício;
2. expectativa de permanência em agosto após nova sessão, embora o contrato vigente abra no mês corrente;
3. cálculo fixo de competência futura com referência de agosto;
4. cenário de Pendência com programa contendo sublinhado dependente implicitamente da competência corrente;
5. defeito real de UI incremental: a bonificação agregada da Consulta Assessoria era atualizada no estado, mas o toggle somente leitura permanecia visualmente no valor anterior.

O saneamento corrente torna os quatro cenários temporais determinísticos e corrige a sincronização visual da Assessoria.

## 3. Regra temporal de testes

Testes que validam o mês corrente devem derivar a competência por `RadarCompetencia.competenceKeyFromDate(new Date())` no mesmo contexto do navegador.

Testes de fixture funcional que não pretendem validar calendário devem selecionar uma competência fixa por `RadarCompetenceContext` / `selectFixtureCompetence()`.

Não voltar a fixar agosto/2026 como sinônimo de “mês corrente”.

## 4. Refinamento visual vigente

O PR #237 tornou referência visual corrente:

- Dados da unidade e Programas vinculados no Prontuário;
- separação clara entre programas;
- Notas Fiscais e Consulta Assessoria individualizadas;
- modal de novo envio;
- modal de cobrança;
- drawer de Pendência em desktop e mobile.

A cobrança termina somente em **Atenciosamente**. RADAR é o nome do sistema, não assinatura institucional.

## 5. Production

O merge do PR #237 está na `main`, mas a promoção para Production deve ocorrer somente depois do fechamento dos gates de CI e da revisão das dependências pendentes. Não declarar Production atualizada antes de existir deployment Vercel correspondente ao SHA aprovado.

## 6. Dependências

A auditoria classificou os PRs de Dependabot abertos:

- incorporados neste fechamento, sujeitos aos gates: `@supabase/supabase-js 2.112.4`, `esbuild 0.28.2`, `knip 6.32.2`, `eslint 10.8.1`, `eslint-plugin-playwright 2.11.0` e `actions/checkout v7`;
- `supabase CLI 2.116.0` foi testado e **não aprovado**: o pgTAP/RLS local passou a falhar em duas garantias de service_role; permanece a versão homologada `2.114.0`;
- `@types/node 26.2.0` foi **adiado** porque o projeto declara Node `24.x`; permanece `24.13.3`.

Atualização de dependência só é considerada concluída depois dos gates e da reconciliação do lockfile/artefatos gerados.

## 7. Próxima sequência

```text
corrigir CI temporal + sincronização visual da Assessoria
→ executar gates
→ revisar/ integrar dependências compatíveis
→ atualizar documentação canônica
→ publicar Production
→ revalidar Production
→ retomar o plano mestre sem reimplementar entregas PR #218–#237
```

O plano mestre de 26/08 permanece vigente como sequência futura, mas seu estado deve ser lido à luz das entregas já incorporadas até o PR #237.
