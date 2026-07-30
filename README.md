# RADAR PDDE

O **RADAR PDDE** é uma aplicação web institucional para acompanhar entrega, análise, regularização, consolidação, inventário e histórico dos programas do PDDE por unidade escolar, competência, programa e documento.

O produto atende Controladores, Assistente de Verbas Federais, Gestão SME, Equipe de Inventário e Administração técnica, com autenticação institucional, autorização por perfil, persistência no Supabase, auditoria, concorrência otimista e exportações estruturadas.

## Estado operacional verificado em 29/07/2026

| Camada | Situação comprovada |
|---|---|
| Baseline funcional da `main` | `598361dd784563f4d70d1e25df3818f4ee066da8` |
| Vercel Production | `dpl_7tLM3RZ7MEuRRTzvGmc9EiAARmDY`, `READY` |
| Commit funcional publicado | `dfc8aa3030b02edb73f764f5f56bd6759a7a1d77` |
| Runtime | `production`, `supabase-production` |
| Supabase | `scnryinorqeucbfkioxo`, `ACTIVE_HEALTHY`, PostgreSQL 17 |
| Calendário | 12 competências; `closing_competence = 2026-12`; `row_version = 5` |
| Gestão SME | governança somente leitura aplicada no frontend, serviços e RLS |
| Ciclos de oficialização | ciclos 1 a 5 concluídos, mesclados e publicados |
| Histórico de migrations | 24 versões correspondentes; migration SME com versão remota distinta, mas SQL idêntico |
| Deployment automático | bloqueado após a janela controlada |
| Liberação oficial | ainda não declarada |

O commit `598361dd...` é posterior ao deployment funcional e apenas restaura `git.deploymentEnabled: false`.

Referências:

- [`Estado atual`](docs/CURRENT_STAGE.md);
- [`Auditoria pós-ciclos 1 a 5`](docs/audits/2026-07-29-reconciliacao-pos-ciclos-1-5.md);
- [`Rastreabilidade da migration SME`](docs/audits/2026-07-29-rastreabilidade-migration-sme.md).

## Regra de precedência

O estado do sistema é determinado por:

1. código-fonte remoto;
2. migrations, políticas, funções e dados efetivos do Supabase autorizado;
3. artefato implantado na Vercel;
4. testes e evidências reproduzíveis;
5. decisões funcionais vigentes;
6. documentação alinhada às fontes anteriores.

Planos, relatórios e documentos históricos não prevalecem sobre código e ambientes reais.

## Entregas consolidadas

### Governança da Gestão SME

- visão mensal e Prontuário restritos à identificação e bonificação;
- Pendências consultáveis em modo somente leitura;
- mutações bloqueadas na política de capacidades, handlers e serviços;
- Registros Internos limitados ao próprio `actor_user_id`;
- RLS de `administrative_logs` vinculada ao `auth.uid()`;
- programas por exercício preservados fora desse escopo.

### Ciclo 1 — competência mensal global

- contexto único `RadarCompetenceContext`;
- janeiro a dezembro de 2026 disponíveis;
- seletor mensal transversal;
- sincronização entre exercício e competência;
- preservação da seleção entre telas e recarga;
- fechamento configurado em dezembro de 2026.

### Ciclo 2 — avaliação mensal certificada

- projeção canônica `evaluateMonthlyEvaluation`;
- resultado APTA/INAPTA;
- identificação de campos ausentes;
- situação e conclusão técnica separadas;
- pendências recortadas por escola, competência e programa;
- consulta e consolidação baseadas na mesma projeção;
- persistência atômica, autoria, auditoria e `row_version` preservados.

### Ciclo 3 — timeline cronológica

- projeção somente leitura por unidade e competência;
- verificações, pendências, tentativas, contatos, notas, bens e logs consolidados;
- ordenação estável e deduplicação de eventos;
- vínculos e autoria preservados;
- recorte de visibilidade para Gestão SME;
- aba **Histórico cronológico** no Prontuário;
- nenhuma tabela paralela de timeline.

### Ciclo 4 — certificação dos relatórios Excel

- certificação separada do relatório institucional e do Excel SME mensal;
- comparação endereço a endereço e valor a valor no OOXML;
- quatro abas institucionais e uma aba SME;
- ausência de `dataValidations` no Excel SME;
- hashes e manifesto determinístico;
- massa sintética sem dados pessoais;
- evidência regenerada pelo `test:readiness`.

Limites atuais:

- o botão institucional permanece vinculado ao CSV;
- a abertura manual no Microsoft Excel desktop ainda integra o gate final.

### Ciclo 5 — navegação contextual

- retorno entre Carteira, Dashboard, Pendências e Prontuário;
- preservação de competência, rota, filtros, rolagem e foco;
- pilha de até 12 transições em `sessionStorage`;
- foco restaurado somente em controle acionável visível;
- suporte validado em desktop, Android e iPhone;
- fallback **Voltar para Carteira** em acesso direto;
- nenhuma persistência remota adicional.

## Modelo funcional

### Bonificação

