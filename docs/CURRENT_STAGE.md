# RADAR PDDE — Estado atual do projeto

- **Atualizado em:** 5 de agosto de 2026
- **`main` vigente:** `2e7b18ffa4b81300cf44c96ffde9c222cf98b895`
- **Último merge:** PR nº 142 — reconciliação documental integral
- **Deployment Production:** `dpl_FZe29TXs9DXeJSLg3bQCsgrgrinW` — `READY`
- **Commit publicado:** `2e7b18ffa4b81300cf44c96ffde9c222cf98b895`
- **Projeto Vercel:** `radarpdde-fix`
- **Supabase:** `scnryinorqeucbfkioxo` — `ACTIVE_HEALTHY`
- **PostgreSQL:** `17.6.1.147`
- **Migrations em Production:** 25
- **Competência de fechamento:** `2026-12`
- **`app_config.row_version`:** 20 na última consulta reconciliada
- **Edge Function:** `team-account-management`, versão 95, `ACTIVE`, JWT obrigatório
- **Runtime Production:** `supabase-production`
- **Node.js:** `24.x`
- **Incidente funcional aberto:** nenhum incidente funcional conhecido confirmado
- **PR independente em andamento:** nº 141, rascunho, auditoria contínua de integridade dos dados
- **Branch corrente:** `feat/matriz-funcional-ponta-a-ponta-20260805`

## 1. Função deste documento

Este arquivo controla o estágio corrente, os ambientes efetivos, o que está integrado e publicado e a sequência aprovada de execução.

Antes de qualquer tarefa:

1. confirmar `main`, PRs e branch de trabalho;
2. confirmar deployment, target e SHA publicados;
3. revalidar Supabase, migrations e Edge Functions quando relevantes;
4. consultar a matriz funcional e os contratos canônicos;
5. distinguir implementado, publicado, comprovado e ainda pendente;
6. rastrear todas as camadas atravessadas pela atividade do usuário;
7. criar regressão antes de corrigir falha reproduzida;
8. manter branch e PR isolados;
9. não realizar merge ou alteração remota sem autorização expressa.

## 2. Situação executiva

O RADAR PDDE opera com frontend estático na Vercel e Supabase Production como backend canônico. Auth, PostgREST, RLS, RPCs, Edge Function e PostgreSQL participam dos fluxos operacionais.

A reconciliação documental foi concluída e integrada pelo PR nº 142. A prioridade corrente é transformar a confiabilidade funcional ponta a ponta em contrato executável e, depois, usar esse contrato para orientar smokes autenticados e provas de escrita reversíveis.

## 3. Funcionalidades publicadas e protegidas

### Núcleo operacional

- competência global de janeiro a dezembro de 2026;
- Dashboard, Carteira, Competências, Prontuário e timeline;
- pendências, tentativas, reanálise, contatos, cancelamento e reabertura;
- notas fiscais, bens, encaminhamento e inventariação;
- Gestão de Equipe com Auth, CORS, RPC e compensação;
- Gestão SME com recortes gerenciais e configurações vigentes;
- registros administrativos e autoria;
- busca global e navegação contextual;
- desktop, Android e iPhone.

### Excel SME

- uma competência mensal;
- 27 colunas A:AA;
- template, ExcelJS e manifesto protegidos;
- designação textual, bordas e cabeçalho normalizado;
- abertura aprovada no Microsoft Excel desktop;
- smoke de Production ativo.

### Garantia operacional

- monitor de Production após `push`, a cada hora e manualmente;
- validação de SHA, manifesto, shell, assets, Auth gate, bloqueio anônimo e preflight;
- incidentes automáticos abertos, atualizados e encerrados conforme o estado;
- backup e restauração em pilhas descartáveis;
- gate por perfil e viewport.

## 4. Fase corrente — matriz funcional ponta a ponta

A branch atual introduz uma fonte canônica JSON e um verificador integrado ao readiness.

### Escopo mapeado

```text
perfil
× superfície
× ação
× serviço
× repositório
× tabela/RPC/Edge Function
× autorização
× concorrência
× releitura
× compensação
× evidência
```

### Resultado atual da matriz

| Cobertura | Operações |
|---|---:|
| Comprovada | 8 |
| Parcial | 29 |
| Lacuna técnica | 1 |
| Decisão funcional pendente | 2 |
| **Total** | **40** |

### Próximas provas derivadas

| Próxima fase | Operações |
|---|---:|
| manter regressão existente | 4 |
| smoke autenticado de leitura | 6 |
| escrita controlada e reversível | 23 |
| decisão funcional expressa | 2 |
| observação contínua em Production | 5 |

