# Auditoria independente — RADAR PDDE 2026

**Data:** 13/09/2026. **Classe:** relatório incremental de auditoria; não substitui decisões canônicas.  
**Alvo:** `WilsonMPeixoto-2/RADARPDDE`, branch `fix/supabase-query-architecture-2026-09-11`.  
**Código auditado:** `8409297194e7b65dcf080c0638af77c882d8e2e0`. **Comparação funcional:** merge do PR #299, `d2663f1ae7554516caf315f53b2509fbcd295e01`.

## Estado atual da auditoria

- Último bloco concluído: 0 — delimitação, fontes e evidência da certificação recebida.
- Descobertas: o candidato inclui o PR #299; as três falhas de integração eram do simulador sem `limit/gt`, já corrigidas; a certificação desktop ainda falha antes de uma jornada de retificação começar.
- Investigação seguinte: autenticação, bootstrap e readiness das extensões, confrontando o trace de falha.
- Pendentes: blocos 1–12; situação efetiva de Production não revalidada; nenhuma medição atual do banco; nenhuma prova de equivalência integral.
- Restrições: somente a branch isolada; nenhuma alteração de main, banco, migrations, secrets, configuração ou deployment de Production.

## Método e escala de evidência

Cada bloco registra arquivos/funções, conclusões, problemas, riscos, descartes e pendências antes do seguinte. Classificações: **confirmado**, **provável**, **hipótese**, **descartado**. Prioridades: crítica, alta, média, baixa. Medidas sintéticas não serão apresentadas como desempenho de Production; testes locais ou com fronteiras simuladas não certificam RLS/banco remoto.

A autoria desta auditoria é a assistência executada nesta conversa; o nome do arquivo segue a solicitação. Não se presume independência por troca de modelo: a independência é metodológica, por contraprovas e separação entre fatos e hipóteses.

## Bloco 0 — base e certificação

**Examinado:** `AGENTS.md`, modelo canônico, catálogo de superfícies, CURRENT_STAGE, método de engenharia, gate de frontend, validade documental, matriz funcional; manifests e workflows; `SupabaseRepository.load/loadAfterId/exportSnapshot`; teste de integração do bootstrap administrativo.

**Evidências:**

- Ancestralidade do merge #299 confirmada por `git merge-base --is-ancestor`.
- Base inicial `4c10fdd`: integração reproduzida com 1 aprovação e 3 falhas `MISSING_KEYSET_PAGINATION` em `appConfig`.
- `loadAfterId` recebe `this.pageSize`; o cliente simulado não tinha os métodos `limit` e `gt`. Correção registrada em `4fa29f3`; proteção do produto não modificada.
- Verificações locais: integração 8/8, unitários 984/984, sintaxe aprovada, arquitetura sem violações em 180 módulos/254 dependências; lint de segurança sem erros e 42 avisos existentes; lint E2E sem erros e 159 avisos.
- [Execução 34718744668](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/34718744668), código `8409297`: cinco testes desktop aprovados, um reprovado e 19 não executados pela parada na primeira falha. Não há certificação desktop integral.
- Falha: `tests/e2e/evaluation-retification-ui.spec.js`, linha 67, `await page.evaluate(() => window.RadarProductExtensionsReady)`; timeout de 30 s nas duas tentativas. O teste não chegou à retificação.
- [Artefato de screenshots/trace](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/34718744668/artifacts/10305153527), SHA-256 `8e9dc63b49942f0bc6d73444dc0bf9087ec643ee5f78ee8d10f69a8ff3c6e92e`.
- Execução anterior 34718133423 foi cancelada pela concorrência ao publicar parada na primeira falha; não representa aprovação.

**A-01 — Certificação desktop bloqueada na espera das extensões.** Impacto: não foi possível provar o fluxo de retificação. Causa ainda aberta; não atribuir o timeout à RPC, Supabase, regra de retificação ou autenticação sem trace. Situação: falha do teste confirmada; defeito de produto ainda indeterminado. Prioridade alta para certificação. Recomendação: localizar a promessa/dependência pendente e reproduzir com fronteira controlada. Cobertura: não corrigido.

**Hipótese descartada neste recorte:** ausência de tamanho da página no fluxo `exportSnapshot → load → loadAfterId` como causa das três falhas anteriores. O limite existe; faltava suporte no simulador.

**Contexto recebido, não remensurado:** cerca de 3.562 logs e 46 s de leitura pelo Controlador; rollback anterior não autorizado; migration #299 permaneceu aplicada. São informações do handoff, a confrontar com código e evidência remota disponível.
