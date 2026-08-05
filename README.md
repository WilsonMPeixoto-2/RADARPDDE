# RADAR PDDE 2026

Sistema institucional de acompanhamento operacional do PDDE da 4ª CRE/SME-Rio. O produto organiza competência mensal, carteira de unidades, prontuário, análise documental, pendências, contatos, notas fiscais, inventário, gestão da equipe, acompanhamento gerencial e exportações.

> **Estado em 5 de agosto de 2026:** `main`, Vercel Production e Supabase Production estão conectados e operacionais. As correções recentes do Excel SME e da Gestão de Equipe estão publicadas. A prioridade atual é ampliar a garantia funcional ponta a ponta para impedir que ações visíveis deixem de alcançar o backend ou concluam apenas parte do fluxo.

## Baseline remoto

```text
GitHub main: f812e5dbf3aaa18fb9851948445b0820ac7a5435
Vercel Production: dpl_7G3Wmh1YiV4c4aXVwe2P5tN7N7Y4 — READY
Commit publicado: f812e5dbf3aaa18fb9851948445b0820ac7a5435
Supabase: scnryinorqeucbfkioxo — ACTIVE_HEALTHY
PostgreSQL: 17.6.1.147
Migrations aplicadas em Production: 25
Competência de fechamento: 2026-12
app_config.row_version: 20
Edge Function team-account-management: ACTIVE, versão 95, JWT obrigatório
Node.js: 24.x
```

Informações mutáveis devem ser confirmadas novamente antes de qualquer ação dependente do ambiente atual.

## Funcionalidades publicadas

### Operação do PDDE

- competência global de janeiro a dezembro de 2026;
- avaliação mensal por escola, competência e programa;
- dashboard, carteira, competências, prontuário e timeline;
- pendências documentais e manuais com tentativas, reanálise, contatos, cancelamento e reabertura;
- notas fiscais, bens permanentes, encaminhamento e inventariação;
- registros administrativos e autoria;
- busca inteligente, navegação contextual, elementos flutuantes responsivos e transições progressivas.

### Perfis

- **Controlador:** carteira principal e colaboração autorizada na própria CRE;
- **Assistente de Verbas Federais:** acompanhamento transversal, operação e gestão da equipe da CRE;
- **Gestão SME:** consulta gerencial e configurações autorizadas, com restrições operacionais cumulativas;
- **Equipe de Inventário:** fluxo patrimonial autorizado na própria CRE;
- **Administrador técnico:** infraestrutura, perfis, escopos, importação, auditoria e homologação técnica.

`technical_admin` é papel técnico, não um quinto perfil funcional de uso cotidiano.

## Correções funcionais recentes

### Excel SME

Os PRs nº 136 e 137 corrigiram o fluxo completo e o arquivo final:

- runtime resiliente, timeout, retry e mensagens por tipo de falha;
- template e ExcelJS identificados por manifesto, tamanho e SHA-256;
- dois botões de exportação no dashboard da Assistente;
- arquivo mensal com **27 colunas, de A até AA**;
- remoção exclusiva das posições-fonte K, R e Y, denominadas `SISTEMÁTICA PREENCHIDA`;
- preservação dos campos administrativos posteriores;
- designação textual no padrão `XX.XX.XXX`;
- bordas completas;
- cabeçalho centralizado, com quebra automática e sem espaçamento artificial;
- abertura homologada no Microsoft Excel desktop sem solicitação de reparo.

O template-fonte permanece com 30 colunas e é projetado de forma determinística para o contrato público de 27 colunas.

### Gestão de Equipe

O PR nº 138 corrigiu o ciclo integral de Controladores e Inventário:

- preflight CORS das origens institucionais;
- autenticação JWT e validação do papel da Assistente;
- cadastro, edição e desativação de integrantes;
- criação, convite, alteração e bloqueio de contas Auth;
- recuperação segura de vínculos históricos por `user_profiles`;
- redistribuição individual e em lote das carteiras;
- compensação quando uma etapa posterior falha;
- homologação com Supabase, Auth, RLS e Edge Function reais.

## Garantia operacional contínua

Os PRs nº 139 e 140 adicionaram uma camada permanente de verificação de Production:

