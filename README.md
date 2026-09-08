# RADAR PDDE 2026

Sistema institucional de gestão, controle, acompanhamento e apoio à decisão do PDDE da 4ª CRE/SME-Rio.

O produto organiza, em um mesmo domínio, competência mensal, carteira de escolas, Prontuário, bonificação, análise documental, Pendências, Notas Fiscais, Consulta Assessoria, patrimônio, Gestão de Equipe, histórico, acompanhamento gerencial e exportações.

## Comece aqui

A leitura do repositório possui uma rota obrigatória. Não começar por plano antigo, auditoria isolada ou memória de conversa.

1. [`AGENTS.md`](AGENTS.md)
2. [`docs/reference/SYSTEM_CANONICAL_MODEL.md`](docs/reference/SYSTEM_CANONICAL_MODEL.md)
3. [`docs/CURRENT_STAGE.md`](docs/CURRENT_STAGE.md)
4. [`docs/reference/ENGINEERING_METHOD.md`](docs/reference/ENGINEERING_METHOD.md)
5. [`docs/reference/FRONTEND_USER_VALIDATION_GATE.md`](docs/reference/FRONTEND_USER_VALIDATION_GATE.md)
6. [`docs/reference/STATUS_DOCUMENTOS.md`](docs/reference/STATUS_DOCUMENTOS.md)
7. matriz funcional, ADRs e referências especializadas da frente afetada
8. históricos somente depois

O modelo canônico integrado descreve **o que é o sistema**. `CURRENT_STAGE.md` descreve **em que ponto o trabalho está**.

## Fontes de verdade

Para determinar o comportamento atual:

1. código do SHA analisado;
2. Supabase/Auth/RLS/RPCs/Edge Functions e dados efetivos;
3. artefato Vercel correspondente;
4. decisões funcionais vigentes;
5. testes atuais que representam o contrato vigente;
6. documentação canônica;
7. planos, auditorias, handoffs, evidências e memória de conversa históricos.

Documentação antiga não redefine o produto. Quando houver divergência, investigar a fonte desatualizada antes de alterar código.

## Contratos essenciais

O detalhamento completo está no [modelo canônico](docs/reference/SYSTEM_CANONICAL_MODEL.md). Entre os guardrails principais:

- Supabase é a persistência canônica de Production;
- competência global usa `RadarCompetenceContext`;
- Pendências é passivo transversal entre competências;
- a página de Pendências mede antiguidade histórica, enquanto Dashboard/Carteira podem medir tempo da ação corrente;
- bonificação, análise técnica e Pendência são dimensões independentes;
- Notas Fiscais possuem análise/Pendência individual por `registered_invoice_id`, com bonificação agregada;
- `a_identificar` novo nasce `Incorreto + Pendência` atomicamente;
- `boleto_internet` é tipo de gasto de NF, somente em Educação Conectada;
- Consulta Assessoria é individual por NF de serviço;
- `Inventariada` é terminal;
- commit remoto confirmado e reconciliação local são fronteiras distintas;
- performance é diagnóstico, não autoridade funcional;
- mudança que afeta usuário exige validação real pelo frontend.

## Superfícies principais

- Dashboard;
- Carteira;
- Competências;
- Pendências;
- Prontuário e timeline;
- Capital e Inventário;
- Gestão de Equipe;
- Configurações SME;
- Registros Internos;
- alertas e busca global;
- exportações institucionais, SME e de Pendências.

## Perfis

- **Controlador:** operação autorizada na própria CRE, com carteira como responsabilidade principal;
- **Assistente de Verbas Federais:** operação transversal e Gestão de Equipe da CRE;
- **Gestão SME:** acompanhamento gerencial e configurações autorizadas;
- **Equipe de Inventário:** fluxo patrimonial autorizado;
- **Administrador técnico:** papel autenticado técnico de infraestrutura, escopos, importação, auditoria e homologação.

`technical_admin` não é um quinto perfil funcional cotidiano. A simulação visual não troca JWT nem reduz a autoridade autenticada.

## Estado atual

A prioridade e os PRs correntes ficam exclusivamente em [`docs/CURRENT_STAGE.md`](docs/CURRENT_STAGE.md). Não manter fila temporal duplicada neste README.

## Desenvolvimento e verificação

```bash
npm ci
npm run test:readiness
npm run test:e2e
npm run test:mobile
```

Supabase descartável:

```bash
npm run supabase:start
npm run supabase:reset
npm run supabase:test:db
npm run supabase:lint:db
```

Matriz funcional:

```bash
npm run generate:functional-matrix
npm run check:functional-matrix
```

## Governança documental

Novo documento canônico deve, na mesma entrega, ser reconciliado com:

- `AGENTS.md`;
- `docs/README.md`;
- `docs/reference/STATUS_DOCUMENTOS.md`;
- `docs/reference/SYSTEM_CANONICAL_MODEL.md` quando regra/fluxo/autoridade/invariante mudar;
- `docs/CURRENT_STAGE.md` quando estado ou prioridade mudar.

Plano, handoff, auditoria ou evidência não se torna baseline apenas por existir no repositório.
