# Competências — contrato canônico

**Estado:** vigente e implementado  
**Atualizado em:** 5 de setembro de 2026

> Leia primeiro [`../../START_HERE.md`](../../START_HERE.md). Este documento descreve o contrato de competência; não cria uma segunda fila de trabalho.

## 1. Identidade canônica

A competência mensal usa exclusivamente:

```text
YYYY-MM
```

Exemplo: `2026-08`.

Rótulos como `Agosto/2026`, `08/2026` e `Agosto de 2026` são apenas apresentação. A chave persistida continua `YYYY-MM`.

A chave composta legada, por exemplo `2026-08_BASIC`, existe somente para interoperabilidade com o núcleo antigo. No modelo relacional, competência e programa são dimensões distintas.

## 2. Autoridade global

`src/domain/competence-context.js` / `RadarCompetenceContext` é a única autoridade para a seleção mensal global.

Regras:

- não criar seletor mensal concorrente por tela;
- não alterar `activeCompetenciaKey` diretamente para simular troca de mês;
- integrações legadas podem refletir o valor global para compatibilidade, mas não se tornam segunda fonte de verdade;
- exercício e competência permanecem sincronizados pelo domínio;
- navegação contextual restaura a competência por essa mesma autoridade.

`src/integration/global-competence-selector.js` publica a seleção visual e mantém compatibilidade com pontos antigos sem criar uma segunda fonte de estado.

## 3. Inicialização

A seleção inicial respeita, em ordem:

1. competência persistida válida;
2. competência inicial fornecida e pertencente ao exercício resolvido;
3. `closing_competence` válida;
4. competência cronologicamente mais recente do exercício;
5. erro explícito quando não existe competência válida.

O exercício é resolvido antes do fallback mensal para preservar exercícios posteriores após reload.

## 4. Competências futuras

Competências futuras podem ser **consultadas** quando pertencem à configuração válida, mas operações mensais protegidas continuam somente leitura antes do período permitido.

Teste SQL com competência futura sintética não prova autorização de edição na UI/application service. A camada exercitada deve ser explicitada.

## 5. Regra geral de navegação

Dashboard, Carteira, Competências, Prontuário, alertas, timeline e exportações mensais devem interpretar a competência global de modo coerente quando a superfície é mensal.

Ao entrar em uma superfície mensal a partir de outra tela, não deve surgir uma seleção paralela ou alteração silenciosa da competência global.

## 6. Exceção deliberada: Pendências é passivo transversal

A regra anterior que dizia simplesmente “transportar a mesma competência para Pendências” ficou incompleta depois da decisão posterior que tornou Pendências uma fila transversal.

Contrato atual:

```text
competência global continua preservada
+
Pendências pode aplicar filtro local de competência
+
filtro local pode ser "Todas"
+
filtrar Pendências NÃO muda silenciosamente RadarCompetenceContext
```

Portanto:

- abrir Pendências a partir de uma competência preserva o contexto de origem;
- a fila pode exibir passivo de outras competências;
- o filtro local `Todas` é permitido;
- abrir detalhe/Prontuário reaplica o contexto mensal apropriado quando necessário;
- retornar deve preservar origem, filtros, rolagem e foco quando a jornada assim prevê.

Essa exceção não autoriza qualquer outra tela a criar seletor concorrente.

## 7. Exportações

A competência global é relevante para a política temporal das exportações, mas os produtos não podem ser generalizados como se todos tivessem o mesmo contrato.

Estado corrente:

- **Excel SME:** sempre uma competência mensal ativa;
- **XLSX institucional:** decisão posterior de 09/08 limita o produto atual à competência global ativa;
- **CSV de contingência:** caminho legado ainda possui política própria e está em investigação/decisão antes de eventual convergência;
- **XLSX de Pendências:** respeita os filtros da fila, inclusive o filtro local transversal, sem alterar a competência global.

Não usar um modelo genérico multicompetência para revogar a política do botão real.

## 8. Responsabilidades que não pertencem ao domínio de competência

Competência não decide:

- escopo/autorização da escola;
- APTA/INAPTA;
- regras de programas;
- análise técnica;
- abertura/resolução/cancelamento de Pendência;
- próximo ator;
- permissão de escrita.

Essas regras pertencem aos domínios e serviços específicos.

## 9. Testes

Cobertura relevante deve incluir:

- seleção inicial/persistida;
- chave inválida/outro exercício;
- troca de exercício;
- competência futura somente leitura nas operações protegidas;
- ausência de seletor global concorrente;
- preservação entre telas/reload;
- passivo transversal de Pendências com filtro local `Todas`;
- abertura do detalhe sem troca silenciosa do contexto;
- exportações com a política temporal específica de cada produto.

### Anti-padrão de teste

Não fazer:

```text
window.activeCompetenciaKey = ...
```

como substituto de uma seleção real quando o comportamento em teste depende da sincronização global. Fixtures sintéticas que não testam contexto devem ser marcadas explicitamente como tal.

## 10. Evidência adversarial de 05/09/2026

A auditoria Astra encontrou um E2E de timeline que manipula diretamente estado legado de competência. Isso não prova defeito da timeline, mas é um **artefato de teste perigoso**, porque pode mascarar falha de sincronização e ensinar o bypass como padrão.

Também confirmou que a documentação anterior deste arquivo não mencionava corretamente a exceção transversal de Pendências.

Ver:

- [`adversarial-analysis-and-implementation-method.md`](adversarial-analysis-and-implementation-method.md);
- [`adversarial-analysis-replication-playbook.md`](adversarial-analysis-replication-playbook.md);
- [`../audits/2026-09-05-astra-adversarial-findings.md`](../audits/2026-09-05-astra-adversarial-findings.md).
