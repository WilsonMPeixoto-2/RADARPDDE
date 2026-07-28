# RADAR PDDE — Auditoria de alinhamento entre código, ambientes e documentação

**Data de corte:** 28 de julho de 2026  
**Repositório:** `WilsonMPeixoto-2/RADARPDDE`  
**Branch auditada:** `main`  
**HEAD auditado:** `a6b1a4628c6f3024740d8d5a6f2cb7ba028f9ff9`  
**Deployment funcional auditado:** commit `6f165f61016261073eba4b56ce7a0afd0074a904`  
**Projeto Supabase autorizado:** `scnryinorqeucbfkioxo` (`RADAR PDDE 2026`)

## 1. Regra de precedência aplicada

O estado do produto foi reconstruído nesta ordem:

1. código-fonte versionado na `main`;
2. migrations e políticas SQL efetivamente aplicadas;
3. artefato publicado na Vercel e sua configuração de runtime;
4. dados e metadados existentes no projeto Supabase autorizado;
5. workflows, testes e evidências reproduzíveis;
6. documentação, apenas após confronto com as fontes anteriores.

Documentos, planos e relatórios históricos não prevalecem sobre o código e os ambientes efetivamente implantados.

## 2. Conclusão executiva

A integração entre frontend, Supabase Auth, PostgREST, RLS, banco e Vercel Production está ativa. A entrega de governança do perfil Gestão SME foi incorporada ao código, teve sua migration aplicada e foi publicada em Production. O deployment auditado está `READY`, usa `supabase-production` e não apresentou erro de runtime no período consultado.

O sistema, entretanto, ainda não deve ser declarado integralmente pronto para operação oficial em escala. Os principais motivos são:

- a competência operacional continua configurada e inicializada em maio de 2026;
- junho a dezembro existem no banco, mas a interface mensal filtra competências posteriores ao fechamento configurado;
- não existe seletor mensal global acionável em todas as superfícies, apenas indicador global e controles locais;
- a garantia banco–tela–Excel possui bons testes unitários e estruturais, mas ainda não possui reconciliação integral com massa representativa de produção;
- documentos canônicos e artefatos gerados permaneceram parcialmente desatualizados após a ativação de Production e a governança SME;
- a proteção contra senhas vazadas está desabilitada no Supabase Auth;
- a homologação transversal das jornadas reais por perfil, competência e viewport ainda precisa ser formalizada como gate de liberação.

## 3. Estado comprovado por camada

### 3.1 GitHub

- `main` aponta para `a6b1a462...`, commit que restabelece o bloqueio de deployment Git após a publicação controlada.
- A entrega funcional da governança SME está no commit publicado `6f165f610...`.
- O código contém política de capacidades compartilhada, guardas de interface e serviços, migration, pgTAP, testes unitários e E2E para a Gestão SME.
- A correção do Excel SME que removia validações OOXML reparadas pelo Microsoft Excel está incorporada ao histórico anterior ao deployment funcional vigente.
- Os scripts de qualidade incluem sintaxe, unitários, integração, auditoria funcional, readiness Supabase, tipos do banco, artefatos gerados, lint, testes E2E e gates específicos.

### 3.2 Vercel Production

Contrato observado no artefato publicado:

```text
environment: production
dataMode: supabase-production
productionActivationApproved: true
supabaseRepositoryEnabled: true
```

O deployment `dpl_Bfg1KBGrJrhE6UJ5G4rynG9rqwAS` está `READY` e foi construído a partir do commit `6f165f610...`. O build informou explicitamente a geração do artefato em `supabase-production`. Não foram identificados erros de runtime no período consultado.

Observação de governança: o `package.json` permite `node >=24 <27`; a Vercel alerta que uma nova major dentro dessa faixa poderá ser adotada automaticamente. Para Production oficial, recomenda-se fixar a major operacional e tratar upgrades de major como mudança deliberada.

### 3.3 Supabase Production

O projeto `RADAR PDDE 2026` está `ACTIVE_HEALTHY` na região `sa-east-1`.

A migration `sme_access_governance` está aplicada. As políticas de `administrative_logs` observadas no banco correspondem ao SQL versionado:

- Administrador técnico: leitura integral;
- Gestão SME: leitura apenas de linhas cujo `actor_user_id = auth.uid()`;
- demais perfis: leitura conforme escopo escolar;
- inserção comum: UUID do próprio usuário autenticado e escopo autorizado.

Inventário observado em 28/07/2026:

| Entidade | Quantidade |
|---|---:|
| Escolas | 164 |
| Programas | 8 |
| Vínculos escola–programa | 431 |
| Controladores | 6 |
| Integrantes no diretório de Inventário | 4 |
| Perfis de usuário ativos | 13 |
| Competências | 12 |
| Verificações operacionais | 6 |
| Pendências | 3 |
| Tentativas | 3 |
| Contatos | 5 |
| Registros administrativos | 81 |
| Bens | 2 |

Distribuição dos perfis ativos:

| Perfil | Quantidade |
|---|---:|
| Controlador | 6 |
| Assistente de Verbas Federais | 1 |
| Equipe de Inventário | 4 |
| Gestão SME | 1 |
| Administrador técnico | 1 |

As 12 competências de 2026 existem, de `2026-01` a `2026-12`. O registro global, porém, mantém `closing_competence = 2026-05`.

### 3.4 Segurança e desempenho

O Advisor de segurança apresenta um aviso relevante: a proteção contra senhas vazadas está desabilitada. Essa proteção deve ser habilitada antes da declaração de liberação oficial para usuários reais.

Os Advisors de desempenho apresentam apenas índices ainda não utilizados. Como a massa operacional é pequena, isso não demonstra que os índices sejam desnecessários. Nenhum índice deve ser removido sem período de observação e análise de planos reais.

