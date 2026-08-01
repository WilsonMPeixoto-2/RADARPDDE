# RADAR PDDE 2026 — Contexto funcional e arquitetural

**Atualizado em:** 1º de agosto de 2026

## 1. Finalidade

O RADAR PDDE organiza o ciclo de entrega, análise, acompanhamento, regularização, consolidação, prestação de contas, inventário, histórico e apoio à decisão dos programas do PDDE no âmbito da 4ª CRE/SME-Rio.

O sistema deve permitir que cada usuário compreenda:

1. o estado atual da unidade, competência e programa;
2. o que exige atenção;
3. quem deve agir;
4. qual é a próxima ação;
5. onde realizar essa ação;
6. como o histórico foi formado;
7. qual competência e programa sustentam a informação;
8. como a informação foi refletida nos relatórios institucionais.

Dashboard, Carteira, Competências, Prontuário, Pendências, Inventário, Registros Internos, timeline e exportações representam o mesmo universo de dados. Nenhuma superfície pode criar fonte de verdade independente.

## 2. Estado operacional de referência

- a `main` contém governança da Gestão SME e ciclos 1 a 5;
- o runtime Node está fixado em `24.x`;
- a reconciliação SME foi integrada em `79cb67c84720b1850879d9c50c262e1623d5d8cc`;
- Vercel Production: `dpl_HjpGHuFNzgTRKDsofzzogbBTAe5h`, `READY`;
- commit funcional publicado: `baeea25201ed304f351ea7e3144b0f13147bc3a7`;
- commit do artefato publicado: `b15718ecdd57e82baeaf2116de34af51f8ed1cc0`;
- runtime: `production` e `supabase-production`;
- Supabase: `scnryinorqeucbfkioxo`, `ACTIVE_HEALTHY`;
- 12 competências de 2026;
- `closing_competence = 2026-12`;
- `app_config.row_version = 5`;
- 25 migrations correspondentes entre GitHub e Supabase Production;
- XLSX institucional integrado e Excel SME de 30 colunas publicado sobre template canônico com ExcelJS 4.4.0;
- CSV legado preservado como secundário e fallback;
- deployments automáticos bloqueados;
- gate remoto perfil/viewport concluído;
- backup/restauração descartáveis concluídos;
- liberação oficial ainda não declarada.

Dados mutáveis devem ser revalidados antes de tarefa que dependa deles.

## 3. Regra de precedência

1. código-fonte remoto vigente;
2. migrations, políticas, funções, Auth e dados do Supabase autorizado;
3. artefato implantado na Vercel;
4. testes e evidências reproduzíveis;
5. decisões funcionais vigentes;
6. documentação canônica;
7. documentos históricos.

Memória de chat, planos e relatórios anteriores não substituem verificação operacional.

## 4. Perfis funcionais

### Controlador

Possui carteira de responsabilidade principal e pode colaborar nas escolas da própria CRE. A atuação fora da carteira não transfere `schools.controller_id`, preserva autoria e não concede acesso a outra CRE.

### Assistente de Verbas Federais

Lidera operacionalmente a GAD/CRE, acompanha escolas, administra Controladores e Inventário, distribui carteiras, executa ações transversais autorizadas e consolida relatórios.

### Gestão SME

Realiza acompanhamento gerencial. Consulta identificação e bonificação, não visualiza análise técnica nem executa mutações operacionais. Em Registros Internos, consulta somente linhas do próprio `auth.uid()`.

### Equipe de Inventário

Executa o fluxo patrimonial autorizado dentro do escopo da CRE.

### Administrador técnico

`technical_admin` atua em segurança, infraestrutura, perfis, escopos, importações e auditoria. A simulação visual não altera JWT nem substitui contas operacionais reais.

## 5. Superfícies e recortes

O produto contém, conforme o perfil:

- Dashboard;
- Carteira;
- Competências;
- Pendências;
- Prontuário e timeline;
- Gestão de Equipe;
- Capital e Inventário;
- Registros Internos;
- configurações SME;
- alertas, modais e exportações.

