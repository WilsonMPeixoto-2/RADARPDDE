# RED inicial — certificação funcional por uso real

**Data:** 4 de setembro de 2026  
**Branch:** `stabilization/functional-certification-real-use-2026-09-04`  
**Baseline funcional de origem:** `8fc58926565a72465980143f253f0a2fee4b8fc2`

## Objetivo

Comprovar que a nova certificação não nasce artificialmente verde.

O primeiro teste exige que toda mutação funcional canônica possua uma linha explícita de certificação por uso real. Neste checkpoint o teste foi adicionado **antes** da implementação de `scripts/check-real-use-functional-certification.mjs`, portanto a execução de unitários deve falhar por ausência do módulo.

## Critério RED esperado

`tests/unit/real-use-functional-certification.test.js` deve falhar ao importar `scripts/check-real-use-functional-certification.mjs`.

Nenhum código de produção foi alterado neste checkpoint.
