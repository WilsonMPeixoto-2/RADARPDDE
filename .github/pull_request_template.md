## Objetivo

Descreva o problema ou objetivo humano desta entrega e a superfície afetada.

Nas mudanças percebidas pelo usuário, registre a jornada, linguagem, ação principal e resultado esperado definidos em paralelo à solução técnica, considerando também pessoas pouco experientes.

## Mudança

Explique a menor alteração coerente aplicada e quais regras ou invariantes permanecem inalterados.

## Evidência técnica

- SHA validado:
- testes e gates executados:
- persistência e reload, quando aplicável:
- falhas classificadas ou remanescentes:

## Aceitação humana do resultado

> Obrigatório para qualquer mudança percebida pelo usuário. Não preencher com “N/A” apenas porque os testes passaram.

### Leitura outside-in

Sem justificar pela implementação, descreva em linguagem comum:

- **Onde o usuário está e o que está tratando:**
- **Estado que a tela comunica:**
- **Informação que recebe maior atenção visual:**
- **Próxima ação que o usuário tende a executar:**
- **O que a interface comunica depois da ação:**
- **Como o usuário continua ou reencontra o caso:**

### Integridade da composição

- [ ] Não há conteúdo necessário cortado, encoberto ou sobreposto.
- [ ] Não há overflow inesperado que prejudique leitura ou ação.
- [ ] A ação principal tem prioridade visual coerente sobre ações secundárias.
- [ ] Rótulos descrevem seus efeitos em linguagem natural; confirmações são proporcionais, sem etapas duplicadas.
- [ ] Cores mantêm significado consistente, com texto/ícone; tipografia e foco são legíveis nas condições afetadas.
- [ ] Espaçamento, alinhamento, densidade e hierarquia continuam coerentes com os elementos preexistentes.
- [ ] O novo elemento foi inspecionado no conjunto da tela, não apenas isoladamente.
- [ ] Feedback comunica consequência material, não apenas “sucesso técnico”.
- [ ] Estado populado ou realista foi inspecionado quando densidade ou comprimento de conteúdo forem relevantes.
- [ ] Viewport desktop principal e uma largura mais restrita foram conferidos quando a geometria puder mudar.
- [ ] Screenshots ou capturas usadas como evidência foram efetivamente abertas e inspecionadas.

**Evidências visuais, caminhos ou links:**

## Impacto de decisões entre módulos e chats — aplicável a qualquer frente funcional

> Verificar [política transversal de propagação](../docs/reference/DECISION_IMPACT_POLICY.md), decisões/ADRs anteriores e supervenientes e a matriz de obrigações da frente; registrar consequências **agora e em fases futuras**. Não se exige alterar simultaneamente todas as telas; exige-se **não perder** a obrigação ou contradizê-la.

- [ ] Identifiquei decisão/ADR já vigente ou superveniente, efeitos na implementação atual e obrigações ainda abertas em outras superfícies/etapas.
- [ ] Verifiquei que código, UI, testes, persistência, relatórios e documentações impactadas não reintroduzem regra antiga que já foi substituída.
- [ ] Se houve decisão nova em outro chat ou agente, registrei origem, status de aprovação, vínculo com decisões anteriores e o compromisso futuro no GitHub.

**Decisões de produto envolvidas e efeitos não atendidos nesta entrega:**

## Rastreabilidade T0–T6 (somente quando este PR tratar da frente Prontuário/correção)

> Não se aplica a PRs independentes de atualização de pacotes/tooling, nem à operação institucional de auditoria documental do PDDE e lançamentos reais de prestação de contas. Essas frentes mantêm seus próprios controles.

- [ ] Consultei [o registro versionado](../docs/continuity/prontuario-t0-t6/registry.json) e o [checkpoint](../docs/continuity/prontuario-t0-t6/CHECKPOINT.md) **antes** de repetir análise ou importar proposta de outro agente.
- [ ] Relacionei os IDs `T0T6-Dxxx` das decisões mantidas, alteradas ou superadas, vinculando `supersedes` quando uma orientação anterior foi substituída.
- [ ] Relacionei IDs `T0T6-Cxxx` para propostas de Antigravity/Manus/Gemini/outros; registrei origem (branch, SHA e PR), avaliação, status e fundamento de integração, adiamento ou rejeição.
- [ ] Atualizei o checkpoint com SHA efetivamente testado, evidências verificáveis, falhas ainda abertas e **próximo ato objetivo**, sem rotular como publicado um código apenas testado localmente.
- [ ] Confirmei que a alteração e seus testes ocorreram **sem escrever no Supabase institucional**, sem usar documentos de escolas como fixtures e sem confundir a frente funcional com upgrades de dependências.
- [ ] Rodei `npm run check:continuity` e registrei o resultado do HEAD final.

### Propagação e coerência histórica (D020)

- [ ] Consultei as obrigações por fase e superfície em [decision-impact.json](../docs/continuity/prontuario-t0-t6/decision-impact.json), inclusive as derivadas de decisões aceitas em outros chats.
- [ ] Relacionei os identificadores `T0T6-Ixxx-xx` aplicáveis e expliquei quais estão no código, quais ainda exigem testes/aceite e quais continuam obrigatórios em T4/T5/T6.
- [ ] Conferi se a mudança cria/revoga uma decisão e se ela exige efeitos posteriores em domínio, UI, banco, relatórios, permissões, navegação, modelos ou regressões.
- [ ] Executei `npm run check:continuity` (incluindo validador de impactos) e consultei `npm run decisions:impact -- --query --phase=T5 --surface=ui` ou o filtro pertinente.
- [ ] Não interpretei ausência de referência no catálogo como prova de inexistência de impacto; dúvidas de origem/aceite ficaram registradas.

**Obrigações atuais e futuras afetadas (`T0T6-Ixxx-xx`):**

**Decisões/contribuições afetadas (IDs):**

**Origem e SHA do código ou análise incorporada:**

**Evidências, divergências ainda em aberto e próximo ato:**

## Revisão de continuidade

Descreva os efeitos em superfícies vizinhas e o que acontece ao navegar, voltar e recarregar quando material.

**Passagem entre agentes:** indique decisões/prioridades e autorizações mantidas, branch/PR/SHA remoto, resultados favoráveis e desfavoráveis, limites e próximo ato. Confirme que o registro remoto foi atualizado; não deixe a única cópia em conversa ou ambiente temporário. Consulte a [política permanente](../docs/reference/DECISION_IMPACT_POLICY.md) e a [D023](../docs/continuity/prontuario-t0-t6/D023_CONTINUIDADE_REMOTA_E_USABILIDADE.md). Esse registro é proporcional à mudança e não cria outra aprovação ou suíte de testes por rotina.

## Limites e pendências

Liste explicitamente o que não foi possível provar. Ausência de prova não equivale a aprovação.

---

**Regra de encerramento:** cumprir literalmente o pedido não encerra uma tarefa se o resultado integrado continuar difícil de perceber, ler, entender ou operar para uma pessoa real.
