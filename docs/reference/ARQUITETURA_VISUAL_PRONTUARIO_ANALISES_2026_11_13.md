# Arquitetura Visual e de Usabilidade — Prontuário, Análise Técnica, Bonificação e Sub-telas

- **Data:** 13/11/2026
- **Foco:** Experiência Desktop (`1440x900` / `1920x1080`) na superfície central de lançamento de **Bonificação**, **Análise Técnica**, **Notas Fiscais / Despesa a identificar**, **Condicionais (Assessoria / Inventariação)** e **Sub-telas de Pendências e Reanálise**.

## 1. Diagnóstico do Problema Central de UX e Design no Prontuário

Hoje, o Prontuário (`/escolas/:id`) concentra a maior inteligência de negócio do RADAR PDDE, mas a interface não explicita visualmente as **relações causais** entre os elementos:
1. **Independência vs. Confusão entre Bonificação e Análise Técnica:** O controlador marca `Sim / Não / N/A` na Bonificação e seleciona o parecer na Análise Técnica (`Não analisado / Correto / Incorreto`), mas os dois fluxos dividem a mesma linha sem separação visual de trilhas e sem explicar na tela por que uma *Despesa a identificar* altera a Análise Técnica para `Incorreto` enquanto preserva a Bonificação.
2. **Condicionais invisíveis (Assessoria Contábil e Inventariação Patrimonial):**
   - A seção **Consulta Assessoria** só é exigida quando há Nota Fiscal de *Prestação de serviço* (ex.: `NF NS 164`), e **Encaminhado para Inventariação** só se aplica quando há aquisição de *Bem Permanente / Capital*. Hoje, essas seções aparecem soltas abaixo de Notas Fiscais, sem um conector visual ou badge de origem indicando qual nota fiscal acionou aquela exigência.
3. **Sub-telas de Classificação de Erros, Lançamento de Pendências, Retificação e Reanálise:**
   - Abrir a edição de análise técnica, classificar os erros documentais, converter uma *Despesa a identificar* em Nota Fiscal ou julgar uma *Reanálise* (1ª, 2ª, 3ª tentativa) ocorre em modais/formulários planos, sem hierarquia de passos, sem prévia clara do efeito no sistema ("Isso abrirá a Pendência #X e mudará a Análise Técnica para Incorreto") e com tipografia homogênea.

## 2. Os 4 Pilares do Novo Design do Prontuário e Sub-telas (Sem Quebrar Regras)

### Pilar 1 — Arquitetura em Duas Trilhas Visuais Distintas (Bonificação vs. Análise Técnica)
- **Cabeçalho Fixo (*Sticky*) do Programa com Duplo Indicador Independente:**
  - Exibir dois cartões de status independentes no topo/lateral do programa:
    1. **Trilha de Bonificação (`APTA` / `INAPTA`):** Vinculada exclusivamente à entrega tempestiva dos itens obrigatórios (`Sim` / `Não` / `N/A`).
    2. **Trilha de Análise Técnica (`Correto` / `Em análise` / `Incorreto`):** Vinculada à conformidade material dos documentos, Notas Fiscais, Despesas a identificar e parecer da Assessoria.
- **Colunas com Identidade Própria na Linha de Verificação:**
  - Agrupar os controles da coluna **BONIFICAÇÃO** em um *Segmented Control* compacto (`[Sim] [Não] [N/A]`) e os controles da coluna **ANÁLISE TÉCNICA** em um cartão de status interativo (`[✓ Correto]` / `[⚠ Incorreto · 2 erros]` + botão `Editar análise`), evitando que pareçam botões duplicados.

### Pilar 2 — Conexões Causais Explícitas (Cards Flutuantes e Badges de Encadeamento)
- **Encadeamento Visual a partir das Notas Fiscais:**
  - Quando uma nota for de **Prestação de Serviço** (ex.: `NF NS 164`), exibir um badge conector violeta (`↳ Exige Consulta Assessoria · Enviada`) que, ao passar o mouse (card flutuante) ou clicar, destaca diretamente a linha correspondente em **Consulta Assessoria**.
  - Quando uma nota for de **Bem Permanente / Capital**, exibir o conector (`↳ Exige Inventariação Patrimonial`) vinculado à linha **Encaminhado para Inventariação** e à sub-aba `Registro de Capital`.
  - Quando não houver nota de serviço ou de capital na competência, exibir as seções de *Consulta Assessoria* e *Encaminhado para Inventariação* em estado silencioso/recolhido com badge automático `N/A — Sem nota de serviço/capital na competência`.
  - Quando houver **Despesa a identificar** (`SAÍDA DE R$ 3.328,00`), exibir um conector âmbar/terracota indicando explicitamente: `↳ Impacta Análise Técnica (Documentação Pendente) · Bonificação Preservada`.

### Pilar 3 — Sub-tela / Compositor Executivo de Análise Técnica e Pendências
- Ao clicar em **`Editar análise`** ou marcar um documento como **`Incorreto`**, abrir um painel estruturado em **3 passos visuais claros**:
  1. **Diagnóstico e Escopo:** Identificação do documento, programa e competência.
  2. **Seleção Semântica de Apontamentos (`renderErrors()`):** Grade de cartões selecionáveis por categoria (Legibilidade, Competência/Datas, Valores/Extrato, Assinaturas/Atesto) com busca rápida e campo de observação técnica.
  3. **Resumo de Impacto antes de Salvar (Feedback Consciente):** Banner na base do formulário informando exatamente a consequência da ação: *"Ao confirmar: Análise Técnica → Incorreto · Abre/Atualiza Pendência Operacional para a escola · Bonificação permanece APTA"*.

### Pilar 4 — Sub-abas do Prontuário (`Pendências Ativas`, `Registro de Capital`, `Histórico de Contatos`) com Linha do Tempo de Tentativas
- Na sub-aba **`Pendências Ativas desta unidade`**, substituir tabelas espremidas por **Fichas de Ciclo de Vida da Pendência**:
  - Linha do tempo horizontal mostrando `1ª Tentativa (Aberta)` $\rightarrow$ `Novo Envio / Resposta da Escola` $\rightarrow$ `Decisão de Reanálise`.
  - Card flutuante de inspeção rápida dos erros atuais e barra de decisão clara com 3 ações semânticas distintas: **`Aprovar na Reanálise (Resolver)`** (verde), **`Rejeitar e Abrir Nova Tentativa`** (âmbar/vermelho) e **`Cancelar Pendência`** (neutro/outline).
