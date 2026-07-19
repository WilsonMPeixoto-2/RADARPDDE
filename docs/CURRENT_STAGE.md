# RADAR PDDE — Estado atual do projeto

**Atualizado em:** 19 de julho de 2026  
**Natureza:** documento operacional e transitório  
**Responsabilidade:** deve ser revisado ao final de cada PR que altere estágio, prioridades, infraestrutura ou critérios de aceite.

---

## 1. Regra de leitura

Este documento registra o estágio principal do desenvolvimento.

A última alteração cronológica no repositório não representa necessariamente a próxima prioridade funcional.

Antes de executar uma nova tarefa:

1. confirme o HEAD remoto da `main`;
2. verifique PRs posteriores a esta atualização;
3. confirme o deployment vigente quando aplicável;
4. atualize este documento caso o estado real tenha mudado.

---

## 2. Estado consolidado

O RADAR possui, no estado auditado:

- frontend funcional em modo local;
- dashboard e carteira operacional;
- fluxo de pendências, tentativas, reanálise e verificações;
- componentes de acessibilidade e responsividade;
- contrato único de repositório;
- adaptador LocalStorage operacional;
- adaptador Supabase preparado;
- serviços de aplicação e unidade de trabalho;
- concorrência otimista por `row_version`;
- migrations SQL versionadas;
- contratos JSON;
- RPCs para operações compostas;
- importação reversível, reconciliação e rollback;
- testes unitários, de integração, E2E e pgTAP;
- runtime config com bloqueio seguro de produção;
- pipeline de readiness Supabase;
- Dependabot para npm e GitHub Actions.

---

## 3. Estado da persistência

### Production

- modo de dados: `local`;
- repositório Supabase: desabilitado;
- URL Supabase pública: vazia;
- chave publicável: vazia;
- ativação Supabase em produção: não aprovada.

### Supabase remoto

No estado auditado:

- ainda não existe projeto remoto exclusivo e homologado para o RADAR PDDE;
- migrations do RADAR ainda não foram aplicadas em projeto remoto exclusivo;
- nenhum dado institucional foi migrado;
- Preview remoto com Supabase ainda não foi ativado;
- projetos Supabase existentes de outras finalidades não devem ser reutilizados sem decisão expressa.

---

## 4. Estágio principal atual

O estágio principal é concluir a preparação operacional de pré-conexão e, posteriormente, iniciar a conexão controlada com um projeto Supabase exclusivo de Preview.

Ajustes visuais recentes são trabalhos pontuais concluídos e não substituem essa prioridade.

A conexão inicial não significa ativação em produção nem migração definitiva de dados.

---

## 5. Pendências necessárias antes da conexão real

### 5.1. Runbook de conexão

Atualizar `docs/runbooks/SUPABASE_CONNECTION.md` para refletir todas as migrations existentes e eliminar a divergência entre a lista manual e o manifesto real.

O runbook auditado menciona dez migrations, enquanto o projeto possui doze.

Devem constar também:

- migration de transações e contratos JSON;
- migration de importação reversível.

Preferência: evitar lista manual duplicada quando a ordem puder ser derivada do diretório de migrations e verificada automaticamente.

### 5.2. Validação remota em duas fases

Separar o workflow remoto em:

1. **preflight não destrutivo** — link, lista de migrations, `db push --dry-run`, verificação de capacidades e registro do plano;
2. **pós-aplicação em ambiente descartável ou Preview** — aplicação das migrations, lint, pgTAP, comparação de tipos, Advisors e testes de repositório.

O teste remoto não pode presumir que o schema existe após um simples `dry-run`.

### 5.3. Build da Vercel

Criar processo de build versionado que:

- execute o gerador de `config.runtime.js`;
- publique o resultado correto por ambiente;
- permita `supabase-preview` somente em Preview;
- preserve Production em modo local e fail-closed.

Adicionar variáveis na Vercel sem executar o gerador durante o build não é suficiente.

### 5.4. Schema exposto

Revisar `supabase/config.toml` e remover `graphql_public` da lista de schemas expostos, salvo requisito funcional e habilitação expressa do `pg_graphql`.

O RADAR utiliza Data API/REST e RPCs; GraphQL não integra o fluxo atual documentado.

