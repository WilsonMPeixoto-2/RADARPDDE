# F06 — NF: teclado, validação e zoom real de 200%

**Classe:** evidência datada de rodada delimitada; não cria regra funcional nova.  
**Baseline:** `e700fba83f1dd8030f9bfd36eb490e990369a799` (main após #489).  
**Estado da rodada:** correção e provas locais concluídas. Homologação, integração
e publicação devem ser verificadas no [PR #493](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/493).

## Fronteira e resultado

Prontuário de uma escola sintética → Adicionar Nota por Enter → formulário de
consumo vazio → Tab nos campos e ações → submissão inválida → correção dos
campos → Escape e retorno ao botão original. Um Controlador autenticado por
Supabase local, sem mock de Auth ou do formulário. Nenhuma NF válida foi enviada.

A rodada encontrou um defeito real: a 200%, o rodapé sticky cobria os controles
**Tipo de Gasto** e **Valor do Gasto** depois de Tab. Foco e dimensões existiam,
mas a área de interação estava sob `.modal-footer`. Imagem e hit-test concordaram.
O Axe não identificou essa sobreposição; a inspeção visual/teclado complementou-o.

A causa é a área de rolagem não reservar o espaço ocupado pelo rodapé sobreposto.
`scroll-padding-block-end: 6rem` no corpo **somente do modal de NF** orienta a
rolagem nativa de foco a manter os campos acima das ações. O espaço cobre o
rodapé de aproximadamente 71 px no recorte medido; não é debounce nem estado
novo. Mantém CTAs sticky, estrutura do formulário, persistência e regras fiscais.
Não estender a todos os modais por semelhança sem reproduzir necessidade.

| Prova | Antes | Candidato |
| --- | --- | --- |
| Zoom 100%; área CSS 1440×813 | 0 controles encobertos | 0 |
| Zoom 200%; área CSS 720×406 | Tipo e Valor encobertos pelo rodapé | 0 |
| Validação nativa vazia | Foco no campo obrigatório; mensagem presente | Preservada |
| Escape/retorno ao botão | Funcionando | Preservado |
| Axe, normal e inválido, em ambos os zooms | 0 violações confirmadas | 0 |
| Mensagens de erro JS no candidato | — | 0 |
| NF enviada/persistida pelo diagnóstico | 0 | 0 |

[Resumo estruturado com hashes](../evidence/2026-10-24-f06-invoice-accessibility/summary.json)
e imagens [antes](../evidence/2026-10-24-f06-invoice-accessibility/before-200-type.png)
/[depois](../evidence/2026-10-24-f06-invoice-accessibility/after-200-type.png).
O resumo preserva falha RED, versões, geometria, resultados, limites e hashes dos
JSONs brutos locais. Não versionar toda a sequência de capturas.

## Método e limites

- Playwright **1.64.1**, Axe **4.14.0**, SDK Supabase **2.118.0**, Chromium
  **156.0.8078.4**. Banco descartável **PostgreSQL 17.6**, 61 migrations;
  não confundir com Postgres hospedado 17.11 nem afirmar ganho de performance.
- Zoom real com extensão temporária isolada: `chrome.tabs.setZoom/getZoom(2)`;
  `innerWidth` 1440→720, DPR 1→2, `visualViewport.scale` continua 1. Não é CSS zoom,
  `deviceScaleFactor`, escala de screenshot ou pinch. Extensão/perfil removidos.
- Captura CDP sem recorte preserva o frame físico inteiro a 200%. A primeira
  captura Playwright usava a escala configurada antes do zoom e cortava a imagem;
  isso foi corrigido no instrumento, não no produto.
- O plugin Browser está listado, mas a ferramenta `js` necessária não foi
  disponibilizada nesta sessão. Usa-se Playwright local conforme autorização
  anterior para este ambiente; não representa Chrome pessoal conectado.
- Quatro scans Axe incluem WCAG 2/2.1/2.2 AA. Cada um preserva um **incomplete**
  `label-content-name-mismatch` no ícone ×, nome acessível **Fechar**. Revisão
  contextual: símbolo de fechar com nome que descreve a ação; não classificado
  automaticamente como violação, nem omitido dos dados.
- O navegador local mostrou mensagem nativa em inglês. Foram conferidos
  `valueMissing`, mensagem não vazia e foco; a captura isolada de popup transitório
  não certifica localização, leitor de tela ou todos os mecanismos assistivos.
- A nova regressão de CI usa áreas CSS 1440×813 e 720×406: é prova de reflow/foco,
  **não se apresenta como zoom real**. Percorre o botão real, os quatro campos,
  Cancelar/Salvar, validação e Escape. Hit-test no centro e meios das bordas evita
  confundir cantos arredondados com obstrução.

Duas expectativas preliminares do instrumento foram corrigidas após inspeção:
`not.toBeVisible()` não descreve overlays fechados por opacity/pointer-events;
usa-se opacity 0, aria-hidden, inert e foco devolvido. Pontos nos cantos arredondados
estavam fora da região de hit por desenho; a prova usa centro/meios das bordas.
Esses resultados não foram classificados como defeitos funcionais.
A consulta de conferência via REST service_role retornou 42501; a contagem foi
feita por SQL no próprio banco descartável, sem alterar grants/RLS.

## Reprodução e aceite

```sh
RADAR_F06_LOCAL_ACCESS_FILE=/caminho/privado/local-access.json \
RADAR_F06_DB_CONTAINER=supabase_db_<ambiente_descartavel> \
node scripts/audit/invoice-accessibility-states.mjs

npx playwright test tests/e2e/modal-accessibility.spec.js --project=desktop-chromium --workers=1
```

O arquivo privado contém `API_URL`, `ANON_KEY`, `SERVICE_ROLE_KEY`; nunca anexar,
logar ou versionar. O script recusa API não loopback, cria só sua escola/identidade
e compara contagens antes/depois. Usuários 7→7, perfis 6→6, escolas 5→5,
controladores 8→8 e NFs 23→23. Relatórios locais em `artifacts/tooling/`, ignorados.

Prova RED autenticada: duas obstruções a 200%, exit 1. Mesmo fluxo após a regra:
exit 0, zero obstruções em ambos os zooms; estado normal/inválido e foco aprovados.
Regressões locais do modal: **3 aprovadas**. Acessibilidade existente e contenção
de submit de NF: **9 aprovadas**. Stylelint do arquivo e ESLint do spec: aprovados.
Demais gates e SHAs finais devem ser
consultados no PR; não declarar CI concluído por esta evidência local.

**Saída desta rodada:** homologar a correção pequena e encerrar a NF nesta F06.
Não abrir novos formulários, salvamento, reanálise ou redesign nesta entrega.
Outros estados só retomam F06 diante de fluxo prioritário ou defeito concreto.
Cobertura horizontal continua 26/26; demais F mantêm condições próprias.
