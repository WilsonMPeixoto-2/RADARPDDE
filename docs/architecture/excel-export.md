# Relatório institucional Excel do RADAR PDDE

**Estado:** contrato corrente reconciliado; existe P1 de composição da auditoria ainda não corrigido  
**Atualizado em:** 5 de setembro de 2026

> Leia primeiro [`../../START_HERE.md`](../../START_HERE.md). A auditoria adversarial de 05/09/2026 revogou a descrição anterior que tratava todas as rotas de exportação como equivalentes e plenamente auditadas.

## 1. Produtos distintos

O RADAR mantém saídas diferentes que **não podem ser tratadas como um único contrato temporal**:

1. XLSX institucional de quatro abas;
2. Excel SME mensal de uma aba e 27 colunas;
3. CSV legado de contingência;
4. XLSX editorial da tela de Pendências.

O modelo/renderizador genérico poder aceitar múltiplas competências não significa que o botão real de cada produto tenha política multicompetência.

## 2. XLSX institucional — regra temporal vigente

Uma decisão posterior, commit `6f6304d91a9eaf0b241461a1968e3c708902c022` de 09/08/2026 (`fix(export): limitar relatório à competência global`), passou a limitar a exportação institucional atual à **competência global ativa**.

Contrato atual do botão institucional:

```text
RadarCompetenceContext.activeKey
→ escopo institucional da competência ativa
→ escola × competência ativa × programa consolidado
→ workbook institucional
```

A frase antiga “a competência ativa não limita o conteúdo institucional; o produto é histórico e multicompetência” está **SUPERADA** para o ponto de entrada corrente.

Camadas internas/modelos genéricos podem continuar capazes de representar várias competências sem definir a política do botão real.

## 3. Estrutura do XLSX institucional

O workbook preserva as quatro abas:

1. `BONIFICACOES`;
2. `SINTESE`;
3. `QUALIDADE_DADOS`;
4. `METADADOS`.

Granularidade da base principal:

```text
escola × competência ativa × programa consolidado
```

Campos principais preservados:

1. INEP;
2. Denominação;
3. Designação;
4. Competência;
5. Programa;
6. Conta corrente;
7. Investimento;
8. Nota fiscal;
9. Assessoria;
10. BB Ágil;
11. Encaminhado ao inventário;
12. Status da bonificação.

As abas auxiliares não alteram a base principal.

## 4. CSV de contingência — contrato ainda não reconciliado

O CSV legado continua disponível, mas a auditoria adversarial encontrou diferença real em relação ao XLSX institucional:

- o caminho legado ainda percorre política temporal anterior;
- a auditoria acontece em ordem diferente;
- o CSV não é interceptado pela mesma autoridade auditada usada na rota institucional protegida.

Portanto, **não afirmar equivalência XLSX ↔ CSV enquanto esse contrato não for decidido e testado**.

Antes de qualquer mudança, decidir explicitamente:

- se CSV deve refletir somente a competência ativa;
- se deve continuar histórico/multicompetência como contingência deliberada;
- qual ordem de auditoria é obrigatória;
- em que condições ele substitui uma falha do XLSX.

Não remover o CSV por inferência.

## 5. Auditoria obrigatória — regra desejada e defeito conhecido

Regra institucional desejada:

```text
clique autorizado
→ persistir evento inicial de auditoria
→ confirmação obrigatória
→ somente então gerar/baixar
→ registrar conclusão
```

Se a auditoria inicial falhar, o download **deve ser bloqueado**.

### P1 conhecido em 05/09/2026

A auditoria Astra demonstrou que existe diferença de composição:

- o entrypoint auditado bloqueia corretamente quando `AuditService.record(...)` falha;
- o botão real **Excel SME**, criado por `excel-export-integration.js`, usa closure privada que pode executar o download antes da confirmação da auditoria;
- o E2E existente comprova que o arquivo baixa corretamente, mas não cobre `falha da auditoria inicial → nenhum download`.

Esse defeito está registrado em:

[`../audits/2026-09-05-astra-adversarial-findings.md`](../audits/2026-09-05-astra-adversarial-findings.md)

**Ainda não foi corrigido neste PR documental.**

## 6. Excel SME

Contrato público preservado:

- uma competência mensal ativa;
- uma aba;
- uma linha por unidade escolar;
- 27 colunas A:AA;
- template-fonte de 30 colunas projetado para 27;
- nenhuma informação inventada;
- nome do arquivo e aba derivados da mesma competência.

O contrato temporal do Excel SME é claro e não depende da decisão pendente do CSV.

## 7. XLSX de Pendências

A exportação de Pendências respeita busca e filtros da fila, inclusive seu filtro local de competência transversal. Essa filtragem não altera `RadarCompetenceContext`.

É um produto diferente do XLSX institucional e do Excel SME.

## 8. Testes que faltam para fechar o contrato atual

### Composição de auditoria

Teste obrigatório pelo ponto de entrada real:

```text
clicar botão
→ injetar falha na auditoria inicial
→ verificar que nenhum download ocorreu
```

Executar pelo menos para:

- XLSX institucional;
- Excel SME;
- CSV, depois de definida sua política.

### Escopo temporal

Usar estado com **duas competências reais/sintéticas** e provar:

- XLSX institucional contém somente a competência ativa;
- Excel SME contém somente a competência ativa;
- CSV segue o contrato que vier a ser deliberadamente decidido;
- nome do arquivo, metadados e conteúdo concordam.

Teste com uma única competência não detecta regressão de escopo.

## 9. Anti-padrões

Não concluir que:

- wrapper auditado correto implica botão real auditado;
- modelo multicompetência implica produto multicompetência;
- E2E de download feliz comprova bloqueio em falha de auditoria;
- CSV e XLSX são equivalentes apenas porque já foram equivalentes em checkpoint histórico.

## 10. Evidência e referências

- [`adversarial-analysis-and-implementation-method.md`](adversarial-analysis-and-implementation-method.md);
- [`adversarial-analysis-replication-playbook.md`](adversarial-analysis-replication-playbook.md);
- [`excel-sme-mensal.md`](excel-sme-mensal.md);
- [`excel-xlsx-runtime.md`](excel-xlsx-runtime.md);
- [`../audits/2026-09-05-astra-adversarial-findings.md`](../audits/2026-09-05-astra-adversarial-findings.md);
- [`../audits/2026-09-05-astra-artifact-package-review.md`](../audits/2026-09-05-astra-artifact-package-review.md).
