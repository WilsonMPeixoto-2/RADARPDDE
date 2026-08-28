# Handoff — PR #211 / hotfix de Notas Fiscais

**Data:** 28 de agosto de 2026  
**PR:** #211 — Draft  
**Branch:** `hotfix/individualizar-analise-notas-fiscais`  
**Checkpoint funcional:** `5088785e2755e7ae27efc3efc38ea5e0fc3fd5d6`  
**Production:** sem alteração causada por este PR

## 1. Situação atual

O hotfix está em implementação real no GitHub. Não está em scratch temporário.

A implementação funcional foi corrigida a partir dos ciclos de gate e, no checkpoint acima, os gates de domínio, banco, E2E, segurança, backup e perfis/viewports estão aprovados.

Permanece vermelho apenas o Lighthouse móvel por LCP. A evidência histórica do PR #210 comprova que o mesmo gate já falhava antes do PR #211, com LCP móvel de 15,28 s para um limite de 15 s. No PR #211 a medição mais recente foi 16,03 s. O limite não foi relaxado nem mascarado.

> **implementação funcional validada; ainda em Draft para inspeção visual/revisão adversarial e decisão explícita sobre a dívida de performance móvel pré-existente.**

## 2. O que está funcionalmente definido

- análise técnica por `registered_invoice_id`;
- bonificação agregada;
- resumo técnico derivado;
- Pendência por invoice;
- `boleto_internet` permanece tipo de gasto;
- `a_identificar` nasce Incorreto + Pendência;
- drawer do Prontuário é somente visualizar/editar/salvar;
- novo envio e reanálise continuam na tela de Pendências;
- desktop é o alvo.

## 3. Resultado dos gates

A rodada de estabilização fechou as falhas determinísticas encontradas pelos gates:

- matriz funcional alinhada para 43 operações;
- conjunto canônico e pgTAP alinhados para 43 migrations;
- migration `20260828023000_invoice_document_analysis_pendency.sql` aplicada com sucesso em PostgreSQL/Supabase descartável;
- artefatos Supabase regenerados, incluindo os quatro novos RPCs nos tipos TypeScript;
- pgTAP: **25 arquivos / 346 testes / PASS**;
- E2E principal: **153 aprovados / 39 ignorados por escopo / 0 falhas**;
- E2E de pré-production: aprovado;
- gate remoto de autenticação/RLS: **14 testes aprovados**;
- gate de perfis × viewports: **15 testes aprovados**;
- CodeQL, dependências, snapshot, Excel SME, backup/restauração e readiness: aprovados.

### Único gate vermelho

O Lighthouse móvel continua acima do orçamento de LCP:

- PR #210, antes deste hotfix: **15,28 s**;
- PR #211, medição mais recente: **16,03 s**;
- limite vigente: **15,00 s**.

Desktop ficou dentro do orçamento na rodada corrente: LCP **3,42 s** para limite de **3,50 s**.

Esse vermelho é uma dívida móvel herdada, não um defeito funcional introduzido pelo PR #211. O threshold não foi elevado. A decisão de tratá-lo como exceção de merge deve ser explícita, nunca implícita.

### Pendente antes de retirar Draft

- inspeção visual autenticada do Preview no desktop contra as referências aprovadas;
- revisão adversarial final do diff;
- decisão explícita sobre o Lighthouse móvel herdado.

## 4. Próxima ação exata

1. inspecionar o Preview autenticado no desktop contra as referências visuais aprovadas;
2. revisar o diff completo de forma adversarial, incluindo migration, RPCs, concorrência, rollback e histórico;
3. confirmar que nenhuma regra de Boleto Internet, Assessoria ou Inventário regrediu;
4. classificar formalmente o Lighthouse móvel como bloqueio ou dívida herdada autorizada;
5. somente depois disso retirar Draft e decidir merge/publicação.

## 5. Relação com o plano mestre

Este hotfix **não substitui o plano mestre**.

Depois do merge e do smoke de Production, a próxima ação não é começar cegamente PR3.1. Primeiro deve existir um checkpoint de reconciliação:

```text
PR #211 publicado
→ reler main/Supabase/Vercel
→ comparar com plano mestre
→ atualizar premissas afetadas
→ confirmar ordem restante
→ iniciar PR3.1
```

Essa etapa é obrigatória porque o hotfix altera precisamente áreas que o plano futuro também pretende tocar: InvoiceService, efeitos de NF, Pendências, RPCs, contratos de persistência e UI do Prontuário.
