# RADAR PDDE — Auditoria de reconsolidação de contexto, código e documentação

**Data:** 29 de julho de 2026  
**Repositório:** `WilsonMPeixoto-2/RADARPDDE`  
**Branch auditada:** `main`  
**Linha de base funcional:** `598361dd784563f4d70d1e25df3818f4ee066da8`  
**Escopo:** leitura de código, reconstrução de decisões, verificação de ambientes e atualização documental  
**Alteração de runtime:** nenhuma

## 1. Objetivo

Reconstruir o contexto técnico e funcional do RADAR PDDE após a saturação dos chats anteriores, verificar o estado real do código e dos ambientes, confrontar decisões consolidadas com a implementação vigente e corrigir a documentação canônica que havia ficado atrás do desenvolvimento.

Esta auditoria não redesenha o produto e não cria nova arquitetura. Seu papel é restabelecer uma base confiável para continuidade.

## 2. Fontes verificadas

### 2.1 GitHub

Foram verificados:

- metadados do repositório e branch principal;
- commits mais recentes da `main`;
- PRs #87 a #106 relevantes à governança SME e aos ciclos de oficialização;
- arquivos modificados nos PRs #87, #100, #103 e #104;
- documentação canônica existente;
- módulos centrais de domínio e integração;
- configuração de build, testes e deployment.

### 2.2 Vercel

Projeto:

```text
radarpdde-fix
projectId: prj_GfXuUuO3dF2jykpp9QgyqIDsxg4U
teamId: team_EFJunPOtGozS99jZ6zkIQXHF
```

Deployment Production verificado:

```text
id: dpl_7tLM3RZ7MEuRRTzvGmc9EiAARmDY
state: READY
target: production
githubCommitSha: dfc8aa3030b02edb73f764f5f56bd6759a7a1d77
message: ops: publicar navegação contextual em Production (#105)
```

A configuração vigente mantém:

```json
{
  "git": {
    "deploymentEnabled": false
  }
}
```

O bloqueio foi restaurado pelo PR #106 depois da publicação e do smoke do Ciclo 5.

### 2.3 Supabase

Projeto autorizado:

```text
id: scnryinorqeucbfkioxo
name: RADAR PDDE 2026
status: ACTIVE_HEALTHY
region: sa-east-1
PostgreSQL: 17
```

Advisor de segurança verificado:

```text
auth_leaked_password_protection
Leaked Password Protection Disabled
nível: WARN
```

A proteção contra senhas vazadas permanece bloqueador objetivo antes da liberação oficial.

### 2.4 Decisões reconstruídas dos chats anteriores

Foram preservadas como contexto vinculante:

- GitHub, Vercel e Supabase são as fontes operacionais;
- o repositório remoto é a fonte de verdade, sem cópia local canônica;
- Gestão SME é perfil gerencial somente leitura nas superfícies definidas;
- configuração de programas por exercício é frente separada e não integra a governança SME já concluída;
- carteira organiza responsabilidade, mas não restringe colaboração entre Controladores da mesma CRE;
- bonificação, análise técnica e pendência são dimensões independentes;
- timeline deve ser projeção, não nova persistência;
- competência mensal deve ser contexto transversal único;
- exportações Excel são produtos institucionais e exigem paridade integral;
- polimento visual não pode alterar paleta, logomarca, capacidades, nomenclatura ou decisões de produto;
- alteração funcional somente se considera concluída quando interface, serviço, persistência, autorização, testes, documentação e implantação estiverem coerentes.

## 3. Arquitetura observada no código

O projeto é uma aplicação JavaScript sem framework de UI. O núcleo legado permanece em `app.js`, com novas capacidades isoladas em módulos especializados.

### 3.1 Padrão de módulos

Os módulos recentes seguem o padrão:

```text
domínio puro
   ↓
serviço ou integração específica
   ↓
bootstrap idempotente pós-app.js
   ↓
superfície existente
```

Características:

