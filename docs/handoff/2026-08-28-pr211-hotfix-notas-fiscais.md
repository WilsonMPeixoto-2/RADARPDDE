# Handoff — PR #211 / hotfix de Notas Fiscais

**Data:** 28 de agosto de 2026  
**PR:** #211 — Draft  
**Branch:** `hotfix/individualizar-analise-notas-fiscais`  
**Checkpoint:** `cebac4dcb3dfb1836f81d59ba58d04cc96974aca`  
**Production:** sem alteração causada por este PR

## 1. Situação atual

O hotfix está em implementação real no GitHub. Não está em scratch temporário.

Já existem mudanças de domínio, aplicação, banco, testes e layout na branch, mas os gates encontraram falhas reais. Portanto, o estado correto é:

> **implementação avançada, ainda não apta para merge.**

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

## 3. Falhas abertas

- migration Draft com delimitador inválido na RPC de `a_identificar`;
- unit tests ampliados ainda precisam de diagnóstico;
- uma advertência nova de lint ultrapassa o orçamento atual;
- readiness de Supabase falha por consequência;
- E2E completo ainda não executado;
- Preview autenticado ainda não inspecionado.

## 4. Próxima ação exata

1. corrigir a migration;
2. executar migration-smoke;
3. abrir JUnit da suíte unitária;
4. corrigir produto/teste conforme o contrato aprovado;
5. remover a nova advertência de lint;
6. reexecutar gates;
7. criar/ajustar E2E dos cenários reais;
8. validar Preview;
9. revisão final;
10. somente então decidir merge.

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
