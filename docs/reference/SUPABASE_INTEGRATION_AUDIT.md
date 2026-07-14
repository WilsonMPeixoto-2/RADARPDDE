# Auditoria de integração e modernização — preparação Supabase

## Finalidade

Verificar se a preparação para Supabase foi incorporada ao RADAR PDDE como parte coerente do projeto, cobrindo frontend, persistência, regras derivadas, banco, segurança, testes, documentação e manutenção tecnológica.

Esta auditoria não autoriza conexão remota. O modo oficial continua sendo `localStorage`.

## Estado auditado

- Branch: `feature/supabase-readiness`
- Pull Request: `#22`
- HEAD auditado: `6c4658bc7877ac07c661e0a1ffae1c4a9f3d184b`
- Base: `main` em `a2483fd07473a0a3c431b5e49c642c53be1b2018`
- Preview funcional: deployment `dpl_AoxHJd1Apx5z7LWzXikz8AqSZUKN`
- Produção: não alterada

## Conclusão executiva

O trabalho de preparação está integrado à estrutura do projeto e não constitui um conjunto isolado de arquivos sem ligação com a aplicação.

Foram incorporados:

- configuração segura e *fail-closed*;
- contrato e adaptadores de persistência;
- ponte bidirecional do estado legado;
- tradução das estruturas reais usadas pela interface;
- sete migrations relacionais;
- autenticação e RLS futuras;
- auditoria e controle de importações;
- testes unitários, SQL e E2E;
- inventário automatizado de superfícies funcionais;
- runbooks e documentação de ativação e rollback;
- atualização da cadeia de desenvolvimento e CI.

A conexão real permanece intencionalmente desativada. Isso é uma salvaguarda, não uma lacuna da etapa aprovada.

## Cobertura verificada

| Dimensão | Cobertura incorporada | Situação |
|---|---|---|
| Layout e navegação | Dashboard, Carteira, Competências, Pendências, Prontuário, Inventário, equipe, configurações e Excel preservados | Coberto |
| Botões e handlers | Inventário estático de handlers e testes E2E dos fluxos principais | Coberto |
| Formulários e campos | Campos de escola, contato, pendência, reenvio, reanálise, nota, bem, controlador, inventariador e exercício | Coberto |
| Persistência local | Chaves `radar_pdde_*`, leitura, gravação, snapshot e restauração | Coberto |
| Dados derivados | Bonificação, análise, alertas, próxima ação, inventário e efeitos de notas permanecem calculados pelas regras atuais | Coberto |
| Tradução para banco | Entidades, relacionamentos, JSONB de compatibilidade e FKs | Coberto |
| Migração e retorno | Exportação, `dryRun`, importação em lotes, reconciliação e rollback local | Coberto |
| Autenticação futura | Perfis, vínculos, escopos e identidade Supabase Auth | Preparado e desativado |
| Autorização | RLS, leitura/escrita separadas, perfil ativo único e exclusão técnica | Coberto |
| Concorrência | `row_version` e erro `OPTIMISTIC_CONFLICT` | Coberto |
| Auditoria | Alterações operacionais, configurações, cadastros, vínculos e importações | Coberto |
| Escala | Paginação integral e lotes para coleções acima de mil registros | Coberto |
| Segurança de segredos | Bloqueio de `service_role`, `sb_secret_`, senha e JWT administrativo | Coberto |
| Regressão visual e funcional | Desktop Chromium, Android/Chromium e iPhone/WebKit | Coberto |

## Correções descobertas e incorporadas durante a auditoria

1. Contatos criados pela interface usam `desc`; a ponte passou a preservar esse campo corretamente.
2. Notas fiscais passaram a preservar `compKey`, programa, verificação, bem vinculado e `dataRegistro` em colunas relacionais.
3. A inventariação passou a preservar responsável e data próprios.
4. A ida e volta canônico → local → canônico deixou de inserir aliases técnicos nos objetos do usuário.
5. Exercícios e competências persistidos passaram a ser hidratados antes da primeira renderização.
6. O repositório Supabase passou a paginar leituras e executar gravações em lotes.
7. Edições concorrentes passaram a ser detectáveis por `row_version`.
8. Escopo adicional com `can_write = false` deixou de conceder escrita a Controladores.
9. Foi impedida a existência de dois perfis ativos simultaneamente para o mesmo usuário.
10. Configurações, programas, controladores, equipe, competências e vínculos escola–programa passaram a gerar eventos de auditoria.
11. Dependências e Actions passaram a ser reproduzíveis e monitoradas.

