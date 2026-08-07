# RADAR PDDE — Estado atual do projeto

**Atualizado em:** 7 de agosto de 2026  
**Classe documental:** Canônico — guia de estado corrente e revalidação

> Este documento descreve o estado corrente, as prioridades e como revalidar o ambiente. Valores que podem mudar em consequência da própria atualização documental, especialmente SHA da `main`, deployment e versão de Edge Function, não são congelados aqui como “estado atual”. Eles devem ser consultados diretamente no GitHub, Vercel e Supabase. Snapshots exatos ficam em checkpoints históricos datados.

## 1. Hierarquia das fontes

Para determinar o estado implementado, usar nesta ordem:

1. código-fonte remoto da `main` ou do SHA explicitamente analisado;
2. schema, migrations, Auth, RLS, funções, dados e logs efetivos do Supabase autorizado;
3. deployment efetivamente publicado na Vercel e seu SHA;
4. testes, workflows e evidências reproduzíveis do mesmo código;
5. decisões funcionais vigentes;
6. documentação canônica;
7. documentos históricos, planos, auditorias datadas e memória de conversa.

Nenhum documento prevalece sobre código ou ambiente real.

## 2. Estado remoto e checkpoint verificável

A fonte canônica para valores operacionais mutáveis é o ambiente remoto correspondente:

- GitHub: branch `main` e SHA efetivamente consultado;
- Vercel: deployment Production associado ao SHA vigente;
- Supabase: projeto `scnryinorqeucbfkioxo`, migrations aplicadas, configuração, integridade e Edge Functions efetivas.

Não registrar aqui como “atual” o SHA da própria `main`, o deployment decorrente desse SHA ou a versão numérica da Edge Function, porque um commit meramente documental pode alterar esses valores e invalidar o documento no instante do merge.

O último snapshot exato verificado antes deste fechamento está preservado em `docs/audits/2026-08-07-checkpoint-pos-pr163.md`. Esse arquivo é evidência histórica e não pretende acompanhar mudanças futuras.

Contratos estáveis confirmados no fechamento:

```text
GitHub repository: WilsonMPeixoto-2/RADARPDDE
Última reconciliação documental integrada: PR #163
Último baseline funcional anterior à reconciliação: PR #162

Vercel project: radarpdde-fix
Vercel project id: prj_GfXuUuO3dF2jykpp9QgyqIDsxg4U
Alias principal: radarpdde-fix.vercel.app

Supabase project: scnryinorqeucbfkioxo — RADAR PDDE 2026
Região: sa-east-1
PostgreSQL: 17.6.1.147
Migrations aplicadas no checkpoint: 30
Última migration no checkpoint: 202608060003_school_institutional_identity
closing_competence no checkpoint: 2026-12
app_config.row_version no checkpoint: 20
production_integrity_check() no checkpoint: healthy / totalIssues = 0 / schemaVersion = 1

Node.js: 24.x
@supabase/supabase-js: 2.110.9
Supabase CLI: 2.110.0
@playwright/test: 1.62.0
ExcelJS: 4.4.0
```

Antes de qualquer tarefa que dependa desses valores, revalidar o remoto. O checkpoint pós-PR #163 confirmou Vercel Production `READY`, ausência de erros de runtime no intervalo consultado e Supabase `ACTIVE_HEALTHY`.

## 3. Estado executivo

O RADAR PDDE opera com Supabase Production como backend institucional canônico e frontend publicado pela Vercel. Permanecem implementados:

- competência global, Dashboard, Carteira, Competências, Prontuário, timeline e Pendências;
- verificações de bonificação e análise técnica;
- notas fiscais e efeitos patrimoniais;
- bens, encaminhamento e inventariação;
- Gestão de Equipe com Auth Admin protegido, RPCs, CORS, compensação e histórico;
- Gestão SME e configurações atualmente autorizadas;
- registros administrativos e trilha técnica;
- Excel SME mensal de 27 colunas homologado no Excel desktop;
- relatório institucional e CSV de contingência;
- monitor geral de Production, incidentes automáticos e auditoria agregada de vinte invariantes;
- backup/restauração descartáveis;
- gate por perfil e viewport;
- matriz funcional executável de 41 operações;
- infraestrutura de smoke autenticado somente leitura em Production, integrada mas deliberadamente desativada até provisionamento específico.

