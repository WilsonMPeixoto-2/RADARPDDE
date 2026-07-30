# RADAR PDDE 2026 — Contexto funcional e arquitetural

**Revisão de contexto:** 29 de julho de 2026  
**Estado técnico de referência:** ciclos 1 a 5 da oficialização concluídos e publicados  
**Próxima frente:** polimento editorial e visual

## 1. Finalidade

O RADAR PDDE organiza o ciclo de análise, acompanhamento, regularização, consolidação, prestação de contas, inventário e apoio à decisão dos programas do PDDE no âmbito da 4ª CRE/SME-Rio.

O sistema deve permitir que cada usuário compreenda:

1. o estado atual;
2. o que exige atenção;
3. quem deve agir;
4. qual é a próxima ação;
5. onde realizar essa ação;
6. como o histórico foi formado;
7. qual competência e programa sustentam a informação;
8. como a informação foi refletida nos relatórios institucionais.

Dashboard, Carteira, Competências, Prontuário, Pendências, Inventário, Registros, timeline e exportações representam o mesmo universo de dados e não podem criar verdades independentes.

## 2. Princípios de produto

- a unidade escolar é a entidade monitorada;
- a identidade operacional é `escola + competência + programa`;
- bonificação, análise técnica e pendência são dimensões independentes;
- o histórico deve ser derivado das entidades canônicas;
- a carteira organiza responsabilidade, mas não isola Controladores da mesma CRE;
- a Gestão SME exerce consulta gerencial e não operação cotidiana;
- mobile preserva conteúdo, contexto e capacidades essenciais;
- exportações são produtos finais e precisam corresponder aos dados canônicos;
- toda alteração relevante deve abranger interface, serviço, persistência, autorização, testes, documentação e implantação;
- código, banco, deployment e evidências prevalecem sobre documentos históricos.

## 3. Perfis funcionais

### 3.1 Controlador

Possui carteira de responsabilidade principal, usada como filtro inicial e organização do trabalho. Também pode consultar e executar ações operacionais nas demais escolas da própria CRE para colaboração, substituição e cobertura da equipe.

A atuação fora da carteira não transfere automaticamente a responsabilidade principal. `schools.controller_id` permanece como atribuição ordinária, enquanto a autoria real da ação é registrada pelo usuário autenticado.

### 3.2 Assistente de Verbas Federais

Representa a liderança operacional da GAD da CRE. O perfil:

- acompanha transversalmente as escolas;
- apoia e coordena os Controladores;
- administra Controladores, integrantes de Inventário e carteiras;
- cadastra, edita, convida, desativa e redistribui conforme autorização;
- executa retificações e ações transversais autorizadas;
- consolida informações e relatórios operacionais.

### 3.3 Gestão SME

Acompanha a situação das coordenadorias por visões consolidadas e parâmetros institucionais autorizados.

Nas visões mensal e do Prontuário:

- consulta identificação da unidade e bonificação;
- não visualiza análise técnica;
- não executa ações operacionais.

Em Pendências:

- consulta listas, histórico e detalhes autorizados;
- não registra novo envio, substituição, reanálise, contato, cancelamento, reabertura ou nova pendência.

Em Registros Internos:

- consulta apenas ações cujo `actor_user_id` corresponde ao próprio UUID autenticado;
- registros históricos sem UUID de autor não são exibidos.

A restrição é aplicada em política de capacidades, guardas de interface, handlers, serviços e RLS. Ocultar botões isoladamente não satisfaz a regra de negócio.

### 3.4 Equipe de Inventário

Executa o fluxo patrimonial, acompanha bens permanentes, encaminhamentos, inventariação, processos e registros dentro do escopo autorizado.

## 4. Papel técnico

`technical_admin` existe para segurança, infraestrutura, perfis, escopos, importações e auditoria. Não é perfil operacional e não herda automaticamente identidade ou funções da Assistente.

A simulação de perfil pelo Administrador técnico altera a política visual efetiva, mas não substitui o JWT autenticado nem concede comportamento contrário ao perfil simulado.

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
- perfil efetivo;
- origem de navegação.

## 6. Competência como contexto transversal

A competência canônica utiliza `YYYY-MM`.

O estado mensal é único para toda a aplicação e orienta:

- Dashboard;
- Carteira;
- Competências;
- Prontuário;
- Pendências e alertas;
- timeline;
- exportações Excel.

A aplicação não mantém seleções mensais independentes por tela. A competência ativa é visível, selecionável, persistida durante a sessão e preservada na navegação e na recarga.

O domínio `RadarCompetenceContext`:

- normaliza as competências disponíveis;
- restringe a seleção ao exercício ativo;
- prioriza seleção persistida válida, seleção inicial explícita, fechamento válido e competência mais recente;
- rejeita competência inexistente ou indisponível;
- notifica assinantes somente quando o estado muda;
- persiste apenas a chave `YYYY-MM`.

