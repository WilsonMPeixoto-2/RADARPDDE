## Objetivo

Descreva o problema ou objetivo humano desta entrega e a superfície afetada.

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
- [ ] Espaçamento, alinhamento, densidade e hierarquia continuam coerentes com os elementos preexistentes.
- [ ] O novo elemento foi inspecionado no conjunto da tela, não apenas isoladamente.
- [ ] Feedback comunica consequência material, não apenas “sucesso técnico”.
- [ ] Estado populado ou realista foi inspecionado quando densidade ou comprimento de conteúdo forem relevantes.
- [ ] Viewport desktop principal e uma largura mais restrita foram conferidos quando a geometria puder mudar.
- [ ] Screenshots ou capturas usadas como evidência foram efetivamente abertas e inspecionadas.

**Evidências visuais, caminhos ou links:**

## Revisão de continuidade

Descreva os efeitos em superfícies vizinhas e o que acontece ao navegar, voltar e recarregar quando material.

## Limites e pendências

Liste explicitamente o que não foi possível provar. Ausência de prova não equivale a aprovação.

---

**Regra de encerramento:** cumprir literalmente o pedido não encerra uma tarefa se o resultado integrado continuar difícil de perceber, ler, entender ou operar para uma pessoa real.
