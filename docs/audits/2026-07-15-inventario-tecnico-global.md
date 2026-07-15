# Inventário técnico global do RADAR PDDE

## Linha de base

| Campo | Valor |
|---|---|
| Data da auditoria | 15/07/2026 |
| Branch remota de execução | `docs/ciclo-a-execucao` |
| Commit funcional de referência em `main` | `f85d0f23648f365b1f88378394914dae4ac85225` |
| Primeiro HEAD remoto da execução | `afda608dbe59499798d651951314666bd84ab5c0` |
| Persistência publicada | `LocalStorageRepository` |
| Modo de dados | `local` |
| Supabase remoto | não conectado |
| Runtime normativo | Node.js `>=24 <27` |
| Runtime auxiliar disponível no contêiner | Node.js `22.16.0`, usado apenas para diagnóstico local |

O commit funcional de referência contém o Plano Diretor e o plano aprovado do Ciclo A. O workflow temporário usado para transferir a worktree não pertence à árvore final e não altera o produto.

## Baseline de validação

| Comando ou gate | Resultado | Observação |
|---|---|---|
| CI `Validar RADAR PDDE` da PR 25 | aprovado | Node 24; plano documental |
| `npm ci` local | aprovado | 0 vulnerabilidades; aviso de engine por Node 22 |
| `npm run check` local | aprovado | sintaxe dos módulos vigentes |
| `npm run test:unit` local antes das ferramentas do Ciclo A | 147 testes aprovados | baseline do produto |
| `npm run test:integration` local | 1 teste aprovado | migração local reversível |
| `npm run audit:functional` local | aprovado | 54 arquivos JS, 11 raízes, 89 handlers e 93 campos |
| `npm run test:readiness` local | aprovado | configuração, artefatos, tipos e persistência |
| Playwright local | bloqueado pelo ambiente | executáveis Chromium/WebKit ausentes; execução normativa será feita na CI |

O bloqueio local do Playwright é ambiental e não foi classificado como falha do produto. A CI oficial instala Chromium e WebKit e permanece a fonte normativa para E2E e capturas.

## Visão quantitativa

O inventário reproduzível em `docs/evidence/global-baseline/repository-inventory.json` registra:

| Categoria | Arquivos |
|---|---:|
| serviços de aplicação | 12 |
| configuração | 3 |
| dados e repositórios | 9 |
| testes de banco | 7 |
| domínio | 11 |
| testes E2E | 21 |
| núcleo frontend | 3 |
| integrações frontend | 17 |
| migrations | 12 |
| estilos de extensão | 9 |
| testes unitários | 38 antes das ferramentas; 39 após a Task 3 |
| workflows vigentes | 4 |

### Maiores concentradores

| Arquivo | Linhas na baseline | Papel | Classificação |
|---|---:|---|---|
| `app.js` | 11.286 | dados iniciais, estado, renderização e handlers legados | `FA` |
| `styles.css` | 2.758 | tokens e estilos principais | `FA` |
| `tests/e2e/pendency-cycle.spec.js` | 2.480 | cobertura extensa do ciclo de pendências | `CP` para cobertura; `FA` para manutenção do teste |
| `src/integration/task-9-pendencias-page.js` | 1.071 | página e integração das pendências | `FA` |
| `index.html` | 756 | shell, navegação, modais e formulários | `FA` |

O tamanho não constitui defeito isoladamente. Ele indica custo de leitura e acoplamento potencial que deverá ser confirmado por pacote antes de qualquer decomposição.

## Arquitetura vigente

```text
Interface e regras aprovadas
        ↓
serviços de aplicação
        ↓
unidade de trabalho e contrato único
        ├── LocalStorageRepository — ativo
        └── SupabaseRepository — preparado
```

### Pontos fortes protegidos

- **`CP-ARQ-001` — contrato único de persistência:** serviços, unidade de trabalho e adaptadores reduzem acoplamento entre interface e backend. Evidências: `src/application/`, `src/data/` e testes unitários.
- **`CP-ARQ-002` — operação fail-closed:** `config.js` bloqueia modos remotos sem ambiente, flag, URL e chave publicável válidos; bloqueia `service_role` e `sb_secret_*`.
- **`CP-ARQ-003` — migração reversível:** staging, checkpoint, reconciliação, promoção e rollback possuem serviços e testes.
- **`CP-DOM-001` — domínio não achatado:** bonificação, análise, pendência, retificação, nota e inventário preservam semânticas distintas.
- **`CP-TEST-001` — cobertura em múltiplas camadas:** unitário, integração, E2E, axe, pgTAP e lint de banco.
- **`CP-MOB-001` — mobile intencional:** navegação móvel, alvos, Escape, retorno de foco e cartões da Carteira possuem testes dedicados.

