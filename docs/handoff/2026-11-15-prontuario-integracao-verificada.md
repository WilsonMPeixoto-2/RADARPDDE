# RADAR PDDE — checkpoint executável da integração T0–T3 (15/11/2026)

**Leitura obrigatória temporária para qualquer agente que continuar esta frente.**
**Branch única de integração e recuperação:** `fix/prontuario-integrado-validado-20261115`.
**Baseline conservada:** `main` em `4011a2b8`, sem alteração, merge ou deploy pela frente.
**Plano de destino:** [Prontuário: design, correção e exclusão integrados](../superpowers/plans/2026-11-14-prontuario-visual-correcao-integrada.md).
**Regras aprovadas:** [contrato](../reference/PRONTUARIO_CORRECAO_CONTRATO.md) e [estudo de flexibilização](../superpowers/specs/2026-11-14-flexibilizacao-correcao-exclusao-lancamentos.md).

## Comece aqui — retomada pelo Astra

**O que abrir:** branch `fix/prontuario-integrado-validado-20261115`, consultar `git status`, `git log -1` e comparar com `main` antes de editar. Este checkpoint, `docs/CURRENT_STAGE.md` e `docs/reference/STATUS_DOCUMENTOS.md` apontam para a **mesma** frente. O handoff antigo do Argon é histórico. Não abrir uma quarta branch nem repetir a auditoria inteira sem mudança material de SHA.

**Objetivo aprovado, sem ampliar escopo:** aprimorar a estrutura visual do Prontuário e permitir correção/exclusão coordenada de lançamentos e dependentes, sem falso envio, falsa reanálise ou justificativa obrigatória. Preservar diferenças entre bonificação manual, análise técnica, NF, Pendência, inventário e saída provisória; manter ADR-055/056 e pe���q�^