Em 29/07/2026, janeiro a dezembro de 2026 estão disponíveis e `closing_competence = 2026-12`.

## 7. Avaliação mensal

Cada avaliação é identificada por:

```text
escola + competência + programa
```

O registro contém dimensões independentes:

- bonificação;
- análise técnica;
- resultado derivado;
- pendências correlatas;
- autoria, datas e versão.

A projeção canônica `evaluateMonthlyEvaluation` reúne:

- possibilidade de consolidação;
- resultado `apta`, `inapta` ou nulo;
- campos ausentes;
- estágio da bonificação;
- situação técnica;
- grau de conclusão `not_started`, `in_progress` ou `complete`;
- pendências abertas;
- itens aguardando reanálise;
- total de pendências ativas.

Consulta e consolidação usam a mesma projeção. A persistência permanece atômica, auditada e protegida por `row_version`.

Situação técnica e grau de conclusão não são equivalentes. Uma análise pode conter documento incorreto e ainda permanecer incompleta quando outros itens não foram analisados.

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

O sistema preserva motivo, documento, escola, programa, responsável, tentativas, contatos, datas, resultado, histórico e próxima ação. Resolver ou cancelar não apaga o percurso.

Novo envio não resolve a pendência. A resolução exige reanálise positiva. Reanálise negativa devolve a providência ao fluxo aberto.

Pendência, tentativa ou regularização não alteram automaticamente o resultado histórico da bonificação.

## 9. Histórico cronológico

O histórico profissional da unidade é uma projeção das entidades canônicas, não uma nova fonte de verdade.

Eventos projetados incluem:

- consolidação da avaliação mensal;
- abertura de pendência;
- contato ou atendimento;
- novo envio;
- reanálise;
- resolução, cancelamento e reabertura;
- nota fiscal ou despesa;
- bem permanente e inventariação;
- alteração administrativa permitida.

A timeline preserva:

- ordem cronológica decrescente;
- desempate estável;
- autoria;
- competência;
- programa;
- vínculo com pendência;
- entidade de origem;
- visibilidade por perfil.

A abertura de pendência já representada no histórico próprio não é duplicada. Detalhes técnicos restritos são ocultados da Gestão SME.

A timeline não cria tabela, migration, RPC ou persistência derivada.

## 10. Entidades canônicas

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

## 11. Persistência

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

Production e Preview usam Supabase. O modo local não é a fonte normal de dados institucionais.

## 12. Arquitetura do frontend

O projeto permanece uma aplicação JavaScript sem framework de UI. `app.js` concentra o núcleo legado, enquanto capacidades novas são implementadas em módulos especializados.

Padrão vigente:

```text
módulo de domínio puro
   ↓
serviço ou integração específica
   ↓
bootstrap idempotente pós-app.js
   ↓
superfície existente
```

Características:

- módulos compatíveis com navegador e Node Test Runner;
- domínio sem dependência de DOM;
- montagem segura por APIs de DOM;
- carregamento coordenado por eventos e `product-extensions-bootstrap.js`;
- degradação segura quando a extensão não está disponível;
- ausência de um segundo roteador concorrente;
- extensões visuais e de navegação preservam o núcleo funcional existente.

## 13. Navegação e retorno contextual

Rotas canônicas:

```text
/dashboard
/carteira
/competencias
/pendencias
/inventario
/auditoria
/equipe
/gestao-sme
/escolas/:schoolId
/escolas/:schoolId/pendencias
/pendencias?escola=:schoolId
```

A navegação usa History API integrada a `switchView()`.

O contexto de retorno:

- é armazenado somente em `sessionStorage`;
- mantém pilha limitada a 12 transições;
- registra competência, rota, filtros, rolagem e alvo de foco;
- restaura o scrollport efetivo de desktop ou mobile;
- devolve o foco apenas a controle acionável;
- usa **Voltar para Carteira** como fallback de acesso direto;
- não contém dados pessoais nem conteúdo documental.

## 14. Gestão de contas da equipe

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

## 15. Autorização

- anônimo: sem acesso institucional;
- Controlador: operação nas escolas da própria `cre_scope`, com carteira como recorte padrão;
- Assistente: operação transversal e Gestão de Equipe plena;
- Inventário: operação patrimonial autorizada;
- SME: leitura gerencial conforme governança restritiva;
- Administrador técnico: infraestrutura, perfis, escopos e auditoria.

Controlador sem `cre_scope` não recebe acesso transversal automático. Escola de outra CRE permanece bloqueada, salvo exceção explícita em `user_school_scopes`.

Exclusão física é excepcional. A remoção funcional de integrante é desativação lógica e auditada.

## 16. Migração e restauração

Fluxo obrigatório:

