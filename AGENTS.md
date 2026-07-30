# AGENTS.md — RADAR PDDE 2026

**Atualizado em:** 29 de julho de 2026

## 1. Leitura obrigatória

Antes de analisar ou alterar o repositório, leia:

1. `docs/CURRENT_STAGE.md` — estado transitório, bloqueadores e próxima decisão;
2. `docs/PROJECT_CONTEXT.md` — domínio e arquitetura estáveis;
3. `docs/DECISION_LOG.md` — decisões vigentes e substituídas;
4. `docs/reference/STATUS_DOCUMENTOS.md` — validade dos documentos;
5. a arquitetura específica da frente;
6. o código remoto real da `main`, PRs relevantes e ambientes correspondentes.

Documentos antigos de “estado atual”, planos, relatórios, specs e handoffs são fontes históricas. Não prevalecem sobre código, ambientes e decisões posteriores.

## 2. Identidade do produto

O RADAR PDDE é sistema institucional de gestão, controle, acompanhamento e apoio à decisão para o PDDE da 4ª CRE/SME-Rio. Não é CRUD genérico.

Toda entrega deve ser avaliada por:

- correção técnica;
- aderência ao fluxo real do PDDE;
- usabilidade administrativa;
- coerência entre perfis, telas e dados;
- integridade, rastreabilidade e auditabilidade;
- acessibilidade e equivalência mobile;
- clareza da próxima ação.

Passar em testes técnicos não basta quando a funcionalidade está difícil de localizar, compreender ou operar.

## 3. Fontes de verdade

Para determinar o estado implementado:

1. código-fonte remoto da branch/commit analisado;
2. migrations, funções, políticas, Auth e dados efetivos do Supabase autorizado;
3. artefato efetivamente implantado na Vercel e seu SHA;
4. testes e evidências reproduzíveis;
5. decisões expressas vigentes;
6. `docs/CURRENT_STAGE.md`;
7. `docs/PROJECT_CONTEXT.md` e contratos de arquitetura;
8. documentos históricos.

A orientação mais recente do responsável define intenção, prioridade e decisão de produto, mas afirmação técnica deve ser confirmada nas fontes operacionais.

Não use clone antigo, memória isolada de chat, última tarefa cronológica ou texto de PR como prova sem conferir o estado remoto.

## 4. Estado operacional de referência

Na data de corte:

```text
Supabase: scnryinorqeucbfkioxo — ACTIVE_HEALTHY
Production dataMode: supabase-production
repositório canônico: SupabaseRepository
contingência: LocalStorageRepository por novo build controlado
closing_competence: 2026-12
ciclos 1–5: concluídos e publicados
liberação oficial: ainda não declarada
```

Esses dados são mutáveis. Revalidar antes de tarefa que dependa do estado atual.

## 5. Perfis e autorização

A interface possui quatro perfis funcionais visíveis:

- Controlador (`controller`);
- Assistente de Verbas Federais (`federal_assistant`);
- SME (Gestão) (`sme_management`);
- Equipe de Inventário (`inventory`).

`technical_admin` é papel técnico separado:

- não é quinto perfil operacional comum;
- administra infraestrutura, perfis, escopos, importações e auditoria;
- pode simular a organização visual dos quatro perfis para suporte e homologação;
- mantém JWT e identidade técnica durante a simulação;
- não substitui testes com contas operacionais reais.

### 5.1 Assistente

A Assistente de Verbas Federais é a liderança direta da equipe da GAD/CRE e possui gestão autorizada de:

- cadastro, edição e desativação de Controladores;
- convite e conta de acesso;
- distribuição e redistribuição de escolas;
- cadastro, edição e desativação da Equipe de Inventário;
- efeitos em Auth, perfis, RLS e auditoria.

A Gestão SME acompanha gerencialmente e não substitui essa liderança local.

### 5.2 Carteiras dos Controladores

A carteira representa responsabilidade principal, filtro inicial e organização do trabalho. Não é fronteira de autorização entre Controladores da mesma CRE.

Controladores autenticados podem consultar e executar ações operacionais em escolas da própria `cre_scope`:

- sem transferir automaticamente `schools.controller_id`;
- preservando o responsável principal;
- registrando autoria real;
- sem acesso a outra CRE, salvo exceção explícita.

### 5.3 Gestão SME

Nas superfícies definidas:

- consulta identificação e bonificação;
- não visualiza análise técnica;
- não executa mutações operacionais em Pendências;
- consulta Registros Internos somente quando `actor_user_id = auth.uid()`.

A restrição deve existir cumulativamente em capacidades, componentes, handlers, serviços e RLS.

Não reabra essas decisões sem solicitação expressa do responsável pelo produto.

## 6. Regra de impacto entre camadas

Toda alteração deve verificar, conforme o caso:

```text
layout/frontend
→ visibilidade e capacidade por perfil
→ domínio e serviço de aplicação
→ contrato de persistência
→ banco/migration/RPC
→ Auth/RLS
→ autoria e auditoria
→ testes unitários, pgTAP e E2E
→ documentação e evidências
→ build/deployment
```

Uma tarefa não está concluída quando somente uma camada foi alterada e as demais ficaram incoerentes.

## 7. Superfícies e dispositivos

Ao modificar dado ou fluxo, examine:

- Dashboard;
- Carteira;
- Competências;
- Prontuário e timeline;
- Pendências;
- Gestão de Equipe;
- Capital e Inventário;
- Registros Internos;
- configurações e visões SME;
- relatórios e exportações;
- desktop, Android e iPhone;
- estados vazios, filtros, menus e modais;
- permissões positivas e negativas;
- última movimentação, próxima ação, prazo e responsável.

Mobile pode reorganizar tabelas em cartões, mas não remover informação ou capacidade essencial.

## 8. Competência, avaliação, timeline e navegação

Contratos vigentes:

- uma única competência global `YYYY-MM`;
- janeiro a dezembro de 2026 disponíveis conforme permissão;
- avaliação mensal canônica para bonificação, análise técnica e pendências;
- timeline como projeção somente leitura das entidades existentes;
- navegação contextual preservando competência, rota, filtros, rolagem e foco.

Não criar fonte paralela de estado para qualquer desses domínios.

## 9. Relatórios Excel

Estado vigente:

- botão principal institucional gera XLSX histórico de quatro abas;
- botão `Excel SME` gera produto mensal de uma aba;
- CSV legado permanece em botão secundário e como fallback;
- certificação automatizada compara até a célula OOXML;
- Excel SME não contém `dataValidations`;
- homologação manual no Microsoft Excel desktop ainda é gate de release.

Não reverter o botão principal para CSV, remover o fallback ou reintroduzir validação de lista sem decisão, testes e atualização documental.

## 10. Persistência e Supabase

O contrato único possui:

- `SupabaseRepository` — canônico em Preview e Production;
- `LocalStorageRepository` — desenvolvimento controlado e contingência excepcional.

Funcionalidades novas devem usar serviços de aplicação e o contrato existente. Não acessar diretamente `localStorage` ou Supabase quando a operação possui porta própria.

Operações compostas devem ser atômicas. Conflitos usam `row_version` e não podem sobrescrever silenciosamente outra sessão.

Não introduzir ORM, segunda biblioteca de schemas, cache ou arquitetura paralela sem limitação comprovada.

Regras:

- somente chave publicável chega ao navegador;
- credenciais administrativas permanecem server-side;
- migrations são versionadas e aplicadas em ordem;
- nenhum seed institucional implícito;
- importação usa validação, staging, reconciliação, promoção e rollback;
- RLS deve refletir exatamente capacidades aprovadas;
- Edge Functions administrativas exigem JWT e validação de papel;
- nenhuma alteração remota sem escopo e autorização.

### 10.1 Gate de migrations

Existe divergência de identificador na migration SME:

```text
local: 20260728182226
remoto: 20260728190344
SQL: idêntico por comprimento e SHA-256
```

Até a reconciliação:

- não criar/aplicar nova migration em Production;
- não renomear ou reaplicar o arquivo;
- não editar diretamente o histórico;
- não criar migration vazia compensatória;
- não usar `db push` para contornar o desvio.

Seguir `docs/runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md`.

## 11. Vercel

- separar Production, Preview e local;
- Production usa `dataMode: supabase-production`;
- Preview conectado usa `supabase-preview`;
- validar `radar-build-manifest.json`;
- confirmar que deployment e evidências correspondem ao SHA analisado;
- não promover Preview como se fosse o artefato de Production;
- manter deployments automáticos bloqueados fora de janela controlada;
- não publicar mudança documental como mudança funcional.

## 12. Git e integração

Não trabalhar diretamente na `main`.

Fluxo:

1. confirmar HEAD remoto;
2. criar branch específica;
3. escrever teste que falha quando aplicável;
4. implementar mudança mínima coerente;
5. executar gates;
6. abrir PR com riscos, limites e evidências;
7. confirmar checks no SHA final;
8. fazer merge somente após conclusão integral.

Não misturar funcionalidade, arquitetura, dependências, migration, ativação remota e polimento visual não relacionado no mesmo PR.

## 13. Testes e conclusão

Usar `npm run test:readiness` como gate local base e acrescentar, conforme impacto:

- Supabase local, pgTAP, lint SQL e tipos;
- Playwright desktop e mobile;
- Lighthouse;
- certificação Excel;
- precedência do frontend;
- build Vercel;
- Advisors;
- homologação manual;
- UAT.

A conclusão exige:

- testes aplicáveis;
- ausência de regressão relevante;
- documentação e estado atualizados;
- nenhum segredo no diff ou artefato;
- correspondência entre commit, build e deployment quando houver publicação;
- relato explícito quando não existir workflow associado ao SHA.

## 14. Gates de liberação oficial

Permanecem pendentes:

1. reconciliação do histórico da migration SME;
2. proteção contra senhas vazadas;
3. fixação deliberada da major do Node;
4. backup e restauração em ambiente descartável;
5. homologação manual dos relatórios Excel;
6. matriz remota por perfil e viewport;
7. UAT;
8. polimento editorial/visual;
9. decisão formal de release.

Não declarar o produto oficialmente liberado antes do gate cumulativo.

## 15. Prevenção de loops

Ao concluir PR relevante:

- atualizar `docs/CURRENT_STAGE.md`;
- registrar decisões duradouras em `docs/DECISION_LOG.md`;
- atualizar `docs/PROJECT_CONTEXT.md` para mudanças estáveis;
- atualizar contratos específicos e evidências;
- classificar documentos substituídos ou históricos;
- não iniciar nova frente antes de declarar a anterior concluída, bloqueada ou substituída.

Quando código, documentação e decisão funcional divergirem, verificar primeiro as fontes operacionais. Interromper apenas a parte que permanecer realmente indeterminada.
