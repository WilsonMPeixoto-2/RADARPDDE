# AGENTS.md — RADAR PDDE 2026

## Frente integrada em execução — leitura obrigatória temporária

Até o encerramento explícito desta frente, **todo agente deve ler**, além da rota canônica abaixo:

1. [Contrato aprovado de evolução](docs/reference/PRONTUARIO_CORRECAO_CONTRATO.md): separa regras de destino das regras ainda publicadas;
2. [Plano integrado](docs/superpowers/plans/2026-11-14-prontuario-visual-correcao-integrada.md);
3. [Checkpoint único de execução (seção vigente atualizada em 16/11)](docs/handoff/2026-11-15-prontuario-integracao-verificada.md) — LEITURA OBRIGATÓRIA antes de qualquer intervenção;
4. [Matriz de transição integral T0–T6](docs/reference/PRONTUARIO_PLANO_TRANSICAO_INTEGRAL_T0_T6.md) — obrigatória para substituir regras legadas, adaptar expectativas de teste, conectar backend/frontend/consumidores e reconciliar documentos **no mesmo lote**, sem confundir funcionalidades ainda desligadas com falhas de Produção;
5. [Handoff de origem e decisões históricas](docs/handoff/2026-11-14-prontuario-correcao-integrada.md), para conferir o que precedeu a integração.

**Princípio de produto obrigatório — favorecer a intenção do operador:** ler a [diretriz transversal de correção assistida](docs/reference/PRONTUARIO_CORRECAO_CONTRATO.md) e a [matriz de transição, §7.1](docs/reference/PRONTUARIO_PLANO_TRANSICAO_INTEGRAL_T0_T6.md). **Não replicar bloqueios antigos sem examinar por que existem.** Prioridade: correção direta com recomposição segura → alteração permitida com ação posterior contextual → orientação para resolver dependência anterior e retomar → bloqueio somente por risco concreto, impossibilidade ou falta de capacidade. Para bonificação consolidada, o destino é permitir correção do perfil autorizado, mostrar **“Alterações pendentes de consolidação”** e oferecer **“Consolidar alterações”**, conservando histórico e exportação coerente; não prometer regravar XLSX já baixado. A responsabilidade do usuário pelas informações não elimina validações do banco. Testar a conclusão da jornada, não apenas a mensagem de bloqueio.

**Estado vigente T2/T3, auditado em 16/11:** os comandos de correção e exclusão de NF/Pendência e a interface candidata **já estão conectados na branch** sob flag OFF por padrão. Foram incorporadas seletivamente seis correções do Antigravity `1cb118fd`; não repetir o merge. Outros agentes relataram testes Playwright com **RPC simulada**, e a integração executou validação isolada do diálogo. **As 74 verificações pgTAP ainda não foram executadas integralmente com PostgreSQL no HEAD integrado; Auth/RLS, F5, segunda sessão, concorrência e aceite humano permanecem pendentes.** Consultar primeiro a seção **“Estado vigente — reconciliação de 16/11/2026”** do [checkpoint único](docs/handoff/2026-11-15-prontuario-integracao-verificada.md) e o [estado mutável](docs/CURRENT_STAGE.md). Antigos trechos que só mencionam diálogo piloto ou exclusão de NF não conectada são históricos. Os guards da rota legada permanecem até o corte comprovado; nenhuma publicação autorizada.

**Gate obrigatório de validação local:** antes de encerrar T1–T5, ler a [seção 8 da matriz de transição](docs/reference/PRONTUARIO_PLANO_TRANSICAO_INTEGRAL_T0_T6.md), preparar e testar a cópia real do RADAR em ambiente local com Supabase completo por Docker, executar Playwright com Auth/RLS e dados sintéticos e obter a validação navegada do proprietário nos marcos definidos. Não considerar mock de RPC, CI verde, código isolado ou documentação como substitutos da experiência real. A substituição dos testes e regras legadas ocorre no mesmo lote de integração. Nenhuma publicação está autorizada nesta frente.

