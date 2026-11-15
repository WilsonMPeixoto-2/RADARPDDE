# RADAR PDDE — checkpoint executável da integração T0–T3 (15/11/2026)

**Leitura obrigatória temporária para qualquer agente que continuar esta frente.**
**Branch única de integração e recuperação:** `fix/prontuario-integrado-validado-20261115`.
**Baseline conservada:** `main` em `4011a2b8`, sem alteração, merge ou deploy pela frente.
**Plano de destino:** [Prontuário: design, correção e exclusão integrados](../superpowers/plans/2026-11-14-prontuario-visual-correcao-integrada.md).
**Regras aprovadas:** [contrato](../reference/PRONTUARIO_CORRECAO_CONTRATO.md) e [estudo de flexibilização](../superpowers/specs/2026-11-14-flexibilizacao-correcao-exclusao-lancamentos.md).

## Comece aqui — retomada pelo Astra

**O que abrir:** branch `fix/prontuario-integrado-validado-20261115`, consultar `git status`, `git log -1` e comparar com `main` antes de editar. Este checkpoint, `docs/CURRENT_STAGE.md` e `docs/reference/STATUS_DOCUMENTOS.md` apontam para a **mesma** frente. O handoff antigo do Argon é histórico. Não abrir uma quarta branch nem repetir a auditoria inteira sem mudança material de SHA.

**Objetivo aprovado, sem ampliar escopo:** aprimorar a estrutura visual do Prontuário e permitir correção/exclusão coordenada de lançamentos e dependentes, sem falso envio, falsa reanálise ou justificativa obrigatória. Preservar diferenças entre bonificação manual, análise técnica, NF, Pendência, inventário e saída provisória; manter ADR-055/056 e permissões institucionais. A fonte de decisão é o contrato e plano T0–T6 acima, não a proposta pessoal de um agente.

| Lote | Código já disponível | Falta comprovar ou implementar |
| --- | --- | --- |
| **T0** | Contrato, plano e 500 linhas de fixtures recuperadas do Argon | Verificar cobertura das fixtures com cenários de aceitação efetivos |
| **T1** | Cabeçalhos horizontais por programa, ajustes CSS, correção do teste Gestão SME, teste automatizado de contraste | Comparação visual aprovada, persistência após reload e revisão mobile/perfis |
| **T2** | RPCs de preview/apply, ledger, validação de papéis, cliente `operational-correction-client.js`, 59 testes SQL e teste concorrente | Diálogos reais, bootstrap e controles da análise/Pendência; provas de fluxo em banco descartável e reload |
| **T3** | Exclusão causal de NF e dependentes proposta no SQL, inclusive testes isolados | Encaminhar exclusão das autoridades existentes à operação única, tratar patrimônio/provisória e reconciliação de caches/UI |
| **T4** | Regras descritas no contrato | Correção de bonificação e exclusão de pacote/contexto |
| **T5** | `pendency-correction.js` preservado do Argon **como material preliminar**, não como solução integrada | Revisar esquema real de tentativas e implementar edição/exclusão granular, contatos e inventário |
| **T6** | Gates parciais e roteiro de teste | Homologação visual, funcional, segurança, CI, integrações e plano de publicação, somente após autorização |

**Próxima alteração útil:** concluir **T2** (diálogos de correção, conexão única ao bootstrap e controles reais). O cliente existente espera `repository.executeRpc`; não confundir um cliente testado em isolamento com produto operacional. Primeiro escrever os cenários negativos e positivos do clique até recibo, atualização da tela e reload; depois integrar, sem sobrescrever a autoridade existente por uma implementação parcial. **Não aplicar SQL ao Supabase institucional.**

**Evite retrabalho:** não reconduzir a T1 do zero; não copiar a migration original insegura do Argon; não apagar as fixtures T0/T5 recuperadas; não trazer de volta restrições antigas; não refazer o PR #515 de Pendências. Verificar os resultados dos testes por SHA e repetir os afetados após alterações, pois testes anteriores não certificam código novo.

## Incremento T2 — diálogo piloto sob flag desligada por padrão

O trabalho da sessão Work foi interrompido por cota antes de chegar ao GitHub. A integração aqui é uma **reconstrução independente** da camada de diálogo usando o cliente/RPC já versionados, não uma recuperação de arquivos privados.

- Módulo `src/integration/operational-correction-dialog.js`, incluído no bootstrap e associado ao botão real **Editar análise** sob `RADAR_OPERATIONAL_CORRECTION_PREVIEW === true`. A flag permanece desligada por padrão.
- O diálogo exibe a prévia real do plano do servidor, alterações e bloqueios; observação é opcional; usa a mesma `operationKey` no retry; distingue erro de gravação de commit confirmado sem recarga local.
- Com flag desligada, o comportamento existente permanece preservado. Sem repositório remoto, a flag falha fechada: não há fallback silencioso para gravação local.
- O piloto T2 **não** valida ainda persistência autenticada em Supabase descartável e não autoriza ativação em Production. Exclusões de NF, Pendência e histórico T3–T5 permanecem pendentes.

**Testes executados nesta reconstrução isolada:** `npm run test:readiness` aprovado (1.404 unitários, 8 testes de integração e demais verificações institucionais); Playwright Chromium: **18/18** nas suítes do diálogo, da retificação legada, da Gestão SME e do layout do Prontuário (incluindo 390 px, tema escuro e interação com botão real sob transporte simulado). Essas provas não equivalem a CRUD autenticado no Supabase institucional; o teste de navegador usa `executeRpc` controlado.

