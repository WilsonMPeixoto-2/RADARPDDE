# Estabilização das avaliações reais — Design

## Objetivo

Estabilizar o fluxo mensal de avaliações do RADAR PDDE antes do uso efetivo pelos usuários reais, preservando a fluidez obtida no PR #192 e eliminando divergências entre regra de negócio, persistência, retorno autoritativo e projeção incremental da interface.

## Princípios

1. A regra vigente do produto prevalece sobre auditorias externas e hipóteses de ferramentas.
2. Production não recebe escritas de teste. Validações destrutivas usam Supabase descartável/Preview.
3. O caminho normal de sucesso preserva retorno autoritativo + aplicação incremental. `renderProntuario()` completo fica restrito a fallback de erro, retorno incompleto ou inconsistência detectada.
4. Toda correção funcional entra por TDD: teste falhando, correção mínima, teste verde e regressão.
5. Alterações de banco devem ser aditivas/migráveis e preservar os dados reais existentes.
6. Operações semanticamente idênticas não devem gerar nova RPC, novo `row_version` nem novo log.

## Escopo funcional

### Integridade da consolidação

A RPC de efeitos de NF deve distinguir campo ausente de `bonus_result` de campo explicitamente presente com valor vazio. Campo ausente preserva o valor; campo vazio limpa a consolidação.

### Assessoria individual e pendência

`Assessoria = Incorreto` para NF de serviço exige pendência correspondente. A operação deve ser atômica: confirmar o modal grava NF, estado agregado, pendência e log; cancelar não persiste `Incorreto`.

Cada pendência de Assessoria deve poder identificar a NF de origem por `registered_invoice_id`. A regra de unicidade ativa passa a permitir pendências simultâneas para NFs distintas no mesmo programa/competência, mantendo a unicidade atual para os demais documentos.

A reanálise de uma pendência de Assessoria deve atualizar a NF vinculada e recalcular o resumo agregado sem alterar outras NFs.

Depois que uma NF possuir histórico de pendência de Assessoria vinculada, sua identidade estrutural passa a ser imutável para preservar a rastreabilidade: escola, competência, programa e natureza da despesa não podem ser alterados e a NF não pode ser excluída fisicamente. Número, descrição, valor e demais campos não estruturais continuam corrigíveis pelas regras normais de edição.

### Transição N/A → Sim/Não

Ao sair de `N/A` para `Sim` ou `Não`, a análise técnica de Nota Fiscal deve ser reinicializada para `Não analisado`, junto das demais derivações incompatíveis com o estado anterior.

### Datas de regularização

`pendency_attempts` passa a manter data de disponibilização (`available_at`) separada de `submitted_at`. A primeira representa quando a escola disponibilizou o documento; a segunda, quando o lançamento entrou no RADAR. A ida e volta Supabase → estado legado → domínio deve preservar ambas.

### Reabertura de pendência

Conforme contrato PEND-05 vigente, pendências `Resolvida` e `Cancelada` podem voltar para `Aberta`, preservando histórico e auditoria.

### Idempotência

Alterações que não mudam semanticamente o valor atual devem retornar sem persistência. Consolidação repetida com o mesmo resultado e estado inalterado também não deve gerar novo log.

## Projeção incremental da interface

Será criado/fortalecido um reconciliador determinístico por escola + competência + programa. Depois de aplicar o estado autoritativo, ele recalcula somente os controles condicionais do contexto afetado:

- ações de NF para Sim/Não/N/A;
- `Registrar despesa a identificar`;
- controles individuais e resumo da Assessoria;
- Inventário para despesas permanentes;
- `Correto` / `Correto (Atrasado)`;
- pendência: abrir, novo envio, reanalisar, cancelar, reabrir;
- `Consolidar` / `Consolidada` e retificação.

A mesma operação seguida de recarga completa deve produzir estado semântico e DOM equivalentes.

## Ferramentas

### Já existentes e ampliadas

- `node:test`
- Playwright
- Supabase DB tests / pgTAP
- ESLint
- `@axe-core/playwright`
- Knip
- Lighthouse
- CodeQL

### Incorporadas neste ciclo

- `fast-check` apenas como `devDependency`, após os testes determinísticos, para testar propriedades invariantes e combinações de estados.
- MSW apenas como `devDependency`, para latência, falha, timeout, conflito e retorno parcial de rede.
- `dependency-cruiser` apenas como `devDependency`, depois da estabilização funcional, para regras arquiteturais e ciclos.
- Performance API / `PerformanceObserver` nativos para medir clique → feedback → RPC → aplicação → estabilização visual.

### Fora deste ciclo

- React/Redux/TanStack Query/ORM: não resolvem a causa e introduzem migração desproporcional.
- OpenTelemetry: exige coletor, política de dados e governança superiores ao benefício atual.
- `web-vitals`: só entra quando houver destino seguro e política definida para métricas reais.

## Critérios de aceite

1. Persistência e retorno autoritativo coincidem após cada operação.
2. A operação seguida de recarga produz o mesmo significado.
3. Todas as transições condicionais relevantes exibem e habilitam os controles corretos.
4. Controlador, Assistente, SME e Inventário preservam suas capacidades.
5. Sucesso incremental não executa renderização integral do Prontuário.
6. Fallback integral permanece para erro ou estado não reconciliável.
7. Nenhuma regressão nos gates oficiais.
8. Production passa por auditoria final somente de leitura antes do merge.
9. Nenhuma inconsistência nova é introduzida nos dados reais existentes.