Antes de editar, conferir os commits remotos e o lote em andamento. Não executar novamente etapas já comprovadas nem reintroduzir justificativas obrigatórias/bloqueios históricos a partir de documentos antigos. **Aprovação de regra futura não significa que já foi aplicada em Production.** Código/SQL atuais continuam evidência do comportamento efetivo. Alteração em módulo compartilhado deve preservar esta frente, o PR #515 (layout de Pendências) e o PR #522 (quebras de parágrafos, CSS); o PR #523 (auth) é hotfix independente e não pode ser introduzido automaticamente na candidata. Atualizar handoff e evidências no mesmo checkpoint remoto de cada entrega. Remover esta rota temporária apenas quando a frente estiver encerrada e reconciliada com os documentos canônicos.

**Classe documental:** Canônico — roteador obrigatório para agentes e novos chats  
**Roteamento permanente original:** 18/10/2026; **frente temporária reconciliada em:** 16/11/2026

## 1. Leitura obrigatória

Antes de analisar funcionalmente ou alterar o repositório, leia **nesta ordem**:

1. `docs/reference/SYSTEM_CANONICAL_MODEL.md` — o que é o RADAR, superfícies, perfis, entidades, fluxos, estados, autoridades, diferenças deliberadas e invariantes;
2. `docs/reference/PRODUCT_SURFACE_CATALOG.md` — modelo mental do usuário, finalidade humana de cada superfície, hierarquia visual, encontrabilidade e papel de cada tela na jornada;
3. `docs/CURRENT_STAGE.md` — estado mutável, prioridade corrente, Production e PRs ativos;
4. **handoff corrente explicitamente apontado por `CURRENT_STAGE.md`, quando houver** — contexto detalhado da frente ativa; somente o arquivo apontado recebe esse papel temporário;
5. `docs/reference/ENGINEERING_METHOD.md` — método permanente de investigação, implementação e revisão adversarial;
6. `docs/reference/FRONTEND_USER_VALIDATION_GATE.md` — gate permanente de jornada real pelo frontend;
7. `docs/reference/STATUS_DOCUMENTOS.md` — validade, precedência e classificação da documentação;
8. `docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md` e seu JSON fonte quando a frente tocar operação mapeada;
9. ADRs e referências especializadas da área afetada;
10. planos, auditorias, evidências e demais handoffs históricos apenas depois da leitura canônica e somente como contexto do seu SHA/momento.

**Decisão funcional obrigatória (ADR-056):** o RADAR é ferramenta interna de equipe pequena. A carteira/atribuição escolar organiza o trabalho, não restringe colegas autenticados que executam uma operação já permitida pelo seu perfil: todas as escolas cadastradas no RADAR são colaborativas, independentemente do responsável. Antes de propor bloqueio por escola, CRE ou carteira, ler [docs/DECISION_LOG.md](docs/DECISION_LOG.md), ADR-056, e [matriz de permissões](docs/reference/SUPABASE_PERMISSIONS_MATRIX.md). Nunca confundir privilégios administrativos server-side `service_role` com atribuição de escolas de colegas; preservar integridade documental, autoria, credenciais e regras operacionais sem criar restrições artificiais de acesso.

**Rota obrigatória de infraestrutura:** para CI/GitHub Actions, troca de runner, Docker/registry, Supabase CLI, geração de tipos ou atualização de tooling, ler [docs/runbooks/CI_TOOLCHAIN_REGISTRY.md](docs/runbooks/CI_TOOLCHAIN_REGISTRY.md) antes de propor alterações. Consultar o SHA, a versão e o log atuais; não confundir falha externa com defeito do produto. Este caminho complementa, não substitui, a leitura canônica acima.

**Nenhuma análise funcional pode começar por um plano histórico, PR antigo, memória de conversa ou arquivo isolado.**

