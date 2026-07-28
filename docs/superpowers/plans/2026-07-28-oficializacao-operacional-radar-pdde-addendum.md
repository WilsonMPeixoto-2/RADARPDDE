# Adendo técnico — Oficialização Operacional do RADAR PDDE

**Documento principal:** `2026-07-28-oficializacao-operacional-radar-pdde.md`  
**Finalidade:** explicitar caminhos e restrições identificados na revisão final da árvore real do repositório.

## 1. Correção da lista de arquivos da Task 8

Na Task 8, a expressão genérica “renderer do modelo editorial existente” deve ser substituída, na execução, pelos módulos exatos abaixo:

- Modify: `src/domain/excel-export-model.js`
- Modify: `src/domain/excel-workbook-plan.js`
- Modify: `src/domain/excel-xlsx-renderer.js`
- Modify: `src/domain/excel-sme-export-model.js`
- Modify: `src/domain/excel-sme-monthly-renderer.js`
- Modify: `src/integration/excel-export-integration.js`
- Modify: `src/integration/load-excel-export.js`, somente se a inclusão de novo módulo exigir alteração da ordem de carga

A ordem atual de carregamento é:

```text
excel-export-model.js
→ excel-workbook-plan.js
→ excel-xlsx-renderer.js
→ excel-sme-export-model.js
→ excel-sme-monthly-renderer.js
→ excel-export-integration.js
```

Essa ordem deve ser preservada, salvo teste explícito que prove a necessidade de mudança.

## 2. Risco específico do Excel editorial

O exportador editorial atual chama `buildExportModel()` com escolas, competências, programas e o conjunto integral de verificações, sem fornecer `activeCompetenciaKey` ao modelo. O nome do arquivo, entretanto, é derivado da competência ativa.

Antes de certificar o relatório, a execução deve escolher e testar uma das soluções:

### Solução recomendada

Alterar o contrato do modelo editorial para receber `competenceKey` explicitamente:

```javascript
RadarExcelExportModel.buildExportModel({
  escolas,
  competencias,
  programas,
  verificacoes,
  competenceKey
});
```

O modelo deve filtrar internamente todas as linhas, sínteses e métricas pela competência selecionada.

### Solução não aceita

Filtrar apenas o nome do arquivo ou a interface, mantendo o modelo com todas as competências. Essa combinação pode gerar arquivo com nome mensal e conteúdo multicompetência.

## 3. Testes adicionais obrigatórios

Adicionar aos testes da Task 8:

```javascript
test('Excel editorial mensal não contém verificações de outra competência', () => {
  const model = buildEditorialModel(representativeState, '2026-08');
  assert.equal(model.base.rows.every(row => row.competenceKey === '2026-08'), true);
});

test('nome, escopo temporal, aba base e síntese usam a mesma competência', () => {
  const artifacts = createExportArtifacts(representativeState, {
    competenceKey: '2026-08'
  });
  assert.match(artifacts.fileName, /08-2026/);
  assert.equal(artifacts.model.base.rows.every(row => row.competenceKey === '2026-08'), true);
  assert.equal(artifacts.plan.metadata.competenceKey, '2026-08');
});
```

O nome exato dos campos de `model` e `plan` deve seguir o contrato implementado no teste inicial da própria tarefa; não criar metadados paralelos sem necessidade.

## 4. Navegação

O arquivo `src/integration/navigation-bootstrap.js` existe e deve ser reutilizado pela Task 9. Não criar um segundo bootstrap de navegação.

## 5. Aplicação deste adendo

Este adendo integra o plano mestre e deve ser lido antes da execução das Tasks 8 e 9. Na primeira alteração futura do documento principal, incorporar estas correções diretamente e remover o adendo para evitar duplicidade documental.
