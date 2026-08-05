# AGENTS.md — RADAR PDDE 2026

**Atualizado em:** 5 de agosto de 2026

## 1. Leitura obrigatória

Antes de analisar ou alterar o repositório, leia:

1. `docs/CURRENT_STAGE.md` — estado corrente, ambientes, prioridades e pendências;
2. `docs/PROJECT_CONTEXT.md` — produto, domínio e arquitetura vigente;
3. `docs/ROADMAP_ATUALIZACOES_2026.md` — manutenção, confiabilidade e evolução;
4. `docs/DECISION_LOG.md` — decisões duradouras;
5. `docs/reference/STATUS_DOCUMENTOS.md` — validade documental;
6. a arquitetura e o runbook específicos da frente;
7. código remoto, PRs, Vercel e Supabase correspondentes.

Documentos históricos não prevalecem sobre código, ambientes ou decisões posteriores.

## 2. Identidade do produto

O RADAR PDDE é sistema institucional de gestão, controle, acompanhamento e apoio à decisão para o PDDE da 4ª CRE/SME-Rio. Não é CRUD genérico.

Toda entrega deve ser avaliada por:

- correção técnica;
- aderência ao fluxo real do PDDE;
- usabilidade administrativa;
- coerência entre perfis, telas e dados;
- integridade, rastreabilidade e auditabilidade;
- acessibilidade e equivalência mobile;
- clareza da próxima ação;
- confiabilidade ponta a ponta.

Uma função não está pronta apenas porque aparece na interface ou passa em teste unitário.

## 3. Fontes de verdade

Para determinar o estado implementado:

1. código-fonte remoto da branch ou commit analisado;
2. migrations, funções, políticas, Auth e dados efetivos do Supabase autorizado;
3. artefato implantado na Vercel e seu SHA;
4. testes e evidências reproduzíveis;
5. decisões expressas vigentes;
6. documentação canônica;
7. documentos históricos.

A orientação mais recente do responsável define intenção e prioridade, mas afirmação técnica deve ser confirmada nas fontes operacionais.

## 4. Estado operacional de referência

```text
GitHub main: f812e5dbf3aaa18fb9851948445b0820ac7a5435
Vercel Production: dpl_7G3Wmh1YiV4c4aXVwe2P5tN7N7Y4 — READY
Commit publicado: f812e5dbf3aaa18fb9851948445b0820ac7a5435
Supabase: scnryinorqeucbfkioxo — ACTIVE_HEALTHY
PostgreSQL: 17.6.1.147
Production dataMode: supabase-production
Migrations aplicadas: 25
closing_competence: 2026-12
app_config.row_version: 20
Edge Function team-account-management: ACTIVE, versão 95, JWT obrigatório
Node.js: 24.x
Excel SME: 27 colunas A:AA, homologado e publicado
Gestão de Equipe: corrigida e publicada
Monitor geral de Production: ativo
Incidentes automáticos: ativos
PR #141: aberto em rascunho, não integrado
Liberação oficial: ainda não declarada
```

Revalidar informações mutáveis antes de tarefa dependente do ambiente.

## 5. Perfis e autorização

Perfis funcionais visíveis:

- Controlador (`controller`);
- Assistente de Verbas Federais (`federal_assistant`);
- Gestão SME (`sme_management`);
- Equipe de Inventário (`inventory`).

`technical_admin` é papel técnico separado. Administra infraestrutura, perfis, escopos, importações e auditoria; pode simular a organização visual, mas não substitui contas operacionais reais.

### Assistente

A Assistente lidera a equipe da GAD/CRE e possui gestão autorizada de Controladores e Inventário, incluindo conta, convite, redistribuição, desativação, Auth, RLS e auditoria.

### Carteiras dos Controladores

A carteira representa responsabilidade principal e filtro inicial. Controladores autenticados podem atuar nas escolas da própria `cre_scope`, preservando responsável principal, autoria e isolamento entre CREs.

### Gestão SME

- consulta identificação e bonificação;
- não visualiza análise técnica;
- não executa mutações operacionais em Pendências;
- consulta Registros Internos somente quando `actor_user_id = auth.uid()`;
- acessa configurações autorizadas pelo produto e pelo Supabase.

A frente de programas deve ser confirmada como decisão funcional antes de qualquer expansão ou retirada, pois havia separação anterior dessa etapa.

