# Auditoria de integração e modernização — preparação Supabase

## Finalidade

Verificar se a preparação para Supabase foi incorporada ao RADAR PDDE como parte coerente do projeto, cobrindo frontend, persistência, regras derivadas, banco, segurança, testes, documentação e manutenção tecnológica.

Esta auditoria não autoriza conexão remota. O modo oficial continua sendo `localStorage`.

## Estado auditado

- Branch: `feature/supabase-readiness`
- Pull Request: `#22`
- Base: `main` em `a2483fd07473a0a3c431b5e49c642c53be1b2018`
- Produção: não alterada
- Conexão Supabase remota: desativada

## Conclusão executiva

O trabalho de preparação está integrado à estrutura do projeto e não constitui um conjunto isolado de arquivos sem ligação com a aplicação.

Foram incorporados:

- configuração segura e *fail-closed*;
- contrato e adaptadores de persistência;
- ponte bidirecional do estado legado;
- tradução das estruturas reais usadas pela interface;
- dez migrations relacionais;
- autenticação e RLS futuras;
- auditoria e controle de importações;
- operações atômicas para nota, bem e verificação;
- testes unitários, smoke SQL, pgTAP e E2E;
- ambiente Supabase local reproduzível;
- tipos TypeScript gerados do schema;
- cliente Supabase fixado e empacotado;
- lint de PL/pgSQL;
- validação remota manual e não destrutiva preparada;
- runbooks de ativação e rollback;
- manutenção automatizada de dependências.

A conexão real permanece intencionalmente desativada. Isso é uma salvaguarda, não uma lacuna da etapa aprovada.

## Cobertura verificada

| Dimensão | Cobertura incorporada | Situação |
|---|---|---|
| Layout e navegação | Dashboard, Carteira, Competências, Pendências, Prontuário, Inventário, equipe, configurações e Excel preservados | Coberto |
| Botões e handlers | Inventário estático de handlers e testes E2E dos fluxos principais | Coberto |
| Formulários e campos | Escola, contato, pendência, reenvio, reanálise, nota, bem, controlador, inventariador e exercício | Coberto |
| Persistência local | Chaves `radar_pdde_*`, leitura, gravação, snapshot e restauração | Coberto |
| Dados derivados | Bonificação, análise, alertas, próxima ação, inventário e efeitos de notas | Coberto |
| Tradução para banco | Entidades, relacionamentos, JSONB de compatibilidade e FKs | Coberto |
| Migração e retorno | Exportação, `dryRun`, lotes, reconciliação e rollback local | Coberto |
| Autenticação futura | Perfis, vínculos, escopos e identidade Supabase Auth | Preparado e desativado |
| Autorização | RLS, leitura/escrita separadas, perfil ativo único e exclusão técnica | Coberto |
| Concorrência | `row_version` e erro `OPTIMISTIC_CONFLICT` | Coberto |
| Mutações compostas | RPCs atômicas para salvar e remover notas com efeitos relacionados | Coberto |
| Auditoria | Alterações operacionais, configurações, cadastros, vínculos e importações | Coberto |
| Escala | Paginação integral e lotes para coleções acima de mil registros | Coberto |
| Segurança de segredos | Bloqueio de `service_role`, `sb_secret_`, senha e JWT administrativo | Coberto |
| Regressão visual e funcional | Desktop Chromium, Android/Chromium e iPhone/WebKit | Coberto |
| Schema executável | Supabase CLI, PostgreSQL 17, pgTAP, tipos e lint | Coberto |

## Correções descobertas e incorporadas

1. Contatos criados pela interface usam `desc`; a ponte passou a preservar esse campo corretamente.
2. Notas fiscais passaram a preservar `compKey`, programa, verificação, bem vinculado e `dataRegistro`.
3. A inventariação passou a preservar responsável e data próprios.
4. A ida e volta canônico → local → canônico deixou de inserir aliases técnicos nos objetos do usuário.
5. Exercícios e competências persistidos passaram a ser hidratados antes da primeira renderização.
6. O repositório Supabase passou a paginar leituras e executar gravações em lotes.
7. Edições concorrentes passaram a ser detectáveis por `row_version`.
8. Escopo adicional com `can_write = false` deixou de conceder escrita a Controladores.
9. Foi impedida a existência de dois perfis ativos simultaneamente para o mesmo usuário.
10. Configurações, programas, controladores, equipe, competências e vínculos escola–programa passaram a gerar eventos de auditoria.
11. Dependências e Actions passaram a ser reproduzíveis e monitoradas.
12. O SDK deixou de ser carregado por CDN flutuante e passou a ser empacotado em versão fixa.
13. Salvar ou remover nota, bem vinculado e ajuste de verificação passou a possuir contrato transacional no banco.