Não há evidência atual de incidente sistêmico de Production.

## 4. Correções recentes incorporadas ao baseline

### PR #150 — transição entre perfis da equipe

Corrigiu a reutilização segura de conta Auth em transições autorizadas, preservando um único perfil ativo, histórico inativo, compensação e mensagens funcionais de conflito.

### PR #154 — autorização da carteira escolar

O Controlador pode editar dados cadastrais autorizados, mas não pode redistribuir `schools.controller_id`. Redistribuição permanece função da Assistente de Verbas Federais e do administrador técnico, com proteção em interface, serviço e banco.

### PR #157 e #160 — exercícios e bootstrap de competências

A criação de novo exercício envia apenas as doze competências correspondentes e o estado remoto é sincronizado antes do primeiro render. A criação usa versão esperada e contrato mensal estrito.

### PR #161 — bloqueio recorrente da Gestão de Equipe

Foi removida a dependência de varredura global `listUsers`. O backend usa `resolve_team_auth_user_id_by_email`, restrita a `service_role`, seguido de lookup exato da conta. Registros Auth legados incompatíveis e resíduos sintéticos conhecidos foram reconciliados pela migration `202608060001_team_auth_legacy_repair`.

### PR #162 — remediação funcional integral

Corrigiu os achados confirmados da auditoria:

- `SCH-01`: identidade institucional de escola deixou de ser sintetizada; novas escolas exigem identificação informada e o banco impede vazios e duplicidades normalizadas de INEP, CNPJ e SICI;
- `CFG-02`: criação de exercício exige `row_version`, janeiro a dezembro e conflito otimista;
- `INV-01`: desvinculação/troca do bem derivado de nota permanente elimina o vínculo antigo na mesma transação protegida;
- `ASSET-02`: edição rápida patrimonial ficou restrita ao campo permitido, com `saveAssetWithLog`, versão esperada e log administrativo;
- `PEND-02`: `pendency_attempts` é sincronizada com o agregado de tentativas e o histórico existente foi reconciliado de forma idempotente;
- `EXP-01` e `EXP-02`: auditoria pelo `AuditService` tornou-se obrigatória antes do download e o log legado duplicado foi neutralizado.

As migrations `202608060002_functional_integrity_remediation` e `202608060003_school_institutional_identity` estão efetivamente aplicadas em Production.

### PR #163 — reconciliação documental e dos contratos executáveis

Reconciliou documentação canônica, matriz funcional, fixtures, sentinelas de CI e tipos gerados com o schema efetivo de 30 migrations. A matriz ficou em 9 operações `covered`, 32 `partial`, 0 `gap` e 0 `decision`. Todos os sete gates normais passaram no mesmo SHA candidato antes do merge, incluindo readiness completo, 268 testes pgTAP, Playwright, perfis/viewports, backup/restauração, Lighthouse e homologação integral.

A validação revelou e corrigiu fixtures anteriores à identidade institucional obrigatória de escolas, contagens endurecidas de migrations e artefatos derivados desatualizados, sem modificar regras funcionais, migrations, Auth/RLS ou dados de Production.

## 5. Matriz funcional após a conciliação

A matriz executável continua com **41 operações**. A conciliação documental não transforma correção técnica em homologação completa quando ainda falta prova controlada.

| Cobertura | Operações |
|---|---:|
| Comprovada | 9 |
| Parcial | 32 |
| Lacuna técnica conhecida | 0 |
| Decisão funcional pendente | 0 |
| **Total** | **41** |

| Próxima prova | Operações |
|---|---:|
| Manter regressão | 5 |
| Smoke autenticado de leitura | 6 |
| Escrita controlada e reversível | 25 |
| Observação contínua em Production | 5 |
| **Total** | **41** |

`ASSET-02` deixa de ser lacuna técnica porque a correção está no código e no backend, mas permanece parcial até a prova controlada prevista pelo contrato de confiabilidade.

`CFG-03` e `CFG-04` deixam de ser classificadas como “decisão pendente”: a revisão do código, serviço, RPC e permissões demonstrou que o contrato vigente já autoriza Gestão SME e administrador técnico a cadastrar, editar e desativar programas. Qualquer retirada ou expansão futura dessa capacidade exige nova decisão funcional expressa.

