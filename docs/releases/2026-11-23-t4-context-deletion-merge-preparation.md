# RADAR PDDE — candidato de integração: excluir lançamentos de mês/programa incorreto

**Escopo:** PR #546, `delete_context` da T4. **Não é a conclusão da T4 integral**: `clear_item_history` continua pendente; a correção de bonificação consolidada já foi entregue nos PRs #538/#540.
**Estado:** preparação com hardening do [PR #556](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/556) (`ae4ca9be`, contribuição `T0T6-C025`) incorporado; **não autoriza merge/deploy** até a lista de gates ser concluída. Baseline `main` já contém o hotfix [PR #555](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/555) (`a695f07f`, Production `dpl_6BPKPiomHXx1MawqeC2ywtkKCqfU`) sem conflito com esta branch. A versão candidata deve ser fixada pelo SHA final do PR e pelos workflows correspondentes.

## Contrato de uso

A pessoa autorizada abre o Prontuário da escola, escolhe a competência e programa existentes, abre **Ações do programa** e seleciona **Excluir lançamentos deste programa neste mês**. A prévia mostra escola, programa, mês, contagens, números/valores das notas fiscais, documentos das Pendências, bens relacionados e o que permanece. A exclusão exige confirmação explícita. Não existem transferência automática de despesa, marcação fictícia de Pendência resolvida nem apagamento de registros vizinhos.

A antiga reconciliação da bonificação deve selecionar **apenas** `.program-consolidate-button`, sem modificar a ação de exclusão no menu.

## Ordem de publicação — somente após autorização

1. **Congelar SHA e CI:** todos os workflows obrigatórios do mesmo SHA com sucesso (nada pendente, cancelado ou reprovado). Conferir ambiente local Supabase/Auth/RLS, pgTAP, E2E da exclusão/cancelamento/segunda sessão, exportações, CodeQL, desempenho, mobile/desktop/temas e aprovação visual. Não aprovar por testes unitários isolados.
2. **Revisar banco e recuperar:** confirmar histórico institucional das migrations prévias T2/T3 e migration 65 da bonificação; fazer backup institucional verificável e ter procedimento de recuperação. **Não reaplicar migrations já registradas.**
3. **Migrar o backend:** aplicar exclusivamente a candidata `supabase/migrations/20261123000100_t4_delete_program_context.sql` após revisão da autoridade, comparando nome/checksum e ordem contra o histórico remoto. A aplicação em banco descartável não prova aplicação institucional. Sem comandos destrutivos de rollback sobre dados ativos.
4. **Verificar backend institucional:** consultar a migração aplicada, permissões e assinaturas das RPCs; confirmar papel do Controlador, negação para perfis somente leitura, consulta da prévia e proteção contra digest desatualizado. Não executar exclusão real com registros escolares durante a homologação; testes destrutivos apenas no banco descartável.
5. **Integrar frontend:** merge do SHA aprovado na `main`, depois deploy Vercel a partir desse SHA, inicialmente com `RADAR_T4_CONTEXT_DELETION_RELEASE_ENABLED=false`. O build-manifest deve registrar `contextDeletionRelease=false` nessa etapa. A correção de bonificação entregue anteriormente permanece ativa.
6. **Liberar o recurso:** apenas com a migration confirmada, o frontend publicado, smoke autenticado e autorização de publicação, ativar `RADAR_T4_CONTEXT_DELETION_RELEASE_ENABLED=true` na Vercel de Production e criar/validar deployment do mesmo commit; confirmar no manifesto `contextDeletionRelease=true`. **Não** confundir com `RADAR_T4_CONTEXT_DELETION_PILOT`, limitado ao localhost.
7. **Verificar e comunicar:** abrir com perfil autorizado, conferir menu, prévia e botão; confirmar bloqueio de perfis sem permissão; validar SHA GitHub/Vercel e banco. Relatar publicação somente com prova e data/hora reais.

## Contenção e recuperação

- **Antes do backend:** manter release flag OFF, não alterar o Supabase institucional.
- **Depois do backend, antes do frontend:** manutenção de RPC compatível com clientes atuais; nenhum botão novo está exposto.
- **Depois do frontend:** primeiro desativar a flag da exclusão e redeploy se necessário; validar que as demais correções continuam funcionando. Preservar histórico transacional, recibos, trilha de auditoria e backup. Não apagar migration, ledger ou dados para reverter interface.
- **Se houver incompatibilidade de protocolo/cliente:** interromper ativação e restaurar versão anterior de frontend, mantendo a flag OFF. Qualquer reversão de banco exige plano específico e evidência de impacto.

## Evidências por versão e critérios de interrupção

**Baseline de testes de 23/11:** `f1fecf29add391c6b1e549c20fdf35426fd74f45`.
- [Supabase readiness](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45267244475): pgTAP aprovado, três jobs aprovados e 13 jornadas de correção autenticadas, incluindo as duas jornadas T4 (prévia/cancelamento e exclusão/persistência/segunda sessão).
- [Ciclos funcionais reais](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45267245068) e [homologação pré-production](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45267245482): aprovados na mesma baseline. São provas em ambiente isolado; não comprovam a publicação da T4.
- [Validação principal](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45267245062): o job de Auth/perfis/RLS/persistência no Preview foi ignorado. Distinguir diagnóstico condicional de falha (artefato não publicado quando o teste passa) de cenário funcional ignorado. Não declarar aprovação de um cenário que não executou.
- Em 24/11 foram acrescentadas duas contraprovas no spec autenticado da T4: perfil somente leitura tentando confirmar com digest válido do Controlador (`14d8d3ca`); prévia invalidada por alteração persistida em outra sessão, recusa do botão real, nova conferência e preservação de registros (`f65b4b2f`). **A aprovação depende dos logs do novo HEAD**, não dos resultados de 23/11.

### Checklist operacional de recuperação (a executar somente em ambiente autorizado)

1. Registrar SHA candidato, hash SHA-256 do arquivo de migration 66, versão atualmente aplicada e identificador do backup. Comparar o hash calculado a partir do arquivo versionado no SHA candidato com o arquivo efetivamente submetido. Não usar hash de outra branch.
2. Antes de qualquer mudança institucional, provar recuperação do backup em ambiente isolado, confrontando contagens, vínculos e versões das entidades afetadas. Não incluir segredos ou dados escolares em artefatos públicos.
3. Se a migration falhar, interromper o procedimento antes de ativar o frontend; verificar o histórico de migrations e o estado transacional. Não presumir sucesso parcial nem reaplicar automaticamente.
4. Se o smoke do frontend ou a ativação falharem, manter/desativar a flag de release, conferir `contextDeletionRelease=false` no manifesto publicado e restaurar a versão de frontend previamente verificada se necessário.
5. Se uma exclusão real já tiver ocorrido, desativar a flag impede novas exclusões, mas **não recupera os registros excluídos**. Preservar ledger, recibos e logs; investigar escopo e impacto. Recuperação seletiva, restauração de backup ou migration compensatória exigem decisão e plano próprios. Não restaurar toda a base sobre registros institucionais posteriores sem reconciliação.
6. Registrar responsável, horário, SHA, evidência de validação e decisão de prosseguir/interromper. Nenhuma etapa deste checklist equivale à autorização do proprietário.

## Gates de aceite para deixar PR #546 Ready for Review

- [ ] Funcionalidade `delete_context`: UI real, prévia, cancelamento, confirmação, reload e segunda sessão com Auth/RLS; registros vizinhos permanecem; eventual conflito entre prévia e confirmação impede perda parcial.
- [ ] Menu acessível, teclado, tema claro/escuro, viewport de celular e contraste; nenhuma ação destrutiva exposta sem autorização.
- [ ] Independência despesa × bonificação e exportações continuam corretas. Testes com fixture compartilhada não devem aprovar por retry contaminado.
- [ ] Testes de configuração confirmam flag OFF por padrão, liberação segura por env explícita e status no manifesto.
- [ ] Todos os workflows GitHub obrigatórios aprovados para o **mesmo SHA**. Sem gate ignorado, skipped disfarçado de sucesso ou ausência de prova.
- [ ] Reconciliar matriz, modelo canônico e registro de continuidade; declarar `clear_item_history` e cenários T5 separadamente.
- [ ] Revisão de release, migração/backup e rollback concluídos. **Aprovação para merge é distinta da autorização para publicação em Production.**

**Referências:** plano T0–T6 de 14/11/2026, `docs/reference/PRONTUARIO_CORRECAO_CONTRATO.md`, checkpoint T4, PR #546, ADR-055 (independência de despesas/bonificação).
