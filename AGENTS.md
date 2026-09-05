# AGENTS.md — RADAR PDDE 2026

**Atualizado em:** 5 de setembro de 2026

> **PRIMEIRA LEITURA OBRIGATÓRIA:** [`START_HERE.md`](START_HERE.md).  
> Nenhum agente deve escolher plano, handoff, ADR ou auditoria como ponto de entrada antes de seguir `START_HERE.md` e verificar a baseline remota.

> **MÉTODO OBRIGATÓRIO:** análises e implementações críticas devem seguir [`docs/architecture/adversarial-analysis-and-implementation-method.md`](docs/architecture/adversarial-analysis-and-implementation-method.md). Suíte verde, CI verde ou documentação reconciliada não equivalem a prova de ausência de defeitos.

## 1. Continuidade obrigatória

Para qualquer nova sessão/chat/agente:

1. ler `START_HERE.md`;
2. verificar se a `main` ainda corresponde à baseline ali declarada;
3. ler `docs/CURRENT_STATE.md`;
4. ler o método adversarial e os achados adversariais correntes quando a tarefa tocar código/fluxo crítico;
5. usar `docs/MASTER_PLAN_CURRENT.md` como **único plano executável vigente** quando a tarefa fizer parte da frente planejada;
6. consultar `docs/PLAN_TRACEABILITY.md` somente para entender origem, absorção ou alteração de uma tarefa;
7. depois abrir código, testes, ADRs, migrations e evidências específicos da superfície em trabalho.

Planos/handoffs datados são histórico de seus checkpoints. Eles não constituem fila concorrente.

**Regra de precedência:** decisão/hotfix posterior deliberadamente aprovado prevalece sobre texto anterior na superfície que alterou. O plano é atualizado para refletir o produto atual; o produto não é revertido para caber no plano histórico.

Se fontes atuais conflitarem e a intenção não puder ser determinada com segurança, classificar como dúvida e investigar. Não escolher unilateralmente a regra mais antiga ou a mais conveniente.

## 2. Identidade do produto

O RADAR PDDE é sistema institucional de gestão, controle, acompanhamento e apoio à decisão para o PDDE da 4ª CRE/SME-Rio. Não é CRUD genérico.

Uma função não está pronta apenas porque grava no banco. Conforme o impacto, o usuário precisa conseguir encontrar a função, compreender o estado, executar a ação e reencontrar o resultado com coerência entre telas e dados.

Toda entrega deve considerar proporcionalmente:

- correção técnica e funcional;
- coerência entre perfis, telas e dados;
- integridade, rastreabilidade e auditabilidade;
- visualização e encontrabilidade;
- feedback e clareza da próxima ação;
- acessibilidade/mobile quando a superfície for afetada;
- persistência e releitura quando houver escrita.

## 3. Fontes de verdade

Para determinar **o que está implementado**:

1. código-fonte remoto do SHA analisado;
2. Supabase efetivo: migrations, funções, Auth, RLS e dados autorizados;
3. artefato Vercel e SHA publicado;
4. decisões funcionais vigentes;
5. testes que representam o contrato atual;
6. documentação corrente reconciliada;
7. histórico documental e memória de conversa.

Para determinar **o que executar a seguir**, usar `START_HERE.md` e `docs/MASTER_PLAN_CURRENT.md` depois de confirmar a baseline.

Se teste ou documento divergir de comportamento atual comprovado, investigar a divergência antes de alterar o produto. Teste não cria regra de negócio por conta própria.

## 4. Perfis e autorização

Perfis funcionais visíveis:

- Controlador (`controller`);
- Assistente de Verbas Federais (`federal_assistant`);
- Gestão SME (`sme_management`);
- Equipe de Inventário (`inventory`).

`technical_admin` é papel autenticado técnico separado, não quinto perfil funcional visual. Simulação visual não rebaixa a autoridade real do administrador técnico; auditoria deve preservar usuário real e perfil visual simulado quando houver.

Regras estáveis:

- Controlador atua na própria CRE e não redistribui `schools.controller_id` pela edição cadastral;
- Assistente possui atuação transversal autorizada e Gestão de Equipe;
- Gestão SME acompanha e usa apenas configurações/mutações expressamente autorizadas;
- Inventário opera o fluxo patrimonial autorizado;
- autorização deve existir também em serviço/banco quando a operação exigir, não apenas na UI.

## 5. Competência global

`RadarCompetenceContext` é a fonte canônica de competência mensal.

Dashboard, Carteira, Competências, Prontuário, Pendências, alertas, timeline e exportações devem consumir o mesmo contexto quando a função for mensal. Não criar seletor concorrente nem alterar `activeCompetenciaKey` diretamente quando a intenção for mudar a competência global.

Pendências são passivo transversal; a página de Pendências pode operar em todas as competências sem trocar silenciosamente a competência global.

