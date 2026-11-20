# Diagnóstico Somente Leitura — Divergência de Bonificação (INAPTA) e Despesa a Identificar

- **Data da Análise:** 12/11/2026
- **Escopo:** Somente Leitura (Read-Only — nenhuma alteração em código de produção)
- **Caso Analisado:** Unidade Escolar **EDI São Vicente (`04.11.809`)** · Competência **Outubro 2026** · Programa **Educação Conectada** (Conta PDDE Qualidade)

## 1. Sintoma Observado na Interface

Na superfície de Acompanhamento Mensal (Exercício 2026 — Outubro 2026) da unidade **EDI São Vicente (`04.11.809`)**:
1. **PDDE Básico:** Exibe `Bonificação: APTA` e `Análise técnica: Em análise` (status `Consolidada`).
2. **Educação Conectada (Conta PDDE Qualidade):**
   - Todos os itens aplicáveis de Bonificação na coluna direita estão marcados positivamente:
     - `Extrato Conta Corrente`: **Sim**
     - `Extrato Investimento`: **Sim**
     - `Notas Fiscais` (3 registros: `SAÍDA DE R$3328 — Despesa a identificar · documentação pendente`, `NF: NS 164` de R$ 860,00 e `Boleto Internet` de R$ 43,57): botão de Bonificação marcado em **Sim** (verde).
     - `Consulta Assessoria` (1 nota de serviço `NF NS 164` — `Enviada à Assessoria`): botão de Bonificação marcado em **Sim** (verde).
     - `Declaração BB Ágil`: **Sim**
     - `Encaminhado para Inventariação`: sem marcação ativa (`Sim` / `Não`), pois não há item de capital encaminhado.
   - Apesar de todas as opções aplicáveis de Bonificação estarem em **Sim** (ou não se aplicarem), o painel lateral esquerdo do programa **Educação Conectada** exibe:
     - **Bonificação:** `INAPTA`
     - **Análise técnica:** `Incorreto`
     - **Estado do bloco:** `Consolidada` (impedindo a reversão manual direta do status de Bonificação).

## 2. Causa Raiz Identificada no Código-Fonte

A inspeção estática dos módulos de domínio revelou duas causas combinadas que levam ao status `INAPTA` e ao bloqueio de edição:

### Causa A — Acoplamento Indevido entre `Despesa a identificar` (Análise Técnica) e o Cálculo Derivado de Bonificação
- **Arquivos e Funções:**
  - `src/domain/invoice-effects.js` (linha 29: `UNIDENTIFIED_EXPENSE_TYPE = 'a_identificar'`)
  - `src/domain/invoice-document-analysis.js` (linhas 19–28: `IDENTIFIED_EXPENSE_TYPES` e `INVOICE_DOCUMENT_TYPES`)
  - `src/domain/fluxo-operacional.js` (linhas 86–111: `evaluateBonificacao()`, linhas 131–144: `getProgramBonificacaoStatus()`, linhas 255–258: `isIdentifiedFiscalNote()`)
- **Mecanismo do Bug:**
  - O lançamento `SAÍDA DE R$3328` está registrado com tipo `a_identificar` (*"Despesa a identificar · documentação pendente"*).
  - Por regra de negócio institucional, **Análise Técnica** e **Avaliação para Bonificação** são independentes: uma despesa a identificar gera pendência na *Análise Técnica* (`Incorreto` / documentação pendente), mas não deveria sobrepor a marcação explícita de *Bonificação* (`Sim`) feita pelo controlador.
  - Entretanto, os efeitos derivados de notas fiscais (`src/domain/invoice-effects.js` em conjunto com `src/domain/fluxo-operacional.js` e a projeção em `src/domain/operational-projection.js`) tratam a presença de `UNIDENTIFIED_EXPENSE_TYPE = 'a_identificar'` como falha documental que contamina/invalida a verificação do programa ou mantém o status consolidado anterior como `'inapta'` quando há qualquer item avaliado negativamente na projeção.

### Causa B — Chave `encampInventario` (`Encaminhado para Inventariação`) e Travamento de Competência `Consolidada`
- **Arquivo e Linhas:** `src/domain/fluxo-operacional.js` (linhas 17–26 e 86–111):
  ```javascript
  const DOCUMENT_KEYS = Object.freeze([
    'extCC',
    'extINV',
    'notaFiscal',
    'consAssessoria',
    'declBBAgil',
    'encampInventario'
  ]);
  const REQUIRED_DOCUMENT_KEYS = new Set(['extCC', 'extINV']);
  const VALID_VALUES = new Set(['Sim', 'Não', 'Não se aplica']);
  ```
- **Mecanismo do Bug:**
  - Na interface de `Encaminhado para Inventariação` (visível nas capturas), a linha renderiza apenas os botões `Sim` e `Não` (sem botão visível de `N/A` / `Não se aplica`).
  - Se o valor subjacente de `bonificacao.encampInventario` no registro persistido tiver sido gravado como `'Não'` (ou derivado como `'Não'` quando não marcado), a condição `documentKeys.some(key => bonificacao[key] === 'Não')` na linha 103 de `evaluateBonificacao()` força imediatamente `status = 'inapta'`, mesmo que `extCC`, `extINV`, `notaFiscal`, `consAssessoria` e `declBBAgil` estejam todos em `'Sim'`.
  - Além disso, como o programa **Educação Conectada** encontra-se no estado **`Consolidada`** (botão cinza desabilitado abaixo de *Análise técnica: Incorreto*) e o efeito automático de `invoice-effects.js` reavalia o bloco a partir da despesa pendente, o usuário fica impedido de reverter manualmente o status de Bonificação para `APTA` pela tela.

## 3. Plano de Correção Recomendado (Para Futuro PR em Preview)

1. **Desacoplar `Despesa a identificar` (`a_identificar`) do Status de Bonificação (`src/domain/invoice-effects.js` e `src/domain/fluxo-operacional.js`):**
   - Garantir que lançamentos com `type === 'a_identificar'` afetem exclusivamente o indicador de **Análise Técnica** (`Incorreto` / pendência documental), sem sobrescrever `bonificacao.notaFiscal` nem forçar o status de **Bonificação** para `INAPTA` quando o controlador tiver avaliado os itens de bonificação como `Sim` ou `Não se aplica`.
2. **Normalizar `encampInventario` quando não houver bem de capital:**
   - Garantir que `encampInventario` assuma `'Não se aplica'` por padrão (ou exiba a opção `N/A` explícita na UI) quando não houver aquisição de bem permanente/capital no programa, evitando que um estado `'Não'` residual ou implícito torne a escola `INAPTA` na bonificação.
3. **Permitir Reavaliação de Bonificação independentemente da Análise Técnica:**
   - Assegurar que a existência de *Análise técnica: Incorreto* (por despesa a identificar) não trave a atualização do resultado de *Bonificação* para `APTA`.
