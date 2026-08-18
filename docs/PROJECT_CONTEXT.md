# RADAR PDDE 2026 — Contexto funcional e arquitetural

**Atualizado em:** 18 de agosto de 2026  
**Classe documental:** Canônico

## 1. Finalidade

O RADAR PDDE organiza o ciclo de entrega, análise, acompanhamento, regularização, consolidação, inventário, histórico e apoio à decisão dos programas do PDDE no âmbito da 4ª CRE/SME-Rio.

O sistema deve permitir que cada usuário compreenda:

1. o estado atual da unidade, competência e programa;
2. o que exige atenção;
3. quem deve agir;
4. qual é a próxima ação;
5. onde realizar essa ação;
6. como o histórico foi formado;
7. qual competência e programa sustentam a informação;
8. como a informação chega aos relatórios institucionais.

Dashboard, Carteira, Competências, Prontuário, Pendências, Inventário, Registros Internos, timeline e exportações representam o mesmo universo de dados. Nenhuma superfície cria fonte de verdade independente.

## 2. Baseline operacional

O baseline mutável corrente fica em [`CURRENT_STAGE.md`](CURRENT_STAGE.md).

O snapshot de encerramento de 18/08/2026 está em [`handoff/2026-08-18-encerramento-operacional.md`](handoff/2026-08-18-encerramento-operacional.md).

Este documento descreve contratos estáveis e não deve ser usado para presumir SHA, deployment, contagem de migrations ou versão de Edge Function sem nova consulta ao remoto.

## 3. Regra de precedência

1. código-fonte remoto vigente;
2. Supabase efetivo, incluindo schema, migrations, Auth, RLS, funções e dados;
3. artefato implantado na Vercel e seu SHA;
4. decisões funcionais vigentes;
5. testes/evidências reproduzíveis;
6. documentação canônica;
7. documentos históricos.

Memória de chat, planos e auditorias anteriores não substituem verificação operacional.

## 4. Perfis funcionais

### Controlador

Possui carteira de responsabilidade principal e pode colaborar nas escolas da própria CRE. A atuação fora da carteira não transfere `schools.controller_id`, preserva autoria e não concede acesso a outra CRE.

Pode editar dados cadastrais autorizados, mas não redistribuir carteira nem alterar a identidade institucional da escola fora das capacidades previstas.

### Assistente de Verbas Federais

Lidera operacionalmente a GAD/CRE, acompanha escolas, administra Controladores e Inventário, distribui carteiras, executa ações transversais autorizadas e consolida relatórios.

### Gestão SME

Realiza acompanhamento gerencial. Consulta identificação e bonificação, não recebe análise técnica editável nas superfícies restritas nem mutações operacionais de Pendências.

Capacidades administrativas específicas, inclusive de programas, devem ser confirmadas no código e nas permissões atuais antes de qualquer ampliação ou retirada futura.

### Equipe de Inventário

Executa o fluxo patrimonial autorizado dentro do escopo da CRE.

### Administrador técnico

`technical_admin` atua em segurança, infraestrutura, perfis, escopos, importações e auditoria. A simulação visual não altera JWT nem substitui contas operacionais reais.

## 5. Superfícies

O produto contém, conforme o perfil:

- Dashboard;
- Carteira;
- Competências;
- Pendências;
- Prontuário e timeline;
- Gestão de Equipe;
- Capital e Inventário;
- Registros Internos;
- configurações SME;
- alertas, busca, modais e exportações.

Toda alteração deve considerar competência, exercício, Controlador, CRE, escola, programa, documento, situação, autoria e perfil efetivo.

## 6. Competência transversal e exceção de Pendências

A competência canônica usa `YYYY-MM` e é gerida por `RadarCompetenceContext`.

Ela é contexto global persistente para Dashboard, Carteira, Competências, Prontuário, alertas, timeline e exportações conforme a regra da superfície.

### Exceção deliberada: Pendências Operacionais

Pendências representam passivo histórico e não podem desaparecer apenas porque o usuário selecionou a competência corrente.

Por isso:

- a competência global continua visível na página;
- a página abre em **Todas as competências**;
- a competência global não é aplicada automaticamente como filtro da lista;
- o filtro local de competência é opcional;
- ao navegar de uma pendência para o Prontuário, a competência de origem da pendência volta a ser aplicada ao contexto mensal.

Ver [`decisions/ADR-044-pendencias-transversais.md`](decisions/ADR-044-pendencias-transversais.md).

Competência existente, disponível e formalmente fechada são conceitos distintos.

## 7. Avaliação mensal

Identidade:

```text
escola + competência + programa
```

A projeção canônica reúne consolidação, resultado, campos ausentes, bonificação, análise técnica, conclusão e pendências.

Regras adicionais vigentes:

- competências futuras podem ser vistas, mas não editadas;
- após consolidação do prazo/bonificação, documento entregue fora do período não recebe `Correto` como situação regular;
- quando tecnicamente correto e entregue após o prazo, usa-se `Correto (Atrasado)`;
- bonificação, análise técnica e pendência permanecem dimensões diferentes.

## 8. Pendências

Estados:

- Aberta;
- Aguardando reanálise;
- Resolvida;
- Cancelada.

Novo envio não resolve automaticamente. Reanálise positiva resolve; negativa reabre; cancelamento preserva motivo e autoria; regularização não apaga percurso.

A ordenação operacional prioriza as pendências ativas mais antigas e, para estados encerrados, os acontecimentos mais recentes.

A tabela `pendency_attempts` permanece sincronizada com o estado agregado das tentativas da pendência.

## 9. Timeline

`RadarSchoolTimeline` projeta avaliações, pendências, tentativas, contatos, despesas, bens e registros administrativos. Preserva ordem, autoria, competência, programa, origem e visibilidade por perfil.

## 10. Navegação contextual

`RadarNavigationContext` preserva competência, rota, filtros, rolagem e foco entre origem operacional e Prontuário/Pendências.

Na exceção transversal de Pendências, abrir detalhes não força a competência global; navegar para o Prontuário assume a competência da pendência.

## 11. Persistência

```text
Frontend
→ serviços de aplicação e UnitOfWork
→ RepositoryContract
   ├── SupabaseRepository — Production
   └── LocalStorageRepository — desenvolvimento/testes explicitamente configurados
→ PostgREST / RPC / Edge Function
→ Auth / RLS / PostgreSQL
```

O adaptador remoto usa paginação, lotes, erros padronizados, `row_version`, snapshots, RPCs, reconciliação e rollback.

### Production fail-closed

Production somente opera com a configuração remota autorizada.

Falha, ausência ou inconsistência de configuração Supabase em Production **não ativa fallback silencioso para LocalStorage ou seed**. O produto deve permanecer bloqueado/indisponível até o ambiente oficial ser restabelecido.

O build de Production sanitiza os dados iniciais de escolas/controladores usados no desenvolvimento para que eles não façam parte do bundle público institucional.

Ver [`decisions/ADR-045-production-fail-closed.md`](decisions/ADR-045-production-fail-closed.md).

## 12. Auth e sessão

O cliente Supabase usa sessão persistente e renovação automática. O bootstrap:

1. restaura ou cria a sessão;
2. valida perfil, papel efetivo e escopos;
3. cria cliente autenticado;
4. carrega entidades autorizadas;
5. aplica o perfil à interface;
6. mantém a aplicação inerte enquanto a autorização não termina.

Em Production, erro de configuração/autorização não é convertido em sessão local funcional.

## 13. Gestão de contas

```text
DirectoryService
→ TeamAccountGateway
→ team-account-management
   ├── Supabase Auth Admin
   └── RPC PostgreSQL transacional
```

Contratos vigentes:

- CORS fail-closed;
- JWT e papel autorizados;
- credencial administrativa somente server-side;
- lookup exato de conta por e-mail pela RPC autorizada;
- recuperação de vínculo histórico quando inequívoca;
- reutilização segura de conta em transição autorizada de perfil;
- um único perfil institucional ativo por usuário;
- desativação lógica e preservação de histórico;
- compensação quando Auth e banco participam de etapas distintas.

### Desativação de Controlador

A sequência obrigatória é:

1. transferir todas as escolas pela alocação de carteira;
2. confirmar carteira zerada;
3. desativar.

A desativação não redistribui escolas e não pede substituto quando a carteira já está vazia. Controladores inativos permanecem no histórico, mas não integram diretórios, filtros ou seletores operacionais.

## 14. Escolas e carteira

A carteira organiza responsabilidade, não fronteira entre Controladores da mesma CRE.

Novas escolas exigem identidade institucional informada:

- código institucional;
- designação;
- denominação;
- INEP;
- CNPJ;
- SICI.

Valores artificiais não podem ser gerados para preencher identidade definitiva.

A redistribuição de `controller_id` é exclusiva de perfis/rotinas administrativas autorizadas e protegida também no backend.

## 15. Financeiro e patrimônio

Notas fiscais e bens permanentes participam de operações compostas.

- nota permanente e bem derivado preservam contexto coerente;
- quando uma nota perde/troca vínculo com bem derivado, o vínculo anterior é tratado na mesma operação protegida;
- cada NF de serviço registra individualmente consulta à Assessoria e análise técnica;
- resumos mensais de Assessoria são derivados das NFs e não substituem a avaliação individual;
- edição rápida de bem é restrita aos campos permitidos, com versão esperada e log;
- encaminhamento e inventariação usam fluxo patrimonial próprio.