## 6. Autoridade única e prevenção de correção duplicada

Antes de criar handler, wrapper, extensão, RPC ou rota de persistência para fluxo crítico:

1. localizar a operação na matriz/decisões atuais;
2. localizar produtores e consumidores, inclusive módulos dinâmicos;
3. inspecionar `product-extensions-bootstrap.js` quando houver extensão;
4. identificar a autoridade vigente de cada etapa;
5. procurar explicitamente segunda implementação, fallback, closure, callback, renderer legado ou chamada direta concorrente;
6. confirmar se a suposta ausência é real;
7. só então alterar.

Não duplicar regra porque ela não apareceu no primeiro arquivo inspecionado. Encontrar uma implementação correta também não encerra a busca por outra implementação executável.

Para Consulta Assessoria, preservar a separação vigente:

```text
edição ordinária
→ InvoiceService.updateServiceAdvisory

Incorreto + abertura/reanálise
→ service-advisory-pendency.js

novo envio corretivo
→ service-advisory-corrective-submission.js

persistência
→ RPC específica correspondente
```

A ordem/composição do bootstrap é parte do contrato e deve continuar coberta por regressões quando alterada.

## 7. Regras funcionais sensíveis a regressão

A lista corrente e detalhada está em `docs/CURRENT_STATE.md`. Antes de mexer nas superfícies correspondentes, preservá-la.

Resumo obrigatório:

- bonificação, análise técnica e Pendência são dimensões independentes;
- análise/Pendência fiscal e Consulta Assessoria usam individualização por `registered_invoice_id`;
- nova `a_identificar` nasce `Incorreto + Pendência` atomicamente e não há backfill heurístico de legados legítimos;
- novo envio não resolve Pendência; substituição de envio em `Aguardando reanálise` é suportada pelo contrato posterior ao PR #254;
- `Aberta → Escola`, `Aguardando reanálise → Controlador`, estados terminais → sem próximo ator;
- Pendências resolvidas ou canceladas podem ser reabertas quando autorizado;
- `boleto_internet` é tipo de gasto dentro de Notas Fiscais em Educação Conectada, não documento autônomo;
- Declaração BB Ágil aceita N/A sob o contrato vigente;
- comunicação oficial externa gerada não expõe `RADAR PDDE`;
- PDDE Básico é priorizado apenas na apresentação, sem reordenar a fonte persistida;
- duas NFs idênticas por conteúdo podem ser legítimas.

### Capital e Inventário

Preservar a regra pós-PRs #257/#258/#260:

- NF permanente cria/vincula bem;
- com processo de inventário existente e número de NF, o bem novo entra `Encaminhada`, exibido como **Aguardando Inventariação**;
- sem processo, entra `Não encaminhada`;
- bem `Não encaminhada` não pode pular para `Inventariada`;
- `encampInventario`: nenhum permanente = `Não se aplica`; algum não encaminhado = `Não`; todos encaminhados/inventariados = `Sim`;
- Prontuário mostra o vínculo NF ↔ bem por identidade técnica;
- encaminhamento posterior sincroniza bem + verificação + log atomicamente;
- bem derivado de NF não aceita edição isolada do número da NF;
- guards de gesto repetido já existentes devem ser preservados.

A frase `Não encaminhada → Encaminhada → Inventariada` aplica-se ao ramo em que o bem **está** `Não encaminhada`; ela não determina que todo bem permanente deva nascer assim.

**Achado adversarial aberto:** salvar novamente uma NF permanente já vinculada a bem `Inventariada` pode reaplicar a regra de nascimento e rebaixar o bem para `Encaminhada`. Até o hotfix específico, qualquer trabalho nessa área deve preservar explicitamente o estado avançado e reproduzir a jornada completa antes/depois da correção.

## 8. Gestão de Equipe

Fluxo vigente:

```text
DirectoryService
→ TeamAccountGateway
→ team-account-management
→ Auth Admin + RPC transacional
```

Preservar CORS fail-closed, JWT/papel autorizado, lookup Auth exato, reutilização segura de conta em transição de perfil, rejeição de ambiguidade, desativação lógica, redistribuição/histórico e compensação de falhas.

## 9. Testes e auditoria

Aplicar `docs/reference/TEST_GOVERNANCE.md` e o método adversarial.

Antes de corrigir falha, classificar:

1. defeito real de produto;
2. contrato de teste superado;
3. defeito do teste/fixture;
4. infraestrutura;
5. flaky não reproduzível;
6. inconsistência de composição;
7. duplicação arquitetural com risco;
8. ambiguidade que exige decisão de produto;
9. hipótese ainda não reproduzida.

Só defeito real/composição comprovada autoriza mudar o produto por causa da falha. Quando regra mudar, registrar `regra anterior → regra vigente → código afetado → teste afetado` e atualizar a expectativa histórica.

