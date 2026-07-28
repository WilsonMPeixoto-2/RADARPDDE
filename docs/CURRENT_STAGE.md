# RADAR PDDE — Estado atual do projeto

**Atualizado em:** 28 de julho de 2026  
**HEAD remoto auditado:** `a6b1a4628c6f3024740d8d5a6f2cb7ba028f9ff9`  
**Commit funcional publicado:** `6f165f61016261073eba4b56ce7a0afd0074a904`  
**Natureza:** documento operacional e transitório

## 1. Regra de leitura

Antes de iniciar qualquer tarefa:

1. confirmar o HEAD remoto da `main`;
2. verificar PRs e workflows posteriores;
3. confirmar o deployment Vercel correspondente;
4. confirmar o estado real do projeto Supabase autorizado;
5. confrontar documentação e artefatos gerados com código e ambientes;
6. atualizar este documento quando o estado mudar.

Código, banco e deployment prevalecem sobre planos e relatórios históricos.

## 2. Conclusão operacional

A integração técnica entre frontend, Supabase Auth, PostgREST, RLS, PostgreSQL e Vercel Production está ativa.

A entrega de governança da Gestão SME está:

- incorporada ao código;
- coberta por política de capacidades e guardas de serviço/interface;
- versionada em migration e pgTAP;
- aplicada no projeto Production;
- publicada no deployment funcional vigente;
- sem erro de runtime observado no período consultado.

O próximo estágio não é construir novamente a conexão. É **oficializar a operação**, concluindo competência global, jornadas reais, histórico, certificação Excel, navegação, segurança e homologação.

## 3. Estado por camada

| Camada | Estado |
|---|---|
| GitHub | `main` em `a6b1a462...`; deployment automático novamente bloqueado após publicação controlada. |
| Vercel | deployment Production do commit `6f165f610...` em estado `READY`. |
| Runtime | `production`, `supabase-production`, ativação aprovada, repositório remoto habilitado. |
| Supabase | projeto `scnryinorqeucbfkioxo` ativo e saudável. |
| Migrations | migration de governança SME aplicada; políticas observadas correspondem ao SQL versionado. |
| Auth/RLS | autenticação e escopos ativos; acesso anônimo bloqueado. |
| Governança SME | concluída e publicada. |
| Excel SME | implementado e corrigido; certificação integral ainda pendente. |
| Competências | 12 registros em 2026; operação/interface ainda limitadas a maio. |
| Liberação oficial | não declarada. |

## 4. Inventário de dados em Production

Data de corte: 28/07/2026.

| Entidade | Quantidade |
|---|---:|
| Configuração global | 1 |
| Programas | 8 |
| Controladores | 6 |
| Integrantes no diretório de Inventário | 4 |
| Competências | 12 |
| Escolas | 164 |
| Vínculos escola–programa | 431 |
| Perfis de usuário ativos | 13 |
| Verificações | 6 |
| Pendências | 3 |
| Tentativas | 3 |
| Contatos | 5 |
| Registros administrativos | 81 |
| Bens | 2 |

As quantidades são retrato operacional e podem mudar com o uso real.

## 5. Perfis ativos

| Perfil | Quantidade |
|---|---:|
| Controlador | 6 |
| Assistente de Verbas Federais | 1 |
| Equipe de Inventário | 4 |
| Gestão SME | 1 |
| Administrador técnico | 1 |

Não registrar neste documento nomes, e-mails ou identificadores pessoais desnecessários. O detalhamento de contas deve permanecer nos controles administrativos adequados.

## 6. Controladores

A carteira individual é responsabilidade principal, filtro inicial e mecanismo de organização. Não é barreira de acesso entre Controladores da mesma CRE.

- cada Controlador consulta e opera escolas da própria CRE conforme a política vigente;
- atuação fora da carteira não transfere responsabilidade;
- autoria permanece vinculada ao executor;
- outra CRE permanece bloqueada sem exceção autorizada;
- alteração de carteira é evento administrativo explícito.

## 7. Gestão SME

A governança implementada estabelece:

- visão mensal e prontuário com identificação e bonificação, sem análise técnica;
- pendências em modo consulta, sem criação, alteração, envio, reanálise, resolução, cancelamento ou reabertura;
- Registros Internos limitados às linhas cujo `actor_user_id` coincide com o `auth.uid()` autenticado;
- proteção redundante em interface, serviços e RLS;
- ausência de configuração operacional indevida.

Essa frente está concluída. Novas mudanças de programas e regras não pertencem a essa entrega.

## 8. Capital e Inventário

O perfil de Inventário:

- consulta escolas e bens da própria CRE conforme escopo;
- cria e atualiza bens autorizados pela interface;
- conclui inventariação de bem encaminhado;
- não recebe escrita cadastral geral nas escolas;
- não recebe bonificação, análise técnica, contatos ou configuração global;
- não acessa escolas ou bens de outra CRE.

A matriz real deve ser novamente exercitada no gate final de UAT.

## 9. Contrato Vercel

### Production

```text
runtimeEnvironment: production
dataMode: supabase-production
supabaseRepositoryEnabled: true
productionActivationApproved: true
```

O build utiliza somente URL e chave publicável do Supabase no bundle.

### Preview

