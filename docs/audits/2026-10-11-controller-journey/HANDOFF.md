# Handoff — auditoria imersiva do Controlador

## Missão e ponto de partida

**Checkpoint superveniente — 11/10, 19:40 UTC:** salvar este estado antes de
qualquer validação longa. Contato interno recebeu proteção contra submit
concorrente reutilizando `critical-action-guard`: RED com duas RPCs/dois contatos
para um duplo clique; GREEN com uma RPC/um contato, segundo contato legítimo e
reload. Foram aprovados 18 unitários focados, oito E2E de Pendências e uma jornada
Auth real (38,6 s). Isso não garante idempotência de retry após commit remoto com
resposta perdida. Evidência: `evidence/contact-submit-guard.json`.

O mesmo corte do footer foi reproduzido em novo envio e cobrança; a correção
`bottom:0` ficou restrita aos três corpos sem padding, na folha vigente. **17/17**
E2E de identidade/rodapé passaram, com inspeção visual. A reanálise autenticada em
1280×720 persistiu o resultado incorreto e preservou NF/Pendência/tentativa após
reload. Evidência: `evidence/corrective-footer-scope.json`.

Bonificação/retificação tardia, edição/exclusão de consumo após retificação,
exportação institucional XLSX e recuperação após perda real de Realtime foram
executadas em sessões legítimas do descartável. A reconexão produziu uma leitura
global HTTP 200 de 49.605 bytes, sem F5; Dashboard convergiu de uma para duas escolas
com Pendências. A exportação da Assistente tem quatro planilhas e 41.021 bytes;
ExcelJS conferiu competência, dados e metadados. Resumos sanitizados estão em
`evidence/`; não são observação de Production nem inspeção do Excel nativo.

**Bloqueio novo confirmado:** exclusão ordinária de `AUD-PERM-01` apagou a NF e o
bem Inventariada no descartável, HTTP 200. O `audit_events.old_record` comprova
estado terminal no DELETE, sem downgrade. Falha herdada da main, não causada por
este PR. Trigger terminal cobre apenas UPDATE; serviço/planner/RPC não negam essa
exclusão. Evidência durável: `evidence/terminal-inventory-delete-red.json`.
Proteções local serializada e backend estão em investigação; ainda não aplicadas.
Não recriar os registros perdidos para mascarar o RED. Production permaneceu intacta.

CI do HEAD publicado `6139fe79`: **18/19 workflows verdes**, incluindo readiness,
Supabase real, ciclos, uso sustentado e pré-production. E2E desktop ficou vermelho:
212 aprovados, 65 pulados, um timeout no caso legado
`unidentified-expense-user-journey.spec.js:27`. O mesmo teste original passou
isoladamente na main (12,60 s) e candidato (12,72 s), sem alterar deadline ou
asserções. A causa exata do timeout CI não foi reproduzida; acesso ao trace remoto
falhou por proxy. Preservar esse vermelho e repetir CI proporcionalmente; não
aumentar timer para fabricar GREEN. Evidências `ci-6139.json` e
`legacy-ci-duration-review.json`. Os parágrafos seguintes são checkpoints históricos.

**Checkpoint corrente de continuação:** UI cloud autenticada autorizada. PR #438
Draft; main/Production intactas. Duas correções candidatas e seus REDs estão no
worktree: identidade documental e readiness após login tardio. Ciclo real tardio
criou NF/Pendência, registrou contato, cancelou e reabriu sem reload: GREEN (1 min).
Suíte unitária completa: **1.333 aprovados, zero falhas/skips**. Não confundir
esse checkpoint com certificação integral A–N ou com observação autenticada de
Production. Ler primeiro [CAUSAL_FINDINGS.md](CAUSAL_FINDINGS.md) e
[JOURNEYS.md](JOURNEYS.md); os blocos antigos abaixo preservam a sequência da
investigação e contêm afirmações temporais já superadas.

Checkpoint seguinte: rodapé da reanálise corrigido após RED de hit-test em
1280×720 e comparação baseline/candidato; **12/12** contratos de identidade/rodapé
passaram. A inspeção autenticada desse CSS ainda está pendente. A CI do
`a5961944` passou a jornada tardia, mas a importação posterior tentou excluir sua
NF com histórico protegido e foi corretamente rejeitada. A jornada foi movida,
sem alterar asserções, para `supabase-late-auth-actions.spec.js`, executada como
último passo dedicado depois de import/rollback em três gates. Não apagar
histórico nem mudar a regra de importação para fabricar GREEN. Diagnóstico em
`evidence/auth-test-isolation.json`; a nova CI limpa ainda precisa confirmar.

Outro vermelho de `a5961944`, run `38165984970`: o caso Conectada persistiu,
recarregou e passou os contratos funcionais; falhou ao exigir painel inteiro
no viewport (ratio 0,94886893). O retry serial encontrou os dados legítimos já
gravados e falhou na expectativa inicial vazia. Investigar a captura original
antes de modificar produto ou teste. Não considerar esse retry causa-raiz.