Toda alteração deve considerar competência, exercício, Controlador, CRE, escola, programa, documento, situação, autoria e perfil efetivo.

## 6. Competência transversal

A competência canônica usa `YYYY-MM` e é única para Dashboard, Carteira, Competências, Prontuário, Pendências, alertas, timeline e exportações.

`RadarCompetenceContext` normaliza, valida, seleciona, sincroniza exercício, persiste durante a sessão e notifica as superfícies.

As 12 competências de 2026 estão disponíveis. Competência existente, disponível e formalmente fechada são conceitos distintos.

## 7. Avaliação mensal

Identidade:

```text
escola + competência + programa
```

A projeção canônica reúne consolidação, resultado `apta`/`inapta`, campos ausentes, bonificação, análise técnica, conclusão e pendências. Consulta, telas e certificação Excel usam a mesma regra.

## 8. Pendências

Estados:

- Aberta;
- Aguardando reanálise;
- Resolvida;
- Cancelada.

Novo envio não resolve; reanálise positiva resolve; reanálise negativa reabre; cancelamento preserva motivo e autoria; regularização não apaga o percurso.

## 9. Timeline

`RadarSchoolTimeline` projeta avaliações, pendências, tentativas, contatos, despesas, bens e registros administrativos. Preserva ordem, autoria, competência, programa, origem e visibilidade por perfil.

## 10. Navegação contextual

`RadarNavigationContext` preserva competência, rota, filtros, rolagem e foco entre origem operacional e Prontuário/Pendências. Usa `sessionStorage`, pilha limitada e fallback seguro. Foi validado em desktop, Android e iPhone.

## 11. Persistência

```text
Frontend
→ serviços de aplicação e unidade de trabalho
→ contrato de repositório
   ├── SupabaseRepository — Preview e Production
   └── LocalStorageRepository — contingência por novo build
```

O adaptador remoto usa paginação, lotes, erros padronizados, `row_version`, snapshots, RPCs, reconciliação e rollback.

## 12. Gestão de contas

```text
DirectoryService
→ TeamAccountGateway
→ Edge Function autenticada
   ├── Supabase Auth Admin
   └── RPC PostgreSQL transacional
```

Credencial administrativa nunca chega ao navegador. Falhas compensam operações para evitar divergência entre Auth e diretório.

## 13. Autorização

- anônimo: sem acesso institucional;
- Controlador: escolas da própria `cre_scope`;
- Assistente: operação transversal e Gestão de Equipe;
- Inventário: operação patrimonial autorizada;
- SME: leitura gerencial restritiva;
- Administrador técnico: infraestrutura e auditoria.

A desativação de integrantes é lógica e auditada.

## 14. Histórico de migrations

Migration SME canônica:

```text
20260728182226_sme_access_governance
SHA-256 cddda35f4cc08b92093071f888cf958ae052ae82775c91366e4d729434427f0e
```

O identificador derivado `20260728190344` está ausente. A reconciliação usou `migration repair`, não alterou SQL funcional e deixou 25 versões correspondentes.

Antes de migration futura: histórico, teste SME, reset, pgTAP, lint, tipos, backup/restauração, dry-run e rollback.

## 15. Backup e restauração

Gate:

```text
.github/workflows/backup-restore-disposable.yml
scripts/verify-supabase-backup-restore.mjs
```

Fluxo:

```text
origem descartável
→ migrations + seed
→ dumps de papéis, schema, dados e histórico
→ segunda pilha isolada
→ restauração transacional
→ fingerprints de schema, dados e migrations
→ limpeza
```

O run `30537076528` comprovou equivalência integral. O CI publica somente `evidence.json`; dumps SQL não são publicados.

O gate não acessa Production e não substitui retenção, cópia remota periódica ou plano institucional de desastre.

## 16. Ambientes

### Desenvolvimento local

Supabase local e fixtures descartáveis. Não representa Production.

### Preview

