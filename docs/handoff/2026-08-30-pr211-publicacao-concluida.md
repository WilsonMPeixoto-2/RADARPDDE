# PR #211 — publicação concluída e rota pós-hotfix

**Atualizado em:** 30 de agosto de 2026  
**Classe documental:** Canônico — estado pós-publicação  
**PR:** #211 — integrado  
**Merge em `main`:** `aa82ab4e359f62259df33842fb794aa1e654c30c`  
**SHA funcional validado:** `530ca6cb62c385ca7ca35f30e82a723e1afed3f6`

## 1. Resultado final

O hotfix de individualização de Notas Fiscais foi integrado e publicado em Production.

- GitHub: PR #211 fechado por merge;
- Supabase Production: projeto `scnryinorqeucbfkioxo` com 43 migrations;
- migration canônica: `20260828023000_invoice_document_analysis_pendency`;
- Vercel Production: deployment `dpl_2ApguJZe79buX9xD1od45RDTKYDR`, estado `READY`;
- URL: `https://radarpdde-fix.vercel.app`;
- manifesto publicado: commit `aa82ab4e359f62259df33842fb794aa1e654c30c`.

## 2. Efeitos confirmados no Supabase Production

O pós-apply remoto confirmou:

- 43 migrations, com a versão canônica `20260828023000` registrada uma única vez;
- 12 despesas/NFs de teste removidas;
- três Pendências fiscais técnicas removidas;
- 15 logs administrativos correspondentes preservados;
- 16 registros legítimos `a_identificar` preservados como **Registro legado**;
- cinco contextos técnicos de teste normalizados;
- RPCs atômicas de análise, Pendência, novo envio, reanálise e `a_identificar` presentes;
- contrato integral de migrations, extensões, privilégios, funções e políticas aprovado por `remote-post-apply.sql`.

A limpeza foi executada pelos IDs e evidências previamente classificados. Não houve associação heurística, backfill de Pendência nem alteração dos 16 legados legítimos.

## 3. Contrato que agora integra o baseline

- bonificação de `notaFiscal` permanece agregada;
- análise técnica e Pendência são individuais por `registered_invoice_id`;
- documentos distintos podem manter Pendências simultâneas;
- a mesma despesa não pode duplicar Pendência ativa equivalente;
- `boleto_internet` existe somente como tipo de gasto dentro de Notas Fiscais e somente em Educação Conectada;
- nova `a_identificar` nasce atomicamente como `Incorreto + Pendência`;
- identificação posterior preserva o ID e segue novo envio/reanálise;
- Consulta Assessoria permanece individual por NF de serviço;
- reanálise exige a tentativa real mais recente, no estado correto, sem reescrever o envio;
- os 16 `a_identificar` anteriores e legítimos permanecem somente leitura como **Registro legado**;
- o Prontuário mantém apenas avaliação e visualização/edição básica da Pendência; novo envio e reanálise permanecem na tela de Pendências.

## 4. Validação de publicação

Após o merge passaram:

- monitor de Production: site, manifesto, assets, bloqueio anônimo e Edge Functions;
- homologação do Supabase Production;
- Supabase readiness;
- Validar RADAR PDDE;
- CodeQL, dependências e snapshot canônico.

O Lighthouse de `main` repetiu a classificação aprovada para este hotfix:

- desktop: performance 79%, acessibilidade 100% e LCP 3,45 s — aprovado;
- mobile: performance 61%, acessibilidade 94% e LCP 16,04 s — dívida não bloqueante, sem relaxamento do limite.

## 5. Smoke autenticado dedicado

O monitor **Cinco perfis × seis leituras reais** não foi declarado como executado. O próprio repositório mantém `RADAR_PRODUCTION_AUTH_READ_ENABLED` desativado enquanto não houver cinco identidades técnicas exclusivas e o segredo protegido.

Essa governança já existia antes do PR #211: contas pessoais ou operacionais não devem ser reutilizadas e identidades não devem ser criadas automaticamente para satisfazer um gate. Os smokes de publicação efetivamente disponíveis passaram.

## 6. Validade dos documentos anteriores

Os handoffs de 28/08 e de retomada de 30/08, o preflight e o plano do hotfix continuam válidos como histórico, decisão e evidência do candidato. Afirmações neles como “Draft”, “Production intocada” ou “migration não aplicada” descrevem o momento anterior ao merge e não representam mais o estado corrente.

Este arquivo, `docs/CURRENT_STAGE.md`, o código de `main` e os ambientes efetivos prevalecem para o estado pós-publicação.

## 7. Correção visual final — PR #214

A reconferência visual posterior ao PR #211 foi efetivamente executada em 30/08/2026 e encontrou um defeito real de composição em desktop de 1280 px: a grade de quatro colunas dos painéis individualizados podia exceder a largura útil do Prontuário, com corte/deslocamento do controle **Enviada à Assessoria**.

O PR #214 corrigiu somente essa composição:

- merge em `main`: `cc842af7b7bc6341dab68aa55a533a2017923bcf`;
- nenhuma mudança de regra de negócio;
- nenhuma migration ou mutação de Supabase;
- regressão E2E contra overflow adicionada;
- Playwright completo, Validar RADAR, perfis/viewports e CodeQL aprovados;
- homologação integral ficou vermelha apenas porque herdou o Lighthouse móvel já classificado como não bloqueante;
- Vercel Production: `dpl_33e4bM4z5YrbP5YGhfsr88pgwDPX`, `READY`;
- monitor de Production e homologação do Supabase Production aprovados após o merge.

A evidência visual de 29/08 que registrava “nova conferência adiada” deve ser lida como histórica; a pendência visual foi encerrada pelo PR #214.

## 8. Decisão explícita sobre hardening adicional do Supabase

A auditoria independente pós-publicação identificou uma lacuna latente de proteção contra escrita direta em `registered_invoices`: embora o fluxo normal do RADAR e as RPCs estejam protegidos, o banco ainda pode receber tentativas diretas de alteração de `id`, `verification_id` ou `source_context_key` por um cliente autenticado que já possua permissão de escrita da escola.

Não há evidência de corrupção atual em Production. Os dados inspecionados permanecem coerentes.

O responsável pelo produto decidiu **adiar conscientemente essa frente de segurança/integridade**. Ela só deverá ser retomada depois que **todas as implementações previstas nos planos de correção de funcionalidades estiverem perfeitamente concluídas e validadas**. Portanto:

- não é gate para considerar o hotfix PR #211 encerrado;
- não bloqueia a reconciliação pós-hotfix;
- não deve interromper PR3.1 ou as demais frentes funcionais aprovadas;
- não deve ser silenciosamente tratada como resolvida;
- deve permanecer registrada para uma frente posterior específica de segurança/integridade, conforme ADR-051.

## 9. Próxima ação obrigatória

O hotfix está encerrado. Antes de iniciar PR3.1:

1. comparar o diff integrado do PR #211 com o plano mestre de 26/08;
2. classificar cada tarefa futura como não afetada, parcialmente atendida, atendida ou alterada;
3. atualizar o plano mestre e seu handoff;
4. reconfirmar a ordem remanescente;
5. somente então iniciar a próxima frente funcional.

Essa reconciliação não autoriza reabrir o hotfix nem restaurar decisões superadas.
