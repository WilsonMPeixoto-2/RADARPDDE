# Auditoria — Rodada 3B: Supabase CLI 2.110.0

## Identificação

- Repositório: `WilsonMPeixoto-2/RADARPDDE`
- Branch: `chore/rodada-3b-supabase-cli-2-110-0-20260802`
- Pull request: `#126`
- `main` de origem: `0718bd984ef9db4d6c52e40d43067599b4fb8a39`
- SHA funcional validado antes desta evidência: `c16c600619736391c49b3997c7e8c97f77dc6492`
- Versão anterior: `supabase@2.109.1`
- Versão instalada: `supabase@2.110.0`
- Ambiente de geração: Node.js `24.18.0` e npm `11.16.0`
- Data: 2 de agosto de 2026

## Escopo executado

A Rodada 3B atualizou exclusivamente o Supabase CLI e adaptou o teste de backup/restauração descartável à validação de caminhos introduzida pela CLI 2.110.0.

Arquivos funcionais ou de infraestrutura alterados:

- `package.json`;
- `package-lock.json`;
- `scripts/verify-supabase-backup-restore.mjs`.

Documentação criada:

- especificação técnica;
- plano de implementação;
- esta auditoria;
- evidência estruturada da atualização.

Não houve alteração em migrations, schema, seeds, dados, políticas RLS, Auth, código de Edge Functions, configuração canônica do Supabase ou configuração da Vercel.

## Instalação e lockfile

O lockfile foi regenerado pelo npm em runner oficial do GitHub com Node.js 24.18.0 e npm 11.16.0.

Validações:

- `package.json` fixa exatamente `supabase: 2.110.0`;
- `package-lock.json` fixa exatamente `node_modules/supabase: 2.110.0`;
- os oito pacotes binários oficiais por plataforma foram atualizados de 2.109.1 para 2.110.0;
- `npx supabase --version` retornou `2.110.0`;
- `@supabase/supabase-js` permaneceu em `2.110.8`;
- nenhum outro pacote foi atualizado intencionalmente;
- auditoria npm: 2 vulnerabilidades moderadas, 0 altas e 0 críticas;
- workflow de saúde das dependências aprovado.

Hashes do artefato gerado:

- `package.json`: `0b6ef521dbbf970a29a4c68f5032e68138653ad5c78d4e00ca0912e3d5d5cabb`;
- `package-lock.json`: `8095099916654341a477c958915e2b19457814894fd5cdd4c348271de01da0a8`;
- artefato GitHub Actions: `sha256:a3134d05080e01b1e3cc6e64baa36972c864e31376e2863b4cc786c2ff64f6a5`.

## Compatibilidade identificada e corrigida

A primeira execução do gate de backup/restauração chegou a gerar corretamente os backups da pilha de origem, mas a inicialização da segunda pilha descartável falhou com:

```text
failed to read file: open supabase/functions/team-account-management/index.ts: no such file or directory
```

A CLI 2.110.0 passou a validar o caminho da Edge Function declarado em `supabase/config.toml` durante a inicialização da segunda pilha. O helper do teste copiava a configuração, mas não copiava a estrutura de funções para o diretório temporário.

A correção foi restrita a `scripts/verify-supabase-backup-restore.mjs`:

```js
await cp(path.join(ROOT, 'supabase/functions'), path.join(supabaseDir, 'functions'), {
  recursive: true
});
```

Essa adaptação copia as funções existentes para o workdir descartável. Ela não modifica o código da função, não publica funções e não altera qualquer ambiente remoto.

Após a correção, o gate comprovou:

- criação dos backups de papéis, schema, dados e histórico de migrations;
- inicialização da segunda pilha descartável;
- restauração lógica completa;
- equivalência de fingerprints de schema, dados, Auth e migrations;
- publicação de evidência sanitizada;
- encerramento limpo das duas pilhas.

## Validação do Supabase local

O workflow de readiness aprovou:

- instalação reproduzível;
- `supabase start` e `supabase status`;
- `supabase db reset --local`;
- aplicação das 25 migrations na ordem canônica;
- contratos operacionais do preflight;
- testes pgTAP;
- lint de PL/pgSQL;
- geração reproduzível dos tipos e do cliente fixado;
- sete identidades Auth descartáveis;
- autenticação das identidades;
- autorização da Edge Function de gestão de contas;
- integração frontend, Auth e RLS na pilha local;
- encerramento limpo da pilha.

## Workflows definitivos aprovados

Todos os workflows abaixo foram aprovados no SHA limpo `c16c600619736391c49b3997c7e8c97f77dc6492`:

| Workflow | Run | Resultado |
|---|---:|---|
| Saúde das dependências | `30771809102` | aprovado |
| Homologação do Excel SME | `30771809133` | aprovado |
| Lighthouse CI | `30771809106` | aprovado |
| Supabase readiness | `30771809104` | aprovado |
| Backup e restauração descartáveis | `30771809127` | aprovado |
| Gate remoto de perfis e viewports | `30771809159` | aprovado |
| Testes E2E Playwright | `30771809124` | aprovado |

A matriz de perfis e viewports cobriu os cinco perfis do RADAR em desktop, Android e iPhone.

## Proteções preservadas

Durante toda a execução:

- não foi executado `db push`;
- nenhuma migration foi aplicada remotamente;
- nenhum dado real foi lido, escrito ou alterado;
- nenhuma configuração de Auth ou RLS de Production foi modificada;
- nenhuma Edge Function foi publicada;
- nenhum deployment da Vercel Production foi solicitado;
- `git.deploymentEnabled` permaneceu `false`;
- os workflows temporários utilizados para geração controlada foram removidos antes da revisão final.

## Observação sobre versões posteriores

Durante os testes, a CLI informou a disponibilidade da versão 2.111.0. Ela não foi incorporada porque a versão aprovada e submetida à análise completa desta rodada é exatamente a 2.110.0. Qualquer atualização posterior deverá ser tratada em escopo independente e novamente validada.

## Conclusão

A atualização para o Supabase CLI 2.110.0 é compatível com o RADAR PDDE após a adaptação mínima do workdir descartável de restauração. Os contratos de banco, segurança, persistência, exportação, desempenho e experiência dos cinco perfis permaneceram aprovados. A atualização está apta à integração, condicionada à repetição final dos workflows sobre o commit que adiciona esta auditoria e a evidência estruturada.
