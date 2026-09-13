# UAT operacional pós-release — RADAR PDDE

**Data:** 13/09/2026  
**Classe:** Evidência incremental; não redefine regra canônica.

## 1. Objetivo

Comprovar jornadas reais do usuário após a refatoração Supabase, cruzando interface, persistência remota, efeitos derivados e recuperação após reload, sem executar mutações de homologação em Production.

## 2. Evolução da UAT

A frente começou com login/contexto/auditoria e avaliação pela interface. Depois foram adicionadas jornadas reais para:

- consumo;
- serviço/Consulta Assessoria por NF;
- `a_identificar`;
- Boleto Internet em Educação Conectada;
- contato, cancelamento e reabertura de Pendência.

As escritas foram executadas em Supabase descartável de CI com Auth/RLS reais. Consultas diretas ao banco serviram apenas para verificar o resultado das ações realizadas pela interface.

## 3. Defeito funcional real encontrado

O novo envio de Pendência fiscal sem bem vinculado podia falhar com 404 em `register_invoice_document_attempt`.

Causa: `p_expected_asset_version` era `undefined`, desaparecia da serialização e alterava o conjunto de argumentos visível ao PostgREST.

Correção:

```diff
- p_expected_asset_version: persistence.expectedAssetVersion,
+ p_expected_asset_version: persistence.expectedAssetVersion ?? null,
```

Regressão adicionada em `tests/unit/pendency-rpc-argument-contract.test.js`. Sem migration ou mudança de regra funcional.

## 4. Falhas de automação classificadas

Vermelhos subsequentes foram rastreados a expectativas obsoletas do teste:

- seletor `Editar` ambíguo;
- clique em ação da linha enquanto drawer operacional estava aberto;
- observação do drawer errado (`#pendency-preview-drawer` em vez de `#pendency-detail-drawer`);
- expectativa de `<select>` editável depois de o estado final corretamente ser renderizado como leitura `Correto`.

As evidências confirmaram que `a_identificar` e Boleto Internet não perdiam dados após reload.

## 5. Ciclo administrativo de Pendência

A UAT comprovou:

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

## 6. Certificação do candidato funcional

Candidato: `452d97267348957f7155fc77bb139a4adafd766b`.

Sucessos:

- Ciclos funcionais reais com Supabase — `34783607506`;
- Playwright completo — `34783607552`;
- Confiabilidade Supabase real — `34783607532`;
- Supabase readiness — `34783607627`;
- perfis/viewports — `34783607483`;
- retificação auditável — `34783607632`;
- validação geral — `34783607599`;
- CodeQL — `34783607516`;
- dependências — `34783607562`.

A homologação integral passou banco, Auth/RLS/pgTAP, backup/restauração, segurança, prontidão, Playwright e Excel; ficou vermelha apenas por Lighthouse desktop. Performance foi retirada do critério bloqueante de reabertura pelo responsável do projeto.

## 7. Integração

PR #301 integrada em `main`:

`39cd984206b33c7d2a6d7084e23597f964235c9a`

Commit documental pós-merge:

`de336d20f514818c42a3ad403720c6b606065868`

O commit documental não altera runtime e disparou a publicação Production contendo o merge funcional.

## 8. Production pós-merge

Deployment:

`dpl_DKGa7PqP6KqiDrrWeevReEhyrKLS`

Estado: `READY`.

Build:

- 1020 testes;
- 1020 aprovados;
- 0 falhas;
- artefato `supabase-production`;
- deployment concluído.

Smoke técnico no domínio oficial:

- HTTP 200;
- tela institucional correta;
- runtime de Production;
- sem logs `error` ou `fatal` no novo deployment no intervalo observado.

TinyFish executou smoke independente e confirmou que o site e a tela de login estavam acessíveis sem bloqueios. A automação não pôde autenticar porque não havia sessão ativa no Browser Context Profile nem credencial segura no vault. A execução parou conforme instruído, sem mutação.

Work/Astra havia comprovado anteriormente um login real em Production e abertura do Prontuário da Ary Barroso. Naquela ocasião surgiu uma mensagem transitória de falha de escopos antes da recuperação da sessão; não houve evidência de bloqueio persistente.

## 9. Supabase pós-publicação

Projeto `RADAR PDDE 2026` (`scnryinorqeucbfkioxo`) observado como `ACTIVE_HEALTHY`.

Advisors:

- segurança: aviso `Leaked Password Protection Disabled`, independente desta correção;
- performance: oito índices ainda reportados como não utilizados, sem ação nesta frente.

Não houve migration no PR #301.

## 10. Conclusão

A frente não identificou defeito funcional conhecido remanescente que bloqueie a reabertura dos usuários nas jornadas operacionais certificadas.

A evidência pós-deploy não inclui um novo login automatizado autenticado por cinco perfis, por ausência de credenciais técnicas seguras. Essa limitação permanece documentada e não deve ser apresentada como teste executado.

A recomendação operacional é **reabrir o RADAR aos usuários**, manter os monitores existentes e tratar qualquer novo relato a partir de reprodução concreta, sem reabrir preventivamente a arquitetura já certificada.