Avalia a entrega tempestiva dos documentos exigidos e produz o resultado **APTA** ou **INAPTA** conforme a competência e o programa.

### Análise técnica

Registra a qualidade e a correção de cada documento: não analisado, em análise, incorreto, correto ou correto após o prazo.

### Pendência operacional

```text
Aberta
  ↓ novo envio
Aguardando reanálise
  ├─ reanálise correta → Resolvida
  └─ reanálise incorreta → Aberta
```

Também existe `Cancelada`, com preservação de motivo, autoria e histórico.

Bonificação, análise e pendência são dimensões independentes. Regularização posterior não reescreve automaticamente o resultado histórico da bonificação.

## Perfis

- **Controlador:** carteira principal com colaboração nas demais escolas da própria CRE e autoria real preservada;
- **Assistente de Verbas Federais:** acompanhamento transversal, Gestão de Equipe, retificações e ações autorizadas;
- **Gestão SME:** consulta gerencial, sem mutações operacionais nas superfícies definidas;
- **Equipe de Inventário:** fluxo patrimonial autorizado;
- **Administrador técnico:** infraestrutura, perfis, escopos, importações e auditoria.

## Arquitetura

```text
Frontend
   ↓
Serviços de aplicação e unidade de trabalho
   ↓
Contrato único de repositório
   ├── SupabaseRepository — Preview e Production
   └── LocalStorageRepository — rollback emergencial
   ↓
Supabase Auth + PostgreSQL + RLS + RPCs + auditoria
```

Requisitos estruturais:

- autenticação institucional;
- autorização por papel e escopo;
- RLS em profundidade;
- operações compostas transacionais;
- concorrência otimista por `row_version`;
- autoria real em mutações;
- snapshots, importação controlada, reconciliação e rollback;
- credencial administrativa exclusivamente server-side.

Nunca utilizar `service_role`, `sb_secret_*`, senha do banco ou token administrativo no frontend, GitHub ou logs.

## Dados observados em Production

Data de corte: 29/07/2026.

| Entidade | Quantidade |
|---|---:|
| Escolas | 164 |
| Programas | 8 |
| Vínculos escola–programa | 431 |
| Perfis ativos | 13 |
| Competências | 12 |
| Verificações | 6 |
| Pendências | 3 |
| Tentativas | 3 |
| Contatos | 5 |
| Registros administrativos | 82 |
| Bens | 2 |

Essas quantidades são um retrato operacional, não constantes de negócio.

## Rastreabilidade da migration SME

O arquivo local é:

```text
20260728182226_sme_access_governance.sql
```

O Supabase registra:

```text
version = 20260728190344
name = sme_access_governance
```

O conteúdo possui o mesmo comprimento e o mesmo SHA-256 nos dois lados:

```text
cddda35f4cc08b92093071f888cf958ae052ae82775c91366e4d729434427f0e
```

Não há divergência funcional identificada, mas o histórico deve ser reconciliado por procedimento suportado e testado antes da próxima migration de Production. Não renomear, reaplicar ou editar diretamente o histórico remoto sem plano específico.

## Executar localmente

```bash
npm ci
npm start
```

Aplicação local:

```text
http://127.0.0.1:4175
```

## Gates principais

```bash
npm run test:readiness
npm run supabase:start
npm run supabase:reset
npm run supabase:test:db
npm run supabase:lint:db
npm run test:e2e
npm run test:mobile
npm run build:vercel
```

O `test:readiness` inclui sintaxe, lint, testes unitários e de integração, certificação Excel, readiness Supabase, tipagem de banco, configuração de runtime, artefatos gerados e auditoria funcional.

## Bloqueadores antes da liberação oficial

1. reconciliar a versão da migration SME no histórico local/remoto;
2. homologar manualmente os relatórios no Microsoft Excel desktop;
3. habilitar proteção contra senhas vazadas no Supabase Auth;
4. fixar deliberadamente a major operacional do Node;
5. testar backup e restauração em ambiente descartável;
6. executar gate remoto por perfil e viewport;
7. concluir UAT;
8. realizar polimento editorial e visual preservando identidade e regras de produto;
9. registrar decisão formal de liberação.

## Documentação

Índice principal: [`docs/README.md`](docs/README.md).

Documentos de entrada:

- [`Estado atual`](docs/CURRENT_STAGE.md);
- [`Contexto funcional e arquitetural`](docs/PROJECT_CONTEXT.md);
- [`Registro de decisões`](docs/DECISION_LOG.md);
- [`Status documental`](docs/reference/STATUS_DOCUMENTOS.md);
- [`Auditoria pós-ciclos`](docs/audits/2026-07-29-reconciliacao-pos-ciclos-1-5.md);
- [`Auditoria da migration SME`](docs/audits/2026-07-29-rastreabilidade-migration-sme.md).

## Próxima frente

Os ciclos 1 a 5 estão encerrados. A próxima frente ainda não foi escolhida e deve partir dos bloqueadores reais, sem reabrir entregas concluídas e sem retomar programas por exercício sem decisão específica.
