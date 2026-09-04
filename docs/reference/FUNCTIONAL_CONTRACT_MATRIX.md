# Matriz funcional ponta a ponta

**Atualizado em:** 2026-09-04  
**Baseline de origem:** `c3d6fc2374476a4884cfebc2f4236e346ccf2700`  
**Fonte canônica:** `functional-contract-matrix.json` e arquivos JSON do diretório `functional-contract-matrix/`

> Arquivo gerado por `scripts/check-functional-contract-matrix.mjs`. Não editar manualmente.

## Resumo executivo

A matriz contém **44 operações** distribuídas entre 13 superfícies.

| Cobertura | Operações |
|---|---:|
| Comprovada | 19 |
| Parcial | 25 |
| Lacuna | 0 |
| Decisão pendente | 0 |

| Próxima prova | Operações |
|---|---:|
| Nenhuma; manter regressão | 15 |
| Smoke autenticado de leitura | 6 |
| Escrita controlada e reversível | 18 |
| Observação contínua em Production | 5 |

## Perfis

| Identificador | Nome | Natureza |
|---|---|---|
| `anonymous` | Anônimo | technical |
| `controller` | Controlador | functional |
| `federal_assistant` | Assistente de Verbas Federais | functional |
| `sme_management` | Gestão SME | functional |
| `inventory` | Equipe de Inventário | functional |
| `technical_admin` | Administrador técnico | technical |

## Operações

### Autenticação

| ID | Ação | Modo | Perfis autorizados | Serviço e persistência | Cobertura | Próxima prova |
|---|---|---|---|---|---|---|
| `AUTH-01` | Entrar, restaurar sessão e aplicar perfil/escopos | read / P0 | Controlador, Assistente de Verbas Federais, Gestão SME, Equipe de Inventário, Administrador técnico | RadarSessionService.bootstrap/restore → Supabase Auth + SupabaseRepository (auth.users, user_profiles, profiles, user_school_scopes) | Parcial | Smoke autenticado de leitura |

### Navegação e busca

| ID | Ação | Modo | Perfis autorizados | Serviço e persistência | Cobertura | Próxima prova |
|---|---|---|---|---|---|---|
| `NAV-01` | Abrir rota canônica e retornar preservando contexto | read / P1 | Controlador, Assistente de Verbas Federais, Gestão SME, Equipe de Inventário, Administrador técnico | RadarNavigationContext.navigate/restore → sessionStorage (route, competence, filters, scroll, focus) | Comprovada | Nenhuma; manter regressão |
| `NAV-02` | Pesquisar escolas, programas, competências e pendências autorizadas | read / P1 | Controlador, Assistente de Verbas Federais, Gestão SME, Equipe de Inventário, Administrador técnico | RadarGlobalSearch.search → state projection (schools, programs, competences, pendencies) | Parcial | Smoke autenticado de leitura |

### Dashboard

| ID | Ação | Modo | Perfis autorizados | Serviço e persistência | Cobertura | Próxima prova |
|---|---|---|---|---|---|---|
| `READ-01` | Consultar indicadores e cartões do dashboard | read / P0 | Controlador, Assistente de Verbas Federais, Gestão SME, Equipe de Inventário, Administrador técnico | OperationalProjection.dashboard → SupabaseRepository.read (schools, verifications, pendencies, assets) | Parcial | Smoke autenticado de leitura |

### Carteira

| ID | Ação | Modo | Perfis autorizados | Serviço e persistência | Cobertura | Próxima prova |
|---|---|---|---|---|---|---|
| `READ-02` | Pesquisar, filtrar e abrir escola na Carteira | read / P0 | Controlador, Assistente de Verbas Federais, Gestão SME, Administrador técnico | OperationalProjection.portfolio → SupabaseRepository.read (schools, controllers, school_programs) | Parcial | Smoke autenticado de leitura |
| `SCH-01` | Cadastrar nova unidade pela Assistente ou editar cadastro escolar autorizado | write / P0 | Controlador, Assistente de Verbas Federais, Administrador técnico | SchoolService.saveSchool → saveSchoolWithPrograms (schools, school_programs, administrative_logs) | Parcial | Escrita controlada e reversível |

