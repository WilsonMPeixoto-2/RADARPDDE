# Matriz funcional ponta a ponta

**Atualizado em:** 2026-08-09  
**Baseline de origem:** `908758d92ec8407003a848ed2779814ce747a6c5`  
**Fonte canônica:** `functional-contract-matrix.json` e arquivos JSON do diretório `functional-contract-matrix/`

> Arquivo gerado por `scripts/check-functional-contract-matrix.mjs`. Não editar manualmente.

## Resumo executivo

A matriz contém **41 operações** distribuídas entre 13 superfícies.

| Cobertura | Operações |
|---|---:|
| Comprovada | 9 |
| Parcial | 32 |
| Lacuna | 0 |
| Decisão pendente | 0 |

| Próxima prova | Operações |
|---|---:|
| Nenhuma; manter regressão | 5 |
| Smoke autenticado de leitura | 6 |
| Escrita controlada e reversível | 25 |
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
| `VER-01` | Alterar status de entrega para bonificação | write / P0 | Controlador, Assistente de Verbas Federais, Administrador técnico | VerificationService.setBonification → saveVerificationWithLog (verifications, administrative_logs) | Parcial | Escrita controlada e reversível |
| `VER-02` | Alterar análise técnica documental | write / P0 | Controlador, Assistente de Verbas Federais, Administrador técnico | VerificationService.setTechnicalAnalysis → saveVerificationWithLog (verifications, pendencies, administrative_logs) | Parcial | Escrita controlada e reversível |
| `VER-03` | Consolidar resultado de bonificação mensal | write / P0 | Controlador, Assistente de Verbas Federais, Administrador técnico | VerificationService.closeBonification → saveVerificationWithLog (verifications, pendencies, administrative_logs) | Parcial | Escrita controlada e reversível |
| `VER-04` | Retificar consolidação com justificativa auditável | write / P0 | Assistente de Verbas Federais, Administrador técnico | VerificationService.retify → saveVerificationWithLog (verifications, administrative_logs) | Parcial | Escrita controlada e reversível |

### Prontuário e timeline

| ID | Ação | Modo | Perfis autorizados | Serviço e persistência | Cobertura | Próxima prova |
|---|---|---|---|---|---|---|
| `READ-03` | Consultar prontuário e timeline da unidade | read / P0 | Controlador, Assistente de Verbas Federais, Gestão SME, Equipe de Inventário, Administrador técnico | RadarSchoolTimeline.project → SupabaseRepository.read (schools, verifications, pendencies, pendency_attempts, pendency_contacts, registered_invoices, assets, administrative_logs) | Parcial | Smoke autenticado de leitura |
| `INV-01` | Cadastrar ou editar nota fiscal e efeitos associados | write / P0 | Controlador, Assistente de Verbas Federais, Administrador técnico | InvoiceService.save → saveInvoiceWithEffects + registered_invoices_delete_unlinked_asset (registered_invoices, assets, verifications, administrative_logs) | Parcial | Escrita controlada e reversível |
| `INV-02` | Excluir nota fiscal e reverter efeitos vinculados | write / P0 | Controlador, Assistente de Verbas Federais, Administrador técnico | InvoiceService.remove → deleteInvoiceWithEffects (registered_invoices, assets, verifications, administrative_logs) | Parcial | Escrita controlada e reversível |

### Pendências

| ID | Ação | Modo | Perfis autorizados | Serviço e persistência | Cobertura | Próxima prova |
|---|---|---|---|---|---|---|
| `READ-04` | Consultar lista e detalhe de pendências | read / P0 | Controlador, Assistente de Verbas Federais, Gestão SME, Equipe de Inventário, Administrador técnico | PendencyViewModel.project → SupabaseRepository.read (pendencies, pendency_attempts, pendency_contacts) | Parcial | Smoke autenticado de leitura |
| `PEND-01` | Abrir pendência documental ou manual | write / P0 | Controlador, Assistente de Verbas Federais, Administrador técnico | PendencyService.open → savePendencyCommand (pendencies, administrative_logs) | Parcial | Escrita controlada e reversível |
| `PEND-02` | Registrar novo envio para regularização | write / P0 | Controlador, Assistente de Verbas Federais, Administrador técnico | PendencyService.registerAttempt → savePendencyCommand + pendencies_sync_attempt_statuses (pendencies, pendency_attempts, verifications, administrative_logs) | Parcial | Escrita controlada e reversível |
| `PEND-03` | Reanalisar tentativa e resolver ou reabrir pendência | write / P0 | Controlador, Assistente de Verbas Federais, Administrador técnico | PendencyService.reanalyze → reanalyzePendencyWithVerification (pendencies, pendency_attempts, verifications, administrative_logs) | Parcial | Escrita controlada e reversível |
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
| `TEAM-02` | Desativar controlador e redistribuir carteira | edge-function / P0 | Assistente de Verbas Federais, Administrador técnico | DirectoryService.deactivateController → team-account-management + RPC (auth.users, controllers, schools, user_profiles, administrative_logs) | Comprovada | Observação contínua em Production |
| `TEAM-03` | Cadastrar ou editar integrante do Inventário e conta | edge-function / P0 | Assistente de Verbas Federais, Administrador técnico | DirectoryService.saveInventoryMember → team-account-management + Auth lookup + RPC (auth.users, inventory_team_members, user_profiles, administrative_logs) | Comprovada | Observação contínua em Production |
| `TEAM-04` | Desativar integrante do Inventário | edge-function / P0 | Assistente de Verbas Federais, Administrador técnico | DirectoryService.deactivateInventoryMember → team-account-management + RPC (auth.users, inventory_team_members, user_profiles, administrative_logs) | Comprovada | Observação contínua em Production |

