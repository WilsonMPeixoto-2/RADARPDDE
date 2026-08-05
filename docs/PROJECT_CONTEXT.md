# RADAR PDDE 2026 — Contexto funcional e arquitetural

**Atualizado em:** 5 de agosto de 2026

## 1. Finalidade

O RADAR PDDE organiza o ciclo de entrega, análise, acompanhamento, regularização, consolidação, inventário, histórico e apoio à decisão dos programas do PDDE no âmbito da 4ª CRE/SME-Rio.

O sistema deve permitir que cada usuário compreenda:

1. o estado atual da unidade, competência e programa;
2. o que exige atenção;
3. quem deve agir;
4. qual é a próxima ação;
5. onde realizar essa ação;
6. como o histórico foi formado;
7. qual competência e programa sustentam a informação;
8. como a informação é refletida nos relatórios institucionais.

Dashboard, Carteira, Competências, Prontuário, Pendências, Inventário, Registros Internos, timeline e exportações representam o mesmo universo de dados. Nenhuma superfície pode criar fonte de verdade independente.

## 2. Baseline operacional

```text
GitHub main: f812e5dbf3aaa18fb9851948445b0820ac7a5435
Vercel Production: dpl_7G3Wmh1YiV4c4aXVwe2P5tN7N7Y4 — READY
Commit publicado: f812e5dbf3aaa18fb9851948445b0820ac7a5435
Supabase: scnryinorqeucbfkioxo — ACTIVE_HEALTHY
PostgreSQL: 17.6.1.147
Migrations em Production: 25
closing_competence: 2026-12
app_config.row_version: 20
Edge Function team-account-management: ACTIVE, versão 95, JWT obrigatório
Runtime: production / supabase-production
Node.js: 24.x
```

O PR nº 141 permanece aberto em rascunho. Sua migration e seu workflow de integridade não pertencem à `main` nem a Production.

Dados mutáveis devem ser revalidados antes de tarefa que dependa deles.

## 3. Regra de precedência

1. código-fonte remoto vigente;
2. migrations, políticas, funções, Auth e dados do Supabase autorizado;
3. artefato implantado na Vercel e seu SHA;
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

Realiza acompanhamento gerencial. Consulta identificação e bonificação, não visualiza análise técnica nem executa mutações operacionais em Pendências. Em Registros Internos, consulta somente linhas do próprio `auth.uid()`.

A superfície de configurações SME possui exercício, calendário, competência e programas. Alteração futura dessas regras deve ser precedida de confirmação funcional, pois a frente de programas havia sido separada para decisão posterior.

### Equipe de Inventário

Executa o fluxo patrimonial autorizado dentro do escopo da CRE.

### Administrador técnico

`technical_admin` atua em segurança, infraestrutura, perfis, escopos, importações e auditoria. A simulação visual não altera JWT nem substitui contas operacionais reais.

## 5. Superfícies

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
- alertas, busca, modais e exportações.

Toda alteração deve considerar competência, exercício, Controlador, CRE, escola, programa, documento, situação, autoria e perfil efetivo.

## 6. Competência transversal

A competência canônica usa `YYYY-MM` e é única para Dashboard, Carteira, Competências, Prontuário, Pendências, alertas, timeline e exportações.

`RadarCompetenceContext` normaliza, valida, seleciona, sincroniza exercício, persiste durante a sessão e notifica as superfícies.

As doze competências de 2026 estão disponíveis. Competência existente, disponível e formalmente fechada são conceitos distintos.

A frase interna que explicava a sincronização não é exibida ao usuário; o seletor, o rótulo e a competência atual permanecem.

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
   └── LocalStorageRepository — desenvolvimento e contingência por novo build
```

O adaptador remoto usa paginação, lotes, erros padronizados, `row_version`, snapshots, RPCs, reconciliação e rollback.

A aplicação carrega um estado inicial local de compatibilidade antes do bootstrap remoto, mas Production somente é liberada após autenticação, autorização e leitura do Supabase. O estado institucional canônico é remoto.

## 12. Auth e sessão

O cliente Supabase usa sessão persistente e renovação automática. O bootstrap:

1. reconhece ou cria a sessão;
2. valida perfil, papel efetivo e escopos;
3. cria cliente autenticado;
4. carrega as entidades operacionais autorizadas;
5. aplica o perfil à interface;
6. mantém a aplicação inerte enquanto a autorização não termina.

Validações duplicadas são deduplicadas por voo único, e consultas de autorização são paralelizadas.

## 13. Gestão de contas

```text
DirectoryService
→ TeamAccountGateway
→ Edge Function team-account-management
   ├── Supabase Auth Admin
   └── RPC PostgreSQL transacional
