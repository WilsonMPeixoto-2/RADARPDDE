# RADAR PDDE — Roadmap canônico de atualizações 2026

**Atualizado em:** 7 de agosto de 2026  
**Classe documental:** Canônico

## 1. Finalidade

O roadmap organiza:

1. confiabilidade funcional ponta a ponta;
2. saúde operacional e integridade;
3. manutenção técnica;
4. evolução do produto.

Integração na `main`, aplicação no Supabase, publicação na Vercel e comprovação funcional são estados distintos.

O baseline mutável do ambiente fica exclusivamente em [`CURRENT_STAGE.md`](CURRENT_STAGE.md).

## 2. Estado consolidado

### Concluído e incorporado ao baseline

| Frente | Resultado atual |
|---|---|
| Excel SME | runtime e arquivo de 27 colunas homologados e publicados |
| Gestão de Equipe | CORS, Auth, transição de perfis, lookup exato de conta e reparo legado incorporados |
| Monitor geral de Production | ativo |
| Incidentes automáticos | ativos |
| Integridade agregada | vinte invariantes ativas e saudáveis |
| Matriz funcional | 41 operações integradas como contrato executável |
| Smoke autenticado de leitura | infraestrutura integrada, ativação remota deliberadamente desabilitada |
| Autorização de carteira | Controlador impedido de redistribuir `controller_id` |
| Criação de exercício | lote mensal correto, `row_version` e sincronização de bootstrap |
| Identidade escolar | dados institucionais reais obrigatórios e proteção contra duplicidades |
| Nota/bem vinculado | desvinculação protegida na mesma transação |
| Edição patrimonial rápida | `saveAssetWithLog`, versão e auditoria |
| Tentativas de pendência | sincronização e reconciliação idempotente |
| Auditoria de exportações | registro inicial obrigatório antes do download e remoção da duplicação legada |

## 3. Cronologia recente relevante

| PR | Estado | Resultado |
|---:|---|---|
| 136 | integrado/publicado | runtime e assets do Excel SME |
| 137 | integrado/publicado | contrato público de 27 colunas |
| 138 | integrado/publicado | primeira correção ampla de Gestão de Equipe e CORS |
| 139 | integrado/publicado | monitor geral de Production |
| 140 | integrado/publicado | incidentes automáticos |
| 141 | integrado/aplicado | auditoria de vinte invariantes |
| 142 | integrado | reconciliação documental anterior |
| 145 | integrado | matriz funcional executável |
| 146 | integrado/publicado | Supabase JS 2.110.9 |
| 147 | integrado | correção de workflow principal |
| 148 | integrado | infraestrutura de smoke autenticado de leitura, desativada por padrão |
| 150 | integrado/publicado | transição de perfil reutilizando conta Auth existente |
| 153 | integrado | correção de corrida do monitor de deployment |
| 154 | integrado/aplicado | bloqueio de redistribuição pela edição cadastral |
| 155 | integrado | documentação pós-autorização de carteira |
| 157 | integrado | lote correto de competências ao criar exercício |
| 158 | fechado sem merge | tentativa substituída pelo PR #157 |
| 159 | integrado na branch de auditoria | sincronização documental de CFG-02 naquela branch |
| 160 | integrado/publicado | sincronização das competências remotas antes do primeiro render |
| 161 | integrado/publicado | reparo P0 de Auth legado na Gestão de Equipe |
| 162 | integrado/publicado | remediação funcional integral dos achados confirmados |
| 156 | aberto/draft histórico | auditoria funcional divergente da `main`; não fazer merge cego |

## 4. Matriz funcional reconciliada

| Cobertura | Operações |
|---|---:|
| Comprovada | 9 |
| Parcial | 32 |
| Lacuna técnica | 0 |
| Decisão funcional pendente | 0 |
| **Total** | **41** |

| Próxima prova | Operações |
|---|---:|
| manter regressão | 5 |
| smoke autenticado de leitura | 6 |
| escrita controlada e reversível | 25 |
| observação contínua em Production | 5 |
| **Total** | **41** |

### Interpretação

- `ASSET-02` deixa de ser lacuna porque a correção foi implementada pelo PR #162, mas permanece parcial até a prova controlada requerida pela matriz;
- `CFG-03` e `CFG-04` deixam de ser decisão pendente, pois o contrato vigente já autoriza Gestão SME e administrador técnico; passam a parciais até prova controlada;
- correções de `SCH-01`, `CFG-02`, `INV-01`, `PEND-02` e exportações não são promovidas automaticamente a “comprovadas” sem os gates ponta a ponta correspondentes.

