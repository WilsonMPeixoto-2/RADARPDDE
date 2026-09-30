# Continuidade após a publicação do PR #397

**Classe:** único handoff corrente, indicado por `docs/CURRENT_STAGE.md`.  
**Atualizado em:** 30/09/2026.  
**Objetivo:** permitir a troca de agente sem reconstruir a investigação, repetir a publicação ou expandir o escopo.

## 1. Entrega encerrada

O [PR #397](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/397) está integrado e publicado. Despesas e Notas Fiscais são operadas por perfis autorizados independentemente do estado da bonificação, conforme a [ADR-055](../decisions/ADR-055-independencia-despesas-bonificacao.md). `bonus_result` e os lançamentos manuais continuam pertencendo ao fluxo de bonificação.

| Registro | Valor confirmado na entrega |
|---|---|
| Candidato homologado | `0e149e148ecef708db3ab05faf9c1b5e43338fe6` |
| Merge funcional | `a5e200e5c3d7955cea0a6122bde1904469771ac3` |
| Árvore comum do candidato/merge | `3fd57652658361e697321de4537760632e0b70eb` |
| Supabase Production | Projeto `scnryinorqeucbfkioxo`; histórico 56 → 58 |
| Deployment Production | `dpl_suHN66eJ41tsHKPmS5SAs6N7iJnu`, `READY` |
| URL | [radarpdde-fix.vercel.app](https://radarpdde-fix.vercel.app) |
| Manifesto | [radar-build-manifest.json](https://radarpdde-fix.vercel.app/radar-build-manifest.json): merge acima, `production`, `supabase-production` |

A entrega seguiu: SQL em Production → conferência por leitura → merge com guarda do HEAD homologado → deployment Vercel → smoke autenticado. A integração Git da Vercel publica a `main`; o SQL foi aplicado antes do merge para evitar frontend novo com banco incompatível. A execução final foi feita pelo agente principal, conforme preferência expressa do usuário.

Os registros acima identificam a publicação comprovada, não um head eterno. Commits documentais posteriores podem avançar a `main` sem mudar a implementação funcional. Não criar novos commits apenas para registrar o SHA do próprio commit documental.

## 2. Contrato a preservar

O modelo canônico e a ADR-055 já contêm a regra; este handoff não cria outra autoridade de negócio.

- `InvoiceService`, o planner de efeitos e os fluxos derivados obedecem a perfil, escopo, contexto e regras da própria despesa, sem depender de bonificação preenchida ou aberta.
- A primeira despesa materializa a `verification` estrutural na mesma transação quando necessário; não inventa lançamento manual, resultado ou segunda ação administrativa.
- Os RPCs especializados omitem `bonus_result`. O SQL mescla somente análise fiscal/Assessoria/Inventário e projeções operacionais permitidas; preserva campos manuais e irmãos. Reanálise vinculada à NF respeita a mesma propriedade.
- `VerificationService` mantém lançamento, consolidação e retificação da bonificação. Idempotência, concorrência otimista, RLS, Pendência ativa, `a_identificar`, Boleto Internet e Inventariada continuam protegidos.
- A leitura contextual `read_operational_context` do #396 deve ser preservada. Não reintroduzir coleções globais crescentes no bootstrap.

Pontos de implementação: `app.js`, `src/application/invoice-service.js`, `src/domain/invoice-effects.js`, `src/application/pendency-service.js`, `src/data/supabase-repository.js` e as integrações listadas na ADR-055. Não reabrir a análise funcional do #397 sem um defeito concreto novo.

## 3. Mapa de testes e provas reutilizáveis

Resultados pertencem ao SHA e ao ambiente identificados. Não converter CI descartável em prova de escrita em Production, nem atribuir a um futuro SHA as execuções anteriores.

| Prova | Resultado | Onde consultar |
|---|---|---|
| CI final do candidato | 45 checks; 43 aprovados, dois skips condicionais de Preview, zero falhas ou pendências | [release.json](../evidence/2026-09-30-pr397-production-release/release.json), com nomes e links de cada check |
| Readiness local do candidato | 1.184 testes unitários + oito integrações; auditoria npm sem vulnerabilidades | Fechamento do [PR #397](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/397) |
| PostgreSQL limpo, pgTAP, Auth/RLS, desktop, visual, Excel e Lighthouse | Homologação aplicável aprovada; pgTAP 546 assertions/38 arquivos, desktop 184 aprovados/58 skips condicionais | [Homologação completa](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/36737810442) |
| Ciclos de despesa em Supabase descartável real | 20/20, sem skips; primeira despesa, CRUD, consolidação, `a_identificar`, reload e preservação manual/resultado | [Lifecycle](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/36737810199) |
| Perfis e viewports | Gate aprovado em desktop, Android e iPhone | [Perfis × viewports](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/36737810560) |
| Aplicação do SQL em Production | Exatamente duas migrations, em ordem; metadados preservados | [Run SQL](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/36775217508) e [sql-verification.json](../evidence/2026-09-30-pr397-production-release/sql-verification.json) |
| Backup/restauração independente | `restoreVerified: true`, 57 tabelas, origem somente leitura | [Run encerrado](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/36774647367) |

Regressões versionadas para reutilizar conforme a mudança:

- [expense-verification-ownership.test.js](../../tests/unit/expense-verification-ownership.test.js) e [first-expense-unit-of-work.test.js](../../tests/unit/first-expense-unit-of-work.test.js): propriedade de campos e primeira despesa na composição real.
- [expense-verification-ownership.test.sql](../../supabase/tests/database/expense-verification-ownership.test.sql), [expense-bonification-independence.test.sql](../../supabase/tests/database/expense-bonification-independence.test.sql) e [first-expense-authority.test.sql](../../supabase/tests/database/first-expense-authority.test.sql): SQL e capacidade efetiva.
- [test-first-expense-concurrency.mjs](../../scripts/test-first-expense-concurrency.mjs): duas sessões PostgreSQL coordenadas antes do INSERT estrutural.
- [supabase-expense-independence.spec.js](../../tests/e2e/supabase-expense-independence.spec.js) e [supabase-invoice-lifecycle-reliability.spec.js](../../tests/e2e/supabase-invoice-lifecycle-reliability.spec.js): UI/Auth/Supabase reais em ambiente descartável.
- [dependency-security-regressions.test.js](../../tests/unit/dependency-security-regressions.test.js) e [tooling-contract.test.js](../../tests/unit/tooling-contract.test.js): patches compatíveis de `brace-expansion`/`fast-uri` e contrato do Ajv. ExcelJS, Ajv e esbuild não foram trocados.

Docker/WSL não estavam disponíveis no notebook da entrega. Os testes com PostgreSQL/Supabase reais foram executados em GitHub Actions com a CLI homologada 2.114.0. Usar Node 24 e npm 11; não instalar uma CLI reprovada para contornar falha de ambiente. A continuação operacional reutilizou o candidato homologado e não repetiu os 45 gates. Uma futura alteração deve executar as verificações proporcionais ao seu diff e aos riscos novos.

## 4. Smoke em Production e seus limites

A interface autenticada no perfil Controlador foi recarregada no deployment do merge. Foram abertos e cancelados formulários de Nota Fiscal com bonificação vazia, Não e N/A, inclusive em contexto consolidado com controles manuais bloqueados. O formulário de despesa a identificar também abriu, e as ações permaneceram disponíveis após reload.

**Zero despesas foram gravadas nesta rodada.** Não houve criação/edição/exclusão seguida de releitura em Production porque não foi definido um contexto de teste. Se esse complemento for solicitado, primeiro identificar escola, competência, programa e registro sintético autorizado; não reutilizar ou excluir fixtures antigas por inferência. Os 20 ciclos descartáveis comprovam a implementação no candidato, com esse limite explícito quanto a Production.

As capturas reais ficaram no notebook em `pr397-delivery/recovered/screenshots/`, incluindo `production-nf-actions-without-bonus.jpg`, `production-first-nf-modal.jpg`, `production-unidentified-expense-modal.jpg`, `production-consolidated-nf-modal.jpg` e `production-na-consolidated-nf-modal.jpg`. Elas podem conter contexto operacional e não foram incluídas no repositório remoto. O [registro público](../evidence/2026-09-30-pr397-production-release/release.json) descreve a cobertura sem copiar os dados das escolas.

O smoke não homologa o drawer inteiro, seletores preexistentes ou o layout mobile de Production. As capturas e análises anteriores permanecem no [mapa causal do candidato](../evidence/2026-09-30-pr397-expense-independence/README.md), com seus próprios SHAs e ambientes.

## 5. SQL, recuperação e backup encerrado

As migrations abaixo já foram aplicadas, em ordem, e não devem ser reaplicadas ou editadas:

1. `20260929213000_expense_bonification_independence`;
2. `20260930003000_expense_verification_field_ownership`.

A execução exigiu dry-run com exatamente esses dois arquivos e conferiu seus hashes canônicos. Depois foram verificados histórico, corpos das três funções, assinaturas, owner, grants, `security definer` e `search_path`. A [evidência SQL](../evidence/2026-09-30-pr397-production-release/sql-verification.json) preserva os 58 registros do histórico e os hashes dos corpos canônicos.

O deployment anterior `dpl_2B2hpgGupfEcHouH9RpWeuHmmfnH`, correspondente a `a38eeef6c36e99be1777ce957d459bc40cdaca02`, foi identificado para recuperação do frontend. As definições e grants anteriores das três funções e um roteiro de reversão restrito às funções ficaram localmente preservados. Nenhum rollback foi executado. Em incidente, preferir código compatível com o SQL corretivo; não apagar linhas estruturais, limpar bonificação nem reparar histórico manualmente.

O usuário retirou expressamente o backup completo como condição desta alteração. O trabalho já iniciado foi preservado e terminou com restauração verificada, sem nova expansão de escopo. **Não há tarefa de backup pendente para o #397.** Para uma mudança restrita de funções, avaliar recuperação proporcional ao diff; não transformar novamente uma cópia de todo o banco em requisito automático.

A falha restante era do verificador: `search_path` diferente alterava a representação das definições, e posições internas de colunas removidas diferiam do dump restaurado. Os dados das 57 tabelas já coincidiam. A reprodução local dos dois fatores produziu exatamente o hash da restauração. A correção normalizou o contexto e a ordem lógica das colunas e aguardou o fechamento da transação de snapshot antes de desconectar a rede. Dois testes de processo cobrem fechamento retardado e saída com falha. [Diagnóstico e prova](../evidence/2026-09-30-pr397-production-release/backup-diagnosis.json).

Material operacional reutilizável já versionado, separado do código funcional:

- [Script de backup/restauração](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/7fbb7b9a784ed266f35f58e0806e8cd23939699d/ops/pr397-backup/backup-production.mjs), [testes de processo](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/7fbb7b9a784ed266f35f58e0806e8cd23939699d/ops/pr397-backup/backup-snapshot.test.mjs) e [workflow](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/7fbb7b9a784ed266f35f58e0806e8cd23939699d/.github/workflows/pr397-production-backup.yml): commit operacional `7fbb7b9...`.
- [Workflow restrito de migrations](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/f9dc1ca0baad4bc588bea45f1360124f794b2e22/.github/workflows/pr397-production-migrations.yml): execução encerrada, commit `f9dc1ca...`; não importar o disparo operacional para a `main` nem executar novamente como tarefa documental.
- Artefato cifrado do backup: `11125711896`, ZIP SHA256 `8dc2ec6d731c16e86054979217932bf90bc50ece2b82ce9c1bab365f1ed1e71c`. Foi baixado e autenticado localmente; a retenção remota prevista termina em 07/10/2026 e a cópia local foi preservada.

A chave privada e os dados descriptografados permanecem exclusivamente no notebook. Não versionar dumps, chaves, credenciais, URLs temporárias de download ou capturas com dados financeiros. O verificador compara conteúdo/schema/RLS/policies; owners e roles originais estão no arquivo de recuperação, mas a restauração descartável usa `no-owner` e roles locais existentes. Esse limite também está registrado no JSON da entrega.

## 6. Próxima rodada solicitada: somente Preview

A publicação do #397 encerrou a prioridade atual. A solicitação anterior de Preview permanece preservada para a próxima implementação; não foi executada nesta rodada documental:

- **NAV-01:** preservar escola em Pendências ao abrir/fechar detalhes, trocar abas e rerenderizar, usando `pageState.filters.schoolId` em vez de filtrar temporariamente a coleção global.
- **UX-04:** corrigir a largura útil do drawer de Pendência em mobile.
- Criar regressões antes/ao lado da correção; validar desktop 1440×900, Pixel 7 e iPhone 15 no Preview Vercel.
- Branch dedicada e PR sem merge; entregar Preview, capturas e achados para aprovação. Preservar integralmente regras de negócio, Supabase, RPCs e persistência; não promover Preview nem gravar em Production.

O `bb7246438b8c6b72ef068b21bb40d492a7049af2` citado na solicitação inicial é um checkpoint histórico anterior à publicação. Revalidar a base atual e preservar o #397; não iniciar uma nova correção removendo os avanços já integrados. Verificar também a configuração de Preview antes de testar: a integração Vercel desta publicação cancelava deployments de branches operacionais por `ignoreCommand`.

`PROD-UX-08` é o clipping/sobreposição do drawer em desktop, com [diagnóstico separado](2026-09-28-prod-ux-08-drawer-clipping.md); não presumir que sua causa coincide com a largura mobile de UX-04. #394, os planos amplos do #395 e a Fase D permanecem fora da rodada limitada. Antes de uma frente ampla de design, recuperar [DESIGN_TOOLING.md](../evidence/2026-09-27-pr378-tooling/DESIGN_TOOLING.md) conforme a rota canônica, revalidando ferramentas antes de adoção.

## 7. Retomada curta para o próximo agente

Ler a rota de `AGENTS.md`, o modelo canônico, o catálogo, `CURRENT_STAGE.md` e este handoff. Confirmar ao vivo somente os fatos baratos materialmente relevantes: estado do PR #397, head de `main`, manifesto/deployment e presença das duas migrations no alvo correto. Se continuarem coerentes, considerar a publicação encerrada e avançar para a frente solicitada pelo usuário.

Usar o mapa de testes e os JSONs acima para localizar provas; abrir históricos apenas para uma dúvida causal concreta. Não refazer a investigação da independência, os 45 gates, a restauração ou a sequência de publicação sem novo diff, falha ou incidente que justifique. As tarefas finais e ações em Production devem permanecer com o agente principal, conforme a preferência expressa nesta entrega.