- validação do commit realmente publicado;
- validação do manifesto, shell e assets locais;
- confirmação do gate de autenticação;
- prova de bloqueio do acesso anônimo ao Supabase;
- preflight das Edge Functions catalogadas;
- execução após `push` na `main`, a cada hora e manualmente;
- criação ou atualização de incidente automático quando o monitor falha;
- encerramento do incidente após recuperação confirmada.

O PR nº 141 permanece **aberto em rascunho**. Ele propõe auditoria agregada de integridade dos dados e não integra a `main` nem Production.

## Arquitetura operacional

```text
interface estática
→ domínio e serviços de aplicação
→ contrato único de repositório
→ SupabaseRepository
→ Auth + PostgREST + RLS + RPC + Edge Function
→ PostgreSQL 17
```

| Ambiente | Persistência | Uso |
|---|---|---|
| Local e CI | Supabase descartável ou LocalStorage controlado | desenvolvimento, regressão, backup/restauração e contingência |
| Preview | Supabase autorizado e artefato de Preview | homologação anterior à Production |
| Production | Supabase Production canônico | operação institucional |

`LocalStorageRepository` não sincroniza automaticamente com o Supabase. Seu uso em contingência exige novo build controlado.

## Critério de confiança funcional

Uma função crítica somente deve ser considerada pronta quando houver evidência de todo o percurso:

```text
controle visível
→ evento do usuário
→ serviço de aplicação
→ repositório
→ tabela, RPC ou Edge Function
→ Auth e RLS
→ gravação ou consulta
→ retorno ao frontend
→ nova renderização
→ releitura após recarregar
→ tratamento da falha e compensação
```

A próxima fase do projeto deve expandir essa prova para cada perfil, tela e mutação relevante.

## Exportações

### Relatório institucional

- histórico multicompetência;
- abas `BONIFICACOES`, `SINTESE`, `QUALIDADE_DADOS` e `METADADOS`;
- equivalência lógica com o CSV;
- CSV preservado como fallback.

### Excel SME

- uma competência mensal;
- uma aba;
- 27 colunas A:AA;
- template visual canônico e dados atuais do RADAR;
- ausência deliberada de `dataValidations` incompatíveis;
- certificação OOXML, reabertura pelo ExcelJS e homologação no Excel desktop.

## Ferramentas e versões

```text
@playwright/test: 1.62.0
@supabase/supabase-js: 2.110.8
Supabase CLI: 2.110.0
ESLint: 10.8.0
eslint-plugin-playwright: 2.10.5
Knip: 6.29.0
ExcelJS: 4.4.0
```

Atualizações menores abertas serão avaliadas em PRs próprios depois da reconciliação documental e da definição da matriz funcional.

## Desenvolvimento e verificação

```bash
npm ci
npm run test:readiness
npm run test:e2e
npm run test:mobile
```

Supabase descartável:

```bash
npm run supabase:start
npm run supabase:reset
npm run supabase:test:db
npm run supabase:lint:db
```

Backup e restauração:

```bash
RADAR_ALLOW_DISPOSABLE_BACKUP_RESTORE=true npm run test:backup-restore
```

## Fontes de verdade e continuidade

1. [`AGENTS.md`](AGENTS.md);
2. [`docs/CURRENT_STAGE.md`](docs/CURRENT_STAGE.md);
3. [`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md);
4. [`docs/ROADMAP_ATUALIZACOES_2026.md`](docs/ROADMAP_ATUALIZACOES_2026.md);
5. [`docs/DECISION_LOG.md`](docs/DECISION_LOG.md);
6. [`docs/reference/STATUS_DOCUMENTOS.md`](docs/reference/STATUS_DOCUMENTOS.md);
7. código, migrations e contratos executáveis da `main`;
8. estado efetivo do GitHub, Vercel e Supabase.

Baseline da reconciliação: [`docs/audits/2026-08-05-reconciliacao-documental-integral.md`](docs/audits/2026-08-05-reconciliacao-documental-integral.md).

## Próxima sequência

1. concluir e revisar esta reconciliação documental;
2. construir matriz funcional completa por perfil, tela e ação;
3. ampliar smokes autenticados de leitura;
4. criar provas controladas de escrita, releitura, rollback e compensação;
5. concluir ou reavaliar o PR nº 141;
6. executar atualizações menores de dependências em escopo isolado;
7. realizar UAT e decisão formal de liberação.

Nenhum merge ou deployment é autorizado apenas porque uma documentação ou PR ficou tecnicamente pronto.