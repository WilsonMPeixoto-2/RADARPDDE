# RADAR PDDE — Estado atual do projeto

**Atualizado em:** 9 de agosto de 2026  
**Classe documental:** Canônico — guia de estado corrente e revalidação

## 1. Fonte de verdade

Para determinar o estado implementado, usar nesta ordem:

1. código-fonte remoto da `main` ou do SHA explicitamente analisado;
2. schema, migrations, Auth, RLS, RPCs, Edge Functions e dados efetivos do Supabase;
3. deployment efetivamente publicado na Vercel e seu SHA;
4. contrato funcional e decisões vigentes;
5. testes que representam o contrato atual;
6. documentação canônica;
7. auditorias, planos e testes históricos.

Nenhum documento ou teste antigo prevalece sobre código e ambiente atuais.

Valores mutáveis de `main`, deployment, migrations e serviços devem ser consultados diretamente no remoto. Checkpoints datados são evidência histórica, não substitutos do estado ao vivo.

## 2. Baseline funcional estabilizado

A rodada de estabilização encerrada em 9 de agosto de 2026 incorporou os PRs #166 a #170.

O último baseline funcional anterior à presente conciliação documental foi:

```text
GitHub main: 908758d92ec8407003a848ed2779814ce747a6c5
PR de fechamento: #170
Vercel Production: READY no mesmo SHA
Alias principal: radarpdde-fix.vercel.app
```

Esse SHA é âncora histórica da rodada, não um valor que deva ser presumido como HEAD futuro.

## 3. Estado executivo

O RADAR PDDE opera com Supabase Production como backend institucional canônico e frontend publicado pela Vercel.

A rodada recente consolidou:

- competência mensal global única em Dashboard, Carteira, Competências, Prontuário, Pendências e exportações;
- regras de autenticação e autorização por perfil;
- autoridade autenticada do `technical_admin` preservada mesmo durante simulação visual de perfil funcional;
- reanálise de pendências por Controlador, Assistente de Verbas Federais e administrador técnico;
- bloqueio de mutações de pendência para Gestão SME e Inventário;
- histórico de reanálise com observação e autoria;
- Gestão de Equipe ligada ao Supabase/Auth com cadastro, edição, redistribuição e desativação;
- relatórios Excel vinculados à competência global aplicável;
- UX de Pendências com contexto de unidade visível, navegação coerente e redução de rerender intermediário.

Não há, nesta data, lista conhecida de correções funcionais críticas dessa rodada aguardando implementação.

## 4. Homologação proporcional concluída

A validação de fechamento foi orientada ao uso real do produto, não à obtenção artificial de uma suíte integralmente verde.

A execução utilizada no fechamento registrou:

- 125 cenários aprovados;
- 39 cenários não aplicáveis/ignorados naquela execução;
- 1 cenário flaky que passou no retry previsto e não apresentou defeito reproduzível;
- falhas remanescentes analisadas individualmente e classificadas como contratos de teste superados ou premissas artificiais de teste.

Entre os fluxos com evidência útil estão:

- autenticação e perfis;
- navegação desktop e mobile;
- competência global;
- Dashboard e Carteira;
- Prontuário e timeline;
- pendências, envio, reanálise, contato, cancelamento e reabertura;
- bonificação, análise, consolidação e retificação;
- notas fiscais e efeitos patrimoniais;
- inventário;
- Gestão de Equipe com operações reais contra Supabase descartável;
- exportações Excel;
- busca, contexto, foco e recuperação de estado;
- importação/reconciliação nos gates já existentes.

A existência de cobertura `partial` na matriz não significa, por si só, defeito ou bloqueio do produto. Ela identifica apenas que uma prova adicional pode existir se um risco futuro concreto justificar sua execução.

## 5. Governança de testes vigente

A estratégia oficial está em `docs/reference/TEST_GOVERNANCE.md`.

Princípios obrigatórios:

- código e contrato atual precedem testes históricos;
- uma falha deve ser classificada antes de qualquer alteração;
- produto correto não é modificado para satisfazer expectativa antiga;
- testes superados devem ser atualizados, removidos ou explicitamente retirados da execução;
- reutilizar evidência válida quando o código correspondente não mudou;
- executar testes proporcionais ao risco e à superfície alterada;
- não iniciar loops sucessivos de suites integrais sem nova evidência.

## 6. Regras funcionais reconciliadas

### `technical_admin`

O administrador técnico é papel autenticado separado dos quatro perfis funcionais visíveis.

Quando simula Controlador, Assistente, SME ou Inventário:

- o recorte visual muda;
- o JWT e a identidade reais não mudam;
- a autoridade técnica real permanece;
- auditoria preserva usuário autenticado, papel real e perfil simulado.

### Assistente e reanálise

Assistente de Verbas Federais pode reanalisar pendência aguardando, assim como Controlador e `technical_admin`. Gestão SME e Inventário não executam essa mutação.

### Competência

`RadarCompetenceContext` é a fonte canônica de mês. `activeCompetenciaKey` é estado refletido/legado e não deve ser manipulado diretamente para representar mudança de competência em código novo ou em testes atuais.

### Auditoria

Não presumir ordem cronológica de uma coleção ordenada por UUID. Testes devem localizar eventos por ator, contexto, identificador ou timestamp adequado.

## 7. Experiência do usuário como critério funcional

Validação do RADAR deve considerar conjuntamente:

- visualização e legibilidade;
- encontrabilidade de ações e informações;
- clareza do contexto ativo, especialmente competência e unidade;
- execução sem perda de foco ou elemento durante interação;
- feedback de sucesso/erro;
- coerência entre o dado salvo e o dado mostrado;
- permanência da informação após releitura quando houver persistência;
- navegação e retorno contextual;
- manutenção das capacidades essenciais em mobile.

Backend correto com interface confusa não é considerado homologação suficiente.

## 8. Próxima etapa

O sistema não permanece em uma fila abstrata de “testes faltantes”. Novas rodadas devem nascer de um destes gatilhos:

1. defeito observado por usuário;
2. nova funcionalidade ou mudança de regra;
3. alteração material de Supabase/Auth/RLS/schema;
4. mudança transversal de frontend/navegação;
5. release ou auditoria expressamente solicitada;
6. UAT/uso real que revele uma necessidade concreta.

Na ausência desses gatilhos, não criar novas provas apenas para aumentar cobertura nominal.

## 9. Critério de conclusão de uma nova frente

Uma frente pode ser encerrada quando:

1. o fluxo afetado atende à regra vigente;
2. a função é encontrável e compreensível;
3. a ação real funciona;
4. os dados permanecem coerentes;
5. autorização relevante foi verificada;
6. falhas encontradas foram classificadas;
7. defeitos reais foram corrigidos;
8. não existe evidência concreta de regressão relevante ao usuário;
9. o SHA publicado é confirmado quando houver alteração de Production.

Não exigir, automaticamente, Lighthouse, backup/restauração, todos os navegadores, toda a suíte E2E ou qualquer outro gate que não tenha relação material com a mudança.

## 10. Continuidade documental

Ordem recomendada de leitura:

1. `AGENTS.md`;
2. `docs/CURRENT_STAGE.md`;
3. `docs/reference/TEST_GOVERNANCE.md`;
4. `docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md`;
5. `docs/PROJECT_CONTEXT.md`;
6. `docs/DECISION_LOG.md`;
7. `docs/reference/STATUS_DOCUMENTOS.md`;
8. arquitetura ou runbook específico da tarefa.
