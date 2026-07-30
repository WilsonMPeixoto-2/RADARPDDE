# RADAR PDDE 2026 — Contexto funcional e arquitetural

**Atualizado em:** 29 de julho de 2026

## 1. Finalidade

O RADAR PDDE organiza o ciclo de entrega, análise, acompanhamento, regularização, consolidação, prestação de contas, inventário, histórico e apoio à decisão dos programas do PDDE no âmbito da 4ª CRE/SME-Rio.

O sistema deve permitir que cada usuário compreenda:

1. o estado atual da unidade, competência e programa;
2. o que exige atenção;
3. quem deve agir;
4. qual é a próxima ação;
5. onde realizar essa ação;
6. como o histórico foi formado;
7. qual competência e programa sustentam a informação;
8. como a informação foi refletida nos relatórios institucionais.

Dashboard, Carteira, Competências, Prontuário, Pendências, Inventário, Registros Internos, timeline e exportações representam o mesmo universo de dados. Nenhuma superfície pode criar uma fonte de verdade independente.

## 2. Estado operacional de referência

Na data de corte:

- a `main` contém a governança da Gestão SME e os ciclos 1 a 5 da oficialização;
- a baseline funcional auditada é `598361dd784563f4d70d1e25df3818f4ee066da8`;
- a reconciliação do histórico SME foi integrada em `79cb67c84720b1850879d9c50c262e1623d5d8cc`;
- a Vercel Production está `READY` no deployment `dpl_7tLM3RZ7MEuRRTzvGmc9EiAARmDY`;
- o commit funcional publicado é `dfc8aa3030b02edb73f764f5f56bd6759a7a1d77`;
- o runtime opera em `production` e `supabase-production`;
- o Supabase autorizado `scnryinorqeucbfkioxo` está `ACTIVE_HEALTHY`;
- existem 12 competências de 2026;
- `closing_competence = 2026-12`;
- `app_config.row_version = 5`;
- as 25 versões de migration correspondem entre GitHub e Supabase Production;
- o relatório institucional XLSX e o Excel SME estão integrados em runtime;
- o CSV legado permanece disponível como botão secundário e fallback;
- o deployment automático está novamente bloqueado;
- a liberação oficial ainda não foi declarada.

O commit posterior ao deployment funcional apenas restaurou `git.deploymentEnabled: false`. A reconciliação posterior do histórico de migrations não alterou o schema funcional nem o artefato publicado.

## 3. Regra de precedência

Quando houver divergência, aplicar:

1. código-fonte remoto vigente;
2. migrations, políticas, funções, Auth e dados efetivos do Supabase autorizado;
3. artefato implantado na Vercel;
4. testes e evidências reproduzíveis;
5. decisões funcionais vigentes;
6. documentação canônica atualizada;
7. documentos históricos.

Memória de chat, planos e relatórios anteriores ajudam a explicar decisões, mas não substituem a verificação operacional.

## 4. Perfis funcionais

### 4.1 Controlador

Possui carteira de responsabilidade principal, usada como filtro inicial e organização do trabalho. Pode consultar e executar ações operacionais nas demais escolas da própria CRE para colaboração, substituição e cobertura da equipe.

A atuação fora da carteira:

- não transfere automaticamente `schools.controller_id`;
- preserva a responsabilidade principal existente;
- registra a autoria do usuário autenticado;
- não concede acesso a escola de outra CRE sem exceção expressa.

### 4.2 Assistente de Verbas Federais

Representa a liderança operacional da GAD da CRE. O perfil:

- acompanha transversalmente as escolas;
- apoia e coordena os Controladores;
- administra Controladores, integrantes de Inventário e carteiras;
- cadastra, edita, convida, desativa e redistribui conforme autorização;
- executa retificações e ações transversais autorizadas;
- consolida informações e relatórios operacionais.

### 4.3 Gestão SME

Realiza acompanhamento gerencial.

Nas visões mensal e do Prontuário:

- consulta identificação da unidade e bonificação;
- não visualiza análise técnica;
- não executa ações operacionais.

Em Pendências:

- consulta listas, tentativas, contatos e detalhes autorizados;
- não registra novo envio, substituição, reanálise, contato, cancelamento, reabertura ou nova pendência.

Em Registros Internos:

- consulta somente linhas cujo `actor_user_id` corresponde ao próprio `auth.uid()`.

A restrição é aplicada por política de capacidades, guardas de interface, handlers, serviços e RLS.

A classificação, o cadastro e a disponibilização de programas por exercício permanecem fora desse escopo.

