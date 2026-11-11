# Verificação e correção do PR #514 — painel de Pendências

Data: 11/11/2026 (UTC). Trabalho executado em Windows/Node 24, com Chromium Playwright 1.65.0.

## Resultado

O diagnóstico visual relatado pelo Gemini é procedente: reproduzimos painel transparente e textos das tentativas sobrepostos na aplicação real servida localmente. O CSS fornecido na conversa foi aplicado experimentalmente e não corrigiu esses defeitos. O PR original continha somente index.html, com meta description dentro de title. Esta entrega corrige o HTML e o CSS responsável pelo painel.

Base examinada: PR #514 em 4d6b2547099e19eb563d0fca0b78a2034270fa36; main remota consultada em 67fa03c07714923066ead6691dd87e2692209af3. Checkout isolado; arquivos preexistentes do usuário preservados.

## Causas e alterações

- O fundo do painel usava --bg-main, sem definição nas folhas examinadas. Substituído pelo token existente --bg-page; o fundo desktop fica inteiramente opaco.
- A folha responsiva reduz o painel para 420–520px, enquanto a composição interna mantinha duas colunas de seções e quatro colunas de contexto. Container queries ajustam a composição à largura real do painel, sem mudar a geometria geral da página.
- A regra desktop de tentativas e contatos usava display:flex em linha sobre cabeçalho, lista de dados, observação e link. Retomado fluxo em bloco; títulos podem quebrar linha, e textos longos têm quebra protegida.
- Corpo com rolagem interna e cabeçalho/rodapé sem compressão; ações em duas colunas no painel estreito.
- Título original restaurado e descrição movida para meta separado no head.
- Nenhuma alteração em domínio, banco, autenticação, RLS ou persistência.

## Experimentos e evidência

Artefatos completos em [artifacts/drawer-review](../../artifacts/drawer-review), incluindo imagens, vídeos das falhas e contextos dos testes. Todos os registros desta frente usam fixtures locais do projeto, sem escrita em Production.

| Diretório | Experimento | Resultado |
|---|---|---|
| before | Código original do PR, 1440 e 1280px | 2 falhas: fundo transparente; capturas mostram sobreposição |
| gemini | Código original mais o CSS literal da conversa | Mesmas 2 falhas; capturas mostram tentativa ainda sobreposta |
| after | Tentativa intermediária cujo script não executou por ausência do Python | Não é resultado da correção; código ainda original, 2 falhas |
| corrected | Primeira correção aplicada | 2 testes passaram; revisão visual identificou transparência residual de color-mix |
| verified | Fundo totalmente opaco e teste de interseção de textos | 11 passaram, 1 ignorado pela condição de projeto mobile |
| final | Correção final mais cenário cancelado/retificação em tema escuro e metadados | 12 passaram, 1 ignorado pela condição de projeto mobile |

O primeiro lançamento do Playwright falhou por ausência do binário Chromium compatível; o navegador foi instalado e os experimentos seguintes executaram normalmente. Nenhuma mudança no lockfile.

Comandos finais:

```powershell
npx playwright test tests/e2e/task-9-pendencias.spec.js tests/e2e/pendency-desktop-action-containment.spec.js --project=desktop-chromium --workers=2 --reporter=line --output=artifacts/drawer-review/final
npx stylelint src/styles/task-9-pendencias.css
npx eslint tests/e2e/task-9-pendencias.spec.js
node --test tests/unit/pendency-surface-polish.test.js tests/unit/pendency-drawer-responsive.test.js
git diff --check
```

Resultados: E2E 12 aprovados/1 ignorado; unitários 9 aprovados; Stylelint sem erro; ESLint sem erro e 7 avisos das condições skip preexistentes; diff sem erro. O teste mobile antigo é ignorado pelo projeto desktop; o teste novo exercita explicitamente viewport 390px no Chromium desktop, sem representar homologação em aparelho físico.

## Leitura visual

Capturas efetivamente abertas: antes em 1440px, CSS Gemini em 1440px, correção em 1440/1280/1920/390px e retificação cancelada em 1280x768 no tema escuro. O painel identifica documento, unidade e estado no topo. Na tentativa, rótulos, datas, status, observação e link ficam separados e legíveis. A retificação mostra alteração, responsável, data e justificativa. Os botões permanecem acessíveis no rodapé. A tabela atrás não aparece através do painel final.

## Limites e decisão sobre merge

A verificação foi local, com código real e fixtures existentes; não houve login nem homologação autenticada em Production. As capturas do usuário constam apenas como relato textual no turno recebido. Não foram utilizadas como se tivessem sido abertas aqui.

O CSS sugerido pelo Gemini foi testado para o defeito do painel. Não houve homologação independente de sincronização flutuante ou de espaçamento do cabeçalho, nem implantação desses ajustes. A tabela ainda apresenta quebras estreitas em algumas colunas; esta correção cobre o painel e os metadados, não uma revisão completa da tabela.

O PR original não estava pronto. A correção final foi validada localmente e deve ser avaliada com a CI do novo SHA antes de integração. Salvar a branch remota não equivale a merge, deploy ou aprovação dos checks. A ausência de falha nestes testes não homologa todas as jornadas do sistema.
