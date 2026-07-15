# Auditoria de integração — Gate de Pré-conexão Supabase

## Conclusão executiva

O RADAR PDDE está estruturalmente preparado para futura conexão ao Supabase sem nova refatoração de arquitetura. A produção permanece no modo local, sem URL, chave ou conexão remota ativa.

Não é correto afirmar que o Supabase está implantado. A formulação correta é:

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

O bootstrap permanece *fail-closed*: o modo versionado é `local`, `supabaseRepositoryEnabled` é `false`, URL e chave publicável são vazias.

## Banco de dados

O conjunto possui 12 migrations versionadas:

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

As migrations são exercitadas em PostgreSQL 17 independente e na pilha Supabase local.

## Segurança

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

As operações compostas possuem equivalência local/remota:

- exercício e 12 competências;
- escola e vínculos de programas;
- reanálise, pendência, tentativa e verificação;
- nota, bem derivado, verificação e log;
- promoção de snapshot funcional.

A importação usa `importId`, hash SHA-256, lotes idempotentes, checkpoint, reconciliação obrigatória e rollback controlado. A substituição atômica declara explicitamente as exclusões totais, mantendo compatibilidade com o modo `safeupdate` do Supabase.

## Evidências de teste

O gate consolidado executa:

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

Os números devem ser atualizados caso a suíte cresça; a fonte de verdade é o workflow associado ao HEAD final do PR 22.

## Riscos residuais

Não são lacunas de preparação, mas atividades dependentes do ambiente remoto:

- disponibilidade real de extensões e versões;
- configuração de ambientes Vercel;
- capacidade, latência e limites do projeto escolhido;
- Advisors do projeto;
- política de backups e restauração;
- MFA para perfis privilegiados;
- homologação com usuários e dados controlados.

## Parecer

O Gate de Pré-conexão pode ser encerrado quando o HEAD final apresentar todas as pipelines verdes e um Preview correspondente ao mesmo commit for validado. O merge não ativa o Supabase: incorpora apenas a arquitetura pronta, mantendo produção em `localStorage`.