## 6. Smoke autenticado de leitura

O PR #148 foi integrado. A infraestrutura cobre cinco contextos autenticados e seis operações de leitura, porém a execução recorrente em Production permanece intencionalmente desativada.

Ainda faltam, por decisão de segurança:

- cinco identidades técnicas exclusivas;
- segredo protegido com as credenciais dessas identidades;
- variável de habilitação;
- execução manual autorizada;
- execução agendada posteriormente autorizada.

Não reutilizar contas pessoais ou funcionais reais para monitoramento.

## 7. Auditoria funcional PR #156

O PR #156, `Auditar funcionalmente as conexões entre frontend e Supabase`, permanece branch histórica de trabalho e **não é fonte canônica do estado atual**.

Ele documentou e reproduziu achados relevantes, mas sua branch divergiu da `main` enquanto as correções avançaram pelos PRs #157, #160, #161 e #162. A documentação formal daquela branch registrou Tasks 1 a 4 como concluídas e a Task 5 como próxima, embora commits posteriores mostrem início da Task 5 e diagnóstico do bootstrap do Controlador.

Para continuidade:

- preservar a branch e o PR como evidência histórica;
- não fazer merge cego do PR #156;
- iniciar qualquer auditoria remanescente a partir da `main` reconciliada;
- reaproveitar somente evidências que ainda correspondam ao código atual;
- considerar o defeito de bootstrap diagnosticado naquela branch como tratado pelo PR #160;
- considerar os achados SCH-01, CFG-02, INV-01, ASSET-02, PEND-02, EXP-01 e EXP-02 como tecnicamente remediados pelo PR #162, sem confundir isso com prova final de todas as 41 jornadas.

## 8. Documentação

A reconciliação de 7 de agosto de 2026 estabelece:

- `CURRENT_STAGE.md` como guia canônico de estado corrente e revalidação;
- documentos canônicos e referências vigentes sem cópias desnecessárias de números voláteis;
- auditorias e evidências datadas preservadas como registros históricos do momento em que foram produzidas;
- planos executados preservados, não reescritos para parecer atuais;
- matriz funcional atualizada na fonte JSON e na visão gerada;
- PR #156 classificado como trabalho histórico não canônico e destinado a encerramento sem merge;
- snapshots exatos de ambiente registrados em checkpoints históricos, sem autorreferência do documento canônico.

Relatório: `docs/audits/2026-08-07-reconciliacao-documental-integral-pos-pr162.md`.

## 9. Prioridades após esta reconciliação

1. encerrar ou substituir formalmente o PR #156 sem merge cego;
2. retomar a auditoria funcional remanescente a partir da `main` atual;
3. completar as provas controladas das operações ainda parciais;
4. decidir separadamente o provisionamento do smoke autenticado de Production;
5. inspecionar e corrigir, se necessário, a tela de detalhes da escola, cuja conclusão anterior não foi comprovada no histórico remoto;
6. tratar PRs automáticos de dependências em frente isolada;
7. realizar UAT com usuários reais e decisão formal de liberação.

## 10. Critério de conclusão funcional

Uma função crítica somente é considerada concluída quando houver evidência aplicável de:

1. perfil autorizado e negativa do indevido;
2. controle visível e acionamento real;
3. payload correto;
4. serviço e repositório esperados;
5. backend efetivamente alcançado;
6. gravação ou leitura concluída;
7. autoria e auditoria;
8. interface atualizada;
9. releitura após refresh quando houver persistência;
10. conflito tratado;
11. falha parcial compensada;
12. mensagem útil;
13. regressão permanente;
14. evidência correspondente ao mesmo SHA e ambiente.

## 11. Continuidade documental

Ordem recomendada de leitura:

1. `AGENTS.md`;
2. `docs/CURRENT_STAGE.md`;
3. `docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md`;
4. `docs/PROJECT_CONTEXT.md`;
5. `docs/ROADMAP_ATUALIZACOES_2026.md`;
6. `docs/DECISION_LOG.md`;
7. `docs/reference/STATUS_DOCUMENTOS.md`;
8. arquitetura ou runbook específico da tarefa.
