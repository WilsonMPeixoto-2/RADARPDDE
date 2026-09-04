# Certificação funcional por uso real

**Atualizado em:** 2026-09-04  
**Baseline de referência:** `876c5976124815d2848f7d2d9e8a82b7cd3a43c5`  
**Operações funcionais obrigatórias:** 33

> Uma operação não recebe PASS por herdar testes antigos. PASS/CORRIGIDO exige evidência de execução do cenário de uso real definido para a linha.

## Resumo

| Resultado | Operações |
|---|---:|
| NÃO EXECUTADO | 33 |
| PASS | 0 |
| FAIL | 0 |
| CORRIGIDO | 0 |

## Operações

| ID | Área | Ação real | Perfis funcionais | Persistência | Reload | Relações | Gesto repetido | Resultado | Evidência |
|---|---|---|---|---|---|---|---|---|---|
| `ASSET-01` | Capital e Inventário | Cadastrar bem permanente manualmente pela interface | controller, federal_assistant | direct-database-read-required | required | Capital e Inventário, Prontuário quando houver vínculo documental | required | **NÃO EXECUTADO** |  |
| `ASSET-02` | Capital e Inventário | Editar campo patrimonial permitido pela interface | controller, federal_assistant | direct-database-read-required | required | Capital e Inventário, Nota Fiscal vinculada quando aplicável | required | **NÃO EXECUTADO** |  |
| `ASSET-03` | Capital e Inventário | Encaminhar bem para inventariação pela interface | controller, federal_assistant | direct-database-read-required | required | Capital e Inventário, Prontuário, Verificação mensal | required | **NÃO EXECUTADO** |  |
| `ASSET-04` | Capital e Inventário | Concluir inventariação e registrar responsável pela interface | controller, federal_assistant, inventory | direct-database-read-required | required | Capital e Inventário, Prontuário | required | **NÃO EXECUTADO** |  |
| `AUD-01` | Registros Internos | Executar uma ação funcional que produza registro administrativo derivado | controller, federal_assistant, sme_management, inventory | direct-database-read-required | required | Ação de origem, Registros Internos | derived-from-origin-action | **NÃO EXECUTADO** |  |
| `CFG-01` | Configurações SME | Alterar competência de fechamento e janela de bonificação pela interface | sme_management | direct-database-read-required | required | Configurações SME, Competências | required | **NÃO EXECUTADO** |  |
| `CFG-02` | Configurações SME | Criar exercício e competências pela interface | sme_management | direct-database-read-required | required | Configurações SME, Seletor de competência | required | **NÃO EXECUTADO** |  |
| `CFG-03` | Configurações SME | Cadastrar ou editar programa pela interface | sme_management | direct-database-read-required | required | Configurações SME, Programas exibidos nas demais telas | required | **NÃO EXECUTADO** |  |
| `CFG-04` | Configurações SME | Desativar programa pela interface | sme_management | direct-database-read-required | required | Configurações SME, Histórico de competências e escolas | required | **NÃO EXECUTADO** |  |
| `EXP-01` | Exportações | Gerar relatório institucional XLSX ou CSV pelo botão da interface | federal_assistant, sme_management | download-and-audit-read-required | not_applicable | Exportação, Registros Internos | not_applicable | **NÃO EXECUTADO** |  |
| `EXP-02` | Exportações | Gerar Excel SME mensal pelo botão da interface | federal_assistant, sme_management | download-and-audit-read-required | not_applicable | Exportação SME, Registros Internos | not_applicable | **NÃO EXECUTADO** |  |
| `EXP-03` | Pendências | Exportar XLSX das Pendências pelos filtros atuais | controller, federal_assistant, sme_management, inventory | download-required | not_applicable | Pendências, Filtros e busca | not_applicable | **NÃO EXECUTADO** |  |
| `INV-01` | Notas Fiscais | Cadastrar ou editar Nota Fiscal/despesa pela interface do Prontuário | controller, federal_assistant | direct-database-read-required | required | Prontuário, Capital e Inventário quando permanente, Consulta Assessoria quando serviço | required | **NÃO EXECUTADO** |  |
| `INV-02` | Notas Fiscais | Excluir documento fiscal permitido pela interface | controller, federal_assistant | direct-database-read-required | required | Prontuário, Capital e Inventário, Verificação mensal | required | **NÃO EXECUTADO** |  |
| `INV-03` | Consulta Assessoria | Registrar envio, análise, Pendência, novo envio e reanálise por Nota Fiscal de serviço | controller, federal_assistant | direct-database-read-required | required | Notas Fiscais, Consulta Assessoria, Pendências, Prontuário | required | **NÃO EXECUTADO** |  |
| `INV-04` | Notas Fiscais | Analisar documento fiscal individual e abrir Pendência quando incorreto | controller, federal_assistant | direct-database-read-required | required | Notas Fiscais, Pendências, Resumo técnico do Prontuário | required | **NÃO EXECUTADO** |  |
| `PEND-01` | Pendências | Abrir Pendência pela ação documental ou fiscal correspondente | controller, federal_assistant | direct-database-read-required | required | Pendências, Prontuário, Nota Fiscal quando aplicável | required | **NÃO EXECUTADO** |  |
| `PEND-02` | Pendências | Registrar novo envio para regularização pela interface | controller, federal_assistant | direct-database-read-required | required | Pendências, Prontuário, Nota Fiscal ou Assessoria vinculada | required | **NÃO EXECUTADO** |  |
| `PEND-03` | Pendências | Reanalisar tentativa pela interface | controller, federal_assistant | direct-database-read-required | required | Pendências, Prontuário, Nota Fiscal ou Assessoria vinculada | required | **NÃO EXECUTADO** |  |
| `PEND-04` | Pendências | Cancelar Pendência com justificativa pela interface | controller, federal_assistant | direct-database-read-required | required | Pendências, Timeline | required | **NÃO EXECUTADO** |  |
| `PEND-05` | Pendências | Reabrir Pendência encerrada pela interface | controller, federal_assistant | direct-database-read-required | required | Pendências, Timeline, Prontuário | required | **NÃO EXECUTADO** |  |
| `PEND-06` | Pendências | Registrar contato ou cobrança pela interface da Pendência | controller, federal_assistant | direct-database-read-required | required | Pendências, Timeline | required | **NÃO EXECUTADO** |  |
| `SCH-01` | Carteira e cadastro escolar | Cadastrar nova unidade ou editar cadastro escolar pela interface | controller, federal_assistant | direct-database-read-required | required | Carteira, Prontuário, Programas da escola | required | **NÃO EXECUTADO** |  |
| `SCH-02` | Gestão de Equipe | Redistribuir uma escola para outro controlador pela interface | federal_assistant | direct-database-read-required | required | Gestão de Equipe, Carteira, Prontuário | required | **NÃO EXECUTADO** |  |
| `SCH-03` | Gestão de Equipe | Redistribuir escolas em lote pela interface | federal_assistant | direct-database-read-required | required | Gestão de Equipe, Carteira | required | **NÃO EXECUTADO** |  |
| `TEAM-01` | Gestão de Equipe | Cadastrar ou editar controlador e conta pela interface | federal_assistant | direct-database-read-required | required | Gestão de Equipe, Carteira | required | **NÃO EXECUTADO** |  |
| `TEAM-02` | Gestão de Equipe | Desativar controlador pela interface após zerar a carteira | federal_assistant | direct-database-read-required | required | Gestão de Equipe, Carteira | required | **NÃO EXECUTADO** |  |
| `TEAM-03` | Gestão de Equipe | Cadastrar ou editar integrante do Inventário e conta pela interface | federal_assistant | direct-database-read-required | required | Gestão de Equipe, Capital e Inventário | required | **NÃO EXECUTADO** |  |
| `TEAM-04` | Gestão de Equipe | Desativar integrante do Inventário pela interface | federal_assistant | direct-database-read-required | required | Gestão de Equipe, Capital e Inventário | required | **NÃO EXECUTADO** |  |
| `VER-01` | Verificação mensal | Alterar status de entrega de documento pela interface | controller, federal_assistant | direct-database-read-required | required | Prontuário, Subopções documentais, Dashboard e Carteira quando derivado | required | **NÃO EXECUTADO** |  |
| `VER-02` | Verificação mensal | Alterar análise técnica documental pela interface | controller, federal_assistant | direct-database-read-required | required | Prontuário, Pendências, Resumo técnico | required | **NÃO EXECUTADO** |  |
| `VER-03` | Verificação mensal | Consolidar resultado de bonificação pela interface | controller, federal_assistant | direct-database-read-required | required | Prontuário, Dashboard, Carteira | required | **NÃO EXECUTADO** |  |
| `VER-04` | Verificação mensal | Retificar consolidação com justificativa pela interface | federal_assistant | direct-database-read-required | required | Prontuário, Dashboard, Carteira, Registros Internos | required | **NÃO EXECUTADO** |  |

## Regra de fechamento

A frente só pode ser encerrada com **FAIL = 0** e **NÃO EXECUTADO = 0** para este conjunto fechado. Checks unitários, lint e CI são proteção adicional, não substitutos desta evidência.