Pendências atuais: inspeção Auth de modais em 1280×720, repetição dos dois E2E
legados que excederam 30s sob carga, bonificação/consolidação/retificação tardia,
reconexão e exportação institucional. Não aumentar deadlines dos testes legados
nem declarar falso positivo corrigido sem prova. O teste Auth novo usa 90s porque
inclui Auth e cinco commits reais, além das interações; seu RED original terminou
na ausência de contato, antes de acrescentar esse ciclo completo.

Etapa 5 autorizada em 11/10/2026: explorar jornadas A–N pela UI real, observar
fora para dentro, conferir persistência/reload/projeções e corrigir achados
fundamentados. Testes históricos verdes não encerram a missão.

Main: `113841bda52ce3bbda228524daf9a7464f12b462`, pós-#437.
Branch/worktree e capacidades: [ENVIRONMENT.md](ENVIRONMENT.md).
O trabalho anterior `7ca3d736` permanece na branch
`audit/operational-readiness-2026-10-07`; não foi descartado nem incorporado cegamente.

## Regras de execução

- Ler a ordem de AGENTS.md. Documentos funcionais/metodológicos estáveis conferidos
  sem alterações desde `a5a67d34`; CURRENT_STAGE/STATUS e reconciliação foram relidos.
- PRs contextualizados: #397, #403, #404; #406, #408, #410, #427, #429;
  #415, #426, #431, #433–#437. Conferir diffs/discussões materiais antes das jornadas.
- Respeitar independência fiscal/bonificação, identidade da NF, histórico individual,
  patrimônio terminal, autoridade de rota/competência, RLS e recuperação global.
- Usuário autoriza ciclos sintéticos reversíveis em Production **autenticada**.
  Não criar usuário/resetar senha de Production nem acessar a UI com service role.
  Após a pausa para navegador pessoal, o usuário autorizou expressamente continuar
  **neste ambiente cloud**; executar a UI autenticada do descartável e distinguir
  seus resultados de observação de Production.
- Histórico imutável, Pendências e patrimônio terminal: somente descartável.
- Capturas/trace/vídeo devem ser abertos e examinados, não apenas produzidos.
- Analisar impactos transversais; duas tentativas sem convergência exigem reavaliar.
- Nenhum problema foi corrigido ou encerrado neste checkpoint de preparação.

## Estado executado

1. Anexos da missão e diretriz sistêmica lidos; branch nova criada da main atual.
2. Dependências do lockfile instaladas sem upgrade; Chromium correspondente instalado.
3. Xvfb auxiliar e Chromium headed/CDP/ARIA provados com página de diagnóstico.
4. MCP registrado e servidor/cliente JSON-RPC provados; login Production e Dashboard local capturados e examinados. Chrome pessoal não conectado à máquina cloud.
5. GitHub/Vercel/Supabase SQL e smoke público revalidados sem escrita.
6. Startup Supabase descartável e incidentes de infraestrutura registrados em ENVIRONMENT.md; configuração copiada para
   `/workspace/scratch/controller-supabase`, project_id próprio; nenhum projeto
   remoto alterado. Excluídos somente serviços auxiliares não necessários à jornada.

## Próximas ações da preparação original — superadas pela correção abaixo

1. Conferir `/workspace/scratch/controller-supabase-start.log`, redigindo tokens
   antes de imprimir; não versionar status env/credenciais locais.
2. MCP isolado já provado. Servidor localhost:8931, display :99; não reinstalar. Cliente auxiliar `/workspace/scratch/controller-mcp.mjs`.
3. Preparar identidades locais pelo bootstrap já existente e build Preview contra
   localhost; serviços/Admin são preparação, todas as ações de jornada pela UI.
4. Começar por A (orientação) com screenshot examinado antes de DOM/código; depois
   B–H, I–M e exploração N, incluindo sessões concorrentes e arquivos exportados.
5. Registrar tarefa/caminho/interação/resposta/tempo/persistência/experiência/achado
   em JOURNEYS.md. Nenhuma jornada autenticada está executada neste checkpoint.
6. Para cada falha atual: reprodução, autoridade/impacto, RED proporcional, correção,
   jornada repetida, revisão crítica e CI; não implementar hipóteses antigas.

Preservar commits/push por avanço material. Dados brutos ficam fora do Git;
versionar síntese, índices, hashes e capturas representativas sem credenciais.

## Atualização de preparação

O usuário escolheu conectar Chrome pessoal; foi orientado a usar extensão oficial
Playwright MCP + servidor `playwright-session` no Codex Desktop **na mesma máquina**
e entrar no RADAR diretamente. A sessão cloud não passou a controlar esse Chrome.
Não solicitar senha/token. Essa orientação foi seguida por pausa e, depois, pela
autorização de continuidade no cloud descrita no último bloco deste documento.

Ferramentas auxiliares estão em `/workspace/scratch/controller-tools`.
O servidor local de orientação usa 4175 em modo local, sem Auth; a árvore isolada
real da auditoria `.radar-snapshot/controller-ui` será servida em 4176 com configuração
Supabase localhost. Não alterar o config.runtime.js versionado para essa preparação.