### Competências

| ID | Ação | Modo | Perfis autorizados | Serviço e persistência | Cobertura | Próxima prova |
|---|---|---|---|---|---|---|
| `COMP-01` | Selecionar competência global mensal | read / P0 | Controlador, Assistente de Verbas Federais, Gestão SME, Equipe de Inventário, Administrador técnico | RadarCompetenceContext.select → session state (competences, app_config) | Comprovada | Nenhuma; manter regressão |
| `VER-01` | Alterar status de entrega para bonificação | write / P0 | Controlador, Assistente de Verbas Federais, Administrador técnico | VerificationService.setBonification → saveVerificationWithLog (verifications, administrative_logs) | Comprovada | Nenhuma; manter regressão |
| `VER-02` | Alterar análise técnica documental agregada, exceto resumos derivados de Assessoria e Notas Fiscais | write / P0 | Controlador, Assistente de Verbas Federais, Administrador técnico | VerificationService.setTechnicalAnalysis → saveVerificationWithLog (verifications, pendencies, administrative_logs) | Comprovada | Nenhuma; manter regressão |
| `VER-03` | Consolidar resultado de bonificação mensal | write / P0 | Controlador, Assistente de Verbas Federais, Administrador técnico | VerificationService.closeBonification → saveVerificationWithLog (verifications, pendencies, administrative_logs) | Comprovada | Nenhuma; manter regressão |
| `VER-04` | Retificar consolidação com justificativa auditável | write / P0 | Assistente de Verbas Federais, Administrador técnico | VerificationService.retify → saveVerificationWithLog (verifications, administrative_logs) | Parcial | Escrita controlada e reversível |

### Prontuário e timeline

| ID | Ação | Modo | Perfis autorizados | Serviço e persistência | Cobertura | Próxima prova |
|---|---|---|---|---|---|---|
| `READ-03` | Consultar prontuário e timeline da unidade | read / P0 | Controlador, Assistente de Verbas Federais, Gestão SME, Equipe de Inventário, Administrador técnico | RadarSchoolTimeline.project → SupabaseRepository.read (schools, verifications, pendencies, pendency_attempts, pendency_contacts, registered_invoices, assets, administrative_logs) | Parcial | Smoke autenticado de leitura |
| `INV-01` | Cadastrar/editar Nota Fiscal ou despesa, incluindo criação atômica de A identificar | write / P0 | Controlador, Assistente de Verbas Federais, Administrador técnico | InvoiceService.save + saveUnidentifiedExpenseWithPendency → saveInvoiceWithEffects + save_unidentified_expense_with_pendency (registered_invoices, assets, verifications, pendencies, administrative_logs) | Comprovada | Nenhuma; manter regressão |
| `INV-02` | Excluir documento fiscal sem qualquer histórico de Pendência individual e reverter efeitos vinculados | write / P0 | Controlador, Assistente de Verbas Federais, Administrador técnico | InvoiceService.remove + proteção histórica individual → deleteInvoiceWithEffects + advisory history trigger (registered_invoices, assets, verifications, pendencies, administrative_logs) | Comprovada | Nenhuma; manter regressão |
| `INV-03` | Registrar envio, análise, pendência, novo envio e reanálise da Assessoria por nota fiscal de serviço | write / P0 | Controlador, Assistente de Verbas Federais, Administrador técnico | InvoiceService.updateServiceAdvisory + RadarServiceAdvisoryPendency → saveInvoiceWithEffects + save_service_advisory_with_pendency + register_service_advisory_attempt + reanalyze_service_advisory_pendency (registered_invoices, verifications, pendencies, pendency_attempts, administrative_logs) | Parcial | Escrita controlada e reversível |
| `INV-04` | Analisar cada documento fiscal, abrir Pendência por invoice e manter resumo técnico derivado | write / P0 | Controlador, Assistente de Verbas Federais, Administrador técnico | InvoiceService.updateDocumentAnalysis + PendencyService.open/registerAttempt/reanalyze → saveInvoiceWithEffects + save_invoice_document_with_pendency + register_invoice_document_attempt + reanalyze_invoice_document_pendency (registered_invoices, assets, verifications, pendencies, pendency_attempts, administrative_logs) | Parcial | Escrita controlada e reversível |

