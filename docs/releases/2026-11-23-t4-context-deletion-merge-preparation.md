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

## Gates de aceite para deixar PR #546 Ready for Review

- [ ] Funcionalidade `delete_context`: UI real, prévia, cancelamento, confirmação, reload e segunda sessão com Auth/RLS; registros vizinhos permanecem; eventual conflito entre prévia e confirmação impede perda parcial.
- [ ] Menu acessível, teclado, tema claro/escuro, viewport de celular e contraste; nenhuma ação destrutiva exposta sem autorização.
- [ ] Independência despesa × bonificação e exportações continuam corretas. Testes com fixture compartilhada não devem aprovar por retry contaminado.
- [ ] Testes de configuração confirmam flag OFF por padrão, liberação segura por env explícita e status no manifesto.
- [ ] Todos os workflows GitHub obrigatórios aprovados para o **mesmo SHA**. Sem gate ignorado, skipped disfarçado de sucesso ou ausência de prova.
- [ ] Reconciliar matriz, modelo canônico e registro de continuidade; declarar `clear_item_history` e cenários T5 separadamente.
- [ ] Revisão de release, migração/backup e rollback concluídos. **Aprovação para merge é distinta da autorização para publicação em Production.**

**Referências:** plano T0–T6 de 14/11/2026, `docs/reference/PRONTUARIO_CORRECAO_CONTRATO.md`, checkpoint T4, PR #546, ADR-055 (independência de despesas/bonificação).