### Capital e Inventário

| ID | Ação | Modo | Perfis autorizados | Serviço e persistência | Cobertura | Próxima prova |
|---|---|---|---|---|---|---|
| `ASSET-01` | Cadastrar bem permanente manualmente | write / P0 | Controlador, Assistente de Verbas Federais, Administrador técnico | InventoryService.createAsset → saveAssetWithLog (assets, administrative_logs) | Parcial | Escrita controlada e reversível |
| `ASSET-02` | Editar campo patrimonial autorizado | write / P0 | Controlador, Assistente de Verbas Federais, Administrador técnico | InventoryService.updateAsset → saveAssetWithLog (assets, administrative_logs) | Parcial | Escrita controlada e reversível |
| `ASSET-03` | Encaminhar bem para inventariação | write / P0 | Controlador, Assistente de Verbas Federais, Administrador técnico | InventoryService.forward → saveAssetWithLog (assets, schools, administrative_logs) | Parcial | Escrita controlada e reversível |
| `ASSET-04` | Concluir inventariação e registrar responsável | write / P0 | Controlador, Assistente de Verbas Federais, Equipe de Inventário, Administrador técnico | InventoryService.inventory → saveAssetWithLog (assets, administrative_logs) | Parcial | Escrita controlada e reversível |

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
- **VER-01 — Alterar status de entrega para bonificação:** Falta prova controlada de escrita e releitura no ambiente publicado por perfil.
- **VER-02 — Alterar análise técnica documental:** Falta prova controlada de análise, bloqueio por pendência ativa e releitura após refresh.
- **VER-03 — Consolidar resultado de bonificação mensal:** Falta prova controlada de consolidação, releitura e rejeição de conjunto incompleto.
- **VER-04 — Retificar consolidação com justificativa auditável:** Falta prova controlada do antes/depois, autoria, releitura e rejeição para demais perfis.
- **PEND-01 — Abrir pendência documental ou manual:** Falta prova controlada de abertura, prevenção de duplicidade e releitura.
- **PEND-02 — Registrar novo envio para regularização:** A sincronização entre agregado e pendency_attempts está remediada; falta prova controlada do ciclo de tentativa, invariância da bonificação e releitura por perfil.
- **PEND-03 — Reanalisar tentativa e resolver ou reabrir pendência:** Falta prova controlada dos dois resultados, releitura e conflito concorrente.
- **PEND-04 — Cancelar pendência com justificativa:** Falta prova controlada de justificativa, autoria e releitura.
- **PEND-05 — Reabrir pendência cancelada ou resolvida:** Falta prova controlada da transição, autoria e releitura.
- **PEND-06 — Registrar contato ou cobrança associado à pendência:** Falta prova controlada de idempotência, associação e releitura.
- **INV-01 — Cadastrar ou editar nota fiscal e efeitos associados:** A remoção do bem derivado ao trocar/desvincular a nota foi remediada; falta prova controlada completa para naturezas, edição, warnings, vínculo/desvínculo e releitura.
- **INV-02 — Excluir nota fiscal e reverter efeitos vinculados:** Falta prova controlada de remoção, restauração dos requisitos documentais e ausência de resíduos.
- **ASSET-01 — Cadastrar bem permanente manualmente:** Falta prova controlada de criação, status inicial e releitura.
- **ASSET-02 — Editar campo patrimonial autorizado:** A persistência genérica foi removida e a edição rápida ficou restrita ao campo permitido, com versão e log; falta prova controlada por perfil, conflito e releitura no ambiente de homologação.
- **ASSET-03 — Encaminhar bem para inventariação:** Falta prova controlada das validações de nota/processo, persistência e releitura.
- **ASSET-04 — Concluir inventariação e registrar responsável:** Falta prova controlada por perfil, autoria, releitura e bloqueio fora do escopo da CRE.
- **AUD-01 — Registrar evento administrativo de domínio:** Falta prova padronizada de autoria e recorte de leitura após persistência em Production.
- **TECH-01 — Planejar, validar, importar, reconciliar ou reverter snapshot canônico:** A execução remota real depende de pacote autorizado, janela operacional, snapshot de retorno e reconciliação final.

## Uso operacional

```bash
npm run generate:functional-matrix
npm run check:functional-matrix
```

A matriz registra o contrato atual. Lacunas não autorizam alteração automática: cada correção exige regressão, branch isolada, revisão e autorização de integração.