### Pendências

| ID | Ação | Modo | Perfis autorizados | Serviço e persistência | Cobertura | Próxima prova |
|---|---|---|---|---|---|---|
| `READ-04` | Consultar lista e detalhe de pendências | read / P0 | Controlador, Assistente de Verbas Federais, Gestão SME, Equipe de Inventário, Administrador técnico | PendencyViewModel.project → SupabaseRepository.read (pendencies, pendency_attempts, pendency_contacts) | Parcial | Smoke autenticado de leitura |
| `EXP-03` | Exportar planilha XLSX das pendências conforme busca e filtros atuais | export / P1 | Controlador, Assistente de Verbas Federais, Gestão SME, Equipe de Inventário, Administrador técnico | PendencyViewModel.project → PendencyExcelExportModel → PendencyExcelRenderer → authorized in-memory state + AuditService.record + download (pendencies, pendency_attempts, pendency_contacts, schools, controllers, ExcelJS asset) | Comprovada | Nenhuma; manter regressão |
| `PEND-01` | Abrir pendência documental/manual ou pendência fiscal individual vinculada | write / P0 | Controlador, Assistente de Verbas Federais, Administrador técnico | PendencyService.open + openInvoiceDocumentPendency → savePendencyCommand + save_invoice_document_with_pendency (registered_invoices, pendencies, verifications, administrative_logs) | Parcial | Escrita controlada e reversível |
| `PEND-02` | Registrar novo envio para regularização, incluindo identificação de a_identificar | write / P0 | Controlador, Assistente de Verbas Federais, Administrador técnico | PendencyService.registerAttempt + registerInvoiceDocumentAttempt → savePendencyCommand + register_invoice_document_attempt + pendencies_sync_attempt_statuses (registered_invoices, assets, pendencies, pendency_attempts, verifications, administrative_logs) | Comprovada | Nenhuma; manter regressão |
| `PEND-03` | Reanalisar tentativa e resolver ou reabrir pendência | write / P0 | Controlador, Assistente de Verbas Federais, Administrador técnico | PendencyService.reanalyze + reanalyzeInvoiceDocumentPendency → reanalyzePendencyWithVerification + reanalyze_invoice_document_pendency (registered_invoices, pendencies, pendency_attempts, verifications, administrative_logs) | Comprovada | Nenhuma; manter regressão |
| `PEND-04` | Cancelar pendência com justificativa | write / P1 | Controlador, Assistente de Verbas Federais, Administrador técnico | PendencyService.cancel → savePendencyCommand (pendencies, administrative_logs) | Parcial | Escrita controlada e reversível |
| `PEND-05` | Reabrir pendência cancelada ou resolvida | write / P1 | Controlador, Assistente de Verbas Federais, Administrador técnico | PendencyService.reopen → savePendencyCommand (pendencies, administrative_logs) | Parcial | Escrita controlada e reversível |
| `PEND-06` | Registrar contato ou cobrança associado à pendência | write / P1 | Controlador, Assistente de Verbas Federais, Administrador técnico | PendencyService.registerContact → savePendencyContactWithLog (pendency_contacts, administrative_logs) | Parcial | Escrita controlada e reversível |

### Configurações SME

