# Auditoria de integração — Gate de Pré-conexão Supabase

**Classificação:** auditoria histórica encerrada  
**Período:** antes da ativação do Supabase em Production  
**Fonte atual:** [`../CURRENT_STAGE.md`](../CURRENT_STAGE.md)

> As afirmações de que Production permanecia local e de que Supabase ainda não estava implantado eram corretas na data desta auditoria, mas foram substituídas pela ativação registrada na ADR-023. O conteúdo abaixo é preservado como evidência do gate de preparação e não deve orientar o estado atual.

## Conclusão executiva histórica

O RADAR PDDE estava estruturalmente preparado para futura conexão ao Supabase sem nova refatoração de arquitetura. Naquele estágio, Production permanecia no modo local, sem URL, chave ou conexão remota ativa.

A formulação correta naquele momento era:

> O RADAR está integralmente preparado para conexão ao Supabase, condicionada à criação e homologação do projeto remoto.

## Escopo auditado

- frontend e handlers mutantes;
- serviços de aplicação e unidade de trabalho;
- contrato de repositório e dois adaptadores;
- modelo relacional, migrations, RPCs e RLS;
- Auth local e cinco perfis;
- contratos JSON Ajv/pg_jsonschema;
- migração, reconciliação e rollback;
- artefatos gerados e configuração pública;
- testes unitários, integração, pgTAP e E2E;
- documentação de conexão e operação.

## Resultado da auditoria estrutural

A auditoria automatizada não encontrou:

- mutação institucional direta em handlers;
- acesso funcional direto ao `localStorage` fora dos adaptadores autorizados;
- chamadas diretas à Data API do Supabase no `app.js`;
- mutadores sem mapeamento para serviços de aplicação;
- credenciais administrativas no frontend ou no repositório.

Naquele gate, o bootstrap permanecia *fail-closed*: o modo versionado era `local`, `supabaseRepositoryEnabled` era `false`, URL e chave publicável eram vazias.

## Banco de dados naquele estágio

O conjunto possuía 12 migrations versionadas:

1. esquema relacional principal;
2. autenticação, perfis e RLS;
3. auditoria e controle de importações;
4. prazo de bonificação por competência;
5. contexto operacional de notas e inventário;
6. endurecimento de autorização;
7. cobertura de auditoria de configurações;
8. operações atômicas de notas fiscais;
9. payload de verificações;
10. Auth local e grants explícitos da Data API;
11. contratos JSON e RPCs compostas;
12. importação reversível por staging, promoção e rollback.

As migrations eram exercitadas em PostgreSQL 17 independente e na pilha Supabase local.

O estado atual possui 25 arquivos locais de migration e Production remota ativa. Consultar o runbook vigente.

## Segurança verificada

- RLS habilitada em todas as tabelas expostas;
- `anon` sem acesso a dados institucionais;
- grants mínimos e explícitos para `authenticated`;
- perfis e escopos mantidos em tabelas públicas protegidas, não em `user_metadata`;
- funções privilegiadas com `search_path` fixo;
- `SECURITY INVOKER` utilizado sempre que possível;
- funções `SECURITY DEFINER` restritas, com autorização interna e `EXECUTE` revogado de `PUBLIC`;
- exclusões físicas limitadas ao Administrador técnico;
- `service_role`, `sb_secret_*`, senha e token administrativo proibidos no navegador e nos logs;
- artefatos e dependências fixados por versão e lockfile.

## Integridade transacional

As operações compostas possuíam equivalência local/remota:

- exercício e 12 competências;
- escola e vínculos de programas;
- reanálise, pendência, tentativa e verificação;
- nota, bem derivado, verificação e log;
- promoção de snapshot funcional.

A importação usava `importId`, hash SHA-256, lotes idempotentes, checkpoint, reconciliação obrigatória e rollback controlado.

## Evidências históricas de teste

O gate consolidado executava:

- verificação de sintaxe;
- 146 testes unitários;
- 1 teste de integração do fluxo de migração;
- 94 verificações pgTAP;
- lint PL/pgSQL;
- regeneração e comparação de tipos e bundles;
- sete identidades Auth locais;
- cinco perfis e negações de acesso;
- Playwright em desktop Chromium, Android/Chromium e iPhone/WebKit;
- axe e navegação por teclado;
- auditoria funcional e de persistência.

Esses números são evidência histórica do PR 22 e não representam a suíte atual. A estratégia vigente está em [`../architecture/testing.md`](../architecture/testing.md).

## Riscos residuais identificados naquele momento

- disponibilidade real de extensões e versões;
- configuração de ambientes Vercel;
- capacidade, latência e limites do projeto escolhido;
- Advisors do projeto;
- política de backups e restauração;
- MFA para perfis privilegiados;
- homologação com usuários e dados controlados.

Parte desses itens foi superada; outros permanecem gates de release. Consultar `CURRENT_STAGE.md`.

## Parecer histórico

O parecer autorizava encerrar o Gate de Pré-conexão após pipelines verdes e Preview correspondente ao mesmo commit. O merge daquele gate não ativava Supabase e mantinha Production em LocalStorage.

Essa condição foi posteriormente substituída pela ativação de Production. O documento permanece somente para demonstrar a preparação anterior.