## 5. Próxima frente P0 — continuidade da auditoria funcional

A auditoria iniciada no PR #156 produziu evidências úteis, mas a branch ficou divergente enquanto a `main` avançava. A continuação deve ocorrer a partir da `main` atual.

Ações:

1. encerrar ou substituir formalmente o PR #156 sem merge cego;
2. mapear quais provas da Task 5 continuam válidas após os PRs #157/#160/#162;
3. retomar as 32 operações parciais na ordem de risco;
4. evitar repetição de prova já incorporada ao código atual;
5. registrar evidência e atualizar a matriz no mesmo SHA quando o nível de cobertura realmente mudar.

## 6. Smoke autenticado de leitura

Infraestrutura integrada. Ativação remota ainda não autorizada/provisionada.

Pendências específicas:

- cinco contas técnicas exclusivas;
- segredo protegido;
- variável de habilitação;
- execução manual aprovada;
- execução agendada aprovada.

A ausência dessas identidades é uma proteção deliberada, não defeito do sistema.

## 7. Escrita controlada e reversível

Existem 25 operações classificadas para esse estágio. A prioridade deve considerar:

- mutações P0 antes de P1/P2;
- autorização positiva e negativa;
- `row_version` e idempotência;
- releitura após refresh;
- rollback/compensação;
- ausência de resíduos;
- mensagem funcional ao usuário.

A execução deve ocorrer em ambiente descartável ou procedimento remoto especificamente autorizado, nunca como teste destrutivo improvisado em Production.

## 8. Demanda visual/funcional — detalhes da escola

A conclusão da solicitação sobre a tela de detalhes da escola não foi comprovada no histórico remoto reconstruído após o travamento do chat.

Antes de alterar:

1. inspecionar a `main` atual;
2. verificar controles que parecem clicáveis sem ação;
3. verificar botões/ações não funcionais;
4. revisar hierarquia, legibilidade, encontrabilidade e responsividade;
5. relacionar cada ação à matriz funcional e ao backend correspondente.

## 9. Garantia operacional

Manter:

- monitor geral de Production;
- incidentes automáticos;
- auditoria agregada de integridade;
- preflight das Edge Functions;
- bloqueio anônimo;
- backup/restauração descartáveis;
- gate por perfil e viewport;
- verificação do SHA efetivamente publicado.

Falha em Preview por quota externa de Vercel ou limite de revisor automático não deve ser classificada como defeito funcional sem evidência do componente afetado.

## 10. Supabase e integração

Princípios:

- Supabase Production canônico;
- Auth e RLS como fronteiras reais;
- Edge Function administrativa com JWT e papel;
- lookup Auth exato, sem varredura global de usuários;
- operações compostas por RPC/transação;
- `row_version` para concorrência otimista;
- migrations versionadas;
- auditoria e autoria preservadas;
- nenhuma credencial administrativa no frontend.

Valores mutáveis e últimas migrations: consultar `CURRENT_STAGE.md` e confirmar no ambiente.

## 11. Manutenção técnica

Versões fixadas devem ser obtidas de `package.json`/lockfile. PRs automáticos de dependências permanecem separados da sequência funcional.

Na data desta reconciliação permaneciam abertos PRs automáticos para Playwright, Supabase tooling, eslint-plugin-playwright e Knip. Eles devem ser rebaseados/reavaliados contra a `main` atual antes de qualquer integração.

ExcelJS continua dependente de nova homologação desktop quando houver alteração material.

## 12. Evolução do produto

Busca inteligente, Floating UI e View Transitions já fazem parte do produto. Novas capacidades de design, gráficos, ajuda contextual, modularização e demais melhorias ficam subordinadas à confiabilidade funcional e ao UAT quando puderem aumentar escopo ou risco.

## 13. Sequência vigente

```text
1. concluir reconciliação documental pós-PR #162
2. encerrar/substituir PR #156 sem merge cego
3. continuar auditoria funcional a partir da main atual
4. executar provas das operações parciais por risco
5. decidir e, se aprovado, provisionar smoke autenticado
6. verificar/corrigir tela de detalhes da escola
7. avaliar dependências em PRs isolados
8. UAT e correções finais
9. decisão formal de liberação
```

## 14. Critério para nova frente

Toda nova frente deve registrar:

- problema e usuários afetados;
- operação/ID da matriz ou justificativa para novo ID;
- regra de negócio vigente;
- perfis permitidos e negados;
- percurso frontend–backend;
- persistência e releitura;
- erro, conflito e rollback/compensação;
- evidência no mesmo SHA;
- impacto em documentação;
- escopo de merge/Production autorizado.
