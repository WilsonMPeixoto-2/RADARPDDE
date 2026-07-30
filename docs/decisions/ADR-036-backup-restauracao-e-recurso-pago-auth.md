# ADR-036 — backup restaurável e recurso pago do Supabase Auth

**Estado:** aceito  
**Data:** 30 de julho de 2026

## Contexto

A lista anterior de bloqueadores incluía:

- teste de backup e restauração;
- checagem de senhas comprometidas no Supabase Auth.

O projeto utiliza o plano Free. A segunda função está disponível apenas no plano Pro ou superior, sem autorização de despesa vigente.

Também era necessário comprovar recuperabilidade sem acessar ou alterar Production, incluindo dados funcionais e identidades Auth.

## Decisão

1. A função condicionada ao plano pago não é requisito de liberação enquanto o projeto permanecer no Free e não houver autorização financeira.
2. A decisão será revista após eventual mudança de plano.
3. O projeto mantém gate automatizado de backup lógico e restauração em duas pilhas Supabase descartáveis.
4. O gate não utiliza segredo remoto, `--linked` ou Production.
5. Schema, dados públicos, `auth.users`, `auth.identities` e histórico de migrations devem apresentar fingerprints equivalentes.
6. O CI publica somente `evidence.json`; dumps SQL não são artefatos permanentes.
7. A evidência não contém e-mails, hashes de senha, tokens ou registros individuais de Auth.

## Consequências

### Positivas

- critérios de release compatíveis com o plano contratado;
- recuperabilidade lógica comprovada em todas as camadas relevantes;
- regressão automatizada;
- nenhum risco operacional para Production;
- menor exposição de dados em artefatos.

### Limites

- não há cópia automatizada do banco Production neste gate;
- retenção e armazenamento externo continuam exigindo política própria;
- recursos pagos de recuperação contínua não são simulados;
- UAT, Excel desktop, Advisors, polimento e decisão de release permanecem externos.

## Evidência

```text
GitHub Actions run: 30538395958
schema: true
data: true
auth: true
migrations: true
auth.users: 7
auth.identities: 7
```

Auditoria: `docs/audits/2026-07-30-backup-restore-disposable.md`.