O fato de `CURRENT_STAGE.md` apontar um handoff corrente não o transforma em regra funcional canônica: ele detalha o momento operacional. Regras duráveis continuam no modelo canônico/ADRs e fatos de ambiente devem ser revalidados ao vivo.

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

### Regra de julgamento humano e qualidade implícita

O pedido do usuário descreve o objetivo, as regras e as restrições conhecidas. Ele não precisa enumerar condições básicas de qualidade de uma interface. Para qualquer alteração percebida pelo usuário, é responsabilidade do agente preservar e avaliar também legibilidade, espaçamento, alinhamento, contraste, clipping, overflow, hierarquia, densidade, coerência, responsive, affordance, feedback e continuidade visual.

Isso não autoriza inventar regra de negócio, conteúdo institucional, permissão ou fluxo novo. Autoriza e exige julgamento profissional sobre a qualidade integrada do resultado dentro da intenção funcional já definida.

**Cumprir literalmente o pedido não basta se o produto renderizado ficar ruim, ambíguo ou difícil de usar.**

Antes de declarar concluída uma alteração de interface, fazer uma passagem deliberadamente de fora para dentro, separada da revisão técnica:

1. abrir o resultado renderizado no SHA candidato;
2. inicialmente não usar código, DOM, seletor, DevTools ou conhecimento da implementação para justificar a tela;
3. observar a superfície como um operador que acabou de chegar nela;
4. responder, apenas pelo que está visível:
   - onde estou e qual contexto estou operando?
   - qual registro ou objeto está em foco?
   - qual é o estado atual?
   - qual informação merece atenção primeiro?
   - qual é a próxima ação principal e como descubro isso?
   - depois da ação, o que aconteceu e o que devo fazer em seguida?
5. inspecionar o conjunto, não apenas o componente alterado: elementos vizinhos, ordem visual, respiro, alinhamento, densidade, cortes, sobreposição, scroll, contraste, títulos, ações concorrentes e feedback;
6. repetir a leitura depois da ação e, quando material, após voltar, trocar de superfície ou recarregar.

Se as respostas dependerem de saber previamente como o código funciona, a interface ainda não se explica suficientemente para o usuário.

O agente pode ajustar problemas diretamente causados pela sua mudança que impeçam leitura, composição ou uso adequado, mesmo que o prompt não tenha nomeado cada detalhe visual. Problemas preexistentes e não relacionados devem ser registrados e roteados, não usados para ampliar silenciosamente o escopo funcional.

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
- memória/cache do navegador pode ser usada como projeção operacional descartável para responsividade, mas não pode virar segunda fonte de verdade no modo Supabase;
- no modo remoto, falha de persistência não pode ser mascarada por estado local e reload deve convergir para a autoridade Supabase;
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
- coleções operacionais crescentes não devem voltar ao bootstrap global quando o contexto pode ser limitado;
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

Uso de cache/memória local é positivo quando reduz trabalho e mantém essa convergência. É regressão quando exige leitura/reconstrução global, sobrevive como verdade concorrente ou deixa a UI afirmar estado que o Supabase não confirmou.

## 8. Método de trabalho

Sequência padrão:

```text
revalidar main/ambiente
→ ler modelo canônico + catálogo de superfícies
→ ler CURRENT_STAGE + handoff corrente apontado
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
→ leitura humana outside-in do resultado integrado
→ corrigir composição e clareza diretamente afetadas até o resultado ser utilizável
→ atualizar documentação afetada
```

Performance nunca compra regressão funcional.


### Navegador MCP para agentes

O repositório versiona `.mcp.json` e `.codex/config.toml` com Playwright MCP
fixado em `0.0.82` e Chrome DevTools MCP fixado em `1.12.0`.

