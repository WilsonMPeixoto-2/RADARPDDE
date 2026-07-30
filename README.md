# RADAR PDDE

O **RADAR PDDE** é uma aplicação web institucional para acompanhar entrega, análise, regularização, consolidação, inventário e histórico dos programas do PDDE por unidade escolar, competência, programa e documento.

Atende Controladores, Assistente de Verbas Federais, Gestão SME, Equipe de Inventário e Administração técnica, com autenticação institucional, autorização em profundidade, Supabase, auditoria, concorrência otimista e exportações estruturadas.

## Estado operacional — 29/07/2026

| Camada | Situação comprovada |
|---|---|
| Baseline funcional da `main` | `598361dd784563f4d70d1e25df3818f4ee066da8` |
| Última consolidação documental anterior | `05f51cbdd433844f11db036bcdefa5f9d8941e45` — PR #108 |
| Vercel Production | `dpl_7tLM3RZ7MEuRRTzvGmc9EiAARmDY`, `READY` |
| Commit funcional publicado | `dfc8aa3030b02edb73f764f5f56bd6759a7a1d77` |
| Runtime | `production`, `supabase-production` |
| Supabase | `scnryinorqeucbfkioxo`, `ACTIVE_HEALTHY`, PostgreSQL 17 |
| Persistência normal | `SupabaseRepository` |
| Contingência | `LocalStorageRepository` por novo build controlado |
| Calendário | janeiro a dezembro de 2026; `closing_competence = 2026-12`; `row_version = 5` |
| Gestão SME | governança somente leitura em interface, serviços e RLS |
| Ciclos de oficialização | 1 a 5 concluídos, mesclados e publicados |
| Migrations | 25 arquivos locais; identificador SME divergente no histórico remoto, com SQL idêntico |
| Deployment automático | bloqueado após janela controlada |
| Liberação oficial | ainda não declarada |

O commit `598361dd...` é posterior ao artefato funcional e restaura o bloqueio automático, sem mudança de produto.

## Entregas concluídas

### Ciclo 1 — competência global

- seletor mensal transversal;
- persistência entre telas e recarga;
- doze competências de 2026;
- `closing_competence = 2026-12`.

### Ciclo 2 — avaliação mensal

- regra canônica APTA/INAPTA;
- bonificação, análise técnica e pendência independentes;
- persistência atômica e concorrência otimista.

### Ciclo 3 — timeline

- visão cronológica por unidade e competência;
- autoria, origem, vínculos e visibilidade;
- projeção somente leitura.

### Ciclo 4 — Excel

- relatório institucional histórico de quatro abas;
- botão principal institucional integrado ao XLSX;
- Excel SME mensal integrado em botão próprio;
- CSV legado preservado como botão secundário e fallback;
- comparação célula a célula no OOXML;
- manifesto e hashes sintéticos;
- ausência deliberada de `dataValidations` no produto SME;
- homologação manual no Microsoft Excel desktop ainda pendente.

### Ciclo 5 — navegação contextual

- rotas canônicas;
- retorno para origem real;
- preservação de competência, filtros e rolagem;
- foco no controle visível e acionável;
- desktop, Android e iPhone.

## Arquitetura

```text
Interface e integrações idempotentes
        ↓
Serviços de aplicação + UnitOfWork
        ↓
Contrato único de persistência
        ├── SupabaseRepository — Preview/Production
        └── LocalStorageRepository — contingência
        ↓
Supabase Auth + PostgREST + PostgreSQL + RLS + RPCs + auditoria
```

Princípios:

- domínio puro para regras compartilhadas;
- `app.js` preservado como núcleo legado;
- extensões carregadas de forma ordenada;
- segurança cumulativa em interface, serviço, Auth e RLS;
- timeline e relatórios derivados de fontes canônicas;
- nenhuma escrita remota implícita.

## Perfis

### Controlador

Carteira como responsabilidade principal e filtro inicial. Pode colaborar nas escolas da mesma CRE, preservando responsável principal e autoria real.

### Assistente de Verbas Federais

Acompanhamento transversal da CRE e Gestão de Equipe, inclusive contas Auth por Edge Function protegida.

### Gestão SME

Consulta identificação e bonificação nas superfícies definidas, sem análise técnica ou mutações operacionais. Registros Internos limitados à própria autoria por UUID.

### Equipe de Inventário

Opera Capital e Inventário dentro da própria CRE, sem acesso aos módulos não patrimoniais.

### Administrador técnico

Infraestrutura, perfis, escopos, importações e auditoria. Pode simular organização visual dos perfis sem alterar JWT.

## Gate de migrations

Divergência conhecida:

```text
local: 20260728182226_sme_access_governance.sql
remoto: 20260728190344_sme_access_governance
```

O SQL possui o mesmo comprimento e SHA-256. O problema é de rastreabilidade, não de regra aplicada.

**Nenhuma nova migration de Production pode avançar antes da reconciliação suportada, testada e documentada.**

Não renomear, reaplicar, editar diretamente o histórico ou criar migration vazia para mascarar a diferença.

## Gates antes da liberação oficial

1. reconciliar o histórico da migration SME;
2. habilitar proteção contra senhas vazadas no Supabase Auth;
3. fixar deliberadamente a major do Node;
4. testar backup e restauração;
5. homologar os dois produtos no Microsoft Excel desktop;
6. executar matriz remota por perfil e viewport;
7. concluir UAT;
8. realizar polimento editorial/visual sem alterar produto;
9. registrar decisão formal de release.

## Documentação obrigatória

1. [`docs/README.md`](docs/README.md);
2. [`docs/CURRENT_STAGE.md`](docs/CURRENT_STAGE.md);
3. [`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md);
4. [`docs/DECISION_LOG.md`](docs/DECISION_LOG.md);
5. [`docs/reference/STATUS_DOCUMENTOS.md`](docs/reference/STATUS_DOCUMENTOS.md);
6. [`docs/audits/2026-07-29-alinhamento-documental-integral-pos-pr108.md`](docs/audits/2026-07-29-alinhamento-documental-integral-pos-pr108.md).

## Desenvolvimento

```bash
npm ci
npm run test:readiness
npm run test:e2e
npm run test:mobile
npm run audit:lighthouse
npm run build:vercel
```

Para banco:

```bash
npm run supabase:start
npm run supabase:reset
npm run supabase:test:db
npm run supabase:lint:db
npm run typecheck:database
```

## Regra de continuidade

A próxima frente ainda não foi escolhida. Antes de implementar:

- confirmar `main`, PRs e ambientes;
- escolher expressamente o objetivo;
- registrar escopo e fora de escopo;
- trabalhar em branch própria;
- executar os gates aplicáveis;
- atualizar documentação e evidências no mesmo ciclo.