Os logs confirmam:

- bloqueio anônimo com HTTP 401 ao tentar consultar escolas;
- operações autenticadas com respostas 200/201;
- paginação das coleções remotas;
- pelo menos uma tentativa de inserção em `administrative_logs` bloqueada com 403, que deve permanecer coberta por teste de autorização para distinguir bloqueio esperado de falha de fluxo.

## 4. Auditoria das últimas entregas

### 4.1 Governança de acesso da Gestão SME

**Status:** concluída e publicada.

Evidências:

- política central de capacidades no frontend;
- visão mensal e prontuário sem análise técnica para SME;
- pendências em modo consulta, sem mutações operacionais;
- Registros Internos filtrados pelo UUID autenticado;
- guardas em handlers e serviços;
- RLS correspondente aplicada;
- migration aplicada em Production;
- deployment publicado e `READY`.

Ponto residual: a documentação operacional ainda registrava essa entrega como pendente e foi corrigida no pacote de alinhamento documental.

### 4.2 Excel SME mensal

**Status:** implementado e tecnicamente funcional; homologação de equivalência integral ainda pendente.

O modelo:

- usa `activeCompetenciaKey`;
- lê verificações canônicas da escola e do programa;
- consolida Básico, Qualidade e Equidade;
- normaliza `SIM`, `NÃO` e `NÃO SE APLICA`;
- gera uma aba mensal e nome de arquivo por competência;
- possui testes do pacote OOXML, 26 colunas, cabeçalhos, dados, estilos, filtro, congelamento e impressão;
- possui regressão para impedir a reintrodução das validações que faziam o Excel reparar o arquivo.

Lacuna para liberação oficial:

- criar uma matriz de reconciliação que compare, para massa representativa e todas as combinações relevantes, o registro no Supabase, o estado carregado no frontend, o modelo de exportação e cada célula do arquivo gerado;
- validar também o modelo institucional legado e o modelo editorial do RADAR, com arquivos abertos pelo Microsoft Excel desktop;
- assegurar que nenhum registro de competência diferente contamine o arquivo mensal;
- produzir hash, manifesto e relatório de divergências por exportação de homologação.

### 4.3 Ferramentas, dependências e gates

**Status:** incorporados; cobertura deve ser ampliada para o novo ciclo transversal.

Existem workflows para validação geral, readiness Supabase, migrations, pgTAP, Auth/RLS, Playwright, mobile, dependências e deployments controlados. O próximo ciclo deve adicionar testes específicos para:

- seletor mensal global em todas as superfícies;
- preservação da competência ao navegar, voltar e recarregar;
- jornadas completas de avaliação, pendência, contato, envio e reanálise;
- equivalência banco–tela–Excel;
- matriz de perfis em desktop e mobile.

## 5. Causa raiz da limitação em maio de 2026

A causa é composta e está comprovada no código e na configuração:

1. `app.js` inicializa `activeCompetenciaKey = '2026-05'`;
2. `app_config.closing_competence` está em `2026-05`;
3. `renderCompetencias()` oferece apenas `COMPETENCIAS.filter(c => c.key <= config.competenciaFechamento)`;
4. `exercise-management.js` cria/mescla as 12 competências, mas sua inicialização não recalcula a competência ativa;
5. o header global contém indicador de competência e seletor de exercício, mas não contém seletor mensal global.

Consequência: junho a dezembro estão persistidos, porém não integram o fluxo mensal acessível ao usuário.

## 6. Divergências documentais encontradas

Foram identificadas e tratadas neste pacote:

- README principal ainda descrevia Production em `localStorage` e Supabase futuro;
- índice de `docs/` ainda apontava o PR 22 como estado de referência;
- `CURRENT_STAGE.md` afirmava que migration, homologação e publicação SME estavam pendentes;
- contagens de escolas, equipe e contas estavam desatualizadas;
- `PROJECT_CONTEXT.md` continha seção de ambientes incompatível com sua própria seção de persistência;
- ADR-002 mantinha Production local como decisão vigente;
- inventário técnico gerado ainda registrava 24 migrations e versões anteriores de ferramentas.

O inventário histórico não deve ser editado manualmente. Deve ser regenerado pelo script canônico após o merge deste pacote e, até lá, permanece explicitamente classificado como evidência histórica do momento em que foi produzido.

## 7. Critério de prontidão para operação oficial

A liberação oficial exige evidência cumulativa de que:

1. todas as competências autorizadas estão disponíveis e navegáveis;
2. a competência ativa é única, visível e preservada entre telas;
3. cada perfil vê e executa exatamente suas capacidades;
4. avaliações mensais persistem atomicamente e reaparecem após nova sessão;
5. aptidão/inaptidão e estados intermediários são derivados pelas regras canônicas;
6. pendências, tentativas, contatos e reanálises formam histórico íntegro;
7. Excel institucional e Excel editorial reconciliam integralmente com os dados canônicos;
8. Auth, RLS, auditoria, concorrência e rollback permanecem válidos;
9. desktop e mobile passam pela matriz de jornadas;
10. segurança operacional, backup, restauração e suporte possuem runbooks testados.

## 8. Próximas frentes recomendadas

A ordem técnica recomendada é:

1. contexto global de competência e liberação de junho a dezembro;
2. motor e jornada completa de avaliação mensal;
3. linha do tempo unificada de contatos, pendências, tentativas e reanálises;
4. reconciliação e certificação das exportações Excel;
5. navegação contextual, botões de voltar e preservação de estado;
6. polimento editorial e visual transversal;
7. homologação de operação real e gate de liberação oficial.

O plano detalhado correspondente está em `docs/superpowers/plans/2026-07-28-oficializacao-operacional-radar-pdde.md`.
