# AGENTS.md — RADAR PDDE 2026

**Atualizado em:** 3 de agosto de 2026

## 1. Leitura obrigatória

Antes de analisar ou alterar o repositório, leia:

1. `docs/CURRENT_STAGE.md` — estado transitório, bloqueadores e próxima decisão;
2. `docs/ROADMAP_ATUALIZACOES_2026.md` — atualizações técnicas, modernização e evolução funcional;
3. `docs/PROJECT_CONTEXT.md` — domínio e arquitetura estáveis;
4. `docs/DECISION_LOG.md` — decisões vigentes e substituídas;
5. `docs/reference/STATUS_DOCUMENTOS.md` — validade dos documentos;
6. a arquitetura específica da frente;
7. o código remoto real da `main`, PRs relevantes e ambientes correspondentes.

Documentos históricos não prevalecem sobre código, ambientes e decisões posteriores.

## 2. Identidade do produto

O RADAR PDDE é sistema institucional de gestão, controle, acompanhamento e apoio à decisão para o PDDE da 4ª CRE/SME-Rio. Não é CRUD genérico.

Toda entrega deve ser avaliada por:

- correção técnica;
- aderência ao fluxo real do PDDE;
- usabilidade administrativa;
- coerência entre perfis, telas e dados;
- integridade, rastreabilidade e auditabilidade;
- acessibilidade e equivalência mobile;
- clareza da próxima ação.

Passar em testes técnicos não basta quando a funcionalidade está difícil de localizar, compreender ou operar.

## 3. Fontes de verdade

Para determinar o estado implementado:

1. código-fonte remoto da branch ou commit analisado;
2. migrations, funções, políticas, Auth e dados efetivos do Supabase autorizado;
3. artefato implantado na Vercel e seu SHA;
4. testes e evidências reproduzíveis;
5. decisões expressas vigentes;
6. `docs/CURRENT_STAGE.md`;
7. `docs/ROADMAP_ATUALIZACOES_2026.md`;
8. `docs/PROJECT_CONTEXT.md` e contratos de arquitetura;
9. documentos históricos.

A orientação mais recente do responsável define intenção e prioridade, mas afirmação técnica deve ser confirmada nas fontes operacionais.

## 4. Estado operacional de referência

```text
Supabase: scnryinorqeucbfkioxo — ACTIVE_HEALTHY
Production dataMode: supabase-production
repositório canônico: SupabaseRepository
contingência: LocalStorageRepository por novo build controlado
closing_competence: 2026-12
migrations: 25 versões alinhadas
Node: 24.x
ciclos funcionais 1–5: concluídos e publicados
Rodadas 0, 1 e 2 de atualização: concluídas
Rodada 2: publicada em dpl_2Sgq4LJKvSvXro81EYwFJHYEHHqp
Rodada 3B: Supabase CLI 2.110.0 integrada à main, sem necessidade de Production
Excel SME: concluído, homologado sem reparo e publicado
liberação oficial: ainda não declarada
```

Baseline da `main` após a Rodada 3B:

```text
520b51e7080ddae0f4e3f03cf4c045cbea0a233d
```

Commit funcional vigente em Production:

```text
f72a1471023f00eec0bc615c192fd25f5c29a920
```

A migration SME está reconciliada no identificador canônico `20260728182226`. O teste `tests/unit/sme-migration-history-alignment.test.js` protege versão, ausência do identificador derivado e hash.

Revalidar dados mutáveis antes de qualquer tarefa dependente do estado atual.

## 5. Perfis e autorização

Perfis funcionais visíveis:

- Controlador (`controller`);
- Assistente de Verbas Federais (`federal_assistant`);
- Gestão SME (`sme_management`);
- Equipe de Inventário (`inventory`).

`technical_admin` é papel técnico separado. Administra infraestrutura, perfis, escopos, importações e auditoria; pode simular a organização visual dos perfis, mas não substitui testes com contas operacionais reais.

### Assistente

A Assistente de Verbas Federais é a liderança direta da equipe da GAD/CRE e possui gestão autorizada de Controladores e Equipe de Inventário, incluindo conta, convite, distribuição de escolas, desativação, Auth, RLS e auditoria.

### Carteiras dos Controladores

A carteira representa responsabilidade principal e filtro inicial. Controladores autenticados podem atuar nas escolas da própria `cre_scope`, preservando responsável principal, autoria e isolamento entre CREs.

### Gestão SME

Nas superfícies definidas:

