# Atualizações de tooling — encerramento da rodada de 21/10/2026

**Classe:** evidência datada e continuidade; não substitui regras canônicas.
**Main revalidada:** `d1f1dad60778c1b8f67bb660e8ad06736b9ab219`.
**Resultado:** três candidatos prontos para revisão; um patch em Draft por gate
geométrico pendente. Nenhum merge/deploy ou alteração de Production nesta rodada.

Este registro está em branch documental separada para preservar os SHAs exatos
homologados sem repetir toda a CI por um checkpoint. Os documentos dos candidatos
que dizem "aguardar CI" registram a etapa local anterior; os resultados finais
abaixo e as descrições atuais dos PRs registram sua conclusão. Não interpretar
esses checkpoints anteriores como falha ou validação ainda pendente.

## Candidatos

| PR | HEAD | Escopo | Estado final conferido |
|---|---|---|---|
| [#462](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/462) | `b00333d3a3f0ab7622eb1e547047531e52f148c6` | Prettier 3.9.9 → 3.9.10; uma expectativa literal reconciliada | Pronto para revisão; 19/19 workflows aprovados |
| [#444](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/444) | `08b2fd4732369a8201574d18a8c3d94827f5be99` | Actions existentes e dois contratos de SHA | Pronto para revisão; 29/29 workflows aprovados |
| [#457](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/457) | `3c33578fb55c1c0e6c08ceaa00728931d2596983` | SDK 2.118.0 em pacote, bundle e import Edge | Pronto para revisão; 20/20 workflows aprovados, com repetições delimitadas registradas abaixo |
| [#461](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/461) | `f5fbfd0c83f860352bbb3072ff2b99e8efb9284e` | Playwright 1.64.0 → 1.64.1, sem atualizar Axe | Draft; 18/19 workflows sem falha, E2E desktop reproduziu a asserção geométrica da #460 |

Checks condicionais ignorados não representam testes executados. Não alegar
smoke autenticado de Production ou Preview interativo READY nesta rodada.

## Prettier

Instalação limpa e 13 contratos de tooling aprovados. Saídas formatadas 3.9.9 ×
3.9.10 idênticas em quatro arquivos atuais: Markdown, JS de aplicação, YAML de
workflow e teste. Nenhuma formatação global. CI:
[desktop 39535123225](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39535123225),
[pré-production 39535123334](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39535123334),
[uso real 39535123212](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39535123212).
O #442 é duplicado desta versão sem o contrato reconciliado; não integrar ambos.

## Actions

Versões/SHAs conferidos nas referências oficiais: setup-node 7.1.0
`949feb2413d6458794dcd2491c4babbbce0c15c1`; upload-artifact 7.0.2
`cf430e030ddbb5b0abf93d22962f4752f3646cd9`; download-artifact 8.0.2
`9000827ccba6bdab643e8b6fd33ac0654aef8333`; CodeQL 4.39.0
`6f2ac81f5cd81fe351a197ba0b00d91d03cd2aee`.

37 workflows comparados: nenhuma mudança de execução além dos SHAs/comentários.
Inputs, permissões, secrets, retenção, condições, runner e escopo GHCR preservados.
RED dirigido 10/12, duas exigências de SHA anterior; GREEN 12/12 depois de trocar
somente os dois literais. Unitários locais completos: 1.368/1.368. Verificador:
39 workflows, 351 referências locais válidas. Evidência inicial na própria branch
do #444: `docs/evidence/2026-10-21-tooling-refresh.md`.

[Uso real 39541782046](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39541782046):
baseline e candidato completos, seis sessões, 400 rodadas, 1.107 gestos/escritas
confirmadas cada; comparador original aberto. Artifact `12319873733`, SHA-256
`943f0cb9ccdc6aae8bc764bb10e5960fa0206d2c47f19c9b22c461858bf693b4`.
Confirmado transporte efetivo entre versões novas de upload/download.

Proveniência: merge sintético `d40a8f592b2e613e55aff758378e9f215f94d184`, pais
main/HEAD acima; árvore `b0bb8524426b21786f771166a0a1528edabd94f6`, idêntica ao HEAD.
29/29 workflows aprovados na primeira execução deste HEAD.

## SDK Supabase

Somente seis nós @supabase/* mudam no lock; mesmo conjunto de pacotes. Import da
Edge muda de versão, sem mudar sua lógica. Guards permanecem estritos e o builder
canônico gera o bundle. CLI, demais pacotes, migrations, Auth/RLS e domínio intactos.
Na inspeção das fontes instaladas, Auth, Realtime e Functions alteram somente
versão; diferenças de comportamento concentram-se em Storage, com tipos alterados
em Supabase/PostgREST. Isso não substitui os testes de fronteira.

RED inicial 18/21 (dois literais antigos e divergência do import Edge). Depois de
alinhar contratos/import, o bundle antigo ainda reprovou. GREEN 21/21 somente
após regenerar. Unitários locais e JUnit original da CI: **1.368 aprovados, zero
falhas/ignorados**. Integração 8/8; falhas de rede 4/4, subconjunto dos unitários.
SDK real preserva duas tentativas GET em 503 seguido de sucesso, uma tentativa
POST em 503. Sintaxe, tipos, artefatos e audit de runtime aprovados.

Bundle: 265.225 → 265.570 bytes (+345), duas gerações idênticas, SHA-256
`33b09b0db467df88254207a45a76fa6ab293ab1539f76c63683a78d75a7a86eb`.
O diff-check integral aponta whitespace em literal Base64 na linha 13; consulta
binária confirma o mesmo literal espaço/tab/newline na main. Não editar o gerado
nem relaxar gates para ocultar essa propriedade. Demais arquivos passam.

### Intermitências, sem mudanças de código entre tentativas

| Run | Primeira tentativa preservada | Única repetição isolada |
|---|---|---|
| [39542458103 — perfis](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39542458103) | 13 aprovados e timeout no helper de prontidão/login de reanálise; retry interno também expirou | 14 Auth/RLS + 15 perfis/viewports + 4 login tardio aprovados |
| [39542458116 — ciclos](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39542458116) | 17 aprovados, um flaky, uma falha, dois não executados; viewport do painel CONECTADA ratio 0.9488689303398132, caso #460 | 21/21 aprovados |
| [39542458082 — uso real](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39542458082) | Baseline falhou na preparação com opacity 0, antes das 400 rodadas; comparação inicial inválida. Candidato passou | Somente baseline/dependentes repetidos; candidato aprovado reutilizado. Comparação completa, seis sessões, 400 rodadas e 1.107 gestos/escritas por variante |

Nenhuma terceira tentativa. Nenhuma mudança de CSS, timeout, fixture, asserção,
RLS ou mecanismo de sincronização para satisfazer os testes. A passagem posterior
não resolve a causa das intermitências. O starter existente recuperou um bind
transitório de porta na segunda execução de perfis antes dos testes; não confundir
essa mensagem de infraestrutura com uma falha Auth/RLS.

JUnit original da [validação 39542457971](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39542457971):
artifact `12319624224`, ZIP SHA-256
`ec907141a481e2775a74e15cca9356784b3ebf8123cff342e96ef8ad93f46852`.
Comparador original aberto: status `diagnostic-comparison-complete`, tentativa 2,
artifact `12321112039`, SHA-256
`c9168ea3295f7f34c7f2fd6d86e977da60544c30a233693f42d0529ede7cfad3`.
Merge sintético `5ea1659810b08fb56dcd4f0578aec106e4469ab1`, árvore
`ef1fea8ef9c9d75dbd9b5f6e5356d85b064051a0`, idêntica ao HEAD do SDK.

20/20 workflows finais aprovados; 38 jobs/checks aprovados, dois condicionais
ignorados. [Readiness 39542457988](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39542457988)
e [pré-production 39542458111](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39542458111)
aprovados. Evidência local na branch do #457:
`docs/evidence/2026-10-21-supabase-sdk-update.md`.

## Limites e continuidade

- Comparadores usam #408 como referência histórica, não a main imediatamente
  anterior. Actions reportou dez advertências diagnósticas e SDK seis. Não atribuir
  os deltas às atualizações, nem alegar ganho de fluidez ou encerramento de performance.
- #461: [desktop 39534955769](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39534955769)
  teve 224 aprovados, 68 ignorados e falha geométrica ≈1,771 px em
  `unidentified-expense-user-journey.spec.js:218`. Pré-production separado passou;
  isso não apaga a falha. Manter Draft até contraprova/classificação na #460, sem
  repetir indefinidamente nem alterar tolerância nesta frente.
- CLI 2.114.0 preservada; resolver a paridade grants/bootstrap/pgTAP separadamente.
  PostgreSQL hospedado, chaves de API e Preview isolado são manutenções próprias.
- MSW major, demais ferramentas de análise e MCP permanecem para ondas próprias;
  não foram incluídos silenciosamente nestes candidatos.
- Não houve merge/deploy. A mudança do SDK no Git não publica a Edge Function
  hospedada: coordenar e verificar sua versão no release, junto do frontend.
  Sem fixtures ou escrita de teste no banco institucional.
- Antes de integrar vários candidatos, revalidar main e resolver a sobreposição
  documental em CURRENT_STAGE preservando os resultados de cada SHA. Não presumir
  que a homologação isolada certifica qualquer combinação posterior não verificada.

Os checkouts antigos, inclusive o teste local não versionado da frente de
performance, foram preservados. Somente instalações node_modules criadas nesta
rodada foram removidas quando necessário para espaço. As quatro worktrees de
tooling encerraram sem alterações de fonte não commitadas.