| ID | Ação | Modo | Perfis autorizados | Serviço e persistência | Cobertura | Próxima prova |
|---|---|---|---|---|---|---|
| `CFG-01` | Alterar competência de fechamento e janela de bonificação | write / P0 | Gestão SME, Administrador técnico | ConfigurationService.saveCalendar → saveCalendarWithLog (app_config, administrative_logs) | Parcial | Escrita controlada e reversível |
| `CFG-02` | Criar exercício e doze competências | write / P0 | Gestão SME, Administrador técnico | ConfigurationService.createExercise → saveExerciseWithCompetences (app_config, competences, administrative_logs) | Parcial | Escrita controlada e reversível |
| `CFG-03` | Cadastrar ou editar programa | write / P1 | Gestão SME, Administrador técnico | DirectoryService.saveProgram → saveProgramWithLog (programs, administrative_logs) | Parcial | Escrita controlada e reversível |
| `CFG-04` | Desativar programa preservando histórico | write / P1 | Gestão SME, Administrador técnico | DirectoryService.deactivateProgram → saveProgramWithLog (programs, administrative_logs) | Parcial | Escrita controlada e reversível |

### Gestão de Equipe

| ID | Ação | Modo | Perfis autorizados | Serviço e persistência | Cobertura | Próxima prova |
|---|---|---|---|---|---|---|
| `SCH-02` | Redistribuir uma escola para outro controlador | write / P0 | Assistente de Verbas Federais, Administrador técnico | SchoolService.assignController → assignControllerWithLog (schools, administrative_logs) | Parcial | Escrita controlada e reversível |
| `SCH-03` | Redistribuir escolas em lote | write / P0 | Assistente de Verbas Federais, Administrador técnico | SchoolService.bulkAssignController → assignControllerWithLog (schools, administrative_logs) | Parcial | Escrita controlada e reversível |
| `TEAM-01` | Cadastrar ou editar controlador e conta de acesso | edge-function / P0 | Assistente de Verbas Federais, Administrador técnico | DirectoryService.saveController → team-account-management + Auth lookup + RPC (auth.users, controllers, user_profiles, administrative_logs) | Comprovada | Observação contínua em Production |
| `TEAM-02` | Desativar controlador somente após zerar a carteira | edge-function / P0 | Assistente de Verbas Federais, Administrador técnico | DirectoryService.deactivateController → team-account-management + RPC (auth.users, controllers, schools, user_profiles, administrative_logs) | Comprovada | Observação contínua em Production |
| `TEAM-03` | Cadastrar ou editar integrante do Inventário e conta | edge-function / P0 | Assistente de Verbas Federais, Administrador técnico | DirectoryService.saveInventoryMember → team-account-management + Auth lookup + RPC (auth.users, inventory_team_members, user_profiles, administrative_logs) | Comprovada | Observação contínua em Production |
| `TEAM-04` | Desativar integrante do Inventário | edge-function / P0 | Assistente de Verbas Federais, Administrador técnico | DirectoryService.deactivateInventoryMember → team-account-management + RPC (auth.users, inventory_team_members, user_profiles, administrative_logs) | Comprovada | Observação contínua em Production |

### Capital e Inventário

| ID | Ação | Modo | Perfis autorizados | Serviço e persistência | Cobertura | Próxima prova |
|---|---|---|---|---|---|---|
| `ASSET-01` | Cadastrar bem permanente manualmente | write / P0 | Controlador, Assistente de Verbas Federais, Administrador técnico | InventoryService.createAsset → saveAssetWithLog (assets, administrative_logs) | Parcial | Escrita controlada e reversível |
| `ASSET-02` | Editar campo patrimonial autorizado | write / P0 | Controlador, Assistente de Verbas Federais, Administrador técnico | InventoryService.updateAsset → saveAssetWithLog (assets, administrative_logs) | Parcial | Escrita controlada e reversível |
| `ASSET-03` | Encaminhar bem para inventariação | write / P0 | Controlador, Assistente de Verbas Federais, Administrador técnico | InventoryService.forward → save_asset_with_verification_and_log (assets, verifications, schools, administrative_logs) | Comprovada | Nenhuma; manter regressão |
| `ASSET-04` | Concluir inventariação e registrar responsável | write / P0 | Controlador, Assistente de Verbas Federais, Equipe de Inventário, Administrador técnico | InventoryService.inventory → saveAssetWithLog (assets, administrative_logs) | Comprovada | Nenhuma; manter regressão |