## De onde veio o código

- A base deste candidato é `audit/manus-sugestoes-correcao-20261114` (`f0fa7335`), com a T1 de cabeçalhos horizontais reconstruída do Astra e uma proposta nova de RPCs mais segura que o contrato incompleto do Argon.
- O ajuste mais recente do teste Gestão SME da T1 (`300ac6d1`) foi incorporado e validado. Nenhuma regra funcional da Gestão SME foi alterada para fazê-lo passar.
- Os artefatos **não substituíveis** do Argon (`182b7949`), `tests/fixtures/prontuario-correction-cases.json` e `src/domain/pendency-correction.js`, foram recuperados para manter os cenários T0 e a base da T5. **Sua existência não significa que a T5 já esteja integrada.**
- O relatório do Manus continua referência histórica, **não é o contrato executável final**: `audit/manus-auditoria-frente-integrada-20261114`.

## Correções realizadas pela auditoria independente

1. **SQL — repetição concorrente da mesma intenção:** `apply_operational_change_impl` agora serializa por `operationKey` com advisory lock transacional antes de consultar o ledger, para que o segundo pedido retorne o recibo idempotente, não `NOT_FOUND`. Regressão reproduzível: `scripts/test-operational-correction-concurrency.sh` (somente banco local com nome `ind_*` ou `radar_test_*`), massa `tests/fixtures/operational-correction-concurrency-seed.sql`.
2. **Tema escuro — NF e dados escolares:** os títulos escuros da T1 eram ilegíveis; a alteração do Manus trocava apenas a cor da fonte, criando texto claro sobre a superfície ainda branca das linhas de NF. O CSS foi reconciliado definindo a **superfície escura da linha** e sua listra no Prontuário, sem `!important` adicional. O Playwright `tests/e2e/prontuario-dark-contrast-regression.spec.js` mede os pares texto/fundo **após** a transição, exigindo WCAG AA de pelo menos 4,5:1. Teste criado inicialmente vermelho no candidato anterior, depois verde.
3. **Readiness SQL:** o runbook declara 63 migrations, identificando a 63ª como *candidata não instalada em Production*; o verificador canônico local também espera 63. Não alterar o histórico de migrations remoto para justificar um contador.
4. **T1/SME:** alteração exclusiva do teste E2E para o novo DOM; permissões efetivas permanecem intactas.

## Resultado e limitações

- Migration candidata e testes SQL aplicados **somente em PostgreSQL descartável**. A migração não está instalada no Supabase institucional.
- Componente `src/application/operational-correction-client.js` é um cliente de prévia/aplicação e **não está instalado no bootstrap visual**. RPCs estarem testadas não significa que T2/T3 estejam disponíveis na interface do usuário.
- Não declarar T1 concluída só pela suíte: requer revisão humana de capturas, histórico e persistência após reload. Testes Playwright com massa local NÃO provam persistência Supabase real.
- Parte da T2 exige diálogos reais, estado sem falso sucesso, carregamento controlado e interface de correção para avaliação, Pendência e NF. A T3 requer delegação da exclusão existente para a autoridade composta quando habilitada, preservando caminho antigo quando desabilitada até homologação. Não instalar duas interceptações sobre a mesma ação.
- T4 (bonificação e contexto errado), T5 (histórico e inventário granulares) e T6 (homologação global/produção) **não estão completas**.
- **Nenhuma operação de escrita institucional, deploy ou merge foi autorizada por este checkpoint.** Registros e usuários de teste são fictícios.

## Comandos de verificação local

```bash
npm ci
npm run test:readiness
npx playwright test tests/e2e/prontuario-correction-layout.spec.js tests/e2e/sme-access-governance.spec.js tests/e2e/prontuario-dark-contrast-regression.spec.js --project=desktop-chromium --workers=1
# Apenas PostgreSQL descartável com schema/migrations já carregados:
# sudo -u postgres bash scripts/test-operational-correction-concurrency.sh ind_radar_corrected
# sudo -u postgres psql -X -q -t -A -d ind_radar_corrected -f supabase/tests/database/operational-correction.test.sql
```

## Próxima ordem objetiva

1. Conferir HEAD remoto desta branch e o estado da `main`. Executar novamente os testes e confirmar que a integração não perdeu os artefatos T0/T5 recuperados.
2. Completar o módulo de diálogo e a integração no **bootstrap e nos controles reais**, baseando-se no plano/receipt da RPC. Evitar criar novas regras de negócio no DOM.
3. Fechar as jornadas T2/T3 com teste autenticado no banco descartável, edit/save/reload e duas sessões. Reprovar qualquer sucesso falso, exclusão ampliada, ressurreição no cache, ou justificativa obrigatória.
4. Fazer revisão visual de screenshots reais 1280/1440/1920 e 390 px, claro/escuro, perfis Controlador/Assistente/SME antes de merge.
5. Só depois da aprovação e integração preparar migração/release separadas, revalidando Prod e CI.

**Regra de continuidade:** atualizar este documento com commit, arquivos, testes e pendências após cada lote; não substituir evidências por afirmações de outro agente.