```text
runtimeEnvironment: preview
dataMode: supabase-preview
supabaseRepositoryEnabled: true
productionActivationApproved: false
```

Preview e Production são artefatos separados.

### Rollback emergencial

```text
RADAR_PRODUCTION_FORCE_LOCAL=true
```

A variável força novo build local sem apagar o banco. Sua remoção restaura o modo Supabase no deployment seguinte. O procedimento deve ser tratado como contingência, não modo normal.

## 10. Competências 2026

As competências `2026-01` a `2026-12` existem no banco.

O bloqueio em maio decorre de três fatores combinados:

1. `activeCompetenciaKey` é inicializada em `2026-05` no frontend;
2. `app_config.closing_competence` permanece em `2026-05`;
3. a tela mensal filtra as opções com `key <= closing_competence`.

O módulo de exercício mescla os 12 meses, mas não recalcula a competência ativa durante a inicialização normal. O header possui indicador global e seletor anual, porém não possui seletor mensal global.

**Próxima implementação prioritária:** contexto global de competência, disponibilização operacional de junho a dezembro e seletor mensal em todas as superfícies e perfis aplicáveis.

## 11. Avaliações e pendências

O banco já contém registros operacionais de verificação e do ciclo de pendências. A estrutura contempla:

- avaliação por escola, competência e programa;
- bonificação e análise técnica independentes;
- pendências `Aberta`, `Aguardando reanálise`, `Resolvida` e `Cancelada`;
- tentativas com resultado correto, incorreto, arquivo indisponível e estados correlatos;
- contatos vinculados ou não a pendência;
- autoria, auditoria e concorrência otimista.

A liberação oficial exige jornada automatizada completa, recarga de sessão e coerência entre Dashboard, Carteira, Competências, Prontuário, Pendências e relatórios.

## 12. Excel

O Excel SME mensal:

- usa a competência ativa;
- consolida Básico, Qualidade e Equidade;
- possui 26 colunas e uma aba mensal;
- normaliza `SIM`, `NÃO` e `NÃO SE APLICA`;
- possui testes de OOXML, estilos, dados, filtro, congelamento e impressão;
- removeu as validações que faziam o Microsoft Excel reparar o arquivo.

Estado: funcional, mas ainda não certificado para correspondência absoluta em escala.

Gate pendente:

- massa representativa;
- reconciliação Supabase → frontend → modelo → célula XLSX;
- isolamento entre competências;
- certificação dos dois modelos de relatório;
- abertura no Microsoft Excel desktop sem reparo;
- manifesto e hash de evidência.

## 13. Segurança operacional

Comprovado:

- usuário anônimo não acessa dados institucionais;
- o frontend recebe apenas chave publicável;
- `service_role`, senha de banco e segredos não entram no bundle;
- RLS restringe leituras e escritas por papel e escopo;
- alterações geram auditoria;
- Edge Function protegida por JWT;
- backup lógico pré-ativação permanece referência de restauração controlada.

Pendente antes do release oficial:

- habilitar proteção contra senhas vazadas no Supabase Auth;
- fixar a major operacional do Node em vez de permitir atualização automática dentro de faixa ampla;
- validar backup e restauração em ambiente descartável;
- executar gate remoto completo por perfil;
- classificar o 403 observado em inserção de registro administrativo como bloqueio esperado ou falha de jornada.

## 14. Qualidade e workflows

Existem workflows para:

- validação geral em PR e `main`;
- readiness Supabase;
- smoke de migrations;
- Supabase local, pgTAP e lint SQL;
- Auth/RLS e Playwright;
- mobile;
- dependências;
- deployments controlados.

Os novos requisitos precisam entrar nos gates:

- seletor mensal global;
- preservação da competência;
- jornada de avaliação completa;
- timeline operacional;
- paridade dos dois Excels;
- navegação contextual;
- matriz visual e acessível por perfil.

## 15. Documentação e artefatos

Foram identificados como desatualizados antes deste alinhamento:

- README principal;
- índice de `docs/`;
- este `CURRENT_STAGE.md`;
- trechos de ambientes em `PROJECT_CONTEXT.md`;
- ADRs que mantinham Production local como decisão vigente;
- inventário técnico gerado com 24 migrations e versões anteriores.

O inventário técnico em `docs/evidence/global-baseline/repository-inventory.json` é evidência histórica. Deve ser regenerado pelo script canônico; não deve ser corrigido manualmente.

## 16. Ordem das próximas entregas

1. contexto global de competência;
2. liberação operacional de junho a dezembro;
3. seletor mensal transversal;
4. consistência entre projeções;
5. certificação da avaliação mensal;
6. timeline de contatos, pendências, tentativas e reanálises;
7. reconciliação dos relatórios Excel;
8. navegação contextual e botões de voltar;
9. polimento editorial e visual;
10. segurança, UAT e release oficial.

Plano detalhado:

[`superpowers/plans/2026-07-28-oficializacao-operacional-radar-pdde.md`](superpowers/plans/2026-07-28-oficializacao-operacional-radar-pdde.md)

## 17. Escopo deliberadamente separado

A remodelagem de programas, categorias, exercícios e unidades participantes permanece fora deste ciclo até especificação funcional própria. O ciclo atual preserva os programas e vínculos vigentes enquanto oficializa a operação estabelecida.