### Registros Internos

| ID | Ação | Modo | Perfis autorizados | Serviço e persistência | Cobertura | Próxima prova |
|---|---|---|---|---|---|---|
| `AUD-01` | Registrar evento administrativo de domínio | write / P1 | Controlador, Assistente de Verbas Federais, Gestão SME, Equipe de Inventário, Administrador técnico | AuditService.record → DataService.defaultPersist (administrative_logs) | Parcial | Escrita controlada e reversível |

### Exportações

| ID | Ação | Modo | Perfis autorizados | Serviço e persistência | Cobertura | Próxima prova |
|---|---|---|---|---|---|---|
| `EXP-01` | Gerar relatório institucional XLSX ou CSV de contingência | export / P1 | Assistente de Verbas Federais, Gestão SME, Administrador técnico | RadarExcelExportAudit → ExcelExportIntegration.generateInstitutionalWorkbook → AuditService.record + download (administrative_logs, authorized in-memory state) | Parcial | Observação contínua em Production |
| `EXP-02` | Gerar Excel SME mensal de 27 colunas | export / P0 | Assistente de Verbas Federais, Gestão SME, Administrador técnico | RadarExcelExportAudit → ExcelSmeRuntime.generate → AuditService.record + download (administrative_logs, authorized monthly state, template asset, ExcelJS asset) | Comprovada | Nenhuma; manter regressão |

### Operações técnicas

| ID | Ação | Modo | Perfis autorizados | Serviço e persistência | Cobertura | Próxima prova |
|---|---|---|---|---|---|---|
| `TECH-01` | Planejar, validar, importar, reconciliar ou reverter snapshot canônico | technical / P0 | Administrador técnico | ImportCoordinator + migration CLI → staging + RPCs de promoção e rollback (data_import_runs, data_import_staging, domain tables, administrative_logs) | Parcial | Escrita controlada e reversível |
| `OPS-01` | Monitorar commit, assets, Auth gate, Supabase e preflight de Production | read / P0 | Administrador técnico | Production system smoke → GitHub Actions + Vercel + Supabase (deployment manifest, public assets, Auth gate, anonymous RLS, Edge Functions) | Comprovada | Nenhuma; manter regressão |
| `OPS-02` | Auditar vinte invariantes agregadas de integridade em Production | read / P0 | Administrador técnico | Production data integrity audit → security-definer function + GitHub Actions (identities, team directories, schools, programs, pendencies, assets, registered_invoices) | Comprovada | Nenhuma; manter regressão |

## Lacunas e decisões pendentes

