# AGENTS.md — RADAR PDDE 2026

## 1. Leitura obrigatória

Antes de analisar ou alterar o repositório, leia:

1. `docs/PROJECT_CONTEXT.md` — domínio e arquitetura estáveis;
2. `docs/CURRENT_STAGE.md` — estágio transitório e próxima entrega;
3. `docs/DECISION_LOG.md` — decisões consolidadas;
4. o código remoto real da `main`, PRs relevantes e deployment correspondente.

Documentos antigos de “estado atual”, planos e relatórios são hipóteses históricas. Não prevalecem sobre o código remoto ou decisões posteriores.

## 2. Identidade do produto

O RADAR PDDE é um sistema de gestão, controle, acompanhamento e apoio à decisão para o PDDE da 4ª CRE/SME-Rio. Não é um CRUD genérico.

Toda entrega deve ser avaliada por:

- correção técnica;
- aderência ao fluxo real do PDDE;
- usabilidade pelo usuário administrativo;
- coerência entre perfis, telas e dados;
- integridade, rastreabilidade e auditabilidade.

Passar em testes técnicos não basta quando a funcionalidade está difícil de localizar, compreender ou operar.

## 3. Fontes de verdade

Para estado atual, use nesta ordem:

1. decisão explícita mais recente do responsável pelo produto;
2. GitHub remoto e código da branch/commit analisados;
3. Vercel efetivamente implantada, vinculada ao commit;
4. Supabase efetivamente existente e configurado;
5. `docs/CURRENT_STAGE.md`;
6. `docs/DECISION_LOG.md`;
7. `docs/PROJECT_CONTEXT.md`;
8. documentos históricos.

Não use clone local antigo, memória isolada de chat, última tarefa cronológica ou texto de PR como prova de estado sem conferir o código.

## 4. Perfis e autorização consolidados

O frontend possui quatro perfis funcionais visíveis:

- Controlador (`controller`);
- Assistente de Verbas Federais (`federal_assistant`);
- SME (Gestão) (`sme_management`);
- Equipe de Inventário (`inventory`).

`technical_admin` é papel técnico separado:

- não aparece no seletor operacional;
- não herda a interface da Assistente;
- administra infraestrutura, perfis, escopos e auditoria;
- não é utilizado no trabalho cotidiano.

A Assistente de Verbas Federais é a liderança direta dos controladores da GAD da 4ª CRE e possui gestão plena de:

- cadastro, edição e desativação de controladores;
- convite e conta de acesso;
- distribuição e redistribuição das escolas;
- cadastro, edição e desativação da Equipe de Inventário;
- efeitos correspondentes em Auth, perfis, RLS e auditoria.

A SME acompanha gerencialmente as CREs e não substitui essa liderança local.

Não reabra essas decisões sem solicitação expressa do responsável.

## 5. Regra de impacto entre camadas

Toda alteração deve verificar, conforme o caso:

```text
layout/frontend
→ visibilidade por perfil
→ serviço de aplicação
→ contrato de persistência
→ banco/migration/RPC
→ Auth/RLS
→ auditoria
→ testes unitários, pgTAP e E2E
→ documentação
→ build/deployment
```

Uma tarefa não está concluída quando apenas uma dessas camadas foi alterada e as demais ficaram incoerentes.

## 6. Todos os perfis e superfícies

Ao modificar um dado ou fluxo, examine:

- todas as abas e telas dos perfis afetados;
- dashboard, carteira, listas, prontuário, relatórios e exportações;
- desktop, Android e iPhone;
- estados vazios, filtros, menus e modais;
- permissões positivas e negativas;
- última movimentação, próxima ação, prazo e responsável.

Mobile pode reorganizar tabelas em cartões, mas não remover informação ou capacidade operacional essencial.

## 7. Arquitetura de persistência

O projeto mantém um contrato único com:

- `LocalStorageRepository` — vigente em Production;
- `SupabaseRepository` — preparado para conexão controlada.

Funcionalidades novas devem usar serviços de aplicação e o contrato existente. Não acesse diretamente `localStorage` ou Supabase quando a operação já possui porta própria.

Operações compostas devem ser atômicas. Conflitos usam `row_version` e não podem sobrescrever silenciosamente outra sessão.

Não introduza ORM, segunda biblioteca de schemas, cache ou arquitetura paralela sem limitação comprovada.

## 8. Supabase

- Production permanece local até autorização específica;
- primeira conexão ocorre apenas em projeto exclusivo de Preview;
- somente chave publicável chega ao navegador;
- credenciais administrativas ficam em backend/Edge Function;
- migrations são aplicadas em ordem, sem seed institucional implícito;
- importação usa staging, reconciliação, promoção e rollback;
- RLS deve refletir exatamente as ações visíveis do frontend;
- Edge Functions administrativas exigem JWT e validação de papel;
- nenhuma criação, conexão ou alteração remota sem autorização expressa.

## 9. Vercel

- separar Production, Preview e local;
- Production permanece `dataMode: local` e fail-closed;
- Preview conectado deve ser produzido por `vercel build` e publicado com `vercel deploy --prebuilt`;
- validar `radar-build-manifest.json`;
- confirmar que o deployment corresponde ao mesmo commit analisado;
- nunca promover Preview conectado diretamente para Production.

## 10. Git e integração

Não trabalhe diretamente na `main`.

Fluxo:

1. confirmar HEAD remoto;
2. criar branch específica;
3. escrever teste que falha quando aplicável;
4. implementar mudança mínima coerente;
5. executar gates;
6. abrir PR com riscos, limites e evidências;
7. confirmar checks no SHA final;
8. fazer merge somente após conclusão integral.

Não misture funcionalidade, arquitetura, dependências, migração, ativação remota e polimento visual não relacionado no mesmo PR.

## 11. Testes e critérios de conclusão

A conclusão exige evidência de:

- testes unitários aplicáveis;
- integração e pgTAP quando banco/RLS mudarem;
- E2E por perfil e dispositivo afetado;
- ausência de regressão relevante;
- documentação e estado atualizados;
- nenhum segredo no diff ou artefato;
- correspondência entre commit, build e deployment quando houver publicação.

## 12. Prevenção de loops

Ao concluir um PR relevante:

- atualize `docs/CURRENT_STAGE.md`;
- registre decisões duradouras em `docs/DECISION_LOG.md`;
- atualize `docs/PROJECT_CONTEXT.md` apenas para mudanças estáveis;
- feche ou marque como substituídos PRs/documentos que contradigam o novo estado;
- não inicie nova frente antes de declarar explicitamente se a anterior foi concluída, bloqueada ou substituída.

Quando código, documentação e decisão funcional divergirem e não for possível determinar qual mudança foi intencional, interrompa somente a parte afetada e pergunte ao responsável.