## 6. Regra de impacto entre camadas

Toda alteração deve verificar, conforme o caso:

```text
layout/frontend
→ visibilidade e capacidade por perfil
→ handler
→ domínio e serviço de aplicação
→ contrato de persistência
→ tabela, migration, RPC ou Edge Function
→ Auth/RLS
→ autoria e auditoria
→ retorno e estado em memória
→ nova renderização
→ releitura após refresh
→ erro e compensação
→ testes unitários, pgTAP e E2E
→ documentação e evidências
→ build/deployment
```

Uma tarefa não está concluída quando apenas uma camada foi alterada.

## 7. Contrato de confiabilidade funcional

Para cada função crítica, comprovar:

1. disponibilidade para o perfil correto;
2. ausência para o perfil indevido;
3. acionamento real no navegador;
4. payload e competência corretos;
5. serviço, repositório e backend corretos;
6. autorização positiva e negativa;
7. consulta ou gravação concluída;
8. interface atualizada;
9. resultado preservado após recarregar;
10. conflito de versão tratado;
11. falha parcial compensada;
12. mensagem útil ao usuário;
13. regressão permanente no CI.

Os casos do Excel SME e da Gestão de Equipe demonstram que validar somente o DOM, somente o código ou somente o banco é insuficiente.

## 8. Garantia operacional contínua

### Monitor de Production

`.github/workflows/production-system-smoke.yml` deve permanecer capaz de validar:

- commit publicado;
- manifesto, shell e assets;
- gate de autenticação;
- bloqueio anônimo do Supabase;
- preflight de todas as Edge Functions catalogadas;
- execução após `push`, a cada hora e manualmente.

### Incidentes automáticos

Falha confirmada abre ou atualiza incidente automático; recuperação confirmada encerra o incidente. Issues humanas e pull requests não podem ser alterados.

### Integridade dos dados

O PR nº 141 é trabalho em andamento. Não registrar sua 26ª migration ou seu workflow como integrados enquanto o PR estiver aberto.

## 9. Superfícies e dispositivos

Examinar:

- Dashboard;
- Carteira;
- Competências;
- Prontuário e timeline;
- Pendências;
- Gestão de Equipe;
- Capital e Inventário;
- Registros Internos;
- configurações SME;
- relatórios e exportações;
- desktop, Android e iPhone;
- estados vazios, filtros, busca, menus e modais;
- permissões positivas e negativas;
- última movimentação, próxima ação, prazo e responsável.

Mobile pode reorganizar tabelas em cartões, mas não remover informação ou capacidade essencial.

## 10. Contratos de produto

- uma única competência global `YYYY-MM`;
- janeiro a dezembro de 2026 disponíveis conforme permissão;
- avaliação mensal canônica;
- timeline como projeção somente leitura;
- navegação contextual preservando competência, rota, filtros, rolagem e foco;
- relatório institucional XLSX de quatro abas;
- Excel SME mensal de uma aba e 27 colunas A:AA;
- CSV legado como secundário e fallback;
- Excel SME sem `dataValidations` incompatíveis;
- posições-fonte K, R e Y removidas somente na projeção pública do Excel SME;
- campos administrativos posteriores preservados.

A homologação manual do Excel SME no Microsoft Excel desktop está concluída. O relatório institucional é produto independente.

## 11. Persistência e Supabase

Contrato único:

- `SupabaseRepository` — canônico em Preview e Production;
- `LocalStorageRepository` — desenvolvimento controlado e contingência excepcional por novo build.

Regras:

- usar serviços e portas existentes;
- operações compostas devem ser atômicas;
- conflitos usam `row_version`;
- somente chave publicável chega ao navegador;
- credenciais administrativas permanecem server-side;
- migrations são versionadas e aplicadas em ordem;
- nenhum seed institucional implícito;
- importação usa validação, staging, reconciliação, promoção e rollback;
- RLS reflete capacidades aprovadas;
- Edge Functions administrativas exigem JWT e papel autorizado;
- nenhuma alteração remota sem escopo e autorização.

Production possui 25 migrations na data de corte. A 26ª migration do PR nº 141 não pertence à `main` nem ao ambiente remoto.

## 12. Gestão de Equipe e Edge Function

Fluxo vigente:

```text
DirectoryService
→ TeamAccountGateway
→ team-account-management
→ Auth Admin + RPC transacional
```