---

## 6. Melhorias recomendadas na mesma etapa ou imediatamente depois

Estas melhorias aumentam a relação verificável entre schema, dados e funcionalidades, mas não justificam troca geral de arquitetura.

### 6.1. Tipos do banco no repositório

Vincular `src/types/database.types.ts` às consultas reais do `SupabaseRepository`, por TypeScript ou JSDoc com `checkJs`.

Objetivo: detectar em CI divergências entre nomes de tabelas, colunas, RPCs e o schema gerado.

### 6.2. CLI de migração remota

Estender a CLI de migração para operar futuramente sobre `SupabaseRepository`, preservando:

- plan;
- validate;
- dry-run;
- import remoto;
- reconcile remoto;
- rollback remoto;
- relatórios sem credenciais.

A credencial administrativa deve permanecer apenas no processo autorizado de CI ou administração, nunca no navegador.

### 6.3. Integridade das dependências

Adicionar às verificações aplicáveis:

- assinatura/proveniência dos pacotes npm;
- auditoria de vulnerabilidades em nível adequado;
- grupos específicos do Dependabot para o ecossistema Supabase e ferramentas de schema/build.

Não habilitar auto-merge para atualizações centrais sem passar pelos gates completos.

### 6.4. Supabase MCP e Advisors

Após criar o projeto exclusivo de Preview:

- configurar Supabase MCP limitado ao `project_ref` correto e inicialmente em modo somente leitura;
- incorporar Advisors de segurança e desempenho à validação pós-aplicação.

---

## 7. Dependências

No estado auditado, as dependências centrais do projeto estavam fixadas e atualizadas para as versões estáveis utilizadas pelo RADAR.

Diretriz atual:

- não executar atualização geral indiscriminada;
- não migrar para versão principal em pré-lançamento do `supabase-js`;
- não instalar ORM, Zod, `@supabase/ssr`, TanStack Query, driver PostgreSQL direto ou camada offline adicional sem requisito demonstrado;
- priorizar melhor uso das ferramentas já instaladas.

---

## 8. Fora do escopo desta etapa

Não devem ser tratados como bloqueadores da preparação técnica atual, salvo nova autorização:

- desenho definitivo da autenticação institucional;
- MFA;
- política final de retenção;
- revisão completa de segurança de produção;
- ativação do Supabase em Production;
- migração definitiva dos dados institucionais;
- Realtime;
- modernização geral do frontend;
- substituição da arquitetura de estado ou persistência.

Esses temas pertencem a etapas posteriores.

---

## 9. Próxima entrega esperada

Um Pull Request pequeno, reversível e verificável que feche as pendências de pré-conexão sem:

- criar projeto Supabase;
- aplicar migrations remotamente;
- inserir credenciais;
- ativar Supabase na Vercel;
- alterar Production;
- migrar dados reais;
- misturar correções visuais não relacionadas.

---

## 10. Critérios de aceite da pré-conexão

- documentação coerente com as migrations existentes;
- workflow remoto dividido em preflight e pós-aplicação;
- build da Vercel gera runtime config por ambiente;
- Production continua fail-closed;
- configuração do Supabase expõe somente os schemas necessários;
- tipos do banco verificam as consultas do repositório;
- CLI remota não expõe segredo ao frontend ou aos relatórios;
- CI completa aprovada;
- nenhuma regressão funcional ou visual relevante;
- PR acompanhado de evidências e riscos residuais.

---

## 11. Sequência posterior autorizável

Depois do fechamento da pré-conexão e mediante autorização expressa:

1. criar projeto Supabase exclusivo `radar-pdde-preview` em região adequada;
2. configurar segredos do GitHub e variáveis públicas somente no Preview da Vercel;
3. executar preflight remoto não destrutivo;
4. aplicar as doze migrations no ambiente descartável ou Preview;
5. executar lint, pgTAP, tipos, Advisors e testes de integração;
6. implantar somente o Preview com `supabase-preview`;
7. confirmar ausência de seed implícito;
8. validar CRUD e RPCs;
9. realizar importação controlada, reconciliação, promoção e rollback de teste;
10. manter Production em modo local até uma etapa futura de homologação.
