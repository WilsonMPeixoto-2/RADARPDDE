# RADAR PDDE — saneamento de dependências e governança automática

**Data:** 2 de setembro de 2026  
**Classe documental:** Canônico — manutenção de dependências

## Decisões aplicadas

- ESLint atualizado de `10.8.1` para `10.9.1`.
- Knip atualizado de `6.32.2` para `6.33.0`.
- TypeScript permanece em `7.0.2`: versão estável homologada e usada pelo typecheck dos tipos gerados do banco.
- Supabase CLI permanece em `2.114.0`: a tentativa com `2.116.0` falhou em duas garantias pgTAP/RLS de `service_role`; a versão `2.116.0` fica bloqueada explicitamente no Dependabot para não ser reaberta. O bloqueio é exato e não impede que uma futura `2.116.1`, `2.117.x` ou posterior seja proposta e homologada novamente.
- `@types/node` permanece na linha 24 enquanto o runtime declarado for Node `24.x`. Dependabot passa a ignorar atualizações major dessa dependência.
- Os scripts `format` e `format:check` agora possuem alvo explícito (`.`) e deixam de depender de invocação incompleta do Prettier.
- Labels inexistentes foram removidos do `.github/dependabot.yml`, eliminando o erro automático que acompanhava os PRs.
- Previews Vercel passam a ser ignorados para branches `dependabot/*`, evitando consumo de quota por propostas automáticas ainda não homologadas. Branches humanas e `main` continuam com deployment habilitado.

## Regra operacional

PR de Dependabot é proposta, não estado desejado. A decisão deve considerar:

1. versão realmente instalada na `main`;
2. release estável atual;
3. relação da mudança com o código e os gates do RADAR;
4. resultado dos testes de domínio, integração, Supabase/RLS, segurança e build;
5. encerramento explícito: merge, rejeição documentada ou substituição.

Falha de infraestrutura externa pode justificar nova execução. Falha de contrato funcional, RLS ou persistência bloqueia a atualização até investigação.

## PRs automáticos existentes

- Knip `6.33.0`: substituído pela manutenção consciente desta rodada.
- ESLint `10.9.1`: substituído pela manutenção consciente desta rodada.
- `@types/node` 26.x: rejeitado enquanto o runtime permanecer Node 24.
- Supabase CLI `2.116.0`: rejeitado pelo resultado pgTAP/RLS observado e bloqueado explicitamente para impedir reabertura automática da mesma versão.

Nenhuma dessas decisões exige migration, alteração de schema ou mudança funcional da aplicação.