- formato compatível com navegador e `node:test`;
- ausência de dependência de DOM no domínio;
- montagem segura por APIs do DOM;
- carregamento coordenado por eventos;
- degradação segura quando extensão não está instalada;
- testes unitários antes da integração visual;
- testes E2E em desktop, Android e iPhone.

### 3.2 Controle de acesso

`src/domain/access-policy.js` centraliza capacidades como:

- visualização de análise técnica;
- visualização e mutação de pendências;
- registro de contato;
- cancelamento e reabertura;
- leitura integral ou própria de registros administrativos.

O perfil SME possui apenas `VIEW_OWN_ADMINISTRATIVE_LOGS` na política de capacidades. As mutações também são bloqueadas em handlers, serviços e RLS.

### 3.3 Competência global

`src/domain/competence-context.js` implementa:

- chave canônica `YYYY-MM`;
- seleção global única;
- persistência em `radar_pdde_active_competence`;
- validação por exercício;
- prioridade de seleção persistida, explícita, fechamento e competência mais recente;
- inscrição de listeners;
- atualização de configuração sem notificação redundante.

### 3.4 Timeline

`src/domain/school-timeline.js` projeta eventos de:

- verificações e consolidações;
- pendências e resoluções;
- tentativas e reanálises;
- contatos;
- notas fiscais;
- bens e inventariação;
- registros administrativos.

A projeção preserva entidade e identificador de origem, competência, programa, pendência, autoria, visibilidade e ordenação estável.

### 3.5 Certificação Excel

A certificação integral utiliza:

- `src/domain/excel-integral-certification.js`;
- `scripts/generate-excel-certification-evidence.mjs`;
- manifesto versionado em `docs/evidence/excel-certification/synthetic-manifest.json`;
- gate `certify:excel:fixture` dentro de `test:readiness`.

A implementação executa os modelos e renderers reais, lê o OOXML produzido e compara células por endereço e valor.

### 3.6 Navegação contextual

O Ciclo 5 utiliza:

- `src/integration/navigation-context.js`;
- `src/integration/navigation-context-bootstrap.js`;
- `src/integration/product-extensions-bootstrap.js`;
- History API e rotas canônicas existentes;
- `sessionStorage` para contexto efêmero de retorno.

Não foi criado segundo roteador nem persistência remota de navegação.

### 3.7 Persistência e qualidade

O projeto mantém:

- `SupabaseRepository` e `LocalStorageRepository` sob contrato único;
- unidade de trabalho e serviços de aplicação;
- RLS, RPCs e `row_version`;
- Supabase Auth e Edge Function para Gestão de Equipe;
- Playwright, pgTAP, Lighthouse, lint de HTML não sanitizado, Knip e auditoria funcional;
- renderer OOXML próprio, sem ExcelJS.

## 4. Sequência real dos ciclos

| Ciclo | Entrega | PR funcional | Publicação |
|---|---|---:|---|
| Governança SME | somente leitura em interface, serviços e RLS | #87 | #88–#89 |
| 1 | competência mensal global | #92 | #95–#96 |
| 2 | avaliação mensal certificada | #98 | #101–#102 |
| 3 | timeline cronológica | #100 | #101–#102 |
| 4 | certificação integral dos Excels | #103 | integrada à `main`; não exigiu alteração de banco |
| 5 | navegação contextual | #104 | #105–#106 |

## 5. Divergências documentais encontradas

### 5.1 `README.md`

Estava congelado no estado de 28/07/2026 anterior aos ciclos de oficialização e afirmava como pendentes:

- competência global;
- disponibilização de junho a dezembro;
- certificação da avaliação mensal;
- timeline;
- certificação integral dos Excels;
- navegação contextual.

Essas entregas já estavam concluídas ou publicadas.

### 5.2 `docs/CURRENT_STAGE.md`

Já registrava os Ciclos 1 a 4, mas ainda classificava o Ciclo 5 como “em validação no PR #104”. O PR havia sido mesclado, publicado e encerrado por janela controlada.

### 5.3 `docs/PROJECT_CONTEXT.md`

