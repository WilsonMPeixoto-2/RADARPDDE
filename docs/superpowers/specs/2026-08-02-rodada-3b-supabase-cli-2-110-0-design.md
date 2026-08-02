# Rodada 3B — Supabase CLI 2.110.0 Design

## Objetivo

Atualizar exclusivamente o Supabase CLI de `2.109.1` para `2.110.0`, preservando integralmente o comportamento funcional do RADAR PDDE, o schema, as 25 migrations, os dados, Auth, RLS, Edge Functions e os ambientes remotos.

## Motivação

A versão 2.110.0 é uma atualização oficial de qualidade e estabilidade que traz benefícios relevantes ao fluxo de desenvolvimento e CI do RADAR:

- recuperação da stack local após interrupções pelo `supabase start`;
- validação de configuração antes do destrutivo `db reset --local`;
- correção para impedir que migrations locais sejam sincronizadas indevidamente por `db push`;
- redação de chaves de API em mensagens de erro;
- restauração do bundling Docker de Edge Functions;
- prevenção de travamentos quando endpoints de telemetria estão bloqueados;
- detecção adicional de exposição local da API pelo `db lint`;
- melhorias de geração de tipos.

## Escopo

### Incluído

- atualizar `devDependencies.supabase` para `2.110.0`;
- regenerar `package-lock.json` com a versão de Node/npm já usada pelo projeto;
- validar os comandos portados para a nova shell TypeScript;
- executar todos os gates de Supabase e regressão já existentes;
- registrar auditoria técnica e evidência final;
- integrar por PR somente após aprovação integral dos workflows.

### Excluído

- migrations novas ou alteradas;
- mudanças em schema, seeds, dados, RLS, Auth ou Edge Functions;
- `db push` ou qualquer operação destrutiva remota;
- atualização de `@supabase/supabase-js`;
- atualização de imagens Docker ou `supabase/config.toml`, salvo incompatibilidade comprovada e aprovada separadamente;
- deployment da Vercel ou alteração de Production.

## Arquitetura de execução

A mudança será feita em branch exclusiva. O lockfile será gerado em runner oficial do GitHub com Node 24 e npm, evitando edição manual. A validação será executada em stacks locais descartáveis do Supabase e em ambientes de teste já definidos pelo repositório.

O PR será tratado como atualização de infraestrutura. Nenhum código de produto será modificado. A comparação de tipos e artefatos deve demonstrar equivalência ou registrar tecnicamente qualquer diferença legítima causada pela CLI.

## Matriz de validação

### Instalação e dependências

- `npm ci` limpo;
- `npx supabase --version` igual a `2.110.0`;
- lockfile coerente e sem alterações não relacionadas;
- ausência de novas vulnerabilidades altas ou críticas;
- análise de dependências não utilizadas e referências de workflow.

### Shell e stack local

- `supabase start`;
- `supabase status`;
- `supabase stop --no-backup`;
- reinicialização após interrupção;
- recuperação de stack interrompida sem limpeza destrutiva desnecessária;
- encerramento limpo ao final dos jobs.

### Banco e migrations

- `supabase db reset --local`;
- aplicação das 25 migrations na ordem canônica;
- pgTAP integral;
- `supabase db lint --local --schema public --level warning --fail-on error`;
- comparação do schema e dos contratos canônicos;
- geração dos tipos TypeScript e comparação com `src/types/database.types.ts`.

### Auth, RLS e Edge Function

- bootstrap das identidades locais;
- verificação de fixtures;
- Auth dos cinco perfis;
- políticas RLS e isolamento por escola/perfil;
- verificação da Edge Function de gestão de contas;
- bundling da função pela CLI 2.110.0;
- nenhuma publicação remota.

### Persistência, backup e regressão

- readiness integral;
- auditoria funcional de persistência;
- backup e restauração descartáveis;
- testes unitários e de integração;
- E2E Playwright;
- cinco perfis em desktop, Android e iPhone;
- Lighthouse;
- Excel SME e artefatos gerados;
- build Vercel sem deployment Production.

## Critérios de aceitação

A atualização será aceita somente se:

1. a versão efetiva for exatamente `2.110.0`;
2. `package.json` e `package-lock.json` forem as únicas mudanças de dependência;
3. as 25 migrations forem aplicadas sem alteração;
4. pgTAP, lint, Auth, RLS e Edge Function forem aprovados;
5. os tipos gerados forem equivalentes ou qualquer diferença for explicada e coberta por teste;
6. backup e restauração forem aprovados;
7. todos os workflows obrigatórios ficarem verdes;
8. não houver nova vulnerabilidade alta ou crítica;
9. não houver alteração funcional, de dados ou de Production.

## Reversão

Se qualquer critério falhar e não houver correção estritamente relacionada à compatibilidade da CLI, a branch será descartada e o projeto permanecerá em `2.109.1`. Nenhuma alteração remota deve ser necessária para a reversão.

## Decisão de produto

A Rodada 3A de data grid permanece adiada. Esta Rodada 3B é independente e não introduz componentes visuais nem altera a experiência dos usuários.
