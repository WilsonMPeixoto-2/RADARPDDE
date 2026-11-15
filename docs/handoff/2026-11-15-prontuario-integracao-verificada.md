# RADAR PDDE — checkpoint executável da integração T0–T3 (15/11/2026)

**Leitura obrigatória temporária para qualquer agente que continuar esta frente.**
**Branch única de integração e recuperação:** \`fix/prontuario-integrado-validado-20261115\`.
**Baseline conservada:** \`main\` em \`4011a2b8\`, sem alteração, merge ou deploy pela frente.
**Plano de destino:** [Prontuário: design, correção e exclusão integrados](../superpowers/plans/2026-11-14-prontuario-visual-correcao-integrada.md).
**Regras aprovadas:** [contrato](../reference/PRONTUARIO_CORRECAO_CONTRATO.md) e [estudo de flexibilização](../superpowers/specs/2026-11-14-flexibilizacao-correcao-exclusao-lancamentos.md).

## De onde veio o código

- A base deste candidato é \`audit/manus-sugestoes-correcao-20261114\` (\`f0fa7335\`), com a T1 de cabeçalhos horizontais reconstruída do Astra e uma proposta nova de RPCs mais segura que o contrato incompleto do Argon.
- O ajuste mais recente do teste Gestão SME da T1 (\`300ac6d1\`) foi incorporado e validado. Nenhuma regra funcional da Gestão SME foi alterada para fazê-lo passar.
- Os artefatos **não substituíveis** do Argon (\`182b7949\`), \`tests/fixtures/prontuario-correction-cases.json\` e \`src/domain/pendency-correction.js\`, foram recuperados para manter os cenários T0 e a base da T5. **Sua existência não significa que a T5 já esteja integrada.**
- O relatório do Manus continua referência histórica, **não é o contrato executável final**: \`audit/manus-auditoria-frente-integrada-20261114\`.

## Correções realizadas pela auditoria independente

1. **SQL — repetição concorrente da mesma intenção:** \`apply_operational_change_impl\` agora serializa por \`operationKey\` com advisory lock transacional antes de consultar o ledger, para que o segundo pedido retorne o recibo idempotente, não \`NOT_FOUND\`. Regressão reproduzível: \`scripts/test-operational-correction-concurrency.sh\` (somente banco local com nome \`ind_*\` ou \`radar_test_*\`), massa \`tests/fixtures/operational-correction-concurrency-seed.sql\`.
2. **Tema escuro — NF e dados escolares:** os títulos escuros da T1 eram ilegíveis; a alteração do Manus trocava apenas a cor da fonte, criando texto claro sobre a superfície ainda branca das linhas de NF. O CSS foi reconciliado definindo a **superfície escura da linha** e sua listra no Prontuário, sem \`!important\` adicional. O Playwright \`tests/e2e/prontuario-dark-contrast-regression.spec.js\` mede os pares texto/fundo **após** a transição, exigindo WCAG AA de pelo menos 4,5:1. Teste criado inicialmente vermelho no candidato anterior, depois verde.
3. **Readiness SQL:** o runbook declara 63 migrations, identificando a 63ª como *candidata não instalada em Production*; o verificador canônico local também espera 63. Não alterar o histórico de migrations remoto para justificar um contador.
4. **T1/SME:** alteração exclusiva do teste E2E para o novo DOM; permissões efetivas permanecem intactas.

## Resultado e limitações

- Migration candidata e testes SQL aplicados **somente em PostgreSQL descartável**. A migração não está instalada no Supabase institucional.
- Componente \`src/application/operational-correction-client.js\` é um cliente de prévia/aplicação e **não está instalado no bootstrap visual**. RPCs estarem testadas não significa que T2/T3 estejam disponíveis na interface do usuário.
- Não declarar T1 concluída só pela suíte: requer revisão humana de capturas, histórico e persistência após reload. Testes Playwright com massa local NÃO provam persistência Supabase real.
- Parte da T2 exige diálogos reais, estado sem falso sucesso, carregamento controlado e interface de correção para avaliação, Pendência e NF. A T3 requer delegação da exclusão existente para a autoridade composta quando habilitada, preservando caminho antigo quando desabilitada até homologação. Não instalar duas interceptações sobre a mesma ação.
- T4 (bonificação e contexto errado), T5 (histórico e inventário granulares) e T6 (homologação global/produção) **não estão completas**.
- **Nenhuma operação de escrita institucional, deploy ou merge foi autorizada por este checkpoint.** Registros e usuários de teste são fictícios.

## Comandos de verificação local

\`\`\`bash
npm ci
npm run test:readiness
npx playwright test tests/e2e/prontuario-correction-layout.spec.js tests/e2e/sme-access-governance.spec.js tests/e2e/prontuario-dark-contrast-regression.spec.js --project=desktop-chromium --workers=1
# Apenas PostgreSQL descartável com schema/migrations já carregados:
# sudo -u postgres bash scripts/test-operational-correction-concurrency.sh ind_radar_corrected
# sudo -u postgres psql -X -q -t -A -d ind_radar_corrected -f supabase/tests/database/operational-correction.test.sql
\`\`\`

## Próxima ordem objetiva

1. Conferir HEAD remoto desta branch e o estado da \`main\`. Executar novamente os testes e confirmar que a integração não perdeu os artefatos T0/T5 recuperados.
2. Completar o módulo de diálogo e a integração no **bootstrap e nos controles reais**, baseando-se no plano/receipt da RPC. Evitar criar novas regras de negócio no DOM.
3. Fechar as jornadas T2/T3 com teste autenticado no banco descartável, edit/save/reload e duas sessões. Reprovar qualquer sucesso falso, exclusão ampliada, ressurreição no cache, ou justificativa obrigatória.
4. Fazer revisão visual de screenshots reais 1280/1440/1920 e 390 px, claro/escuro, perfis Controlador/Assistente/SME antes de merge.
5. Só depois da aprovação e integração preparar migração/release separadas, revalidando Prod e CI.

**Regra de continuidade:** atualizar este documento com commit, arquivos, testes e pendências após cada lote; não substituir evidências por afirmações de outro agente.
