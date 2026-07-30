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
- a Vercel Production está `READY` no deployment `dpl_7tLM3RZ7MEuRRTzvGmc9EiAARmDY`;
- o commit funcional publicado é `dfc8aa3030b02edb73f764f5f56bd6759a7a1d77`;
- o runtime opera em `production` e `supabase-production`;
- o Supabase autorizado `scnryinorqeucbfkioxo` está `ACTIVE_HEALTHY`;
- existem 12 competências de 2026;
- `closing_competence = 2026-12`;
- `app_config.row_version = 5`;
- o deployment automático está novamente bloqueado após a janela controlada;
- a liberação oficial ainda não foi declarada.

O commit posterior ao deployment funcional apenas restaurou `git.deploymentEnabled: false` em `vercel.json`.

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

A restrição é aplicada por:

- política de capacidades;
- guardas de interface;
- handlers e serviços de aplicação;
- RLS do Supabase.

A classificação, o cadastro e a disponibilização de programas por exercício permanecem fora desse escopo.

### 4.4 Equipe de Inventário

Executa o fluxo patrimonial autorizado, acompanha bens permanentes, encaminhamentos, inventariação, processos e registros dentro do escopo definido.

### 4.5 Administrador técnico

`technical_admin` existe para segurança, infraestrutura, perfis, escopos, importações e auditoria. Não é perfil operacional equivalente à Assistente.

A simulação visual de perfil altera a política exibida, mas não substitui o JWT nem concede comportamento contrário ao perfil simulado.

## 5. Superfícies principais

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

Toda alteração deve considerar as superfícies em que o dado aparece e os recortes por:

- competência;
- exercício;
- Controlador;
- CRE e região administrativa;
- escola;
- programa;
- documento;
- situação;
- autoria;
- perfil efetivo.

## 6. Competência como contexto transversal

A competência canônica usa `YYYY-MM`.

O contexto mensal é único para toda a aplicação e orienta:

- Dashboard;
- Carteira;
- Competências;
- Prontuário;
- Pendências e alertas;
- timeline;
- exportações Excel.

O domínio `RadarCompetenceContext`:

- normaliza e valida competências;
- disponibiliza as competências existentes do exercício;
- prioriza seleção persistida válida, seleção explícita, fechamento e fallback cronológico;
- sincroniza exercício e competência;
- persiste a seleção durante a sessão;
- notifica as superfícies por uma fonte de contexto única.

As 12 competências de 2026 estão disponíveis. A aplicação não mantém seletores mensais concorrentes por tela.

Competência existente, competência disponível e competência formalmente fechada são conceitos distintos.

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

Situação técnica e grau de conclusão são dimensões independentes. Um documento incorreto não significa necessariamente que toda a análise da unidade esteja concluída.

Consulta, consolidação, telas e certificação dos relatórios utilizam a mesma regra canônica.

## 8. Pendências e regularização

Estados canônicos:

- `Aberta`;
- `Aguardando reanálise`;
- `Resolvida`;
- `Cancelada`.

Resultados de tentativa incluem:

- aguardando;
- correto;
- incorreto;
- arquivo indisponível;
- substituída antes da análise.

O sistema preserva motivo, documento, escola, programa, responsável, tentativas, contatos, datas, resultado, histórico e próxima ação.

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
- notas fiscais e despesas registradas;
- bens permanentes, encaminhamento e inventariação;
- registros administrativos autorizados.

A projeção preserva:

- ordem cronológica decrescente;
- desempate estável;
- autoria;
- competência;
- programa;
- vínculo com pendência;
- origem do evento;
- visibilidade por perfil.

A abertura já representada no histórico da pendência não é duplicada. A Gestão SME não recebe detalhes técnicos restritos.

A aba **Histórico cronológico** integra o Prontuário e é montada por DOM seguro.

## 10. Navegação contextual

O módulo `RadarNavigationContext` complementa as rotas canônicas sem criar roteador paralelo.

Fluxo:

```text
origem operacional
→ captura de competência, rota, filtros, rolagem e foco
→ Prontuário ou Pendências
→ ação Voltar para …
→ restauração da origem e do controle acionável
```

Características:

- contexto armazenado somente em `sessionStorage`;
- pilha limitada a 12 transições;
- captura antes da entrada em telas de aprofundamento;
- restauração da competência pelo contexto global;
- suporte a scroll próprio no desktop e scroll da página no mobile;
- foco restaurado somente em elemento visível e acionável;
- fallback **Voltar para Carteira** em acesso direto, favorito ou nova aba;
- nenhuma persistência remota;
- nenhum dado documental armazenado no contexto de retorno.

A jornada foi validada em desktop, Android e iPhone.

## 11. Entidades canônicas

O contrato de repositório inclui:

- configuração;
- programas;
- perfis e perfis de usuário;
- escopos escolares;
- Controladores;
- equipe de Inventário;
- escolas e programas por escola;
- competências;
- verificações;
- pendências, tentativas e contatos;
- bens;
- notas registradas;
- logs administrativos;
- execuções de importação;
- eventos de auditoria.

Nenhuma superfície deve persistir cópia paralela capaz de divergir dessas entidades.

## 12. Persistência

```text
Frontend
   ↓
Serviços de aplicação e unidade de trabalho
   ↓
Contrato de repositório
   ├── SupabaseRepository — Preview e Production
   └── LocalStorageRepository — rollback emergencial
```

O adaptador remoto utiliza:

- paginação e lotes;
- tratamento padronizado de erros;
- concorrência otimista por `row_version`;
- snapshots;
- operações RPC compostas;
- reconciliação e rollback.

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
        ├── diretório organizacional
        ├── user_profiles
        ├── redistribuição, quando aplicável
        └── administrative_logs
