# Adendo técnico — Oficialização Operacional do RADAR PDDE

**Documento principal:** `2026-07-28-oficializacao-operacional-radar-pdde.md`  
**Finalidade:** explicitar correções identificadas na revisão final da árvore real do repositório.

## 1. Task 3 — Não criar status novo de competência sem necessidade comprovada

A proposta inicial da Task 3 previa adicionar `competences.operational_status`. A revisão do código demonstrou que o modelo atual já possui:

- `starts_on`;
- `ends_on`;
- `closed_at`;
- `app_config.closing_competence`;
- serviço transacional e auditado para alterar a competência operacional de fechamento.

O `ConfigurationService` valida se a competência existe, altera `config.competenciaFechamento`, registra log administrativo e persiste pelo contrato remoto. A criação de exercício também gera os 12 meses e define a competência operacional inicial.

### Decisão corrigida

Não criar a coluna `operational_status` no primeiro PR.

A implementação deve:

1. introduzir o contexto mensal global;
2. remover a constante `activeCompetenciaKey = '2026-05'`;
3. carregar as competências existentes do Supabase;
4. interpretar `closing_competence` como o último mês operacional disponibilizado no contrato atual;
5. atualizar, por fluxo autorizado e auditado, `closing_competence` de `2026-05` para `2026-12` após a publicação do seletor global;
6. manter `closed_at`, `starts_on` e `ends_on` sem alteração;
7. verificar que janeiro a dezembro ficam selecionáveis para todos os perfis, observadas suas permissões de leitura e escrita;
8. provar que nenhuma verificação, pendência, contato ou histórico anterior foi apagado ou remapeado.

### Arquivos da Task 3 corrigida

- Modify: `src/application/configuration-service.js`, somente se o contrato atual precisar expor melhor o valor operacional;
- Modify: `src/integration/exercise-management.js`;
- Modify: `src/domain/competence-context.js` criado na Task 2;
- Modify: `app.js`;
- Create: `tests/unit/competence-availability.test.js`;
- Create: `tests/e2e/competence-2026-availability.spec.js`;
- Modify: `docs/architecture/competencias.md`;
- Modify: `docs/CURRENT_STAGE.md` após a alteração operacional.

Não criar migration, alterar tipos gerados ou modificar o esquema nesta etapa.

### Gate de reavaliação

Somente criar estado adicional no banco se um requisito real exigir distinguir, de forma independente:

- competência cadastrada, mas invisível;
- competência aberta para lançamentos;
- competência fechada para mutações, mas consultável;
- reabertura excepcional por perfil autorizado.

Nesse caso, primeiro documentar tabela de decisão, demonstrar que `starts_on`, `ends_on`, `closed_at` e `closing_competence` são insuficientes e então propor migration própria.

## 2. Correção da lista de arquivos da Task 8

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

## 3. Risco específico do Excel editorial

O exportador editorial atual chama `buildExportModel()` com escolas, competências, programas e o conjunto integral de verificações, sem fornecer `activeCompetenciaKey` ao modelo. O nome do arquivo, entretanto, é derivado da competência ativa.

Antes de certificar o relatório, alterar o contrato do modelo editorial para receber `competenceKey` explicitamente:

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

## 4. Testes adicionais obrigatórios para Excel

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

## 5. Navegação

O arquivo `src/integration/navigation-bootstrap.js` existe e deve ser reutilizado pela Task 9. Não criar um segundo bootstrap de navegação.

## 6. Aplicação deste adendo

Este adendo integra e, nos pontos acima, prevalece sobre as Tasks 3, 8 e 9 do plano mestre. Na primeira alteração estrutural futura do documento principal, incorporar estas correções diretamente e remover o adendo para evitar duplicidade documental.