Para escrita crítica, a prova preferida é proporcional ao risco e pode incluir:

```text
ação real
→ persistência
→ leitura direta
→ reload
→ releitura/renderização
→ superfície relacionada
```

Além disso, em fluxo crítico, procurar:

```text
criar
→ avançar o estado em outro subsistema
→ voltar à origem
→ salvar/editar novamente
→ reload
→ confirmar que o estado avançado sobreviveu
```

O PR #260 deixou jornadas reais de lifecycle/persistência/reload. Reutilizá-las, mas não assumir que elas cobrem combinações entre fluxos apenas porque cada fluxo isolado está verde.

## 10. Supabase e migrations

- Production é fail-closed;
- migrations são versionadas e aplicadas em ordem;
- histórico de migration não é editado;
- para RPC redefinida, auditar a **última definição efetiva da assinatura**;
- nenhum seed institucional implícito;
- nenhuma chave administrativa no frontend;
- operações compostas devem ser atômicas quando o domínio exigir;
- conflito de `row_version` não é sobrescrito silenciosamente;
- nova migration somente para mudança real de banco/contrato que não possa ser representada pela estrutura existente;
- não reintroduzir `rowVersion`/`row_version` em payload de negócio;
- ADR-051 permanece fora da frente funcional corrente até decisão específica.

## 11. Excel e exportações

Excel SME público mantém contrato de 27 colunas A:AA e competência mensal estrita. Alteração material do gerador exige certificação correspondente; mudanças sem relação com exportação não justificam recertificação indiscriminada.

A exportação XLSX de Pendências é superfície vigente e deve preservar filtros, auditoria e ausência de IDs técnicos.

**Achado adversarial aberto:** o botão real de Excel SME pode contornar a autoridade que exige persistência de auditoria antes do download. Até o hotfix específico, não considerar a exportação certificada apenas porque o arquivo baixa corretamente; o cenário `falha da auditoria inicial → nenhum download` precisa ser provado pelo ponto de entrada real.

## 12. Documentação

Documentação de continuidade:

- `START_HERE.md` — única porta de entrada;
- `docs/CURRENT_STATE.md` — estado curto corrente;
- `docs/architecture/adversarial-analysis-and-implementation-method.md` — método obrigatório;
- `docs/audits/2026-09-05-astra-adversarial-findings.md` — achados adversariais correntes;
- `docs/MASTER_PLAN_CURRENT.md` — único plano executável;
- `docs/PLAN_TRACEABILITY.md` — origem e absorção do plano.

`docs/CURRENT_STAGE.md`, ADRs, handoffs, audits anteriores e planos datados preservam história/evidência e não devem competir como fila atual.

Ao integrar hotfix funcional depois da baseline:

1. atualizar `CURRENT_STATE.md`;
2. registrar impacto em `PLAN_TRACEABILITY.md`;
3. atualizar `MASTER_PLAN_CURRENT.md` se o trabalho remanescente mudou;
4. atualizar/regredir o ledger de achados adversariais correspondente;
5. só depois retomar a fila planejada.

## 13. Git e integração

Não trabalhar diretamente na `main`.

Fluxo:

1. confirmar HEAD remoto;
2. branch isolada;
3. inspecionar causa atual;
4. procurar autoridades concorrentes e estados laterais;
5. reproduzir antes de corrigir;
6. mudança mínima;
7. validação proporcional + composição real;
8. classificar falhas;
9. abrir PR com escopo/riscos/evidência;
10. integrar quando objetivamente pronto;
11. confirmar SHA publicado quando houver Production;
12. reconciliar continuidade documental quando a mudança afetar regra/estado/plano.

## 14. Critério de conclusão

Uma frente pode encerrar quando o comportamento afetado atende ao contrato atual, o usuário consegue executar a tarefa real, dados permanecem coerentes, não há defeito relevante conhecido no escopo e falhas remanescentes foram classificadas.

**Não é suficiente** dizer que unitários/E2E/CI estão verdes. Antes do fechamento deve existir evidência de tentativa adversarial de quebrar a funcionalidade dentro do risco do escopo.

Não manter o projeto eternamente “inacabado” apenas porque existe teste histórico, prova opcional ou documento antigo ainda arquivado. Mas também não declarar encerrado apenas porque os gates conhecidos passaram.

## 15. Cinco perguntas obrigatórias antes de encerrar análise ou implementação crítica

1. Onde esta regra está implementada pela segunda vez?
2. Que estado mais avançado esta operação pode destruir?
3. Existe caminho real da UI que contorna a autoridade considerada correta?
4. Que combinação de dois fluxos verdes ainda não foi exercitada em sequência?
5. Qual contraexemplo tentamos produzir para provar que a solução ainda estava errada?

Se essas perguntas não foram investigadas e registradas proporcionalmente ao risco, a tarefa pode estar validada pelos gates, mas **não está auditada adversarialmente**.