```text
snapshot → validação → plano → dry-run → staging
         → retomada → reconciliação → promoção atômica
         → reconciliação do destino → rollback comprovado
```

Seed local não é dado institucional. Importação administrativa não ocorre no navegador.

Backup e restauração devem ser testados periodicamente em ambiente descartável, não apenas documentados.

## 17. Ambientes

### Desenvolvimento local

Pode usar Supabase local e fixtures descartáveis. Não representa Production.

### Preview

```text
environment: preview
dataMode: supabase-preview
supabaseRepositoryEnabled: true
productionActivationApproved: false
```

Usado para homologação remota, identidades temporárias e testes antes de Production.

### Production

```text
environment: production
dataMode: supabase-production
supabaseRepositoryEnabled: true
productionActivationApproved: true
```

O projeto autorizado é `scnryinorqeucbfkioxo`, em `ACTIVE_HEALTHY`, região `sa-east-1`. O build público contém apenas configuração publicável.

A Vercel Production usa Node `24.x`. `vercel.json` mantém `git.deploymentEnabled: false`, exigindo janela controlada para nova publicação.

### Rollback emergencial

`RADAR_PRODUCTION_FORCE_LOCAL=true` força novo build local sem apagar o banco. Esse modo é contingência excepcional e deve possuir decisão, evidência e plano de retorno.

## 18. Excel como produto final

Os relatórios Excel são produtos institucionais do sistema. A informação exportada deve corresponder integralmente aos lançamentos canônicos.

Produtos distintos:

### Relatório institucional

- histórico e multicompetência;
- modelo certificado com quatro abas;
- equivalência lógica com o CSV legado;
- renderer OOXML próprio.

### Excel SME mensal

- uma única competência por arquivo;
- uma única aba com o nome do mês;
- 26 colunas;
- agrupamentos PDDE Básico, Qualidade e Equidade;
- ausência de `dataValidations` incompatíveis com o Microsoft Excel.

Cadeia de certificação:

```text
estado de origem
→ evaluateMonthlyEvaluation
→ modelo lógico
→ plano do workbook
→ pacote OOXML
→ endereço e valor da célula
→ manifesto SHA-256
```

A certificação automatizada está implementada e integrada ao readiness. Ela confirma zero divergências na massa sintética e isolamento entre competências.

Limites atuais:

- o botão institucional exposto ainda preserva o CSV legado;
- a abertura manual no Microsoft Excel desktop precisa de homologação e evidência;
- a massa de certificação é sintética e não consulta Production.

## 19. Qualidade de produto

Uma implementação está concluída quando:

- representa corretamente os dados;
- permite localizar e executar a próxima ação;
- mantém coerência entre visões e exportações;
- funciona para todos os perfis afetados;
- preserva desktop e mobile;
- mantém acessibilidade, histórico e rastreabilidade;
- possui autorização e persistência compatíveis com o frontend;
- possui feedback de erro e sucesso sem expor infraestrutura;
- passa pelos testes e gates aplicáveis;
- atualiza documentação canônica e evidências;
- é publicada de forma controlada quando o escopo exige Production.

## 20. Segurança e release

Comprovado:

- acesso anônimo bloqueado;
- somente chave publicável no frontend;
- RLS por papel e escopo;
- Edge Function protegida por JWT;
- autoria e auditoria preservadas;
- deployment automático bloqueado;
- evidências sintéticas sem dados pessoais.

Pendências antes do release oficial:

- habilitar proteção contra senhas vazadas no Supabase Auth;
- restringir deliberadamente a faixa de Node do repositório à major operacional aprovada;
- testar backup e restauração em ambiente descartável;
- homologar os arquivos no Microsoft Excel desktop;
- executar matriz remota de jornadas por perfil, competência e viewport;
- concluir UAT;
- registrar decisão formal de liberação.

## 21. Direção de desenvolvimento vigente

Os subprojetos de competência global, avaliação mensal, timeline, certificação Excel e navegação contextual estão concluídos.

Ordem atual:

1. polimento editorial e visual;
2. fortalecimento de segurança e infraestrutura de release;
3. homologação manual dos Excels e restauração;
4. gate remoto por perfil, competência e viewport;
5. UAT;
6. decisão formal de liberação oficial.

O polimento pode melhorar hierarquia, legibilidade, espaçamento, ícones, botões, tabelas, cartões, estados e responsividade. Não pode alterar paleta, logomarca, capacidades, nomenclatura canônica, fluxos ou decisões de produto sem nova decisão específica.

Plano histórico: [`superpowers/plans/2026-07-28-oficializacao-operacional-radar-pdde.md`](superpowers/plans/2026-07-28-oficializacao-operacional-radar-pdde.md). Para estado corrente, prevalece [`CURRENT_STAGE.md`](CURRENT_STAGE.md).