## Sete migrations incorporadas

1. `202607130001_core_schema.sql`
2. `202607130002_auth_and_rls.sql`
3. `202607130003_audit_and_import.sql`
4. `202607130004_competence_bonus_deadline.sql`
5. `202607130005_operational_context.sql`
6. `202607130006_authorization_hardening.sql`
7. `202607130007_configuration_audit_coverage.sql`

## Validações executadas

- validação de sintaxe e infraestrutura;
- testes de domínio existentes;
- testes unitários dos contratos e adaptadores;
- auditoria funcional e de persistência;
- auditoria npm com bloqueio para vulnerabilidades altas;
- aplicação das sete migrations em PostgreSQL 17 efêmero;
- testes SQL de versão, auditoria, contexto e autorização;
- Playwright completo em desktop, Android e iPhone;
- verificação de ausência de chamadas Supabase no modo local;
- Preview Vercel em estado `READY` e sem erro de build ou runtime registrado.

## Elementos não ativados por decisão arquitetural

Os itens abaixo não devem ser interpretados como trabalho esquecido:

- projeto Supabase remoto;
- URL e chave publicável;
- login real;
- sessão autenticada;
- aplicação das migrations em banco remoto;
- substituição das chamadas diretas do `app.js` pelo contrato;
- ativação de `supabase-preview`;
- promoção para produção.

Esses itens pertencem à etapa futura de conexão e exigem ambiente remoto, usuários de teste e homologação de RLS.

## Modernização já incorporada

- Node.js 24 indicado em `.nvmrc` e CI;
- dependências de desenvolvimento fixadas;
- `package-lock.json` versionado;
- instalação por `npm ci` no CI;
- Playwright atualizado e fixado;
- análise sintática com Acorn;
- GitHub Actions fixadas por SHA;
- Dependabot semanal para npm e Actions;
- `npm audit --audit-level=high` no pipeline;
- PostgreSQL real no smoke test das migrations.

## Melhorias recomendadas para a etapa de conexão real

### Prioridade alta

1. **Adicionar Supabase CLI como dependência de desenvolvimento fixada.** Usar a pilha local completa para aplicar migrations, testar Auth e reproduzir o ambiente remoto.
2. **Converter os testes SQL de autorização para pgTAP.** Manter os smoke tests atuais e acrescentar casos declarativos de RLS positivos e negativos.
3. **Gerar tipos TypeScript a partir do banco.** Mesmo com frontend JavaScript, os tipos podem validar contratos e servir como artefato de auditoria do schema.
4. **Fixar e empacotar `@supabase/supabase-js`.** Remover o carregamento CDN flutuante antes da primeira conexão.
5. **Executar Security e Performance Advisors.** Tratar índices ausentes, políticas permissivas, RLS incompleta e funções com `search_path` inseguro.
6. **Implementar transações server-side para mutações compostas.** Edição ou remoção de nota pode alterar nota, bem e verificação; essas operações devem ser atômicas por função PostgreSQL/RPC ou backend controlado.

### Prioridade média

1. Criar testes de contrato contra uma instância Supabase local real, além dos mocks do cliente.
2. Gerar relatório automático de diferença entre schema esperado e schema aplicado.
3. Adicionar teste de carga com a volumetria completa das CREs antes da produção.
4. Criar telemetria de erros de sincronização sem registrar dados pessoais ou conteúdo documental.
5. Avaliar cache de leitura e invalidação somente após medir consultas reais.

### Não recomendado agora

- migrar o frontend inteiro para React, Next.js ou outro framework apenas para usar Supabase;
- ativar Realtime sem necessidade operacional comprovada;
- introduzir ORM antes de estabilizar o contrato de dados;
- remover o adaptador local antes da homologação e do rollback;
- substituir tabelas, botões ou fluxos aprovados durante a integração técnica.

## Critério para considerar a conexão pronta

A conexão futura somente poderá ser promovida quando:

- o cliente Supabase estiver fixado e empacotado;
- o contrato substituir a integração antiga;
- Auth e RLS forem testados com todos os perfis;
- mutações compostas forem atômicas;
- origem e destino forem reconciliados sem divergência funcional;
- falha de rede, sessão expirada e conflito forem tratados;
- o Preview remoto for homologado;
- o rollback estiver testado;
- houver autorização expressa para produção.
