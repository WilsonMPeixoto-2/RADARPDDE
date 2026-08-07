# AGENTS.md — RADAR PDDE 2026

**Atualizado em:** 7 de agosto de 2026

## 1. Leitura obrigatória

Antes de analisar ou alterar o repositório, leia:

1. `docs/CURRENT_STAGE.md` — baseline remoto, prioridades e pendências reais;
2. `docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md` — contrato executável das 41 operações;
3. `docs/PROJECT_CONTEXT.md` — produto, domínio e arquitetura;
4. `docs/ROADMAP_ATUALIZACOES_2026.md` — sequência técnica e funcional;
5. `docs/DECISION_LOG.md` — decisões duradouras;
6. `docs/reference/STATUS_DOCUMENTOS.md` — validade documental;
7. arquitetura e runbook específicos da frente;
8. código, GitHub, Vercel e Supabase correspondentes.

`docs/CURRENT_STAGE.md` é o guia canônico do estado corrente e da revalidação remota. Ele não deve congelar SHA da própria `main`, deployment ou versão de Edge Function quando a atualização documental puder alterar esses valores. Snapshots exatos ficam em checkpoints históricos datados.

Documentos históricos não prevalecem sobre código, ambientes ou decisões posteriores.

## 2. Identidade do produto

O RADAR PDDE é sistema institucional de gestão, controle, acompanhamento e apoio à decisão para o PDDE da 4ª CRE/SME-Rio. Não é CRUD genérico.

Toda entrega deve ser avaliada por:

- correção técnica e funcional;
- aderência ao fluxo real do PDDE;
- coerência entre perfis, telas e dados;
- integridade, rastreabilidade e auditabilidade;
- acessibilidade e equivalência mobile;
- clareza da próxima ação;
- confiabilidade ponta a ponta.

Uma função não está pronta apenas porque aparece na interface ou passa em teste unitário.

## 3. Fontes de verdade

Para determinar o estado implementado:

1. código-fonte remoto do SHA analisado;
2. migrations, funções, políticas, Auth e dados do Supabase autorizado;
3. artefato implantado na Vercel e seu SHA;
4. testes e evidências reproduzíveis;
5. decisões expressas vigentes;
6. documentação canônica;
7. históricos.

A orientação mais recente do responsável define intenção e prioridade; afirmação técnica deve ser comprovada operacionalmente.

## 4. Estado operacional

O estado corrente, as prioridades e o procedimento de revalidação estão em `docs/CURRENT_STAGE.md`. Valores voláteis devem ser consultados ao vivo; checkpoints exatos são evidências históricas datadas.

Contratos estáveis atuais:

- Supabase é a persistência canônica de Preview/Production;
- Production usa `supabase-production` e `SupabaseRepository`;
- Node.js permanece fixado em `24.x`;
- Excel SME público possui 27 colunas A:AA;
- monitor geral, incidentes automáticos e auditoria agregada de integridade estão ativos;
- matriz funcional de 41 operações está integrada;
- infraestrutura do smoke autenticado de leitura está integrada, mas sua execução remota permanece desativada sem identidades técnicas exclusivas;
- liberação oficial do produto ainda depende das provas remanescentes e UAT.

## 5. Perfis e autorização

Perfis funcionais visíveis:

- Controlador (`controller`);
- Assistente de Verbas Federais (`federal_assistant`);
- Gestão SME (`sme_management`);
- Equipe de Inventário (`inventory`).

`technical_admin` é papel técnico separado.

### Controlador

A carteira representa responsabilidade principal e filtro inicial. Controladores podem colaborar nas escolas da própria `cre_scope`, preservando responsável principal e autoria. Não podem redistribuir `schools.controller_id` pela edição cadastral. Alteração de identidade institucional da escola também é exclusiva da Assistente.

### Assistente de Verbas Federais

Lidera a Gestão de Equipe da CRE e possui as operações transversais autorizadas, incluindo cadastro/desativação de Controladores e Inventário, contas Auth e redistribuição de carteira.

### Gestão SME

Realiza acompanhamento gerencial e utiliza as configurações atualmente autorizadas. O contrato vigente de código, serviço, RPC e permissões permite cadastrar, editar e desativar programas, além de configurações de exercício/calendário. Qualquer retirada ou expansão futura dessas capacidades exige decisão funcional expressa e alteração coordenada de interface, serviço e RLS.

### Inventário

Opera o fluxo patrimonial autorizado na própria CRE, segundo as políticas específicas de bens.

## 6. Regra de impacto entre camadas

Toda alteração deve verificar, conforme o caso:

```text
layout/frontend
→ visibilidade e capacidade por perfil
→ handler
→ domínio e serviço de aplicação
→ contrato de persistência
→ tabela, migration, RPC ou Edge Function
→ Auth/RLS
→ autoria e auditoria
→ retorno e estado em memória
→ nova renderização
→ releitura após refresh
→ conflito, erro e compensação
→ testes unitários, pgTAP e E2E
→ documentação e evidências
→ build/deployment
```

Uma tarefa não está concluída quando apenas uma camada foi alterada.

## 7. Contrato de confiabilidade funcional

Para cada função crítica, comprovar quando aplicável:

1. disponibilidade para o perfil correto;
2. negativa para o perfil indevido;
3. acionamento real no navegador;
4. payload e competência corretos;
5. serviço, repositório e backend esperados;
6. autorização positiva e negativa;
7. consulta ou gravação concluída;
8. autoria/auditoria;
9. interface atualizada;
10. persistência após recarregar;
11. conflito de versão;
12. falha parcial e compensação;
13. mensagem útil;
14. regressão permanente no CI.

A matriz funcional executável é a fonte de classificação de cobertura.

## 8. Gestão de Equipe

Fluxo vigente:

```text
DirectoryService
→ TeamAccountGateway
→ team-account-management
→ Auth Admin + RPC transacional
```

Preservar:

- CORS fail-closed e allowlist canônica;
- JWT obrigatório e papel autorizado;
- lookup Auth exato por `resolve_team_auth_user_id_by_email` em vez de varredura global de usuários;
- recuperação segura de vínculos históricos;
- rejeição de ambiguidade e vínculo ativo conflitante;
- transição autorizada entre perfis reutilizando a conta existente;
- desativação lógica e histórico;
- redistribuição de carteira;
- compensação quando Auth ou banco falhar;
- testes de cadastro, edição, transição e desativação.

## 9. Escolas

Novas escolas exigem identidade institucional informada. Não gerar INEP, CNPJ, designação, denominação ou SICI fictícios.

O banco protege campos institucionais não vazios e unicidade normalizada de INEP, CNPJ e SICI. O Controlador pode editar campos cadastrais autorizados, mas não a identidade institucional nem o responsável da carteira.

## 10. Patrimônio, pendências e exportações

- edição rápida de bem patrimonial é restrita ao campo expressamente permitido e persiste via `saveAssetWithLog` com versão esperada;
- nota permanente e bem derivado devem permanecer coerentes na mesma transação;
- tentativa de pendência deve manter a tabela `pendency_attempts` sincronizada com o agregado da pendência;
- exportação institucional e Excel SME exigem auditoria inicial pelo `AuditService` antes da liberação do download;
- duplicação pelo log legado de exportação não deve ser reintroduzida.

## 11. Smoke autenticado de Production

A infraestrutura está integrada. Enquanto não houver provisionamento autorizado:

- manter a execução remota desabilitada;
- não reutilizar contas pessoais ou funcionais;
- não criar contas automaticamente em PR;
- não expor service role ao navegador;
- não registrar traces, screenshots, vídeos ou credenciais de Production;
- permitir somente autenticação/leitura previstas pelo contrato.

## 12. Migrations e Supabase

Regras permanentes:

- migrations versionadas e aplicadas em ordem;
- nenhum seed institucional implícito;
- nenhuma chave administrativa no frontend;
- operações compostas atômicas;
- conflitos com `row_version` não são sobrescritos;
- histórico de migrations não é editado diretamente;
- nova migration exige reset, pgTAP, lint, tipos, backup/restauração, dry-run, plano de reversão e autorização.

A contagem e a versão atuais ficam somente em `CURRENT_STAGE.md`.

## 13. Excel SME

Contrato vigente:

```text
template-fonte: 30 colunas
produto público: 27 colunas A:AA
motor: ExcelJS 4.4.0
competência: mensal e estrita
```

As posições-fonte K, R e Y são removidas na projeção pública. Alteração material exige certificação automatizada e homologação no Excel desktop.

## 14. Testes e conclusão

Usar `npm run test:readiness` como gate base e acrescentar, conforme impacto:

- Supabase local, pgTAP, lint SQL e tipos;
- backup/restauração descartáveis;
- Playwright desktop e mobile;
- gate por perfil e viewport;
- Lighthouse;
- dependências;
- certificação Excel;
- precedência do frontend;
- build Vercel;
- smoke de Production;
- preflight remoto;
- UAT.

Antes de declarar conclusão, fixar o SHA candidato e verificar os gates no mesmo SHA.

## 15. Documentação

Classificação:

- canônicos e referências vigentes descrevem o presente;
- matriz JSON é contrato executável;
- visão Markdown da matriz é gerada e não deve ser editada manualmente;
- auditorias/evidências datadas registram o passado e não são reescritas para parecer atuais;
- planos executados permanecem históricos;
- branch/PR não integrado é trabalho em andamento e não altera o baseline.

Ao concluir mudança material, atualizar somente os documentos vigentes afetados e registrar evidência correspondente.

## 16. Git e integração

Não trabalhar diretamente na `main`.

Fluxo:

1. confirmar HEAD remoto;
2. criar branch específica;
3. criar regressão quando aplicável;
4. implementar mudança mínima coerente;
5. executar gates;
6. abrir PR com riscos, limites e evidências;
7. confirmar checks no SHA final;
8. integrar e publicar somente dentro da autorização da tarefa;
9. executar smokes posteriores quando houver impacto em Production.

Não misturar funcionalidade, dependência, migration e polimento sem relação no mesmo PR.

## 17. Prioridade corrente

A sequência atual fica em `docs/CURRENT_STAGE.md` e `docs/ROADMAP_ATUALIZACOES_2026.md`. Em síntese: encerrar a divergência do PR #156, continuar as provas funcionais a partir da `main`, decidir separadamente a ativação do smoke autenticado, verificar a tela de detalhes da escola, tratar dependências isoladamente e concluir UAT.