### Lacuna técnica identificada

`ASSET-02 — editar campo patrimonial autorizado` usa persistência genérica, sem o mesmo RPC atômico com log e versão esperado das demais mutações patrimoniais. A matriz registra a lacuna, mas esta branch não altera a implementação.

### Decisões funcionais pendentes

`CFG-03` e `CFG-04` confirmam que cadastrar, editar e desativar programas existe no frontend e no Supabase, mas a autoridade funcional da Gestão SME deve ser decidida antes de nova expansão ou retirada.

## 5. Contratos da matriz

Fontes:

- `docs/reference/functional-contract-matrix.json`;
- `docs/reference/functional-contract-matrix/*.json`;
- `docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md` — visão gerada;
- `scripts/check-functional-contract-matrix.mjs`;
- `tests/unit/functional-contract-matrix.test.js`.

Comandos:

```bash
npm run generate:functional-matrix
npm run check:functional-matrix
npm run test:readiness
```

O verificador bloqueia:

- IDs duplicados;
- perfil ou superfície desconhecidos;
- permissões incompletas ou sobrepostas;
- arquivo ou símbolo de código ausente;
- evidência inexistente;
- cobertura declarada sem lacuna coerente;
- mutação crítica sem releitura, concorrência e compensação.

## 6. Ambientes

### GitHub

```text
main: 2e7b18ffa4b81300cf44c96ffde9c222cf98b895
branch corrente: feat/matriz-funcional-ponta-a-ponta-20260805
PR #141: aberto, rascunho, independente
```

### Vercel Production

```text
project: radarpdde-fix
deployment: dpl_FZe29TXs9DXeJSLg3bQCsgrgrinW
state: READY
target: production
commit: 2e7b18ffa4b81300cf44c96ffde9c222cf98b895
```

Deployments da branch da matriz são Preview e não alteram Production.

### Supabase Production

```text
project: scnryinorqeucbfkioxo
status: ACTIVE_HEALTHY
region: sa-east-1
PostgreSQL: 17.6.1.147
migrations: 25
closing_competence: 2026-12
```

## 7. Sequência cronológica

### Etapa A — reconciliação documental

**Concluída e integrada pelo PR nº 142.**

### Etapa B — matriz funcional

**Em execução nesta branch.** Encerrar com PR em rascunho e workflows verdes, sem merge automático.

### Etapa C — smoke autenticado de leitura

Usar contas técnicas por perfil para provar, sem mutação:

- login e sessão;
- Dashboard;
- Carteira;
- Prontuário e timeline;
- Pendências;
- busca e recortes de autorização.

### Etapa D — escrita controlada e reversível

Executar em ambiente descartável equivalente ou com registros técnicos identificados:

- criar ou alterar;
- confirmar banco e interface;
- recarregar e reler;
- provocar conflito ou falha parcial;
- desfazer;
- confirmar ausência de resíduos.

### Etapa E — decisões e correções derivadas

- decidir a autoridade da Gestão SME sobre programas;
- auditar e corrigir `ASSET-02` em PR próprio;
- concluir ou reavaliar o PR nº 141;
- executar atualizações menores isoladas.

### Etapa F — UAT e liberação

Executar jornadas reais com servidores, corrigir achados e registrar decisão formal de liberação.

## 8. Critério de conclusão funcional

Uma função crítica somente é considerada concluída quando houver prova de:

1. visibilidade correta por perfil;
2. acionamento real no navegador;
3. payload correto;
4. serviço e repositório esperados;
5. backend alcançado;
6. autorização positiva e negativa;
7. consulta ou gravação concluída;
8. interface atualizada;
9. resultado preservado após recarregar;
10. conflito tratado;
11. falha parcial compensada;
12. regressão permanente no CI.

## 9. Gates pendentes

- conclusão e integração autorizada da matriz;
- smoke autenticado recorrente;
- provas controladas de escrita e compensação;
- decisão sobre programas SME;
- correção da edição patrimonial genérica;
- decisão sobre o PR nº 141;
- homologação do relatório institucional quando priorizada;
- UAT;
- decisão formal de liberação.

## 10. Continuidade

1. `AGENTS.md`;
2. `README.md`;
3. `docs/CURRENT_STAGE.md`;
4. `docs/PROJECT_CONTEXT.md`;
5. `docs/ROADMAP_ATUALIZACOES_2026.md`;
6. `docs/DECISION_LOG.md`;
7. `docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md`;
8. `docs/reference/STATUS_DOCUMENTOS.md`.