### 4.4 Equipe de Inventário

Executa o fluxo patrimonial autorizado, acompanha bens permanentes, encaminhamentos, inventariação, processos e registros dentro do escopo definido.

### 4.5 Administrador técnico

`technical_admin` existe para segurança, infraestrutura, perfis, escopos, importações e auditoria. Não é perfil operacional equivalente à Assistente.

A simulação visual de perfil altera a política exibida, mas não substitui o JWT nem concede comportamento contrário ao perfil simulado.

## 5. Superfícies e recortes

O produto contém, conforme o perfil:

- Dashboard;
- Carteira de Escolas;
- Competências Mensais;
- Pendências Operacionais;
- Prontuário;
- Histórico cronológico;
- Gestão de Equipe;
- Capital e Inventário;
- Registros Internos;
- Configurações e visões gerenciais SME;
- alertas, modais e exportações.

Toda alteração deve considerar os recortes por competência, exercício, Controlador, CRE, região administrativa, escola, programa, documento, situação, autoria e perfil efetivo.

## 6. Competência como contexto transversal

A competência canônica usa `YYYY-MM`.

O contexto mensal é único para Dashboard, Carteira, Competências, Prontuário, Pendências, alertas, timeline e exportações Excel.

O domínio `RadarCompetenceContext`:

- normaliza e valida competências;
- disponibiliza as competências existentes do exercício;
- prioriza seleção persistida válida, seleção explícita, fechamento e fallback cronológico;
- sincroniza exercício e competência;
- persiste a seleção durante a sessão;
- notifica as superfícies por uma fonte de contexto única.

As 12 competências de 2026 estão disponíveis. A aplicação não mantém seletores mensais concorrentes por tela.

Competência existente, disponível e formalmente fechada são conceitos distintos.

## 7. Avaliação mensal canônica

Cada avaliação é identificada por:

```text
escola + competência + programa
```

A projeção `evaluateMonthlyEvaluation` reúne:

- possibilidade de consolidação;
- resultado `apta`, `inapta` ou nulo;
- campos obrigatórios ausentes;
- estágio da bonificação;
- situação da análise técnica;
- conclusão técnica `not_started`, `in_progress` ou `complete`;
- pendências abertas;
- itens aguardando reanálise;
- total de pendências ativas.

Situação técnica e grau de conclusão são independentes. Consulta, consolidação, telas e certificação dos relatórios utilizam a mesma regra canônica.

## 8. Pendências e regularização

Estados canônicos:

- `Aberta`;
- `Aguardando reanálise`;
- `Resolvida`;
- `Cancelada`.

Resultados de tentativa incluem aguardando, correto, incorreto, arquivo indisponível e substituída antes da análise.

Regras essenciais:

- novo envio não resolve a pendência;
- reanálise positiva resolve;
- reanálise negativa devolve o fluxo ao estado aberto;
- cancelamento preserva motivo e autoria;
- regularização não apaga o percurso;
- pendência não altera automaticamente a bonificação histórica.

## 9. Histórico cronológico da unidade

A timeline é uma projeção das entidades canônicas, não nova fonte de verdade.

O domínio `RadarSchoolTimeline` consolida, por unidade e competência:

- avaliações e consolidações;
- abertura, resolução, cancelamento e reabertura de pendências;
- novos envios e reanálises;
- contatos e cobranças;
- notas fiscais e despesas;
- bens permanentes, encaminhamento e inventariação;
- registros administrativos autorizados.

A projeção preserva ordem, desempate estável, autoria, competência, programa, vínculo com pendência, origem e visibilidade por perfil. A abertura já representada no histórico da pendência não é duplicada. A Gestão SME não recebe detalhes técnicos restritos.

A aba **Histórico cronológico** integra o Prontuário e é montada por DOM seguro.

## 10. Navegação contextual

O módulo `RadarNavigationContext` complementa as rotas canônicas sem criar roteador paralelo.

```text
origem operacional
→ captura de competência, rota, filtros, rolagem e foco
→ Prontuário ou Pendências
→ ação Voltar para …
→ restauração da origem e do controle acionável
```

Características:

- contexto somente em `sessionStorage`;
- pilha limitada a 12 transições;
- restauração da competência pelo contexto global;
- scroll próprio no desktop e scroll da página no mobile;
- foco somente em elemento visível e acionável;
- fallback **Voltar para Carteira** em acesso direto;
- nenhuma persistência remota ou dado documental no contexto.

A jornada foi validada em desktop, Android e iPhone.

## 11. Entidades canônicas

