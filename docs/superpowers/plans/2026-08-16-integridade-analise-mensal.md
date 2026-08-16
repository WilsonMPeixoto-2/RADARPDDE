# Plano de implementação — integridade da análise mensal

**Data:** 16/08/2026  
**Branch:** `fix/analise-integridade-20260816`  
**Base:** `3afedbdea76d344e7ce296e8e4b9a7afca98affe`

## Objetivo

Implementar, em três etapas independentes e testáveis, as correções aprovadas para o fluxo mensal do RADAR PDDE:

1. eliminar conflitos otimistas falsos causados por gravações concorrentes da mesma verificação na mesma sessão, preservando conflitos reais entre sessões;
2. tornar competências futuras visíveis, porém somente leitura;
3. impedir `Correto` quando, após consolidação, o documento constava como não entregue, exigindo `Correto (Atrasado)` para documento válido recebido posteriormente.

Nenhuma das três correções exige alteração de schema do Supabase.

## Etapa 1 — serialização de gravações da mesma verificação

**Arquivos principais:**
- `src/application/verification-service.js`
- `tests/unit/verification-remote-persistence.test.js`

### RED
Criar teste que dispare duas operações sem aguardar a primeira, sobre a mesma escola/competência. O mock remoto deve devolver a nova `row_version` na primeira gravação e simular conflito se a segunda entrar antes da atualização canônica.

### GREEN
Adicionar fila por chave `schoolId + compKey` no `VerificationService`. Operações que escrevem a mesma linha de verificação devem executar sequencialmente; linhas diferentes continuam paralelas. Não remover `expectedVersion`, não fazer retry cego e não enfraquecer a RPC.

### Verificação
- duas ações rápidas da mesma competência executam em sequência e usam versões sucessivas;
- verificações distintas não ficam globalmente bloqueadas;
- conflito externo verdadeiro continua propagado como `OPTIMISTIC_CONFLICT`.

## Etapa 2 — competências futuras somente leitura

**Arquivos principais:**
- `src/domain/competencia.js`
- `src/application/verification-service.js`
- integração/UI do Prontuário, conforme o ponto mínimo de acoplamento encontrado
- testes unitários e E2E focados

### RED
Cobrir comparação contra data de referência determinística: em agosto/2026, agosto e anteriores não são futuras; setembro em diante são. Cobrir tentativa de gravação em competência futura.

### GREEN
Adicionar regra canônica no domínio de competência e guard no serviço. Na interface, manter o mês visível, desabilitar controles mutáveis e sinalizar `Competência futura · somente leitura`.

### Verificação
- regra independe do relógio em testes;
- UI não permite edição futura;
- chamada direta ao serviço também é rejeitada;
- competências correntes/passadas mantêm comportamento existente.

## Etapa 3 — `Correto` × `Correto (Atrasado)` após não entrega consolidada

**Arquivos principais:**
- `src/domain/fluxo-operacional.js`
- `src/application/verification-service.js`
- renderização/integração do seletor de análise técnica
- `tests/unit/verification-service.test.js`
- testes de regra/UI focados

### RED
Cobrir verificação já consolidada com bonificação `Não` para documento específico. Nesse estado, `Correto` deve ser recusado e `Correto (Atrasado)` aceito. `Incorreto` e `Não analisado` continuam válidos.

### GREEN
Centralizar a decisão no domínio, aplicá-la no serviço e refletir a restrição no seletor da UI. Não converter silenciosamente `Correto` em atrasado: o estado histórico deve ser explícito.

### Verificação
- documento entregue no prazo ainda aceita `Correto`;
- documento não entregue, mas ainda não consolidado, não recebe a restrição histórica prematuramente;
- após consolidação com `Não`, `Correto` fica indisponível/rejeitado e `Correto (Atrasado)` permanece permitido.

## Encerramento

Executar testes focados a cada etapa, depois os gates gerais proporcionais. Comparar falhas amplas contra a `main` para não atribuir dívida preexistente ao pacote. Abrir PR somente com as três correções aprovadas, revisar diff e integrar apenas após validação do candidato final.