### Despesa `A identificar`

Saída bancária sem documentação suficiente pode ser registrada provisoriamente como `A identificar`.

Esse estado não deve forçar NF, natureza de despesa, bem patrimonial ou consulta à Assessoria. A classificação é atualizada quando houver evidência documental.

## 16. Auditoria e exportações

`administrative_logs` registra eventos funcionais e `audit_events` serve à trilha técnica correspondente ao schema.

Exportações institucional e SME passam por auditoria de início/conclusão e devem permanecer coerentes com o estado canônico.

## 17. Ambientes

### Desenvolvimento/local

Supabase local, LocalStorage e fixtures descartáveis conforme o ensaio. Não representa Production.

### Preview

Ambiente candidato/isolado para validação. Preview não é publicação oficial.

### Production

Supabase Production canônico e frontend publicado na Vercel. Production é fail-closed e não usa seed/local como contingência silenciosa.

Consultar `CURRENT_STAGE.md` e o manifesto remoto para o baseline efetivo.

## 18. Excel SME

Contrato estável:

- uma competência por arquivo;
- uma aba;
- 27 colunas A:AA;
- template-fonte com 30 colunas usado somente como base visual;
- remoção de K, R e Y na projeção pública;
- designação como texto;
- bordas, alinhamentos, filtro, impressão e congelamento preservados;
- ausência deliberada de validações incompatíveis;
- certificação OOXML e homologação desktop.

## 19. Garantia operacional

O sistema possui camadas permanentes de:

- smoke geral de Production;
- incidentes/monitoramento conforme workflows vigentes;
- auditorias e contratos executáveis;
- backup/restauração descartáveis;
- gate por perfil e viewport;
- CodeQL;
- health checks de dependências;
- testes de banco, Auth e RLS.

A existência de um gate não o torna automaticamente obrigatório para toda alteração. A governança de testes define proporcionalidade ao risco.

## 20. Confiabilidade funcional ponta a ponta

Uma função crítica deve ser rastreada por:

```text
superfície
→ controle
→ handler
→ serviço
→ repositório
→ tabela/RPC/Edge Function
→ Auth/RLS
→ resposta
→ estado em memória
→ renderização
→ releitura após refresh
→ erro, conflito e compensação
```

Não declarar função concluída apenas porque o controle aparece na interface.

## 21. Experiência do usuário

Critérios de homologação incluem:

- clareza de contexto;
- legibilidade;
- encontrabilidade de ações;
- feedback de sucesso/erro;
- coerência do dado salvo e exibido;
- permanência após releitura;
- navegação e retorno contextual.

No fechamento de 18/08/2026 o polimento priorizou notebooks 14–15" e monitores 21–24". Mobile preserva capacidade essencial, mas sua otimização de performance permaneceu melhoria não bloqueadora.

## 22. Restrições permanentes

Não é permitido:

- alterar código para coincidir com documento histórico;
- criar fonte paralela de competência, avaliação, timeline ou exportação;
- voltar a filtrar automaticamente Pendências Operacionais pela competência global;
- enfraquecer Auth, RLS ou autoria;
- reintroduzir fallback silencioso local/seed em Production;
- publicar seed institucional legado no bundle de Production;
- transformar carteira em fronteira de segurança entre Controladores da mesma CRE;
- ocultar capacidade essencial no mobile;
- introduzir segredo no frontend;
- aplicar migration sem histórico, testes e reversão proporcional ao risco;
- editar diretamente a tabela de migrations;
- inventar identidade institucional de escola;
- liberar exportação sem os controles de auditoria previstos;
- tratar PR aberto ou Preview como funcionalidade publicada;
- declarar função pronta apenas pela presença visual.

## 23. Referências

- [`CURRENT_STAGE.md`](CURRENT_STAGE.md);
- [`handoff/2026-08-18-encerramento-operacional.md`](handoff/2026-08-18-encerramento-operacional.md);
- [`DECISION_LOG.md`](DECISION_LOG.md);
- [`decisions/ADR-044-pendencias-transversais.md`](decisions/ADR-044-pendencias-transversais.md);
- [`decisions/ADR-045-production-fail-closed.md`](decisions/ADR-045-production-fail-closed.md);
- [`reference/FUNCTIONAL_CONTRACT_MATRIX.md`](reference/FUNCTIONAL_CONTRACT_MATRIX.md);
- [`reference/TEST_GOVERNANCE.md`](reference/TEST_GOVERNANCE.md);
- [`architecture/testing.md`](architecture/testing.md);
- [`architecture/supabase-readiness.md`](architecture/supabase-readiness.md);
- [`runbooks/SUPABASE_CONNECTION.md`](runbooks/SUPABASE_CONNECTION.md).