O contrato de repositório inclui configuração, programas, perfis, escopos escolares, Controladores, equipe de Inventário, escolas, vínculos escola–programa, competências, verificações, pendências, tentativas, contatos, bens, notas, logs administrativos, importações e auditoria.

Nenhuma superfície deve persistir cópia paralela capaz de divergir dessas entidades.

## 12. Persistência

```text
Frontend
   ↓
Serviços de aplicação e unidade de trabalho
   ↓
Contrato de repositório
   ├── SupabaseRepository — Preview e Production
   └── LocalStorageRepository — contingência por novo build
```

O adaptador remoto utiliza paginação, lotes, erros padronizados, concorrência otimista por `row_version`, snapshots, RPCs compostas, reconciliação e rollback.

Production e Preview usam Supabase. O modo local não é a fonte normal dos dados institucionais.

## 13. Gestão de contas da equipe

```text
DirectoryService
   ↓
TeamAccountGateway
   ↓
Edge Function autenticada
   ├── Supabase Auth Admin
   └── RPC PostgreSQL transacional
```

A credencial administrativa nunca chega ao navegador. Falhas compensam convite, edição ou bloqueio para evitar divergência entre conta e diretório.

## 14. Autorização

- anônimo: sem acesso institucional;
- Controlador: operação nas escolas da própria `cre_scope`;
- Assistente: operação transversal e Gestão de Equipe plena;
- Inventário: operação patrimonial autorizada;
- SME: leitura gerencial conforme governança restritiva;
- Administrador técnico: infraestrutura, perfis, escopos e auditoria.

Controlador sem `cre_scope` não recebe acesso transversal automático. Escola de outra CRE permanece bloqueada, salvo exceção explícita em `user_school_scopes`.

Exclusão física é excepcional. A remoção funcional de integrante é desativação lógica e auditada.

## 15. Migração, backup, restauração e rastreabilidade

Fluxo obrigatório de dados:

```text
snapshot → validação → plano → dry-run → staging
         → retomada → reconciliação → promoção atômica
         → reconciliação do destino → rollback comprovado
```

Seed local não é dado institucional. Importação administrativa não ocorre no navegador.

### Histórico SME reconciliado

O repositório e o Supabase Production possuem o identificador canônico:

```text
20260728182226_sme_access_governance
```

O identificador remoto derivado `20260728190344` foi marcado como revertido no histórico e está ausente da listagem final. O identificador canônico foi marcado como aplicado.

A reconciliação:

- usou `supabase migration repair`;
- não executou, reaplicou ou reverteu o SQL funcional;
- preservou o schema e as políticas existentes;
- manteve o SQL com 1.411 caracteres;
- preservou o SHA-256 `cddda35f4cc08b92093071f888cf958ae052ae82775c91366e4d729434427f0e`;
- deixou 25 versões correspondentes entre local e remoto;
- deixou `db push --dry-run` sem pendência;
- ganhou teste unitário de regressão.

Antes de qualquer migration futura, executar o runbook e o teste `tests/unit/sme-migration-history-alignment.test.js`.

Backup e restauração ainda precisam ser exercitados em ambiente descartável antes da liberação oficial.

## 16. Ambientes

### Desenvolvimento local

Pode usar Supabase local e fixtures descartáveis. Não representa Production.

### Preview

```text
environment: preview
dataMode: supabase-preview
supabaseRepositoryEnabled: true
productionActivationApproved: false
```

### Production

```text
environment: production
dataMode: supabase-production
supabaseRepositoryEnabled: true
productionActivationApproved: true
```

O projeto autorizado é `scnryinorqeucbfkioxo`. O build público contém somente configuração publicável.

### Rollback emergencial

`RADAR_PRODUCTION_FORCE_LOCAL=true` força novo build local sem apagar o banco. É contingência excepcional e exige decisão, evidência e plano de retorno.

## 17. Excel como produto institucional

A certificação automatizada percorre:

```text
estado de origem
→ evaluateMonthlyEvaluation
→ modelo lógico
→ plano do workbook, quando aplicável
→ pacote OOXML
→ endereço e valor da célula
→ manifesto SHA-256
```

### Relatório institucional

- histórico e multicompetência;
- quatro abas: `BONIFICACOES`, `SINTESE`, `QUALIDADE_DADOS` e `METADADOS`;
- equivalência com o relatório lógico original e o CSV legado;
- hashes estrutural e de conteúdo;
- botão principal integrado ao XLSX em runtime;
- CSV legado preservado como botão secundário e fallback.

### Excel SME mensal

