# RADAR PDDE — Estado atual do projeto

- **Atualizado em:** 5 de agosto de 2026
- **`main` vigente:** `f812e5dbf3aaa18fb9851948445b0820ac7a5435`
- **Deployment Production:** `dpl_7G3Wmh1YiV4c4aXVwe2P5tN7N7Y4` — `READY`
- **Commit publicado:** `f812e5dbf3aaa18fb9851948445b0820ac7a5435`
- **Projeto Vercel:** `radarpdde-fix`
- **Supabase:** `scnryinorqeucbfkioxo` — `ACTIVE_HEALTHY`
- **PostgreSQL:** `17.6.1.147`
- **Migrations em Production:** 25
- **Competência de fechamento:** `2026-12`
- **`app_config.row_version`:** 20
- **Edge Function:** `team-account-management`, versão 95, `ACTIVE`, JWT obrigatório
- **Runtime Production:** `supabase-production`
- **Node.js:** `24.x`
- **Deployment automático:** controlado por configuração do repositório e monitorado após `push` na `main`
- **Incidente funcional aberto:** nenhum incidente funcional conhecido confirmado nesta data de corte
- **PR funcional em andamento:** nº 141, rascunho, auditoria contínua de integridade dos dados

## 1. Função deste documento

Este arquivo controla o estágio corrente, o que está efetivamente integrado e publicado, as frentes ainda abertas e a ordem de execução recomendada.

Antes de iniciar qualquer tarefa:

1. conferir a `main` remota e os PRs abertos;
2. confirmar deployment, target e SHA publicados;
3. confirmar Supabase, migrations, Edge Functions e dados mutáveis quando relevantes;
4. verificar a documentação canônica e as decisões vigentes;
5. distinguir recurso implementado, publicado, comprovado e ainda pendente;
6. identificar todas as camadas atravessadas pela ação do usuário;
7. criar regressão antes de corrigir falha reproduzida;
8. manter branch e PR isolados;
9. não realizar merge ou alteração de Production sem autorização expressa.

Código e ambientes efetivos prevalecem sobre memória de chat, planos ou evidências antigas.

## 2. Situação executiva

O RADAR PDDE opera com frontend estático na Vercel e Supabase Production como backend canônico. Auth, PostgREST, RLS, RPCs, Edge Function e PostgreSQL participam dos fluxos operacionais.

O sistema possui ampla cobertura automatizada, mas os erros recentes demonstraram que uma função visualmente presente pode falhar em outra camada:

- o Excel SME existia, porém o template não estava corretamente servido no deployment e o runtime possuía fragilidades de recuperação;
- a Gestão de Equipe existia, porém o preflight CORS falhava antes de a ação alcançar a Edge Function, e vínculos Auth históricos exigiam reconciliação.

A prioridade atual é transformar a confiabilidade ponta a ponta em contrato permanente por perfil, tela e operação.

## 3. Funcionalidades publicadas

### 3.1 Núcleo operacional

- competência global de janeiro a dezembro de 2026;
- avaliação mensal por escola, competência e programa;
- dashboards por perfil;
- Carteira, Competências, Prontuário e timeline;
- pendências, tentativas, contatos, reanálise, cancelamento e reabertura;
- notas fiscais e bens vinculados;
- encaminhamento e inventariação;
- registros administrativos e autoria;
- busca inteligente;
- navegação contextual;
- desktop, Android e iPhone.

### 3.2 Gestão SME

A governança de acesso está integrada e publicada. O perfil possui consulta gerencial e configurações autorizadas, com restrições cumulativas sobre análise técnica, pendências operacionais e logs de terceiros.

As configurações de programas precisam ser confirmadas como regra de produto antes de nova alteração, pois sua implementação atual existe no frontend e no Supabase, mas havia decisão anterior de tratar essa frente separadamente.

### 3.3 Excel SME

Estado final publicado após os PRs nº 136 e 137:

- botão disponível nas superfícies autorizadas, inclusive dashboard da Assistente;
- competência mensal resolvida de forma estrita;
- carregamento resiliente do motor e do template;
- manifesto de assets e hashes;
- arquivo de 27 colunas A:AA;
- remoção exclusiva das posições-fonte K, R e Y;
- designação textual `XX.XX.XXX`;
- bordas completas;
- cabeçalho centralizado e normalizado;
- filtro, impressão e congelamento preservados;
- abertura aprovada no Microsoft Excel desktop.

Não existe incidente 404 conhecido no deployment vigente.

### 3.4 Gestão de Equipe

Estado final publicado após o PR nº 138:

- CORS compartilhado e fail-closed;
- origens institucionais canônicas aceitas;
- origem indevida rejeitada;
- JWT obrigatório;
- papel da Assistente validado;
- cadastro, edição e desativação de Controladores e Inventário;
- Auth Admin restrito ao backend;
- RPC transacional;
- recuperação segura de vínculos históricos;
- redistribuição individual e em lote;
- compensação de falhas parciais;
- smoke independente do preflight em Production.

## 4. Garantia operacional contínua

### Fase 1 — monitor geral de Production

Integrada pelo PR nº 139.

O workflow `.github/workflows/production-system-smoke.yml` valida:

- commit esperado e commit publicado;
- `radar-build-manifest.json`;
- ambiente e modo de dados;
- tela pública e gate de autenticação;
- assets locais referenciados;
- bloqueio de leitura anônima do Supabase;
- preflight das Edge Functions catalogadas;
- execução após `push` na `main`, a cada hora e manualmente.

