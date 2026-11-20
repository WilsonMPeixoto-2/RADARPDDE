# Checkpoint único de continuidade operacional — RADAR T0–T6

**Data de fotografia:** 20/11/2026. **Escopo:** Release 1, T0–T3. **Classe:** estado temporário, revalidar GitHub em cada retomada.  
**Branch executora:** `release/prontuario-t0-t3-20261120` — [PR #535](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/535) (Draft).  
**Code source:** [Antigravity PR #534](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/534) @ `054d3bc4e0eaf7a7d1db8a5c0bfc2c9947d0f4fe`; a branch colaboradora pode receber novos commits.  
**Última candidata com testes funcionais completos verificados:** `b4f2853c3a5f6161b09788fb5e43fdfad1f2a840` (test:readiness, Auth/RLS/Supabase local, gate de configuração).  
**Commit de governança posterior já versionado:** `025a97f95a6db560b00ef473802e07a88cb3fb77` (documentação). **HEAD remoto após esta reconciliação deve ser conferido em tempo real; não presumir que estas duas fotografias são o HEAD.**  
**Baseline de Produção verificada em 20/11:** `main@69954645b597e39623ef2f24fe5f336ed37989f2`; nenhuma publicação T0–T3 ou migration institucional autorizada.

## Estado efetivo

| Marco | Estado rigoroso | Evidência/observação |
|---|---|---|
| T0 — contrato, fixtures e mapa de operações | Candidato preparado; ampliar matriz por consumidores conforme necessidade | Plano integrado, `tests/fixtures/prontuario-correction-cases.json` e PR #535 |
| T1 — composição visual | Código candidato, **não homologado visualmente** | Golden `prontuario.png` anterior à T1; diferença aprox. 2% contra tolerância 1%; exige aceite do proprietário, não relaxar tolerância |
| T2 — correção de análise e Pendências | UI/RPC candidatas verificadas em Docker/Auth/RLS e E2E específicos; **não publicadas** | `correct_analysis`, `clear_analysis`, `delete_pendency`; revalidar consumidores |
| T3 — exclusão de NF | Backend e jornadas autenticadas incluindo reabertura de Qualidade; **não publicada** | `delete_invoice`, preservar NF irmã/bonificação, Auth, RLS, F5 e segunda sessão |
| T4/T5 | Não implementados integralmente; registrar propostas sem executar aqui | Contrato e plano; próximos releases próprias |
| T6 transversal / G4 | Backend e CI não bastam para publicar | Conferir UI, compatibilidade cliente, backup/restore, migration 63, aprovação, deploy, smoke e recuperação |

**Prova do SHA de código `b4f2853c`:** `npm run test:readiness`: **1.439 unitários e 8 integrações aprovados**. `supabase-local` aprovado com pgTAP, sete identidades Auth e E2E real T2/T3. O check **Desktop homologado** falhou no golden T1 (pendência de decisão humana); nos demais checks desse SHA foram 15 aprovados, 2 skipped e 1 falha visual. **Não declarar CI integralmente verde**.

## Registro e rastreabilidade

- Decisões vigentes, alteradas ou rejeitadas: [registry.json](registry.json), chaves `T0T6-Dxxx`.
- Contribuições por agente e estado da triagem: [registry.json](registry.json), chaves `T0T6-Cxxx`. Ex.: `T0T6-C005` (fingerprint com note, rejeitado), `T0T6-C007` (Gemini G-02 integrado), `T0T6-C014` (normalização de atraso, pendente de decisão).
- Contratos vinculantes: [contrato](../../reference/PRONTUARIO_CORRECAO_CONTRATO.md) · [plano integral](../../superpowers/plans/2026-11-14-prontuario-visual-correcao-integrada.md) · [matriz](../../reference/PRONTUARIO_PLANO_TRANSICAO_INTEGRAL_T0_T6.md) · [plano da release](../../releases/2026-11-20-prontuario-t0-t3-release-1.md).
- Handoff longo de 15/11 conserva provas por SHA, **não é a fila atual**.

## Próximo ato verificável — sem reiniciar auditoria integral

1. Conferir **HEAD e CI atuais do PR #535**, `main` e `#534`; verificar se surgiram novos commits nas branches colaboradoras desde a última triagem.
2. Reabrir **apenas** a divergência visual T1 contra o golden anterior; comparar aparência com a direção de arte já aprovada e obter aceite humano, inclusive posição das NFs em 1440×900, tema escuro, teclado e outros viewports. **Não atualizar golden automaticamente.**
3. Fechar a matriz de consumidores afetados T2/T3 (Prontuário, Pendências, Passivo, Busca, Inventário, Carteira/Dashboard, Excel) com F5 e segunda sessão; registrar cenários não cobertos em vez de repetir SQL já comprovado.
4. Concluir plano de compatibilidade do cliente anterior, backup/restauração seletiva e sequência backend→frontend da Release 1. Sem migration, dados reais ou deploy institucional sem autorização expressa.
5. Atualizar este checkpoint e o registro **com SHA remoto real**, status de contribuições e próximo passo **antes de concluir o chat**, sem depender de memória.

**Não executar nesta frente:** atualização de pacotes, análise documental Drive ou registros reais de prestação de contas. **Não chamar o Supabase Docker de mock**; é banco real de testes isolado.