## Oito migrations incorporadas

1. `202607130001_core_schema.sql`
2. `202607130002_auth_and_rls.sql`
3. `202607130003_audit_and_import.sql`
4. `202607130004_competence_bonus_deadline.sql`
5. `202607130005_operational_context.sql`
6. `202607130006_authorization_hardening.sql`
7. `202607130007_configuration_audit_coverage.sql`
8. `202607130008_atomic_invoice_operations.sql`
9. `202607140009_verification_payload.sql`

## Modernização incorporada

- Node.js 24 em `.nvmrc` e CI;
- Supabase CLI `2.109.1` fixada;
- `@supabase/supabase-js` `2.110.5` fixado e empacotado por esbuild;
- TypeScript `7.0.2` verificando o contrato gerado do banco;
- tipos TypeScript gerados em `src/types/database.types.ts`;
- ambiente local versionado em `supabase/config.toml`;
- 48 verificações pgTAP para schema, RLS, grants e RPCs;
- smoke test adicional em PostgreSQL 17 puro;
- lint de PL/pgSQL com falha em erro;
- `package-lock.json`, `npm ci`, `npm audit` e Dependabot;
- GitHub Actions fixadas por SHA;
- workflow manual `supabase-remote-validation.yml`, sem aplicação automática de migrations.

## Validações permanentes

O workflow `Supabase readiness` executa três camadas:

1. contratos, artefatos, segredos e auditoria funcional;
2. aplicação das dez migrations e smoke operacional em PostgreSQL 17;
3. pilha Supabase local, pgTAP, lint, regeneração de tipos e reprodução do bundle.

A validação remota, quando houver projeto autorizado, poderá executar:

- vínculo controlado por `project_ref`;
- `db push --dry-run`;
- lint remoto;
- pgTAP remoto em transações reversíveis;
- comparação dos tipos remotos;
- inventário de branches.

## Elementos não ativados por decisão arquitetural

Os itens abaixo não devem ser interpretados como trabalho esquecido:

- projeto Supabase remoto;
- URL e chave publicável;
- login e sessão reais;
- aplicação das migrations em banco remoto;
- substituição das chamadas diretas do `app.js` pelo contrato;
- ativação de `supabase-preview`;
- criação de branch remota Supabase;
- execução dos Advisors do projeto real;
- promoção para produção.

Esses itens exigem ambiente remoto, usuários de teste, homologação de RLS e autorização expressa.

## Melhorias que permanecem para a conexão real

1. Criar uma branch Supabase sem dados produtivos para homologação.
2. Aplicar as migrations em ambiente remoto autorizado.
3. Executar Security e Performance Advisors do projeto real.
4. Repetir no projeto remoto os testes de Auth e RLS já preparados para os cinco perfis e cenários negativos locais.
5. Homologar o gateway já integrado ao `app.js` com uma cópia reconciliada dos dados.
6. Testar falha de rede, sessão expirada, conflito e recuperação.
7. Executar teste de carga com a volumetria completa das CREs.
8. Reconciliar origem e destino sem divergência funcional.

## Não recomendado agora

- migrar o frontend para React, Next.js ou outro framework apenas para usar Supabase;
- ativar Realtime sem necessidade operacional comprovada;
- introduzir ORM antes de estabilizar o contrato;
- remover o adaptador local antes da homologação e do rollback;
- substituir tabelas, botões ou fluxos aprovados durante a integração técnica.

## Critério para considerar a conexão pronta

A conexão futura somente poderá ser promovida quando:

- o gateway já integrado for homologado contra a base remota reconciliada;
- Auth e RLS forem testados com todos os perfis;
- mutações compostas forem homologadas no ambiente remoto;
- Advisors forem analisados;
- origem e destino forem reconciliados;
- falha de rede, sessão expirada e conflito forem tratados;
- o Preview remoto for homologado;
- o rollback estiver testado;
- houver autorização expressa para produção.