- consulta identificação e bonificação;
- não visualiza análise técnica;
- não executa mutações operacionais em Pendências;
- consulta Registros Internos somente quando `actor_user_id = auth.uid()`.

A restrição deve existir cumulativamente em capacidades, componentes, handlers, serviços e RLS.

## 6. Regra de impacto entre camadas

Toda alteração deve verificar, conforme o caso:

```text
layout/frontend
→ visibilidade e capacidade por perfil
→ domínio e serviço de aplicação
→ contrato de persistência
→ banco/migration/RPC
→ Auth/RLS
→ autoria e auditoria
→ testes unitários, pgTAP e E2E
→ documentação e evidências
→ build/deployment
```

Uma tarefa não está concluída quando apenas uma camada foi alterada.

## 7. Avaliação tecnológica proativa

Toda tarefa — correção, melhoria visual, mudança de fluxo ou nova funcionalidade — deve avaliar se o resultado fica materialmente melhor com atualização, instalação ou capacidade tecnológica moderna.

Não ficar preso aos limites da implementação atual quando existir caminho maduro, seguro e compatível para solução superior.

### 7.1 Quando a proposta é obrigatória

Apresentar proposta tecnológica quando:

- a solução possível na pilha atual for paliativa;
- uma queixa ou erro decorrer de limitação estrutural da tecnologia usada;
- biblioteca ou capacidade especializada melhorar materialmente acessibilidade, segurança, desempenho, consistência ou manutenção;
- o recurso solicitado puder ser entregue com maior robustez por ampliação tecnológica;
- insistir na abordagem existente reduzir perceptivelmente a qualidade final;
- correção de layout, tabela, formulário, diálogo, gráfico, cache, sincronização ou navegação estiver sendo resolvida artesanalmente apesar de existir solução especializada pertinente.

### 7.2 Conteúdo mínimo da proposta

Informar:

1. problema ou limite observado;
2. tecnologia, atualização ou capacidade sugerida;
3. ganho concreto para usuários e projeto;
4. alternativa sem nova dependência;
5. custo, risco e manutenção adicional;
6. impacto em bundle, carregamento, dados, permissões, LGPD e ambientes;
7. testes, rollback e evidências necessários;
8. necessidade de Vercel, Supabase ou ambas.

### 7.3 Limites

- proposta não significa autorização de instalação;
- não ampliar escopo silenciosamente;
- não instalar pacote apenas por novidade;
- manter solução existente quando ela produzir resultado equivalente com menor custo;
- seguir ADR-020, ADR-038 e ADR-039;
- separar atualização, integração funcional e ativação de Production quando isso melhorar segurança e rastreabilidade;
- registrar oportunidade nova no roadmap quando ela não for executada no ciclo atual.

## 8. Superfícies e dispositivos

Examinar:

- Dashboard;
- Carteira;
- Competências;
- Prontuário e timeline;
- Pendências;
- Gestão de Equipe;
- Capital e Inventário;
- Registros Internos;
- configurações e visões SME;
- relatórios e exportações;
- desktop, Android e iPhone;
- estados vazios, filtros, menus e modais;
- permissões positivas e negativas;
- última movimentação, próxima ação, prazo e responsável.

Mobile pode reorganizar tabelas em cartões, mas não remover informação ou capacidade essencial.

## 9. Contratos de produto

- uma única competência global `YYYY-MM`;
- janeiro a dezembro de 2026 disponíveis conforme permissão;
- avaliação mensal canônica;
- timeline como projeção somente leitura;
- navegação contextual preservando competência, rota, filtros, rolagem e foco;
- relatório institucional XLSX de quatro abas;
- Excel SME mensal de uma aba;
- CSV legado como secundário e fallback;
- Excel SME sem `dataValidations`.

A homologação manual do Excel SME no Microsoft Excel desktop está concluída e não deve ser tratada como pendência. O relatório institucional é produto preexistente e independente; eventual homologação manual desse arquivo pertence ao gate global de release, não ao escopo encerrado do Excel SME.

## 10. Persistência e Supabase

Contrato único:

- `SupabaseRepository` — canônico em Preview e Production;
- `LocalStorageRepository` — desenvolvimento controlado e contingência excepcional.

Regras:

- usar serviços de aplicação e portas existentes;
- operações compostas devem ser atômicas;
- conflitos usam `row_version`;
- somente chave publicável chega ao navegador;
- credenciais administrativas permanecem server-side;
- migrations são versionadas e aplicadas em ordem;
- nenhum seed institucional implícito;
- importação usa validação, staging, reconciliação, promoção e rollback;
- RLS reflete exatamente as capacidades aprovadas;
- Edge Functions administrativas exigem JWT e papel autorizado;
- nenhuma alteração remota sem escopo e autorização.

