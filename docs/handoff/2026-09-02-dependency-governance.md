# RADAR PDDE — saneamento de dependências e governança automática

**Data-base:** 2 de setembro de 2026  
**Atualizado em:** 14 de setembro de 2026  
**Classe documental:** Canônico — manutenção de dependências

## Estado homologado atual

A manutenção consciente de 14/09/2026 consultou diretamente o registro npm no runner Node 24 e não reutilizou versões de PRs antigos do Dependabot como fonte de verdade.

Versões atualizadas e homologáveis nesta rodada:

- `@playwright/test`: `1.62.1` → `1.63.0`;
- `@supabase/supabase-js`: `2.112.4` → `2.116.0`;
- `@types/node`: `24.13.3` → `24.13.4`, preservando a linha compatível com Node `24.x`;
- `fast-check`: `4.9.0` → `4.10.0`;
- `knip`: `6.33.0` → `6.35.1`;
- `dependency-cruiser`: `18.2.0` → `18.3.0`;
- `eslint`: `10.9.1` → `10.10.0`.

O `npm outdated` executado após essas atualizações deixou somente duas situações deliberadas:

- `@types/node` possui major mais nova, mas permanece na linha 24 enquanto o runtime declarado for Node `24.x`;
- Supabase CLI possui `2.117.0` como versão mais nova observada, mas permanece em `2.114.0` porque a `2.117.0` repetiu a regressão de RLS já observada na `2.116.0`.

## Supabase CLI — decisão de compatibilidade

A tentativa anterior com Supabase CLI `2.116.0` falhou em duas garantias pgTAP/RLS de `service_role`. Em 14/09/2026, a versão `2.117.0` foi testada novamente em pilha Supabase local descartável com a suíte completa de banco.

Resultado da `2.117.0`:

- 31 arquivos pgTAP executados;
- 440 testes executados;
- 438 aprovados;
- 2 falharam, exatamente em `rls.test.sql`:
  - teste 32: `service_role não remove perfis pelo bootstrap`;
  - teste 33: `service_role não remove escopos pelo bootstrap`.

Portanto:

- Supabase CLI homologado continua em `2.114.0`;
- `2.116.0` e `2.117.0` ficam bloqueados explicitamente e de forma exata no Dependabot;
- versões posteriores continuam elegíveis para nova homologação;
- os testes de RLS não devem ser enfraquecidos para acomodar uma atualização da CLI.

## Decisões anteriores preservadas

- TypeScript permanece em `7.0.2`, versão estável homologada e usada pelo typecheck dos tipos gerados do banco.
- Os scripts `format` e `format:check` possuem alvo explícito (`.`) e não dependem de invocação incompleta do Prettier.
- Labels inexistentes foram removidos do `.github/dependabot.yml`.
- Previews Vercel permanecem ignorados para branches `dependabot/*`, evitando consumo de quota por propostas automáticas ainda não homologadas. Branches humanas e `main` continuam com deployment habilitado.
- O override transitivo de `fast-uri` permanece em `^3.1.6`, evitando salto indevido para a major 4 e preservando a linha compatível com Ajv.
- `qs` transitivo permanece fixado em `^6.16.0` dentro do intervalo aceito pelo dependente.

## Segurança de dependências

Na manutenção de 14/09/2026, `npm audit` reportou 2 vulnerabilidades moderadas, 0 altas e 0 críticas. Elas permanecem restritas ao encadeamento transitivo conhecido `exceljs` → `uuid`, já tratado pela política `check-exceljs-audit-policy.mjs`. Não foi introduzido advisory novo pela atualização desta rodada.

## Regra operacional

PR de Dependabot é proposta, não estado desejado. A decisão deve considerar, nesta ordem prática:

1. versão realmente instalada na `main`;
2. versão publicada atualmente no registro oficial;
3. compatibilidade com o runtime e com as decisões arquiteturais do RADAR;
4. resultado dos testes de domínio, integração, Supabase/RLS, segurança, arquitetura e build;
5. encerramento explícito: merge, rejeição documentada ou substituição.

Falha de infraestrutura externa pode justificar nova execução. Falha de contrato funcional, RLS ou persistência bloqueia a atualização até investigação.

Ao atualizar dependências, consultar o registro atual durante a própria rodada. PR antigo do Dependabot, documentação histórica ou pesquisa web desatualizada não substituem `npm outdated`/resolução atual do pacote.

## PRs automáticos antigos

PRs automáticos anteriores de Knip e Supabase tooling são considerados substituídos pela manutenção consciente de 14/09/2026. Eles não devem ser usados para inferir a versão mais recente disponível.

Nenhuma das atualizações homologadas desta rodada exige migration, alteração de schema ou mudança de regra de negócio da aplicação.