Preservar:

- CORS fail-closed;
- allowlist canônica;
- preflight remoto;
- JWT obrigatório;
- papel da Assistente;
- recuperação segura de vínculos legados;
- rejeição de divergência ambígua;
- compensação quando Auth ou banco falhar;
- testes de cadastro, edição, redistribuição e desativação.

## 13. Excel SME

Contrato vigente:

```text
template-fonte: 30 colunas
produto público: 27 colunas A:AA
motor: ExcelJS 4.4.0
competência: mensal e estrita
```

O renderer:

1. valida K, R e Y como `SISTEMÁTICA PREENCHIDA` no template-fonte;
2. remove as posições em ordem decrescente;
3. valida os 27 cabeçalhos restantes;
4. usa o cadastro atual para A:D;
5. grava designação como texto `XX.XX.XXX`;
6. aplica bordas e alinhamentos;
7. preserva filtro, impressão e congelamento;
8. certifica OOXML e reabertura.

Template e ExcelJS devem estar presentes no artefato publicado e corresponder ao manifesto de hashes.

## 14. Backup e restauração

Gate canônico:

```text
.github/workflows/backup-restore-disposable.yml
scripts/verify-supabase-backup-restore.mjs
npm run test:backup-restore
```

O teste deve usar somente pilhas descartáveis, comparar schema, dados, Auth e migrations e publicar apenas `evidence.json`.

## 15. Recursos e dependências

Versões correntes:

```text
@playwright/test 1.62.0
@supabase/supabase-js 2.110.8
supabase CLI 2.110.0
eslint 10.8.0
eslint-plugin-playwright 2.10.5
knip 6.29.0
exceljs 4.4.0
```

Atualizações menores abertas devem ser tratadas em PRs isolados. Supabase JS/CLI exige bateria completa de Auth, RLS, Edge Function, migrations, backup/restauração e perfis.

Não atualizar ExcelJS sem necessidade comprovada e nova homologação no Excel desktop.

## 16. Vercel

- distinguir Production, Preview e local;
- confirmar `radar-build-manifest.json`;
- verificar correspondência entre deployment e SHA;
- não promover Preview como Production;
- distinguir `target: production` de Preview;
- não tratar deployment de branch como publicação oficial;
- monitorar assets críticos e preflight após `push` na `main`.

## 17. Git e integração

Não trabalhar diretamente na `main`.

Fluxo obrigatório:

1. confirmar HEAD remoto;
2. criar branch específica;
3. criar teste vermelho quando aplicável;
4. implementar mudança mínima coerente;
5. executar gates;
6. abrir PR em rascunho com riscos, limites e evidências;
7. confirmar checks no SHA final;
8. apresentar diff e estado;
9. fazer merge somente após autorização expressa;
10. publicar em Production somente após autorização expressa.

Não misturar funcionalidade, arquitetura, dependências, migration, ativação remota e polimento não relacionado no mesmo PR.

## 18. Testes e conclusão

Usar `npm run test:readiness` como gate base e acrescentar, conforme impacto:

- Supabase local, pgTAP, lint SQL e tipos;
- backup/restauração descartáveis;
- Playwright desktop e mobile;
- gate por perfil e viewport;
- Lighthouse;
- dependências;
- certificação Excel;
- precedência do frontend;
- build Vercel;
- smoke de Production;
- preflight remoto;
- homologação manual;
- UAT.

A conclusão exige testes aplicáveis verdes no SHA final, documentação atualizada e nenhum segredo no diff ou artefato.

## 19. Prioridade corrente

1. concluir a reconciliação documental;
2. criar matriz funcional completa;
3. implantar smoke autenticado de leitura;
4. implantar provas controladas de escrita e compensação;
5. concluir ou reavaliar o PR nº 141;
6. atualizar dependências menores;
7. realizar UAT e decisão formal de liberação.

## 20. Prevenção de loops

Ao concluir PR relevante:

- atualizar `docs/CURRENT_STAGE.md`;
- atualizar o roadmap;
- registrar decisões duradouras;
- atualizar contexto e arquitetura;
- atualizar matriz documental;
- registrar evidência do mesmo SHA;
- declarar a frente concluída, bloqueada, adiada ou substituída;
- não iniciar nova frente antes de fechar o estado da anterior.
