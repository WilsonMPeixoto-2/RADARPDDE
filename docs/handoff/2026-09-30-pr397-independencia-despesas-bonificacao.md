# PR #397 — independência entre despesas e bonificação

**Classe:** handoff corrente, candidato não publicado. **Data:** 30/09/2026.

O ponto central é o [PR #397](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/397), branch `fix/decouple-expenses-bonification`, base revalidada `a38eeef6c36e99be1777ce957d459bc40cdaca02`. Os comentários do PR vinculam cada execução ao HEAD e ao merge-ref real; não manter um SHA autorreferente neste arquivo.

## Resultado e autoridade

Consolidar encerra a bonificação. Despesa elegível exige identidade/capacidade, escopo, contexto e regras do próprio registro; não exige NF = Sim, bonificação preenchida ou resultado aberto. [ADR-055](../decisions/ADR-055-independencia-despesas-bonificacao.md) é a decisão vinculante. Ler AGENTS, modelo canônico, catálogo, CURRENT_STAGE, ENGINEERING_METHOD e FRONTEND_USER_VALIDATION_GATE antes de retomar.

O [mapa causal, propriedade e checkpoints](../evidence/2026-09-30-pr397-expense-independence/README.md) precede as alterações. O planner mantém análises e projeções de Assessoria/Inventário, preservando NF manual e resultado. A fronteira RPC omite a decisão consolidada; salvar/excluir só mesclam campos operacionais no SQL. Reanálise vinculada à NF usa a mesma propriedade; documentos não vinculados mantêm o contrato genérico. VerificationService continua responsável por preencher/consolidar/retificar bonificação.

## Provas e limites

O checkpoint inicial revalidou main, candidato, CI/JUnit e ref #395. RED local reproduziu matriz gerada e expectativa histórica de reabertura, reconciliadas com a ADR-055. Provas locais: 19 testes de matriz/effects, 12 E2E do fluxo, 14 testes da fronteira/idempotência e sete cenários de rejeição/rollback com DataService/UnitOfWork/bridge reais. Esses números identificam execuções dirigidas, não o total final da CI.

O RED remoto em `582096b4` executou 529 assertions pgTAP: o novo teste de propriedade falhou em 7/15, comprovando perda de resultado, NF manual e campos irmãos. [Trecho do log](../evidence/2026-09-30-pr397-expense-independence/red-pgtap.txt). A árvore do merge-ref `4ae84fc` era equivalente ao HEAD, com base `a38eeef6`.

As provas sucessoras estão instaladas nos workflows existentes: pgTAP de propriedade e capacidade da primeira despesa; duas sessões PostgreSQL bloqueadas numa barreira antes do INSERT estrutural; replay/resposta descartada/payload divergente e recuperação explícita; jornadas por UI/Auth/Supabase reais com contexto vazio e consolidação para Controlador/Assistente. Resultados finais, contagens e capturas inspecionadas serão registrados no PR, sem promover execução pendente a aprovação.

Docker/WSL não estão instalados neste host. PostgreSQL/Supabase reais são os ambientes descartáveis de GitHub Actions, CLI 2.114.0 homologada, sem atualização de dependências. O conector Supabase retorna zero projetos; histórico compartilhado não verificado. Nenhuma migration, escrita em Production, merge ou deploy foi executado por esta rodada.

## Sequência de publicação a preparar, sem executar

1. Consultar, somente por leitura, histórico de migrations e artefato ativo de cada ambiente compartilhado; conferir divergências, banco/alvo, backup e restauração. Não inferir aplicação por contagem versionada.
2. Conferir CI obrigatória no candidato exato, parecer visual das capturas e limitações de Preview. Aprovação de interface exige evidência fora do código, conforme gate vigente.
3. Aplicar, após autorização específica e plano revisado, as migrations pendentes em ordem: `20260929213000_expense_bonification_independence` e `20260930003000_expense_verification_field_ownership`. Preservar arquivos já aplicados; a segunda é corretiva e não exige backfill.
4. Banco novo com frontend antigo mantém os nomes/assinaturas e ignora tentativa incidental de alterar NF manual/bonus pelos helpers de despesa. Frontend novo com banco antigo não atende primeira criação nem a proteção completa da consolidação; não o publicar antes do SQL necessário. A semântica idempotente continua vinculada ao payload exato: concluir intenções pendentes das sessões antigas e recarregar a aplicação após publicar; nunca reutilizar chave com payload reconstruído diferente.
5. Só então publicar o frontend candidato, verificando SHA do manifesto e ambiente efetivo. Fazer leitura observacional dos registros de controle e, apenas com autorização específica, ciclo sintético segregado para conferir contexto/retorno/reload.
6. Rollback de código pode voltar ao frontend anterior mantendo o banco corretivo, que protege decisões manuais. Rollback de banco não é automático: se houver incidente, interromper novas escritas, coletar versões/IDs/logs, restaurar código compatível e planejar migration corretiva revisada. Não apagar linhas estruturais que tenham despesas vinculadas, não reparar histórico manualmente e não limpar resultado consolidado para recuperar UI.

## Frentes separadas e próximo passo

`PROD-UX-08` continua com seu [registro de retomada](2026-09-28-prod-ux-08-drawer-clipping.md); o #397 não homologa nem corrige o drawer inteiro. #394 e os planos A–D do #395 não foram incorporados. Não confundir esses planos com Fases A+B+C históricas ou Fase D adiada.

Antes de qualquer frente ampla futura de layout/design, ler obrigatoriamente [DESIGN_TOOLING.md](../evidence/2026-09-27-pr378-tooling/DESIGN_TOOLING.md), revalidando versões, compatibilidade e custo/benefício. Preservar a metodologia: arquitetura/ferramental visual + aceitação humana outside-in. Quando houver decisão de abrir a frente visual, criar/apontar seu único handoff corrente e preservar este como histórico.

Retomar pelo estado vivo do PR e pela primeira falha causal restante; não executar merge/SQL remoto/Production usando autorização histórica.