### Histórico de migrations

```text
arquivo canônico: 20260728182226_sme_access_governance.sql
registro remoto: 20260728182226
registro derivado 20260728190344: ausente
SHA-256: cddda35f4cc08b92093071f888cf958ae052ae82775c91366e4d729434427f0e
```

Antes de migration futura:

- `supabase migration list --linked`;
- teste de alinhamento SME;
- reset local, pgTAP, lint e tipos;
- backup/restauração descartáveis;
- `db push --linked --dry-run`;
- plano de rollback;
- nenhuma edição direta do histórico.

## 11. Backup e restauração

Gate canônico:

```text
.github/workflows/backup-restore-disposable.yml
scripts/verify-supabase-backup-restore.mjs
npm run test:backup-restore
```

O teste deve:

1. usar somente pilhas locais descartáveis;
2. exigir `RADAR_ALLOW_DISPOSABLE_BACKUP_RESTORE=true`;
3. gerar dumps lógicos de papéis, schema, dados e histórico;
4. restaurar em segunda pilha isolada por `SUPABASE_WORKDIR`;
5. copiar as Edge Functions exigidas pela configuração antes de iniciar a pilha de restauração;
6. comparar schema, dados, Auth e migrations;
7. publicar somente `evidence.json`;
8. destruir as pilhas ao final;
9. nunca usar `--linked`, segredo remoto ou Production.

A Rodada 3B comprovou esse contrato com Supabase CLI 2.110.0.

## 12. Recursos dependentes de plano

A checagem de credenciais comprometidas é restrita pelo Supabase ao plano Pro ou superior. O projeto está no plano Free e não possui autorização de despesa. Esse recurso não é requisito de liberação enquanto essa condição permanecer; reavaliar após eventual mudança de plano.

## 13. Vercel

- separar Production, Preview e local;
- Production usa `supabase-production`;
- Preview conectado usa `supabase-preview`;
- validar `radar-build-manifest.json`;
- confirmar correspondência entre deployment e SHA;
- não promover Preview como Production;
- manter deployments automáticos bloqueados fora de janela controlada;
- não publicar mudança documental ou ferramenta interna como funcional;
- distinguir explicitamente mudança integrada à `main` de mudança presente em Production.

## 14. Git e integração

Não trabalhar diretamente na `main`.

Fluxo obrigatório:

1. confirmar HEAD remoto;
2. criar branch específica;
3. escrever teste que falha quando aplicável;
4. implementar mudança mínima coerente;
5. executar gates;
6. abrir PR com riscos, limites e evidências;
7. confirmar checks no SHA final;
8. fazer merge somente após conclusão integral.

Não misturar funcionalidade, arquitetura, dependências, migration, ativação remota e polimento não relacionado no mesmo PR.

## 15. Testes e conclusão

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
- Advisors;
- homologação manual;
- UAT.

A conclusão exige:

- testes aplicáveis verdes no SHA final;
- ausência de regressão relevante;
- documentação atualizada;
- nenhum segredo no diff ou artefato;
- correspondência entre commit, build e deployment quando houver publicação;
- relato explícito quando não existir workflow associado ao SHA.

## 16. Gates globais de liberação oficial

Permanecem pendentes no processo geral do produto, sem constituir pendência do Excel SME ou das rodadas técnicas:

1. homologação manual do relatório institucional preexistente no Microsoft Excel desktop, caso essa frente seja priorizada;
2. revisão dos Advisors quando aplicável;
3. UAT funcional;
4. polimento editorial e visual;
5. decisão formal de release.

Não declarar o produto oficialmente liberado antes do gate cumulativo.

## 17. Prevenção de loops

Ao concluir PR relevante:

- atualizar `docs/CURRENT_STAGE.md`;
- atualizar `docs/ROADMAP_ATUALIZACOES_2026.md` quando houver item técnico ou funcional afetado;
- registrar decisões duradouras em `docs/DECISION_LOG.md`;
- atualizar `docs/PROJECT_CONTEXT.md` quando necessário;
- atualizar contratos e evidências;
- classificar documentos substituídos ou históricos;
- registrar oportunidades tecnológicas identificadas e não executadas;
- não iniciar nova frente antes de declarar a anterior concluída, bloqueada, adiada ou substituída.