## Direção vigente após intervenção do usuário — 11/10

**Direção histórica, superada pela autorização cloud no bloco seguinte.** O usuário
apontou o desvio: a missão não é substituir o operador real por uma auditoria cloud
com fixtures. As jornadas locais foram pausadas e não serão utilizadas como prova
de Production. Não retomar a lista local A–N como se fosse o pedido corrente.

Preparação concluída e observações limitadas: [LOCAL_PREPARATION.md](LOCAL_PREPARATION.md).
Nenhum defeito do produto foi confirmado ou corrigido; não houve escrita de Production.
PR de continuidade: [#438](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/438), Draft.

### Retomada pelo Codex Desktop local

1. Abrir o repositório em ambiente **local** do Codex Desktop; obter a branch
   `audit/controller-journey-2026-10-11` sem descartar mudanças locais. Usar worktree
   separada quando necessário. A sessão atual /workspace é cloud.
2. A extensão foi **confirmada instalada pelo usuário**. Link oficial:
   https://chromewebstore.google.com/detail/playwright-extension/mmlmfjhmonkocbjadbfplnigmagldckm
3. A branch contém `.codex/config.toml`, equivalente a `.mcp.json`, para clientes
   Codex que carreguem configuração de projetos confiáveis. Se não carregarem:
   `codex mcp add playwright-session -- npx -y @playwright/mcp@0.0.82 --extension`
   e conferir `codex mcp list`. Reabrir a sessão se necessário para as ferramentas
   aparecerem no turno. Não presumir ativação por arquivo ou por registro CLI.
4. O responsável entra em https://radarpdde-fix.vercel.app diretamente no Chrome.
   Na primeira chamada MCP, aprova a conexão e seleciona essa aba. Nunca enviar
   senha, cookies, storageState, JWT ou token da extensão pelo chat/Git.
5. Provar conexão com snapshot + screenshot **examinado** da tela autenticada,
   identificando perfil, rota, competência e SHA. Não usar tela de login como prova.
6. Iniciar A e prosseguir pelas jornadas reais autorizadas. Reversíveis sintéticas
   em Production exigem estado anterior e cleanup; irreversíveis no descartável.

Não expor CDP/browser pessoal à Internet para contornar a separação cloud/Desktop.
Instalação foi confirmada; seleção de aba/conexão ainda não. O estado ambient de
uma aba aberta não equivale a conexão MCP estabelecida.

## Direção vigente — continuidade cloud autorizada

Após confirmar a extensão, o usuário instruiu: **“pode continuar neste ambiente
mesmo”**. Portanto a pausa principal foi levantada para jornadas na interface
autenticada local preparada. Não esperar migração ao Desktop para prosseguir,
nem chamar os resultados sintéticos de homologação da sessão pessoal/Production.

Recurso integrado encontrado: habilidade Browser do executor. Foi lida antes de
qualquer nova automação; exige ferramenta de execução específica que não consta
do catálogo após duas buscas. Flags de navegador já ativas, socket de gerenciamento
ausente; não há conexão integrada provada. A preparação Playwright MCP isolada
continua disponível como instrumento auxiliar para a UI cloud.

Configuração portátil adicionada: `.codex/config.toml`, mesmos comandos/argumentos
fixados de `.mcp.json`, sem credenciais, hooks ou alterações de políticas. TOML e
equivalência verificados. `codex mcp get` confirma o registro global; não comprova
carregamento do arquivo no Desktop pessoal ou ferramentas no turno aberto.

Próximo passo: retomar A–N pela UI do Controlador local, registrar capturas
examinadas, rede e persistência; corrigir somente defeitos atuais reproduzidos.
Manter checkpoints remotos por avanço material e preservar a massa/resíduos locais
documentados em LOCAL_PREPARATION.md até conferência/cleanup.

Checkpoint de jornadas: [JOURNEYS.md](JOURNEYS.md). Consumo/novo envio/reanálise,
Inventário terminal em segunda sessão, Assessoria e contexto histórico, boleto e
duplo clique de despesa provisória conferidos. A–N ainda parciais. Nenhuma alteração
funcional realizada. Próximas ações: identificação mantendo IDs, ação terminal
protegida, contexto/navegação/agregados/concorrência e clareza dos modais fiscais.
MCP auxiliar apresentou limite de continuidade de modal; usar Playwright nativo do
lockfile no cloud para prosseguir, sem alterar runtime/Auth/RLS. A habilidade do
navegador integrado foi lida, mas sua ferramenta continua indisponível no catálogo.

Achados prioritários: [CAUSAL_FINDINGS.md](CAUSAL_FINDINGS.md). RED real de login
tardio: ações de Pendência/retificação não se instalam após expirar 10s pré-auth.
RED de identidade documental: seis cenários de apresentação. Não confundir RED
com implementação concluída. Revisão independente da instalação em andamento.