Ainda afirmava que o frontend estava limitado a maio e que a competência global era a próxima frente. A seção de direção de desenvolvimento tratava os ciclos 1 a 5 como futuros.

### 5.4 `docs/README.md`

O índice documental ainda indicava:

- operação limitada a maio;
- avaliação mensal pendente de certificação;
- Excel pendente de certificação;
- sequência dos ciclos 1 a 5 como plano futuro.

Também não indexava os novos documentos de arquitetura de timeline, ordem das extensões, certificação integral e navegação contextual.

### 5.5 Plano de oficialização

O plano mestre de 28/07/2026 permanece com caixas de seleção originais. Como é um artefato de implementação extenso e historicamente útil, não foi reescrito nem teve as caixas alteradas manualmente.

Passa a ser classificado expressamente como **plano histórico de referência**. O estado corrente deve ser lido em `docs/CURRENT_STAGE.md`.

## 6. Documentos atualizados nesta reconsolidação

- `README.md`;
- `docs/README.md`;
- `docs/CURRENT_STAGE.md`;
- `docs/PROJECT_CONTEXT.md`;
- este relatório de auditoria.

Não foram alterados:

- `app.js`;
- arquivos em `src/`;
- migrations;
- políticas RLS;
- funções Supabase;
- configuração de runtime;
- `vercel.json`;
- artefatos gerados;
- manifests de evidência.

## 7. Decisões vigentes que não devem ser reabertas implicitamente

1. Production usa Supabase como persistência canônica.
2. LocalStorage é contingência de rollback, não fonte normal.
3. Administrador técnico é papel separado da Assistente.
4. Gestão SME permanece somente leitura conforme ADR-022.
5. Controladores colaboram nas escolas da mesma CRE.
6. Competência mensal é contexto global único.
7. Timeline é projeção, não nova tabela.
8. Exportações exigem certificação integral.
9. Navegação de retorno preserva contexto operacional.
10. Polimento visual preserva identidade e decisões de produto.
11. Release oficial depende de gate cumulativo.
12. Configuração de programas por exercício permanece fora do escopo da governança SME concluída.

## 8. Bloqueadores restantes

Antes da liberação oficial:

- executar polimento editorial e visual;
- homologar manualmente os Excels no Microsoft Excel desktop;
- habilitar proteção contra senhas vazadas no Supabase Auth;
- restringir a faixa de Node do repositório à major operacional aprovada;
- testar backup e restauração em ambiente descartável;
- executar matriz remota por perfil, competência e viewport;
- concluir UAT;
- registrar decisão formal de liberação.

## 9. Próxima frente recomendada

### Ciclo 6 — polimento editorial e visual

Escopo permitido:

- hierarquia tipográfica;
- espaçamento e densidade;
- legibilidade;
- consistência de ícones e botões;
- tabelas, cartões e estados;
- responsividade;
- mensagens ao usuário;
- remoção de textos técnicos de infraestrutura das superfícies operacionais.

Restrições:

- não alterar paleta;
- não alterar logomarca;
- não alterar capacidades;
- não alterar nomenclatura canônica;
- não alterar fluxo ou regra de negócio sem decisão específica;
- não usar o polimento como justificativa para refatoração ampla não relacionada.

Antes de implementar, deve ser produzida uma auditoria visual por superfície e perfil, com priorização por impacto e risco.

## 10. Higiene pendente do repositório

O PR #94 permanece aberto como rascunho histórico da primeira branch empilhada da timeline. Foi substituído pelo PR #100 e não deve ser mesclado.

O fechamento deve ocorrer em tarefa de manutenção separada, para que esta reconsolidação permaneça exclusivamente documental.

## 11. Conclusão

O código e os ambientes estavam materialmente mais avançados do que os documentos de entrada. A divergência não indicava falha de implementação, mas falha de continuidade documental.

Após esta atualização, o estado canônico passa a ser:

```text
Ciclos 1 a 5 concluídos e publicados
→ próxima frente: polimento editorial e visual
→ depois: segurança, restauração, homologação, UAT e release
```

Nenhuma mudança funcional foi realizada nesta auditoria.