```

A Edge Function ativa é a versão 95 e exige JWT. A autorização também verifica o papel institucional.

O PR nº 138 corrigiu:

- preflight CORS;
- allowlist de origens institucionais;
- classificação de erros no frontend;
- recuperação segura de vínculos Auth históricos;
- divergência entre diretório e `user_profiles`;
- cadastro, edição, convite, redistribuição e desativação;
- compensação quando Auth ou banco falha.

Credencial administrativa nunca chega ao navegador.

## 14. Autorização

- anônimo: sem acesso institucional;
- Controlador: escolas da própria `cre_scope` e escopos adicionais autorizados;
- Assistente: operação transversal e Gestão de Equipe;
- Inventário: operação patrimonial autorizada;
- SME: leitura gerencial restritiva e configurações explicitamente autorizadas;
- Administrador técnico: infraestrutura e auditoria.

A desativação de integrantes é lógica e auditada.

## 15. Histórico de migrations

Migration SME canônica:

```text
20260728182226_sme_access_governance
SHA-256 cddda35f4cc08b92093071f888cf958ae052ae82775c91366e4d729434427f0e
```

O identificador derivado `20260728190344` está ausente. A reconciliação usou `migration repair`, não alterou SQL funcional e deixou 25 versões correspondentes.

O PR nº 141 contém uma 26ª migration apenas em sua branch. Enquanto não houver integração e aplicação autorizada, Production permanece com 25.

Antes de migration futura: histórico, teste SME, reset, pgTAP, lint, tipos, backup/restauração, dry-run, plano de rollback e autorização.

## 16. Backup e restauração

Gate:

```text
.github/workflows/backup-restore-disposable.yml
scripts/verify-supabase-backup-restore.mjs
```

Fluxo:

```text
origem descartável
→ migrations + seed
→ identidades Auth efêmeras
→ dumps de papéis, schema, dados e histórico
→ segunda pilha isolada
→ restauração transacional
→ comparação de schema, dados, Auth e migrations
→ limpeza
```

O CI publica somente `evidence.json`; dumps SQL não são publicados. O gate não acessa Production e não substitui uma política institucional de retenção.

## 17. Ambientes

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

## 18. Exportações

### Relatório institucional

- histórico multicompetência;
- abas `BONIFICACOES`, `SINTESE`, `QUALIDADE_DADOS` e `METADADOS`;
- equivalência lógica e com CSV;
- hashes estruturais e de conteúdo;
- botão principal XLSX;
- CSV secundário e fallback.

### Excel SME mensal

- uma competência por arquivo;
- uma aba;
- 27 colunas A:AA;
- template-fonte com 30 colunas usado apenas como base visual;
- remoção exclusiva das posições-fonte K, R e Y;
- campos administrativos posteriores preservados;
- designação como texto `XX.XX.XXX`;
- bordas completas;
- cabeçalho centralizado e normalizado;
- filtro, impressão e congelamento preservados;
- ausência deliberada de `dataValidations` incompatíveis;
- comparação célula a célula, reabertura pelo ExcelJS e inspeção OOXML;
- abertura no Microsoft Excel desktop aprovada sem reparo.

## 19. Garantia operacional de Production

O monitor geral integrado pelos PRs nº 139 e 140 verifica:

- SHA publicado;
- manifesto de build;
- shell e gate de autenticação;
- assets locais;
- bloqueio anônimo do Supabase;
- preflight das Edge Functions;
- criação, atualização e encerramento de incidente automático.

Ele executa após `push` na `main`, a cada hora e manualmente.

Essa camada detecta indisponibilidade e inconsistências de publicação, mas não substitui prova autenticada de todas as mutações.

## 20. Confiabilidade funcional ponta a ponta

Uma função crítica deve ser rastreada por:

```text
superfície
→ controle
→ handler
→ serviço
→ repositório
→ tabela/RPC/Edge Function
→ Auth/RLS
→ resposta
→ estado em memória
→ renderização
→ releitura após refresh
→ falha e compensação
```

A prioridade corrente é criar essa matriz para cada perfil e transformar os fluxos críticos em regressões completas.

## 21. Runtime e gates

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
- backup/restauração descartáveis;
- monitor geral de Production;
- preflight remoto de Edge Functions.

## 22. Próxima sequência

1. concluir a reconciliação documental;
2. criar catálogo funcional por perfil, tela e ação;
3. implementar smoke autenticado somente leitura;
4. implementar provas controladas de escrita, releitura e compensação;
5. concluir ou reavaliar o PR nº 141;
6. atualizar dependências menores em PRs separados;
7. realizar UAT e decisão formal de liberação.

## 23. Restrições permanentes

Não é permitido:

- alterar código para coincidir com documento histórico;
- criar fonte paralela de competência, avaliação, timeline ou exportação;
- enfraquecer Auth, RLS ou autoria;
- transformar carteira em fronteira entre Controladores da mesma CRE;
- ocultar informação funcional no mobile;
- introduzir segredo no frontend;
- aplicar migration sem histórico, testes, backup, dry-run e rollback;
- editar diretamente a tabela de migrations;
- reintroduzir `dataValidations` no Excel SME sem nova prova;
- restaurar o contrato público de 30 colunas do Excel SME;
- tratar PR aberto como funcionalidade integrada;
- declarar função pronta apenas pela presença visual;
- realizar merge ou publicação sem autorização expressa.

## 24. Referências

- [`CURRENT_STAGE.md`](CURRENT_STAGE.md);
- [`ROADMAP_ATUALIZACOES_2026.md`](ROADMAP_ATUALIZACOES_2026.md);
- [`DECISION_LOG.md`](DECISION_LOG.md);
- [`architecture/testing.md`](architecture/testing.md);
- [`architecture/supabase-readiness.md`](architecture/supabase-readiness.md);
- [`architecture/excel-sme-mensal.md`](architecture/excel-sme-mensal.md);
- [`runbooks/SUPABASE_CONNECTION.md`](runbooks/SUPABASE_CONNECTION.md);
- [`audits/2026-08-05-reconciliacao-documental-integral.md`](audits/2026-08-05-reconciliacao-documental-integral.md).