## Frontend e ordem de carregamento

`config.js:90-116` carrega, em ordem, nove folhas de estilo e dezessete scripts de domínio/integração. O padrão permitiu evolução incremental sem reescrever o núcleo, mas a ordem passou a exercer papel arquitetural.

### Folhas de estilo carregadas

1. `mobile-responsive.css`;
2. `mobile-rendering-hotfix.css`;
3. `task-9-pendencias.css`;
4. `task-9-cross-view.css`;
5. `task-10-11-pendency-actions.css`;
6. `task-12-13-retificacoes.css`;
7. `cycle-b-carteira.css`;
8. `cycle-b-dashboard.css`;
9. `cycle-b-dashboard-final.css`.

### Achados

- **`IC-FE-001` — precedência acumulativa de CSS:** nomes como `hotfix` e `final`, somados à carga sequencial, indicam sobreposição potencial. A consolidação só poderá ocorrer depois de mapear seletores ativos, especificidade e capturas computadas.
- **`FA-FE-002` — concentração em `app.js`:** 11.286 linhas e múltiplas responsabilidades aumentam o custo de alteração. A decomposição deve ser incremental e restrita às áreas tocadas.
- **`FA-FE-003` — HTML com handlers e estilos inline:** `index.html` contém 36 ocorrências de `onclick=` e 20 de `style=`. Isso reduz separação sem, por si só, provar falha funcional.
- **`FA-FE-004` — navegação baseada em estado interno:** itens da sidebar chamam `switchView(...)`; URLs não representam integralmente tela, filtro e contexto. O Ciclo C deverá medir perdas reais antes de propor roteamento.
- **`FA-UX-001` — feedback bloqueante coexistente:** foram localizadas 17 chamadas ou wrappers de `alert`/`confirm` fora de vendors. Modais acessíveis mais novos já demonstram padrão superior, mas a substituição precisa preservar mensagens e confirmações críticas.
- **`FA-OBS-001` — ausência de observabilidade de uso real:** testes protegem entrega, mas não há contrato consolidado para erros em produção, Web Vitals ou métricas de fluxo. Trata-se de evolução do Ciclo G.
- **`DF-SUP-001` — proteções remotas:** usuários reais, Auth/RLS remotos, backup, restauração, Advisors e MFA pertencem ao Ciclo F e não são falhas do estado local.

## Dados iniciais e código público

`app.js:79` inicia `INITIAL_ESCOLAS`; a baseline contém 163 registros com campos de contato, direção, INEP, CNPJ, processo e atribuição. Esse fato é tratado detalhadamente na auditoria de dados. A existência no código versionado e no bundle é risco atual independente da futura RLS; a decisão de saneamento do histórico permanece `DQ`.

## Testes e gates

### Unitários e integração

- 147 testes unitários do produto na baseline;
- 1 teste de integração de exportação, importação, reconciliação e rollback;
- ferramentas do Ciclo A acrescentam testes sem substituir os anteriores.

### E2E

Os 21 arquivos E2E cobrem, entre outros:

- núcleo funcional;
- ciclo completo de pendências;
- Dashboard e Carteira;
- navegação contextual;
- retificações;
- alertas;
- exercícios;
- autenticação e RLS local;
- acessibilidade de modais;
- erros de dados;
- mobile Chromium e WebKit.

### Banco

- 12 migrations;
- testes pgTAP e smoke;
- lint PL/pgSQL;
- tipos TypeScript reproduzíveis;
- grants e RLS preparados.

## Dependências

As dependências estão fixadas no `package-lock.json`. Não foi adicionada dependência no Ciclo A. O frontend permanece JavaScript/HTML/CSS próprio; Ajv, Playwright, Supabase client, TypeScript e ferramentas de build são dependências de desenvolvimento ou bundles versionados.

## Regra de escopo

Este documento registra o estado atual. O Ciclo A não altera comportamento funcional, layout, regras, persistência, migrations, Vercel ou produção. Achados `FA`, `IC`, `DQ`, `DF` e `EP` serão convertidos em backlog; nenhum deles autoriza implementação automática.