- **AUTH-01 — Entrar, restaurar sessão e aplicar perfil/escopos:** Falta smoke autenticado recorrente em Production para todos os perfis.
- **NAV-02 — Pesquisar escolas, programas, competências e pendências autorizadas:** Falta prova autenticada de que resultados não vazam recursos fora do escopo em Production.
- **READ-01 — Consultar indicadores e cartões do dashboard:** Falta smoke autenticado recorrente em Production por perfil.
- **READ-02 — Pesquisar, filtrar e abrir escola na Carteira:** Falta smoke autenticado recorrente em Production por perfil.
- **READ-03 — Consultar prontuário e timeline da unidade:** Falta smoke autenticado recorrente em Production e comparação de recortes SME/Inventário.
- **READ-04 — Consultar lista e detalhe de pendências:** Falta smoke autenticado recorrente em Production por recorte de perfil.
- **EXP-01 — Gerar relatório institucional XLSX ou CSV de contingência:** Auditoria inicial obrigatória e conclusão estão integradas; homologação humana do relatório institucional permanece independente quando priorizada.
- **CFG-01 — Alterar competência de fechamento e janela de bonificação:** Falta prova controlada de escrita, releitura e reversão fora da suíte descartável.
- **CFG-02 — Criar exercício e doze competências:** A correção de lote, row_version e calendário mensal está integrada; falta concluir a prova controlada de criação, releitura por perfil e limpeza/reversão do exercício.
- **CFG-03 — Cadastrar ou editar programa:** O contrato vigente já autoriza Gestão SME e administrador técnico; falta prova controlada de criação/edição, negativa aos demais perfis, autoria e releitura.
- **CFG-04 — Desativar programa preservando histórico:** O contrato vigente já autoriza Gestão SME e administrador técnico; falta prova controlada de desativação, preservação de histórico, negativa aos demais perfis e releitura.
- **SCH-01 — Cadastrar nova unidade pela Assistente ou editar cadastro escolar autorizado:** A geração artificial de identidade foi removida e as duplicidades estão protegidas; falta prova controlada completa diferenciando criação pela Assistente, edição autorizada pelo Controlador, negativas de identidade/carteira e releitura.
- **SCH-02 — Redistribuir uma escola para outro controlador:** Falta prova controlada de ida, releitura, negativa ao Controlador e retorno ao responsável original.
- **SCH-03 — Redistribuir escolas em lote:** Falta prova controlada de lote, releitura, retorno/rollback e conflito parcial.
- **VER-04 — Retificar consolidação com justificativa auditável:** Falta prova controlada do antes/depois, autoria, releitura e rejeição para demais perfis.
- **PEND-01 — Abrir pendência documental/manual ou pendência fiscal individual vinculada:** Abertura fiscal e de Assessoria individual está protegida por RPCs atômicas, regressões e smoke transacional real do defeito pós-PR #211; falta homologação autenticada final da interface publicada e releitura após refresh.
- **PEND-04 — Cancelar pendência com justificativa:** Falta prova controlada de justificativa, autoria e releitura.
- **PEND-05 — Reabrir pendência cancelada ou resolvida:** Falta prova controlada da transição, autoria e releitura.
- **PEND-06 — Registrar contato ou cobrança associado à pendência:** Falta prova controlada de idempotência, associação e releitura.
- **INV-03 — Registrar envio, análise, pendência, novo envio e reanálise da Assessoria por nota fiscal de serviço:** Abertura, novo envio e reanálise individual, isolamento entre NFs, tentativa imutável, bootstrap crítico e RPCs possuem regressões unitárias/E2E/pgTAP; falta apenas a homologação autenticada final da interface publicada com refresh/releitura.
- **INV-04 — Analisar cada documento fiscal, abrir Pendência por invoice e manter resumo técnico derivado:** Análise individual, resumo derivado, Pendência por invoice, a_identificar, patrimônio, legado, fronteira rowVersion e RPC de abertura possuem regressões e smoke transacional real; falta homologação autenticada final da interface publicada com refresh/releitura.
- **ASSET-01 — Cadastrar bem permanente manualmente:** Falta prova controlada de criação, status inicial e releitura.
- **ASSET-02 — Editar campo patrimonial autorizado:** A persistência genérica foi removida e a edição rápida ficou restrita ao campo permitido, com versão e log; falta prova controlada por perfil, conflito e releitura no ambiente de homologação.
- **AUD-01 — Registrar evento administrativo de domínio:** Falta prova padronizada de autoria e recorte de leitura após persistência em Production.
- **TECH-01 — Planejar, validar, importar, reconciliar ou reverter snapshot canônico:** A execução remota real depende de pacote autorizado, janela operacional, snapshot de retorno e reconciliação final.

## Uso operacional

```bash
npm run generate:functional-matrix
npm run check:functional-matrix
```

A matriz registra o contrato atual. Lacunas não autorizam alteração automática: cada correção exige regressão, branch isolada, revisão e autorização de integração.