```

A credencial administrativa nunca chega ao navegador. Falhas compensam convite, edição ou bloqueio para evitar divergência entre conta e diretório.

## 14. Autorização

- anônimo: sem acesso institucional;
- Controlador: operação nas escolas da própria `cre_scope`, com carteira como recorte padrão;
- Assistente: operação transversal e Gestão de Equipe plena;
- Inventário: operação patrimonial autorizada;
- SME: leitura gerencial conforme governança restritiva;
- Administrador técnico: infraestrutura, perfis, escopos e auditoria.

Controlador sem `cre_scope` não recebe acesso transversal automático. Escola de outra CRE permanece bloqueada, salvo exceção explícita em `user_school_scopes`.

Exclusão física é excepcional. A remoção funcional de integrante é desativação lógica e auditada.

## 15. Migração, backup e restauração

Fluxo obrigatório:

```text
snapshot → validação → plano → dry-run → staging
         → retomada → reconciliação → promoção atômica
         → reconciliação do destino → rollback comprovado
```

Seed local não é dado institucional. Importação administrativa não ocorre no navegador.

O projeto possui contratos, scripts e runbooks de migração e rollback. Antes da liberação oficial, backup e restauração ainda precisam ser exercitados em ambiente descartável com evidência reproduzível.

## 16. Ambientes

### 16.1 Desenvolvimento local

Pode usar Supabase local e fixtures descartáveis. Não representa Production.

### 16.2 Preview

```text
environment: preview
dataMode: supabase-preview
supabaseRepositoryEnabled: true
productionActivationApproved: false
```

Usado para homologação remota, identidades temporárias e testes antes de Production.

### 16.3 Production

```text
environment: production
dataMode: supabase-production
supabaseRepositoryEnabled: true
productionActivationApproved: true
```

O projeto autorizado é `scnryinorqeucbfkioxo`. O build público contém somente configuração publicável.

### 16.4 Rollback emergencial

`RADAR_PRODUCTION_FORCE_LOCAL=true` força novo build local sem apagar o banco. Esse modo é contingência excepcional e exige decisão, evidência e plano de retorno.

## 17. Excel como produto institucional

Os relatórios Excel são produtos finais do sistema e devem corresponder aos lançamentos canônicos.

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

### 17.1 Relatório institucional

- histórico e multicompetência;
- uma linha por escola, competência e programa consolidado;
- quatro abas: `BONIFICACOES`, `SINTESE`, `QUALIDADE_DADOS` e `METADADOS`;
- equivalência com o relatório lógico original e o CSV legado;
- hashes estrutural e de conteúdo.

O botão institucional ainda permanece vinculado ao CSV.

### 17.2 Excel SME mensal

- uma competência por arquivo;
- todas as unidades no escopo;
- 26 colunas;
- agrupamentos PDDE Básico, Qualidade e Equidade;
- uma planilha mensal;
- ausência de `dataValidations` que provocavam reparo;
- isolamento entre competências;
- comparação célula a célula.

### 17.3 Limite do gate automatizado

A evidência sintética:

- não consulta Production;
- não grava dados institucionais;
- não substitui homologação manual no Microsoft Excel desktop.

## 18. Qualidade de produto

Uma implementação está concluída quando:

- representa corretamente os dados;
- permite localizar e executar a próxima ação;
- mantém coerência entre visões e exportações;
- funciona para todos os perfis afetados;
- preserva desktop e mobile;
- mantém acessibilidade, histórico e rastreabilidade;
- possui autorização e persistência compatíveis com o frontend;
- possui feedback sem expor infraestrutura;
- passa pelos testes e gates aplicáveis;
- atualiza documentação e evidências.

## 19. Toolchain e testes

O gate `npm run test:readiness` inclui:

- sintaxe dos módulos;
- lint de segurança;
- lint Playwright;
- testes unitários;
- certificação Excel sintética;
- testes de integração;
- readiness e alinhamento final do Supabase;
- configuração de runtime;
- artefatos gerados;
- tipagem do banco;
- auditoria funcional.

A cobertura remota inclui Supabase local/pgTAP, Playwright desktop, Android e iPhone, Lighthouse e saúde das dependências.

A faixa de Node permanece `>=24 <27`; a major operacional deve ser fixada deliberadamente antes do release oficial.

## 20. Segurança e liberação oficial

Comprovado:

- acesso anônimo bloqueado;
- RLS por papel e escopo;
- somente chave publicável no frontend;
- Edge Function protegida por JWT;
- autoria e auditoria das mutações;
- concorrência otimista;
- deployments automáticos novamente bloqueados;
- evidência Excel sem dados pessoais.

Permanecem como bloqueadores:

1. homologação manual dos relatórios no Microsoft Excel desktop;
2. habilitação da proteção contra senhas vazadas no Supabase Auth;
3. fixação da major operacional do Node;
4. teste de backup e restauração em ambiente descartável;
5. gate remoto por perfil e viewport;
6. UAT funcional;
7. polimento editorial e visual;
8. decisão formal de liberação.

## 21. Direção de desenvolvimento vigente

A sequência funcional anterior foi encerrada:

1. competência global — concluída;
2. janeiro a dezembro de 2026 — concluído;
3. avaliação mensal certificada — concluída;
4. timeline cronológica — concluída;
5. certificação automatizada Excel — concluída;
6. navegação contextual — concluída.

A próxima frente ainda não foi escolhida. Nenhum novo ciclo funcional está autorizado por este documento.

O cadastro e a disponibilização de programas por exercício continuam fora do escopo até decisão específica.

Referência operacional: [`CURRENT_STAGE.md`](CURRENT_STAGE.md).  
Auditoria: [`audits/2026-07-29-reconciliacao-pos-ciclos-1-5.md`](audits/2026-07-29-reconciliacao-pos-ciclos-1-5.md).
