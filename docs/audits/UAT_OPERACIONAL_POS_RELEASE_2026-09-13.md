# UAT operacional pós-release — RADAR PDDE

Data: 13/09/2026. Registro incremental, não constitui nova regra canônica.

## Estado inicial da frente

- Prioridade: verificar acesso e jornadas reais, confirmação visual, gravação Supabase e recuperação após reload.
- Base funcional publicada no início: PR #300 / `1a149174`.
- PR #301 Draft, branch `test/operational-uat-supabase-2026-09-13`.
- Escritas de homologação permanecem no Supabase descartável de CI; nenhuma mutação operacional em Production foi autorizada.

## Bloco 1 — contraprova do checkpoint recebido

O checkpoint inicial recebido estava em torno de `920c7230`. A branch avançou até `4a7a41dc...`, corrigindo expectativa visual obsoleta e adicionando espera explícita de convergência remota.

No run `34772406774`, os ciclos funcionais existentes passaram, incluindo login/contexto/auditoria e avaliação pela interface com persistência/reload.

A homologação integral daquele momento falhou ao baixar `public.ecr.aws/supabase/postgres-meta:v0.97.0` durante geração de tipos. A pilha já havia executado migrations, lint e **426 testes pgTAP**. Classificação: rate limit externo de infraestrutura, sem evidência de defeito funcional do RADAR.

O monitor autenticado de Production também revelou uma falsa sensação de prontidão: um run verde podia ter a leitura autenticada ignorada quando as contas técnicas protegidas não estavam configuradas. Logo, monitor verde sem execução da etapa autenticada não prova login real por perfil.

## Bloco 2 — ampliação das jornadas

Foram adicionados cenários de UAT com mutação exclusivamente pelos controles reais da interface:

- consumo: cadastro, análise, retificação, reload e exclusão;
- serviço/Assessoria: duas NFs independentes, Pendência, novo envio, reanálise incorreta, nova tentativa e resolução;
- `a_identificar`: abertura atômica, edição preservando vínculo, identificação no novo envio e resolução;
- Boleto Internet em Educação Conectada;
- contato, cancelamento e reabertura de Pendência.

Uma escola UAT e Educação Conectada são provisionadas somente por fixture SQL no PostgreSQL local descartável do workflow. Não há migration nem escrita em Production.

O workflow passou a preservar evidências de sucesso e falha.

## Bloco 3 — defeito funcional real descoberto

A jornada de novo envio de Pendência fiscal revelou um 404 real no RPC `register_invoice_document_attempt` quando a NF não possuía bem vinculado.

Causa raiz:

- `p_expected_asset_version` recebia `undefined`;
- a serialização removia o argumento;
- a assinatura RPC esperava o parâmetro, mesmo que `null`;
- o PostgREST não encontrava a função com o conjunto de argumentos enviado.

Correção mínima em `src/application/pendency-service.js`:

```diff
- p_expected_asset_version: persistence.expectedAssetVersion,
+ p_expected_asset_version: persistence.expectedAssetVersion ?? null,
```

Foi criado `tests/unit/pendency-rpc-argument-contract.test.js` como regressão específica. Não houve alteração de schema, migration nem regra funcional.

## Bloco 4 — falsos vermelhos da automação

Falhas subsequentes foram classificadas pelas evidências do Playwright:

1. seletor genérico de edição encontrava `Editar NF` e `Editar análise`;
2. a automação tentava clicar em botões da linha enquanto um drawer operacional estava por cima;
3. o helper observava `#pendency-preview-drawer` quando a tela de Pendências usa `#pendency-detail-drawer`;
4. após resolução de `a_identificar` e Boleto Internet, a UAT esperava um `<select>` editável, mas a interface corretamente renderizava o estado final `Correto` em modo de leitura.

Os testes foram ajustados para usar o controle que o usuário realmente vê, sem `force: true` e sem sleeps arbitrários.

As capturas confirmaram que `a_identificar` e Boleto Internet **não perdiam dados** após reload: o documento reaparecia com o mesmo registro remoto e estado `Correto`.

## Bloco 5 — ciclo administrativo de Pendência

Foi criada `tests/e2e/supabase-pendency-operations-uat.spec.js` para provar:

```text
criar Pendência pela UI
→ registrar contato
→ conferir pendency_contacts
→ reload
→ cancelar com justificativa
→ conferir Supabase/log
→ reload
→ reabrir com novo erro
→ conferir Supabase/log
→ reload
→ confirmar contato e histórico preservados
```

Essa prova fortalece diretamente `PEND-04`, `PEND-05` e `PEND-06`, mas a matriz não deve ser artificialmente marcada como totalmente coberta onde ainda exige autoria explícita ou idempotência específica.

## Bloco 6 — Production observada pelo Work/Astra

O Astra conseguiu autenticar no site oficial e abrir o Prontuário da Ary Barroso com avaliações reais.

Antes da navegação bem-sucedida apareceu a mensagem `Não foi possível carregar os escopos de escolas`. A sessão posteriormente se recuperou e o Prontuário abriu. Classificação: ocorrência transitória ainda sem causa determinada; não tratar como bloqueio permanente sem reprodução.

Nenhuma escrita de homologação foi feita em Production.

## Bloco 7 — certificação funcional do candidato `452d972...`

Candidato:

`452d97267348957f7155fc77bb139a4adafd766b`

Passaram:

- `Ciclos funcionais reais com Supabase` — run `34783607506`;
- `Testes E2E Playwright` — run `34783607552`;
- `Confiabilidade funcional com Supabase real` — run `34783607532`;
- `Supabase readiness` — run `34783607627`;
- `Gate remoto de perfis e viewports` — run `34783607483`;
- `Retificação auditável direcionada` — run `34783607632`;
- `Validar RADAR PDDE` — run `34783607599`;
- `CodeQL` — run `34783607516`;
- `Saúde das dependências` — run `34783607562`.

`Homologação integral pré-production` — run `34783607517`:

- migrations em PostgreSQL limpo: sucesso;
- Supabase local/Auth/RLS/pgTAP: sucesso;
- dependências/segurança: sucesso;
- backup/restauração: sucesso;
- prontidão completa: sucesso;
- Playwright completo: sucesso;
- Excel SME/OOXML/rota pública: sucesso;
- Lighthouse desktop: falha de performance;
- gate final herdou apenas esse vermelho.

Por decisão operacional expressa desta rodada, pequenas oscilações de Lighthouse não bloqueiam a reabertura funcional do sistema.

## Bloco 8 — interpretação de release

A certificação comprova o núcleo operacional crítico com UI + Supabase + reload e toda a suíte E2E atual.

Operações `partial` na matriz continuam significando dívida de evidência específica, não bug conhecido. Não esconder essas lacunas nem transformá-las automaticamente em bloqueio quando o contrato da matriz não as define assim.

Antes de reabrir aos usuários ainda faltam passos de ambiente, não de implementação funcional conhecida:

1. integrar o PR #301;
2. confirmar `main` no merge resultante;
3. confirmar Vercel Production `READY` no SHA integrado;
4. executar smoke não destrutivo do endereço oficial;
5. registrar o fechamento documental pós-merge.
