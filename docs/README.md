# Documentação do RADAR PDDE

**Classe documental:** Canônico — índice e rota de leitura  
**Atualizado em:** 7 de setembro de 2026

## 1. Rota obrigatória

A documentação possui uma única porta de entrada. Não começar por plano, auditoria, PR ou handoff antigo.

Ordem:

1. [`../AGENTS.md`](../AGENTS.md) — regras de trabalho e precedência;
2. [`reference/SYSTEM_CANONICAL_MODEL.md`](reference/SYSTEM_CANONICAL_MODEL.md) — modelo integrado do produto: superfícies, perfis, entidades, fluxos, estados, autoridades, diferenças deliberadas e invariantes;
3. [`CURRENT_STAGE.md`](CURRENT_STAGE.md) — estado mutável, prioridade, PRs pausados/ativos e classificação corrente;
4. [`reference/ENGINEERING_METHOD.md`](reference/ENGINEERING_METHOD.md) — método permanente de engenharia;
5. [`reference/FRONTEND_USER_VALIDATION_GATE.md`](reference/FRONTEND_USER_VALIDATION_GATE.md) — gate permanente de jornada real pelo frontend;
6. [`reference/STATUS_DOCUMENTOS.md`](reference/STATUS_DOCUMENTOS.md) — validade documental e separação entre vigente, gerado, histórico e superado;
7. [`reference/FUNCTIONAL_CONTRACT_MATRIX.md`](reference/FUNCTIONAL_CONTRACT_MATRIX.md) e JSON fonte — operações ponta a ponta;
8. ADRs e referências especializadas da área afetada;
9. planos, auditorias, handoffs e evidências históricas apenas para compreender o seu momento/SHA.

## 2. Função de cada documento canônico

| Documento | Função |
|---|---|
| `AGENTS.md` | roteador obrigatório e regras de trabalho |
| `reference/SYSTEM_CANONICAL_MODEL.md` | mapa único do sistema e seus contratos funcionais |
| `CURRENT_STAGE.md` | estado mutável e próxima prioridade |
| `reference/ENGINEERING_METHOD.md` | método de investigação, implementação e revisão |
| `reference/FRONTEND_USER_VALIDATION_GATE.md` | prova obrigatória pela interface real |
| `reference/STATUS_DOCUMENTOS.md` | validade e classificação da documentação |
| `DECISION_LOG.md` + ADRs | decisões duráveis e especializações |
| matriz funcional JSON/MD | contrato operacional executável/gerado |

O objetivo é impedir que o mesmo assunto volte a ser reconstruído a partir de documentos parcialmente sobrepostos.

## 3. Fontes de verdade

Para saber o que existe de fato:

1. código do SHA analisado;
2. Supabase/Auth/RLS/RPCs/Edge Functions e dados efetivos;
3. artefato Vercel do ambiente analisado;
4. decisões funcionais vigentes;
5. testes atuais que representam o contrato vigente;
6. documentação canônica;
7. históricos, planos e memória de conversa.

Documentação antiga não redefine o código. Quando há divergência, investigar qual fonte está desatualizada antes de alterar o produto.

## 4. Princípios funcionais já consolidados

O modelo detalhado está em `SYSTEM_CANONICAL_MODEL.md`. Em resumo:

- Supabase é a persistência canônica de Production;
- competência global usa `RadarCompetenceContext`;
- Pendências é passivo transversal;
- página de Pendências mede antiguidade histórica e Dashboard/Carteira podem medir tempo da ação corrente;
- bonificação, análise técnica e Pendência são dimensões independentes;
- NF usa análise/Pendência individual por `registered_invoice_id`, com bonificação agregada;
- `a_identificar` novo nasce `Incorreto + Pendência` atomicamente;
- `boleto_internet` é tipo de gasto de NF, apenas Educação Conectada;
- Consulta Assessoria é individual por NF de serviço;
- `Inventariada` é terminal;
- commit remoto confirmado e sincronização local são fronteiras diferentes;
- performance não é autoridade de negócio;
- mudança que afeta usuário exige validação pela interface real.

## 5. Documentação especializada vigente

Consultar conforme a área materialmente afetada:

- [`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) — contexto funcional/arquitetural detalhado;
- [`DECISION_LOG.md`](DECISION_LOG.md) — decisões duradouras;
- [`architecture/`](architecture/) — contratos arquiteturais específicos;
- [`decisions/`](decisions/) — ADRs;
- [`reference/PRODUCT_SURFACE_CATALOG.md`](reference/PRODUCT_SURFACE_CATALOG.md) — catálogo detalhado de superfícies;
- [`reference/SUPABASE_DATA_DICTIONARY.md`](reference/SUPABASE_DATA_DICTIONARY.md) — dicionário de dados;
- [`reference/SUPABASE_PERMISSIONS_MATRIX.md`](reference/SUPABASE_PERMISSIONS_MATRIX.md) — matriz de permissões;
- [`reference/TEST_GOVERNANCE.md`](reference/TEST_GOVERNANCE.md) — interpretação dos testes.

## 6. Histórico

Diretórios como `audits/`, `handoff/`, `superpowers/plans/`, `evidence/` e `history/` preservam rastreabilidade. Eles não formam uma fila implícita de execução.

R1–R9 são identificadores históricos. A classificação atual pertence exclusivamente a `CURRENT_STAGE.md`.

## 7. Regra de criação de documentação

Novo documento canônico não pode ficar solto no repositório.

Na mesma entrega que criar ou alterar fonte canônica, atualizar quando aplicável:

1. `AGENTS.md`;
2. este índice;
3. `reference/STATUS_DOCUMENTOS.md`;
4. `reference/SYSTEM_CANONICAL_MODEL.md` se regra, autoridade, fluxo ou invariante mudar;
5. `CURRENT_STAGE.md` se a mudança alterar estado/prioridade.

Documento histórico não deve ser reescrito para fingir atualidade. Deve ser preservado e, quando necessário, reclassificado por uma fonte canônica posterior.