```text
environment: preview
dataMode: supabase-preview
supabaseRepositoryEnabled: true
productionActivationApproved: false
```

### Production

```text
environment: production
dataMode: supabase-production
supabaseRepositoryEnabled: true
productionActivationApproved: true
```

Projeto autorizado: `scnryinorqeucbfkioxo`. O build público contém somente configuração publicável.

`RADAR_PRODUCTION_FORCE_LOCAL=true` exige novo build controlado e é contingência excepcional.

## 17. Excel institucional

### Relatório institucional

- histórico multicompetência;
- abas `BONIFICACOES`, `SINTESE`, `QUALIDADE_DADOS` e `METADADOS`;
- equivalência lógica e com CSV;
- hashes estruturais e de conteúdo;
- botão principal XLSX;
- CSV secundário e fallback.

### Excel SME mensal

- uma competência por arquivo;
- todas as unidades no escopo;
- 30 colunas literais do modelo original;
- uma planilha com nome, arquivo e dados derivados da competência mensal ativa;
- template canônico e ExcelJS 4.4.0 carregados sob demanda;
- ausência de `dataValidations`;
- comparação célula a célula;
- abertura no Microsoft Excel desktop aprovada sem reparo, com conteúdo visível e alinhamentos revisados.

A evidência sintética não consulta Production. A homologação manual do Excel SME foi concluída; a do relatório institucional permanece separada e pendente.

## 18. Runtime e gates

Node oficial: `24.x`.

Cobertura automatizada:

- readiness;
- pgTAP e lint SQL;
- tipos;
- Playwright desktop, Android e iPhone;
- gate de cinco papéis em três viewports;
- Lighthouse;
- dependências;
- certificação Excel;
- backup/restauração descartáveis.

A checagem de credenciais comprometidas depende do plano Pro ou superior. No plano Free atual e sem autorização de despesa, não constitui gate de liberação.

## 19. Segurança comprovada

- acesso anônimo bloqueado;
- RLS por papel e escopo;
- somente chave publicável no frontend;
- Edge Function protegida por JWT;
- autoria e auditoria;
- concorrência otimista;
- histórico alinhado;
- deployments automáticos bloqueados;
- evidência Excel sem dados pessoais;
- dumps SQL excluídos dos artefatos do CI;
- procedimento lógico de restauração comprovado.

## 20. Bloqueadores remanescentes

1. homologação manual do relatório institucional no Microsoft Excel desktop;
2. revisão dos Advisors quando aplicável;
3. UAT funcional;
4. polimento editorial e visual;
5. decisão formal de liberação.

## 21. Restrições permanentes

Não é permitido:

- alterar código para coincidir com documento histórico;
- criar fonte paralela de competência, avaliação, timeline ou exportação;
- enfraquecer Auth, RLS ou autoria;
- conceder mutação operacional à Gestão SME;
- transformar carteira em fronteira entre Controladores da mesma CRE;
- ocultar informação funcional no mobile;
- introduzir segredo no frontend ou repositório;
- publicar dumps SQL em artefato;
- aplicar migration sem histórico, testes, backup, dry-run e rollback;
- editar diretamente a tabela de migrations;
- reintroduzir `dataValidations` no Excel SME sem nova prova;
- remover o CSV de fallback sem decisão.

## 22. Referências

- [`CURRENT_STAGE.md`](CURRENT_STAGE.md);
- [`DECISION_LOG.md`](DECISION_LOG.md);
- [`architecture/testing.md`](architecture/testing.md);
- [`architecture/supabase-readiness.md`](architecture/supabase-readiness.md);
- [`runbooks/SUPABASE_CONNECTION.md`](runbooks/SUPABASE_CONNECTION.md);
- [`runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md`](runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md);
- [`audits/2026-07-30-backup-restore-disposable.md`](audits/2026-07-30-backup-restore-disposable.md);
- [`audits/2026-07-30-node24-gate-remoto-perfis-viewports.md`](audits/2026-07-30-node24-gate-remoto-perfis-viewports.md).
