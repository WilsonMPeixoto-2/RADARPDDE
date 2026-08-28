# PR #211 — referências visuais do hotfix de Notas Fiscais

**Data:** 28 de agosto de 2026  
**Uso:** referência visual e funcional; não substitui contrato de domínio

## 1. Evidência do defeito original

**Arquivo:** `362edde1-851f-4b8c-98f9-387ac031bc8c.png`  
**SHA-256:** `523d8532390126682dad027c0b8f570e4786169547206a861b40c0489f748d27`  
**Referência de anexo do projeto:** `file_00000000e704820e81bdc86dd6468e2c`

A imagem registra o estado anterior:

- três despesas distintas dentro de Notas Fiscais;
- um único seletor técnico agregado;
- uma única Pendência;
- botão de `Registrar novo envio` no Prontuário;
- bloqueio global da análise após uma Pendência.

Essa imagem serve como evidência de regressão a evitar.

## 2. Layout-alvo aprovado

**Título na File Library:** `Painel de revisão de notas fiscais.png`  
**Arquivo de trabalho da referência:** `a_clean_ui_ux_mockup_layout_image_screenshot_like.png`  
**SHA-256:** `82d2a52a0c35f7dbe233ba34ff0693ca8cf39c8891643e923fe81eb2d1f91348`  
**Referência da File Library:** `file_0000000011b0820eb6b41b7ef7359907`  
**Referência de anexo do projeto:** `file_00000000e584820e89f0ab2681cb85e3`

A imagem contém quatro quadros de referência:

1. estado geral com três registros e análise individual;
2. múltiplos documentos incorretos coexistindo;
3. drawer lateral de `Visualizar pendência`;
4. ciclo completo de `Despesa a identificar`.

## 3. Elementos obrigatórios do layout

- grupo único `Notas Fiscais`;
- contador de registros;
- bonificação agregada;
- situação técnica agregada somente leitura;
- contador de Pendências **somente quando maior que zero**;
- sublinha por documento;
- quatro áreas desktop: **Documento | Tipo · Valor | Situação técnica | Ação**;
- análise individual;
- `Não analisado` como seletor;
- `Correto` e `Correto (Atrasado)` como estados concluídos, com edição apenas por ação deliberada;
- `Incorreto` e `Aguardando reanálise` como estados estáticos acompanhados de `Visualizar pendência`;
- `a_identificar` como `Incorreto + Visualizar pendência`;
- controles normais de edição documental escondidos enquanto houver Pendência ativa;
- `Visualizar pendência` como única ação operacional do Prontuário para documento em ciclo de regularização;
- `Adicionar Nota`;
- `Registrar despesa a identificar`;
- drawer lateral;
- no drawer: status, documento, contexto, motivo, observação, data e ação Editar/Salvar.

## 4. Elementos que não devem aparecer no Prontuário

- `Registrar novo envio`;
- `Reanalisar`;
- `Resolver`;
- `Cancelar`;
- histórico completo de tentativas;
- seletor técnico agregado editável;
- categoria documental `boletoInternet`.

## 5. Regra de interpretação

A referência visual não autoriza criar regra nova.

Em conflito entre mockup e contrato:

```text
regra de negócio aprovada
→ domínio e persistência
→ testes válidos
→ referência visual
```

A imagem orienta composição, hierarquia, densidade, próximos passos e estados visuais.


## 6. Matriz estado → apresentação → ação

| Estado | Apresentação | Ação principal |
|---|---|---|
| Não analisado | seletor técnico | analisar |
| Correto | estado verde | Editar análise, sob demanda |
| Correto (Atrasado) | estado concluído | Editar análise, sob demanda |
| Incorreto + Pendência | estado estático | Visualizar pendência |
| Aguardando reanálise | estado estático | Visualizar pendência |
| Despesa a identificar | Incorreto | Visualizar pendência |

## 7. Checkpoint de implementação

No checkpoint funcional `3b10c2a97fd2142dbfd1e120dad0bf2bbd712d57`, o código já incorpora a hierarquia de quatro áreas, contador zero oculto, estado concluído estático, edição deliberada, bloqueio visual de edição comum com Pendência ativa e drawer limitado à conferência/edição simples.

A homologação final ainda exige inspeção autenticada do Preview desktop contra esta referência. Aprovação automatizada de DOM não substitui a conferência visual humana.
