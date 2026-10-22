# MSW 3 — validação e publicação, 21/10/2026

Classe: evidência datada de continuidade, não autoridade funcional nem handoff corrente.
Este arquivo suplementar fica em branch documental separada para registrar
resultados posteriores à certificação sem disparar novamente a CI de produto.

## Candidato e causa da adaptação

PR [#443](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/443), sobre
`main@c480e2445e1ddbdbe91369dfb7f1182a7d73a944`.
HEAD **`221209dab8af23f052672811201b6d05d62ebcae`**.
[Evidência técnica versionada](https://github.com/WilsonMPeixoto-2/RADARPDDE/blob/221209dab8af23f052672811201b6d05d62ebcae/docs/evidence/2026-10-21-msw3-network-harness.md)
contém fontes primárias, lock revisado, hashes e RED/GREEN.

MSW 2.15.0 → 3.0.3, exclusivamente usado na suíte Node de falhas de rede.
`onUnhandledRequest` passou a ser ignorado em favor de `onUnhandledFrame`.
Uma sonda com transporte HTTP loopback comprovadamente acessível protege a
rejeição de requisições sem handler, sem falso positivo por DNS.

- Baseline + sonda, commit `2e40db52`: **5/5**.
- MSW 3 com chave antiga: **4/5**, falha `Missing expected rejection`, enquanto
  os quatro testes originais permanecem verdes.
- Chave correta: **5/5**, sem mudar os quatro contratos originais.
- Sem scripts MSW novos habilitados; removida somente autorização obsoleta da
  versão anterior, que possuía postinstall. MSW 3 não possui esse script.
- Lock: 14 nós adicionados, cinco alterados, oito removidos, todos relacionados;
  fontes e dependências de runtime, CSS, workflows, banco e Auth/RLS intactos.

## Prova local e na CI

Instalação limpa, readiness local com **1.369 unitários e oito integrações** sem
falhas/ignorados, arquitetura 191 módulos/276 dependências, Knip sem achados,
lint, tipos, gerados e auditoria estrutural aprovados.
Audit runtime zero; seis registros high conhecidos em braces/Stylelint sob a
mesma política estrita, sem aceitar novos advisories ou relaxar regras.
Revisão independente do patch e dos logs: sem bloqueio concreto.

No [readiness 39706386990](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39706386990),
job `119587291810`, o log original confirma a sonda e os quatro cenários originais
aprovados em **Node 24.21.0**, junto de 1.369 unitários e oito integrações,
zero falhas/ignorados. Ciclos reais, run `39706386986`, job `119587291788`:
**21/21**, sem repetição, em 4,4 minutos.

## Referência sustentada incompleta — ocorrência original preservada

[Run 39706387025](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39706387025),
job inicial da baseline `119587291900`: startup e fixtures concluíram.
O spec entrou em `signIn`, mas `operational-sustained-sessions.spec.js:46/117`
recebeu `opacity=0` quando esperava 1, timeout 5 s. O teste durou aproximadamente
21 s e **não chegou à jornada de 400 rodadas**.

A referência é o runtime histórico fixo
`d9bf67f7d8a1ce2e468ec3c793ff992d8e10dfd6` (#408), não a main anterior a este PR.
A assinatura de preparação da referência já havia ocorrido na rodada #457;
isso não estabelece a causa-raiz nem prova defeito apenas no instrumento.
Não foi classificada como regressão do pacote, comparação válida ou falha das
asserções funcionais do candidato.

O candidato original, job `119587292248`, completou **400 rodadas**, 1 teste
aprovado em 6,6 minutos. O comparador original `119590265396` recusou corretamente
a amostra: `baseline: experiment is incomplete or failed (requires passed reload)`.

| Artefato original | ID | SHA-256 |
| --- | --- | --- |
| Métricas da referência incompleta | 12395402479 | `8420272f3ff1d1a4ae76edf36c4f5dfd0a2a2ed372a6812cfc7652f34bdf6612` |
| Evidência da referência incompleta | 12395297692 | `bfc11393d96b15c833bf2639c7a337184cef28b712522ece6247921d3f1e15bc` |
| Métricas do candidato aprovado | 12395124341 | `289a51baa1804c0d023149272e0a93dcda385598a9d1eb74705b2822d73f2eaa` |

Depois de registrar a ocorrência no PR, foi solicitada **uma única repetição
nativa do job da baseline**, no mesmo HEAD. Novo job `119590885753`.
O resultado do candidato foi mantido; nenhuma mudança de produto, fixture,
asserção, CSS, tolerância ou timeout. O comparador dependente deverá confirmar
que ambas as amostras completaram a jornada antes de aceitar os dados.

**Estado deste checkpoint:** 18/19 workflows aprovados, repetição da referência
ainda em execução, PR Draft, sem merge ou deploy desta atualização. Se a
referência falhar novamente, preservar o bloqueio sem terceiro rerun cego.
Qualquer resultado superveniente deve ser acrescentado com seu SHA/run real.

## Limites preservados

Não se atribui ganho de fluidez, CPU, rede ou SQL ao MSW, que não compõe o runtime
do produto. A referência histórica não isola o efeito de um pacote. Avisos
diagnósticos do comparador não são um budget de aceitação.
CLI Supabase 2.114.0/paridade de grants, tipos Node 26, #446/#447, #460 e
indicadores mensais permanecem separados. Não houve alteração ou escrita
institucional em Production nesta avaliação.