- use `playwright` para navegação isolada e reproduzível;
- use `playwright-session` quando a validação depender de sessão já autenticada, SSO, 2FA ou extensões do navegador;
- use `chrome-devtools` para diagnóstico de console/rede, CSS, acessibilidade, LCP, heap e PWA; ele abre Chrome isolado e não reutiliza a sessão do Playwright;
- para o sistema publicado em `https://radarpdde-fix.vercel.app`, use esse navegador na parte pública ou `chrome-devtools-session` para observar a sessão autenticada no Chrome da mesma máquina; confirme URL, manifesto/SHA, runtime e perfil antes do diagnóstico;
- `chrome-devtools-session` usa `--auto-connect`, exige Chrome 144+ com depuração remota habilitada e aceite da conexão; configuração registrada não comprova login;
- diagnóstico de Production é leitura por padrão, incluindo não disparar exportações auditadas ou workflows de CRUD; Preview só permite mutações após confirmar backend separado/descartável e escopo autorizado;
- antes desse diagnóstico, leia `.agents/skills/radar-browser-diagnostics/SKILL.md` e carregue somente os guias oficiais pertinentes entre os sete versionados em `.agents/skills/`;
- a configuração MCP é tooling do agente e não integra o bundle/runtime do RADAR;
- nenhuma sessão autenticada autoriza escrita em Production por inferência: aplicar os mesmos guardrails de ambiente e autorização do restante do projeto;
- para detalhes operacionais, leia `docs/runbooks/AGENT_BROWSER_MCP.md`.

## 9. Documentação: regra de manutenção

A documentação não existe para decorar o repositório.

### Papéis

- `AGENTS.md`: roteador obrigatório e regras de trabalho;
- `docs/reference/SYSTEM_CANONICAL_MODEL.md`: modelo integrado do produto;
- `docs/reference/PRODUCT_SURFACE_CATALOG.md`: modelo mental do usuário e contrato das superfícies;
- `docs/CURRENT_STAGE.md`: estado mutável, Production, frente ativa e ponte para o handoff corrente;
- handoff corrente apontado por `CURRENT_STAGE.md`: contexto detalhado temporário da frente ativa;
- `docs/reference/STATUS_DOCUMENTOS.md`: validade documental;
- `docs/reference/ENGINEERING_METHOD.md`: método;
- `docs/reference/FRONTEND_USER_VALIDATION_GATE.md`: aceitação pela interface real;
- ADR: decisão durável/especializada;
- plano/handoff/auditoria/evidência não apontado como corrente: contexto histórico do seu momento, não baseline automática.

### Obrigação de reconciliação

Todo novo documento classificado como **canônico** deve, na mesma entrega:

1. atualizar a rota em `AGENTS.md` se introduzir leitura obrigatória;
2. atualizar `docs/README.md`;
3. atualizar `docs/reference/STATUS_DOCUMENTOS.md`;
4. atualizar `SYSTEM_CANONICAL_MODEL.md` se mudar regra, autoridade, fluxo ou invariante;
5. atualizar `PRODUCT_SURFACE_CATALOG.md` se mudar finalidade, jornada, ação, encontrabilidade ou semântica visual de uma superfície;
6. atualizar `CURRENT_STAGE.md` quando mudar estado/prioridade;
7. reclassificar explicitamente qualquer documento anterior que deixe de orientar o presente.

Se `CURRENT_STAGE.md` nomear um handoff corrente, esse vínculo deve ser removido/substituído quando a frente encerrar. É proibido deixar dois handoffs concorrentes como “correntes”.

É proibido criar uma nova fonte canônica “solta” e esperar que um agente futuro a descubra.

## 10. Estado mutável

Não registrar aqui SHA corrente, deployment atual, fila de PRs ou conclusão temporal de fases, salvo quando indispensável à regra do roteador. Esses dados pertencem a `docs/CURRENT_STAGE.md` e devem ser revalidados ao vivo.

Essa separação é intencional: `AGENTS.md` deve envelhecer devagar; `CURRENT_STAGE.md` pode mudar com frequência.