- uma competência por arquivo;
- todas as unidades no escopo;
- 26 colunas;
- agrupamentos PDDE Básico, Qualidade e Equidade;
- uma planilha mensal;
- ausência de `dataValidations`;
- isolamento entre competências;
- comparação célula a célula;
- botão próprio habilitado somente para competência mensal.

A evidência sintética não consulta Production, não grava dados institucionais e não substitui homologação manual no Microsoft Excel desktop.

## 18. Qualidade e gates

Uma implementação está concluída quando representa os dados, permite localizar a próxima ação, mantém coerência entre visões e exportações, funciona para todos os perfis, preserva desktop/mobile/acessibilidade, mantém histórico e rastreabilidade, possui autorização compatível e passa pelos gates aplicáveis.

O `npm run test:readiness` inclui sintaxe, lint, testes unitários, certificação Excel sintética, integração, readiness Supabase, configuração de runtime, artefatos gerados, tipagem do banco e auditoria funcional.

A cobertura remota inclui pgTAP, Playwright desktop/Android/iPhone, Lighthouse e saúde das dependências.

A faixa de Node permanece `>=24 <27`; a major operacional deve ser fixada deliberadamente antes do release oficial.

## 19. Segurança e liberação oficial

Comprovado:

- acesso anônimo bloqueado;
- RLS por papel e escopo;
- somente chave publicável no frontend;
- Edge Function protegida por JWT;
- autoria e auditoria das mutações;
- concorrência otimista;
- histórico de migrations alinhado e protegido por teste;
- deployments automáticos bloqueados;
- evidência Excel sem dados pessoais.

Permanecem como bloqueadores:

1. homologação manual dos relatórios no Microsoft Excel desktop;
2. proteção contra senhas vazadas no Supabase Auth;
3. fixação da major operacional do Node;
4. backup e restauração em ambiente descartável;
5. gate remoto por perfil e viewport;
6. UAT funcional;
7. polimento editorial e visual;
8. decisão formal de liberação.

## 20. Direção de desenvolvimento vigente

A sequência funcional anterior foi encerrada:

1. competência global — concluída;
2. janeiro a dezembro de 2026 — concluído;
3. avaliação mensal certificada — concluída;
4. timeline cronológica — concluída;
5. certificação e integração Excel — concluídas;
6. navegação contextual — concluída;
7. reconciliação do histórico da migration SME — concluída.

A próxima frente ainda não foi escolhida.

Frentes elegíveis:

- polimento editorial e visual;
- hardening, homologação e release;
- configuração de programas por exercício, em pacote separado.

A escolha deve ser expressa e antecedida por escopo, branch própria, gates e atualização documental.

## 21. Restrições permanentes

Não é permitido:

- alterar código para coincidir com documento histórico;
- criar fonte paralela de competência, avaliação, timeline ou exportação;
- enfraquecer Auth, RLS ou autoria por conveniência de interface;
- conceder mutação operacional à Gestão SME;
- transformar a carteira em fronteira entre Controladores da mesma CRE;
- ocultar informação funcional no mobile;
- introduzir segredo no frontend ou no repositório;
- aplicar migration futura sem histórico alinhado, teste, reset local, pgTAP, lint, tipos, dry-run, backup e rollback;
- editar diretamente a tabela de histórico de migrations;
- reintroduzir `dataValidations` no Excel SME sem nova prova OOXML e homologação;
- remover o CSV de fallback sem decisão e plano de reversão.

## 22. Referências

- [`CURRENT_STAGE.md`](CURRENT_STAGE.md);
- [`DECISION_LOG.md`](DECISION_LOG.md);
- [`reference/STATUS_DOCUMENTOS.md`](reference/STATUS_DOCUMENTOS.md);
- [`architecture/competencias.md`](architecture/competencias.md);
- [`architecture/avaliacao-mensal.md`](architecture/avaliacao-mensal.md);
- [`architecture/timeline-unidade.md`](architecture/timeline-unidade.md);
- [`architecture/navigation-contextual.md`](architecture/navigation-contextual.md);
- [`architecture/excel-export.md`](architecture/excel-export.md);
- [`architecture/excel-sme-mensal.md`](architecture/excel-sme-mensal.md);
- [`architecture/supabase-readiness.md`](architecture/supabase-readiness.md);
- [`runbooks/SUPABASE_CONNECTION.md`](runbooks/SUPABASE_CONNECTION.md);
- [`runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md`](runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md);
- [`audits/2026-07-29-reconciliacao-migration-sme-evidencias.md`](audits/2026-07-29-reconciliacao-migration-sme-evidencias.md).