### Fase 2 — incidentes automáticos

Integrada pelo PR nº 140.

- falha confirmada abre ou atualiza uma única issue automática;
- falhas recorrentes atualizam o mesmo incidente;
- recuperação confirmada registra comentário e encerra o incidente;
- issues humanas e pull requests não são alterados;
- falha do mecanismo de alerta não mascara o resultado do monitor.

### Fase 3 — integridade de dados

PR nº 141, ainda em rascunho.

Escopo proposto:

- identidades e perfis;
- diretórios de equipe;
- escolas e carteiras;
- programas escolares;
- pendências;
- inventário;
- notas fiscais e bens vinculados.

Enquanto não for integrado, os 25 migrations de Production permanecem a referência. A migration e os 26 migrations presentes na branch do PR nº 141 não pertencem à `main` nem a Production.

## 5. Ambientes

### GitHub

```text
main: f812e5dbf3aaa18fb9851948445b0820ac7a5435
PR #141: aberto, rascunho, não integrado
branch documental atual: docs/reconciliacao-integral-20260805
```

### Vercel Production

```text
project: radarpdde-fix
deployment: dpl_7G3Wmh1YiV4c4aXVwe2P5tN7N7Y4
state: READY
target: production
commit: f812e5dbf3aaa18fb9851948445b0820ac7a5435
```

Deployments de Preview do PR nº 141 não alteram o alias oficial de Production.

### Supabase Production

```text
project: scnryinorqeucbfkioxo
status: ACTIVE_HEALTHY
region: sa-east-1
PostgreSQL: 17.6.1.147
migrations: 25
closing_competence: 2026-12
app_config.row_version: 20
```

### Edge Function

```text
slug: team-account-management
status: ACTIVE
version: 95
verify_jwt: true
```

## 6. Ferramentas e manutenção

Versões integradas na `main`:

| Ferramenta | Versão |
|---|---:|
| Node.js | `24.x` |
| Playwright | `1.62.0` |
| Supabase JS | `2.110.8` |
| Supabase CLI | `2.110.0` |
| ESLint | `10.8.0` |
| eslint-plugin-playwright | `2.10.5` |
| Knip | `6.29.0` |
| ExcelJS | `4.4.0` |

PRs Dependabot abertos indicam atualizações pequenas para Playwright 1.62.1, eslint-plugin-playwright 2.11.0, Knip 6.30.0 e Supabase JS/CLI 2.111.0. Nenhuma deve ser integrada automaticamente. A atualização de Supabase exige repetir Auth, RLS, Edge Functions, migrations, backup/restauração e fluxos funcionais.

## 7. Prioridade corrente

### Etapa A — reconciliação documental

Em execução nesta branch. Deve concluir:

- estado executivo;
- cronologia dos PRs nº 136 a 141;
- contratos de Excel e Gestão de Equipe;
- baseline de Vercel e Supabase;
- roadmap de confiabilidade funcional;
- matriz de validade documental.

### Etapa B — matriz funcional ponta a ponta

Criar catálogo por perfil, tela e ação com:

```text
controle
→ handler
→ serviço
→ repositório
→ tabela/RPC/Edge Function
→ política RLS
→ retorno
→ renderização
→ releitura
→ erro e compensação
```

### Etapa C — smoke autenticado de leitura

Usar contas técnicas por perfil para provar consultas reais em Production sem mutação.

### Etapa D — provas controladas de escrita

Usar ambiente descartável equivalente ou registros técnicos reversíveis para confirmar:

- criar;
- editar;
- desativar ou excluir logicamente;
- recarregar;
- confirmar persistência;
- desfazer;
- confirmar ausência de resíduos;
- testar compensação.

### Etapa E — integridade e manutenção

- concluir ou reavaliar o PR nº 141;
- executar atualizações menores em PRs isolados;
- repetir todos os gates aplicáveis.

## 8. Critério de conclusão de uma função crítica

Uma função não está concluída apenas porque o botão existe ou o teste unitário passou. É necessário comprovar:

1. visibilidade correta por perfil;
2. acionamento real no navegador;
3. payload correto;
4. serviço e repositório corretos;
5. backend alcançado;
6. autorização positiva e negativa;
7. persistência ou consulta concluída;
8. atualização da interface;
9. manutenção do resultado após recarregar;
10. erro compreensível;
11. ausência de estado parcial após falha;
12. regressão permanente no CI.

## 9. Gates gerais ainda pendentes

- matriz funcional integral por perfil;
- smoke autenticado recorrente;
- provas controladas de escrita e compensação;
- conclusão ou decisão sobre o PR nº 141;
- homologação do relatório institucional no Excel desktop, caso priorizada;
- UAT com servidores reais;
- polimento editorial e visual;
- decisão formal de liberação.

## 10. Documentos de continuidade

1. `AGENTS.md`;
2. `README.md`;
3. `docs/CURRENT_STAGE.md`;
4. `docs/PROJECT_CONTEXT.md`;
5. `docs/ROADMAP_ATUALIZACOES_2026.md`;
6. `docs/DECISION_LOG.md`;
7. `docs/reference/STATUS_DOCUMENTOS.md`;
8. `docs/audits/2026-08-05-reconciliacao-documental-integral.md`.
