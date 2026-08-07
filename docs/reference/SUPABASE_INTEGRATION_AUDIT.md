# Auditoria de integração — Supabase e frontend

**Classificação:** referência vigente  
**Atualizado em:** 7 de agosto de 2026

## 1. Parecer executivo

O Supabase é o backend canônico de Production. A integração cobre Auth, autorização, leitura, escrita, operações atômicas, Gestão de Equipe, auditoria, importação e recuperação.

Os incidentes recentes demonstraram que uma arquitetura amplamente correta pode conter falhas em fronteiras específicas. Por isso, o estado atual deve ser avaliado operação por operação, usando a matriz funcional executável e não apenas a existência das camadas.

O baseline mutável fica em [`../CURRENT_STAGE.md`](../CURRENT_STAGE.md).

## 2. Camadas da integração

```text
index.html / app.js / integrações
→ domínio e serviços de aplicação
→ DataService e UnitOfWork
→ RepositoryContract
→ SupabaseRepository
→ PostgREST / RPC / Edge Function
→ Auth / RLS / PostgreSQL
→ resposta
→ estado em memória
→ renderização
```

### Frontend

- não usa chave administrativa;
- recebe somente configuração pública;
- aplica gate de autenticação antes da operação;
- usa serviços de aplicação para mutações;
- mantém adaptador local separado;
- exibe erros classificados por operação;
- deve refletir o resultado persistido/recarregado, não apenas o estado otimista local.

### Repositório

- paginação e lotes;
- leitura seletiva;
- tradução entre modelo de aplicação e banco;
- `row_version` e conflitos otimistas;
- RPCs para operações compostas;
- snapshots, staging, promoção e rollback.

### Banco

- RLS nas tabelas expostas;
- políticas por operação;
- funções privilegiadas com autorização interna;
- `search_path` controlado;
- grants mínimos;
- autoria e logs;
- constraints, triggers e relacionamentos.

## 3. Auth e autorização

O bootstrap autenticado:

1. restaura/cria sessão;
2. deduplica validações concorrentes;
3. consulta perfil, papel e escopos;
4. rejeita perfil inativo ou ausência de autorização;
5. cria cliente autenticado;
6. carrega entidades autorizadas;
7. aplica a organização visual do perfil.

Papéis:

- `controller`;
- `federal_assistant`;
- `sme_management`;
- `inventory`;
- `technical_admin`.

Simulação visual do administrador técnico não altera JWT.

## 4. Gestão de Equipe — percurso vigente

```text
formulário
→ DirectoryService
→ TeamAccountGateway
→ Edge Function
→ CORS + JWT + papel
→ Auth Admin
→ lookup Auth exato / RPC transacional
→ diretório, perfil e auditoria
→ resposta
→ renderEquipe()
```

### Evolução da correção

- **PR #138:** corrigiu CORS e recuperação segura de alguns vínculos históricos;
- **PR #150:** corrigiu transição entre Inventário e Controlador reutilizando a conta Auth existente;
- **PR #161:** eliminou a varredura global `listUsers`, adicionou lookup exato pela RPC `resolve_team_auth_user_id_by_email`, normalizou campos Auth legados incompatíveis e reconciliou resíduos sintéticos conhecidos.

O contrato atual é a soma dessas camadas. Não atribuir a resolução integral somente ao PR #138.

### Contratos atuais

- allowlist CORS canônica e fail-closed;
- JWT e papel autorizados;
- `service_role` somente server-side;
- lookup exato por e-mail;
- ambiguidade de conta rejeitada;
- reutilização segura de conta sem vínculo ativo conflitante;
- um único perfil institucional ativo;
- histórico inativo preservado;
- bloqueio/desbloqueio e metadados compensados em falha parcial;
- payload funcional de erro preservado até a interface.

## 5. Integração de dados operacionais

| Entidade/fluxo | Interface | Serviço | Backend |
|---|---|---|---|
| configuração | SME/configuração | ConfigurationService | `app_config`, `competences`, RPCs |
| programas | SME/configuração | DirectoryService | `programs`, RPC + log |
| escolas | Carteira/Prontuário | SchoolService | `schools`, `school_programs`, constraints/RPC |
| verificações | Prontuário/Competências | VerificationService | `verifications`, RPCs |
| pendências | Pendências/Prontuário | PendencyService | `pendencies`, `pendency_attempts`, `pendency_contacts`, RPCs/triggers |
| notas | Prontuário | InvoiceService | `registered_invoices`, `assets`, RPCs/triggers |
| bens | Capital/Inventário | InventoryService | `assets`, `saveAssetWithLog` |
| equipe | Gestão de Equipe | DirectoryService | Edge Function + Auth + RPC |
| logs | Registros Internos | AuditService | `administrative_logs` |
| exportações | ações Excel | RadarExcelExportAudit + integração Excel | AuditService + memória autorizada/assets |
| importação | superfície técnica | ImportCoordinator | staging + RPCs de promoção/rollback |

## 6. Escolas e carteira

### Cadastro/edição

Nova escola exige identidade institucional real. O serviço valida os campos e duplicidades; o banco exige não-vazio e unicidade normalizada de INEP, CNPJ e SICI.

Controlador pode editar dados cadastrais autorizados, mas não pode:

- redistribuir `controller_id`;
- alterar identidade institucional.

Esses limites são impostos no serviço e, para a carteira, também por proteção de banco.

### Redistribuição

Redistribuição individual ou em lote pertence à Gestão de Equipe autorizada. A operação usa versão esperada e log administrativo.

## 7. Configuração e exercício

`ConfigurationService.createExercise` preserva o estado completo localmente, mas envia à RPC somente as doze competências do exercício novo.

O backend exige `row_version`, janeiro a dezembro, um único exercício, configuração coerente e log. A sincronização remota de competências ocorre antes do primeiro render do Controlador.

## 8. Pendências

A integração usa RPCs para abertura, tentativa, reanálise, status e contatos.

A remediação PEND-02 adicionou sincronização entre o agregado de tentativas da pendência e `pendency_attempts`. Isso elimina divergência conhecida, mas a prova completa de todas as transições continua registrada como `partial` na matriz.

## 9. Notas e bens

Notas fiscais usam operações atômicas e efeitos vinculados. A remediação INV-01 garante que bem derivado anteriormente vinculado seja removido quando a nota perde/troca `linked_asset_id`, sem deixar órfão silencioso.

`InventoryService.updateAsset` não usa persistência genérica. A edição rápida admite somente o campo permitido e persiste com `saveAssetWithLog`, versão esperada e log.

## 10. Exportações

`RadarExcelExportAudit` envolve as duas exportações:

1. grava `Exportação Excel Iniciada` via `AuditService.record`;
2. bloqueia a exportação se esse registro não for confirmado;
3. executa o pipeline institucional ou SME;
4. neutraliza o evento legado duplicado durante a geração;
5. registra a conclusão correspondente;
6. distingue falha de auditoria final de falha de geração.

## 11. RLS e escopos

### Controlador

- própria CRE conforme política vigente;
- carteira como responsabilidade principal;
- colaboração autorizada na mesma CRE;
- sem alteração de identidade institucional/redistribuição;
- outra CRE bloqueada sem escopo.

### Assistente

- acesso transversal à CRE;
- Gestão de Equipe;
- redistribuição de carteira;
- identidade institucional;
- ações operacionais autorizadas.

### Inventário

- escolas/bens da própria CRE;
- operações patrimoniais específicas;
- sem bonificação, análise ou configuração global.

### Gestão SME

- leitura gerencial;
- sem análise técnica nas superfícies restritas;
- sem mutações operacionais de Pendências;
- logs conforme política de autoria;
- calendário/exercícios e programas conforme contrato atualmente implementado.

### Administrador técnico

- infraestrutura, perfis, escopos, importação e auditoria.

## 12. Migrations e alinhamento

A quantidade/última migration fica em `CURRENT_STAGE.md` e deve ser confirmada no Supabase.

As remediações recentes incluem:

- `202608060001_team_auth_legacy_repair`;
- `202608060002_functional_integrity_remediation`;
- `202608060003_school_institutional_identity`.

Antes de nova migration: comparar histórico, resetar localmente, executar pgTAP/lint/tipos, backup/restauração, dry-run, analisar reversão e aplicar somente dentro do escopo autorizado.

## 13. Garantia operacional

### Monitor geral

Verifica publicação, manifesto, shell, assets, Auth gate, bloqueio anônimo, preflight e incidentes.

### Integridade

A auditoria agregada de vinte invariantes está integrada. O estado atual é registrado no baseline e deve ser revalidado remotamente.

### Leitura autenticada

A infraestrutura foi integrada, mas permanece desativada sem identidades técnicas exclusivas.

## 14. Matriz funcional

A matriz executável possui 41 operações e é a fonte granular de cobertura.

Estado reconciliado:

- 9 comprovadas;
- 32 parciais;
- 0 lacunas técnicas;
- 0 decisões funcionais pendentes.

A ausência de lacuna não equivale a UAT concluído. O próximo ganho de confiança vem das provas controladas das operações parciais.

## 15. PR #156

A auditoria funcional do PR #156 produziu evidências importantes, mas a branch ficou divergente da `main`. Ela não deve ser mesclada como pacote documental atual. A continuação deve partir do código presente e reaproveitar somente evidências compatíveis.

## 16. Conclusão

A integração está ativa e coerente quanto às camadas principais. Os achados estruturais conhecidos da auditoria anterior receberam remediação técnica. O trabalho remanescente é provar sistematicamente as operações ainda parciais, decidir a ativação do smoke autenticado e executar UAT.

## 17. Referências

- [`SUPABASE_FUNCTIONAL_COVERAGE.md`](SUPABASE_FUNCTIONAL_COVERAGE.md);
- [`SUPABASE_PERMISSIONS_MATRIX.md`](SUPABASE_PERMISSIONS_MATRIX.md);
- [`SUPABASE_DATA_DICTIONARY.md`](SUPABASE_DATA_DICTIONARY.md);
- [`FUNCTIONAL_CONTRACT_MATRIX.md`](FUNCTIONAL_CONTRACT_MATRIX.md);
- [`../runbooks/SUPABASE_CONNECTION.md`](../runbooks/SUPABASE_CONNECTION.md);
- [`../CURRENT_STAGE.md`](../CURRENT_STAGE.md).
