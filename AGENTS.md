# AGENTS.md — RADAR PDDE 2026

**Classe documental:** Canônico — roteador obrigatório para agentes e novos chats  
**Atualizado em:** 8 de setembro de 2026

## 1. Leitura obrigatória

Antes de analisar funcionalmente ou alterar o repositório, leia **nesta ordem**:

1. `docs/reference/SYSTEM_CANONICAL_MODEL.md` — o que é o RADAR, superfícies, perfis, entidades, fluxos, estados, autoridades, diferenças deliberadas e invariantes;
2. `docs/reference/PRODUCT_SURFACE_CATALOG.md` — modelo mental do usuário, finalidade humana de cada superfície, hierarquia visual, encontrabilidade e papel de cada tela na jornada;
3. `docs/CURRENT_STAGE.md` — estado mutável, prioridade corrente, PRs pausados/ativos e decisões temporais;
4. `docs/reference/ENGINEERING_METHOD.md` — método permanente de investigação, implementação e revisão adversarial;
5. `docs/reference/FRONTEND_USER_VALIDATION_GATE.md` — gate permanente de jornada real pelo frontend;
6. `docs/reference/STATUS_DOCUMENTOS.md` — validade, precedência e classificação da documentação;
7. `docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md` e seu JSON fonte quando a frente tocar operação mapeada;
8. ADRs e referências especializadas da área afetada;
9. planos, auditorias, evidências e handoffs históricos apenas depois da leitura canônica e somente como contexto do seu SHA/momento.

**Nenhuma análise funcional pode começar por um plano histórico, PR antigo, memória de conversa ou arquivo isolado.**

## 2. Regra de reconstrução de contexto

Antes de propor mudança funcional, preencher mentalmente ou no trabalho da frente:

```text
objetivo humano da superfície
→ o que o usuário vê e entende no layout
→ fato de negócio
→ entidade canônica
→ autoridade de domínio/aplicação
→ persistência/backend
→ projeções relacionadas
→ diferenças deliberadas entre superfícies
→ invariantes
→ decisão vigente
→ jornada real do usuário
```

Se essa cadeia ainda não estiver clara, continue investigando. Não altere o produto para resolver uma suposta ausência encontrada em leitura parcial.

### Regra contra análise apenas técnica

Conhecer a função, serviço, tabela ou RPC não basta para afirmar que se compreendeu a funcionalidade.

Antes de classificar um comportamento como defeito, verificar também:

- para que a tela existe;
- qual pergunta ela responde ao usuário;
- qual contexto precisa estar visível antes da ação;
- qual informação é histórica, gerencial, técnica ou operacional;
- onde o usuário espera executar a ação;
- como o resultado aparece depois do clique;
- o que ele reencontra ao navegar, voltar ou recarregar.

**Diferença entre duas projeções não é bug por si só.** Só existe inconsistência quando superfícies que deveriam responder à mesma pergunta apresentam fatos incompatíveis, ou quando uma projeção viola deliberadamente a finalidade confirmada da tela.

## 3. Precedência de autoridade

Para determinar o comportamento atual:

1. código do SHA analisado;
2. Supabase/Auth/RLS/RPCs/Edge Functions e dados efetivos;
3. artefato Vercel do ambiente analisado;
4. decisões funcionais vigentes e ADRs supervenientes;
5. testes atuais que representam o contrato vigente;
6. `SYSTEM_CANONICAL_MODEL.md`, `PRODUCT_SURFACE_CATALOG.md` e demais documentos vigentes;
7. auditorias, evidências, planos, handoffs e memória de conversa históricos.

Teste ou documento antigo não prevalece sobre regra posterior comprovada. Não modificar código correto apenas para satisfazer expectativa histórica.

## 4. Identidade do produto

O RADAR PDDE é sistema institucional de gestão, controle, acompanhamento e apoio à decisão para o PDDE da 4ª CRE/SME-Rio. Não é um CRUD genérico.

O produto deve manter coerência entre:

- escolas, competências e programas;
- bonificação, análise técnica e Pendências;
- Notas Fiscais e seus efeitos;
- Consulta Assessoria;
- Capital e Inventário;
- perfis, escopos e autoria;
- Dashboard, Carteira, Competências, Prontuário, Pendências, Inventário, Timeline, Registros Internos e exportações.

O modelo completo está em `docs/reference/SYSTEM_CANONICAL_MODEL.md`. A finalidade humana e a leitura de cada superfície estão em `docs/reference/PRODUCT_SURFACE_CATALOG.md`. Não duplicar esses mapas aqui.

## 5. Guardrails permanentes

Preservar, entre outros, os invariantes do modelo canônico:

- Supabase é a persistência canônica de Production;
- `RadarCompetenceContext` é a autoridade da competência global;
- Pendências é passivo transversal entre competências;
- página de Pendências usa antiguidade histórica; Dashboard/Carteira podem usar tempo da ação corrente;
- bonificação, análise técnica e Pendência são dimensões independentes;
- NF usa análise/Pendência individual por `registered_invoice_id`, com bonificação agregada;
- `a_identificar` novo nasce `Incorreto + Pendência` atomicamente;
- legados legítimos não recebem backfill inventado;
- `boleto_internet` é tipo de gasto dentro de Notas Fiscais, somente Educação Conectada;
- Consulta Assessoria é individual por NF de serviço;
- Pendência da NF A não bloqueia NF B;
- novo envio não resolve Pendência;
- reanálise exige tentativa/contexto/versionamento válidos;
- `Inventariada` é terminal;
- commit remoto confirmado e sincronização local são fronteiras diferentes;
- wrapper de performance não é autoridade de negócio;
- layout aprovado de Prontuário/Pendências não deve regredir por plano histórico;
- comunicação externa não expõe o nome interno `RADAR PDDE`;
- mudança que afeta o usuário só é concluída após o gate real de frontend.

## 6. Autoridade única em fluxos críticos

Para fluxo P0/P1, antes de criar handler, wrapper, extensão, RPC ou nova persistência:

1. localizar a operação na matriz funcional;
2. identificar todos os produtores e consumidores atuais;
3. conferir módulos carregados dinamicamente e ordem de bootstrap;
4. identificar a autoridade vigente de cada etapa;
5. confirmar que a suposta ausência não está implementada em outro módulo;
6. somente então alterar código.

Exemplo canônico de autoridade deliberadamente distribuída, Consulta Assessoria:

```text
edição ordinária
→ InvoiceService.updateServiceAdvisory

Incorreto + abertura / reanálise
→ service-advisory-pendency.js

novo envio corretivo
→ service-advisory-corrective-submission.js

persistência
→ RPC específica correspondente
```

Não fundir responsabilidades apenas para tornar a arquitetura “mais simples” se isso violar o contrato vigente.

## 7. Escrita e convergência

Para operação de escrita relevante, buscar:

```text
estado persistido remoto
=
estado local da aplicação
=
estado apresentado ao usuário
=
estado reencontrado após reload
```

Quando houver efeitos transversais, conferir as projeções relacionadas. Exemplos:

- NF permanente ↔ bem patrimonial;
- análise individual ↔ Pendência;
- reanálise ↔ tentativa mais recente;
- mudança de equipe ↔ carteira;
- retificação ↔ histórico/auditoria.

## 8. Método de trabalho

Sequência padrão:

```text
revalidar main/ambiente
→ ler modelo canônico + catálogo de superfícies
→ reconstruir objetivo humano e jornada
→ localizar autoridade real
→ tentar refutar a hipótese
→ classificar causa atual
→ branch isolada
→ RED quando houver defeito/código
→ menor mudança coerente
→ revisão adversarial proporcional
→ gates do SHA final
→ jornada real pelo frontend quando aplicável
→ inspeção visual da superfície afetada
→ atualizar documentação afetada
```

Performance nunca compra regressão funcional.

## 9. Documentação: regra de manutenção

A documentação não existe para decorar o repositório.

### Papéis

- `AGENTS.md`: roteador obrigatório e regras de trabalho;
- `docs/reference/SYSTEM_CANONICAL_MODEL.md`: modelo integrado do produto;
- `docs/reference/PRODUCT_SURFACE_CATALOG.md`: modelo mental do usuário e contrato das superfícies;
- `docs/CURRENT_STAGE.md`: estado mutável e prioridade;
- `docs/reference/STATUS_DOCUMENTOS.md`: validade documental;
- `docs/reference/ENGINEERING_METHOD.md`: método;
- `docs/reference/FRONTEND_USER_VALIDATION_GATE.md`: aceitação pela interface real;
- ADR: decisão durável/especializada;
- plano/handoff/auditoria/evidência: contexto histórico do seu momento, não baseline automática.

### Obrigação de reconciliação

Todo novo documento classificado como **canônico** deve, na mesma entrega:

1. atualizar a rota em `AGENTS.md` se introduzir leitura obrigatória;
2. atualizar `docs/README.md`;
3. atualizar `docs/reference/STATUS_DOCUMENTOS.md`;
4. atualizar `SYSTEM_CANONICAL_MODEL.md` se mudar regra, autoridade, fluxo ou invariante;
5. atualizar `PRODUCT_SURFACE_CATALOG.md` se mudar finalidade, jornada, ação, encontrabilidade ou semântica visual de uma superfície;
6. reclassificar explicitamente qualquer documento anterior que deixe de orientar o presente.

É proibido criar uma nova fonte canônica “solta” e esperar que um agente futuro a descubra.

## 10. Estado mutável

Não registrar aqui SHA corrente, deployment atual, fila de PRs ou conclusão temporal de fases, salvo quando indispensável à regra do roteador. Esses dados pertencem a `docs/CURRENT_STAGE.md` e devem ser revalidados ao vivo.

Essa separação é intencional: `AGENTS.md` deve envelhecer devagar; `CURRENT_STAGE.md` pode mudar com frequência.
