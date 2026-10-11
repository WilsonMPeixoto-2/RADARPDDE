# Achados causais — 11/10/2026

Ambiente descartável autenticado, runtime baseline `113841bd`; as correções abaixo
foram verificadas no candidato local posterior, ainda em revisão. Não são relatos
de usuário nem telemetria de Production. PR #438 permanece Draft.

## Instalação expira antes da autenticação humana

Observação fora para dentro: na página de Pendências do Controlador, linha e
drawer oferecem envio/prontuário, mas não contato/cancelamento/reabertura.
O perfil efetivo é `controller` e possui a capacidade correspondente.

Contraprova: scripts Task 10/11 e 12/13 foram carregados (~375 ms), todos os
pré-requisitos estavam disponíveis após login, mas os dois módulos não instalados.
Eles dependem de `RadarApplicationServices` e encerram polling após 10 segundos.
Os serviços só são criados após Auth/bootstrap. O evento canônico
`radar:application-services-ready` já existe; o bootstrap crítico atual não instala
esses módulos. `RadarProductExtensionsReady` não certifica sua disponibilidade.

RED real: `supabase-auth-local.spec.js`, cenário “login tardio”, com relógio do
navegador avançado 11 segundos na tela de login, Auth/RLS/RPC reais e nenhuma
recarga posterior. Criar NF/Pendência pela UI e abrir detalhes termina na ausência
de Registrar contato. Log privado `controller-auth-delayed-red.log`; não é falha
de startup ou seletor presumido. Retificação compartilha a dependência/expiração.
Correção: instalação pelos eventos existentes de serviços/competência/DOM e pelo
evento `radar:pendency-page-ready`, emitido somente depois de Task 9 publicar suas
APIs. Os três instaladores alterados deixam de expirar enquanto a pessoa permanece
na tela de login. A instalação é idempotente; os listeners são removidos depois
de instalar. Não foram alterados Auth, RLS, capabilities ou os comandos de negócio.

GREEN real: **1/1 em 1,0 minuto**, `controller-auth-delayed-green-full-cycle.log`.
Após os mesmos 11 segundos de login tardio, sem reload, o Controlador cria uma NF,
abre Pendência, registra contato, cancela e reabre pela UI. O drawer confirma o
contato e as transições Cancelada → Aberta. Auth/RLS/RPC são reais no descartável;
isso certifica o ciclo dirigido, não todos os perfis ou jornadas.

Revisão independente do diff verificou a ordem do evento Task 9, idempotência,
remoção dos listeners e uso dos serviços/capabilities vigentes pelos wrappers.
Nenhum bloqueio foi identificado nessa revisão. O polling de Task 9 já existente
permanece: não afirmar que todo polling foi removido. Execução duplicada integral
dos scripts não recebeu nova certificação neste checkpoint.

## Identidade omitida em ações corretivas individuais

Drawer identifica a NF, mas novo envio mostra apenas Notas Fiscais. Reanálise
destaca descrição/tipo/valor, omitindo o número. Com duas despesas de mesma descrição
e valor, o operador não consegue distingui-las pelo contexto do modal.

RED de apresentação, fixtures locais + UI real: seis casos falharam na baseline
em `corrective-document-identity.spec.js` (número no envio, número na reanálise
fiscal e de Assessoria, snapshot sem NF carregada, indicação de legado, referência
de boleto). A primeira tentativa usou título antigo de modal; foi corrigida antes
da execução causal. Log causal: `controller-identity-red-causal.log`.
Correção: novo envio e reanálise reutilizam `pendencyDrawerDocumentMeta`, com NF
atual ou snapshot vinculado à própria Pendência. A dimensão Notas Fiscais/Consulta
Assessoria permanece explícita; reanálise conserva descrição, tipo e valor. O
documento agregado legado continua identificado como legado, sem escolher uma NF
arbitrária. Documento genérico não ganha identidade fiscal. O rótulo ordinário
do formulário passa a “Número ou referência do documento”, incluindo a autoridade
de UX que antes sobrescrevia o HTML. IDs, regras, writes e sincronização permanecem
fora dessa alteração.

GREEN dirigido: **11/11 em 1,0 minuto**, com contraprovas de snapshot, Assessoria,
boleto, documento genérico, legado e escaping; **19/19 unitários relacionados**.
Syntax/diff-check aprovados; ESLint terminou sem erros e com 25 warnings existentes
de `innerHTML`, sem desativar a regra. Duas capturas desktop 1440×900 estão em
`evidence/document-identity-new-submission.png` e
`evidence/document-identity-reanalysis.png`: certificam identidade/contexto visível.
O footer da reanálise aparenta corte nessa captura e requer comparação controlada
baseline/candidato; não usar a imagem como prova de ausência de clipping.

Regressão ampliada: **28/30 aprovados**, dois timeouts de 30 segundos nos cenários
legados `pendency-cycle.spec.js:997` e `unidentified-expense-user-journey.spec.js:27`.
Ambos repetiram timeout isoladamente. No primeiro, trace mostra espera de navegação,
instalação e locators antes de leitura dos controles; no segundo, a execução chegou
à captura final após as asserções funcionais. Havia carga concorrente elevada no
host. Isso é contexto diagnóstico, não prova de que os casos estejam corretos:
os dois permanecem **não certificados**. Testes e deadlines não foram relaxados.
Logs/hashes e resultado de cada execução constam de `evidence/green-index.json`.

## Contraprovas positivas novas

- Identificação `AUD-EXP-PROV-01` → `AUD-IDENT-01`: NF/Pendência mantêm seus IDs,
  uma tentativa, resolução após reanálise; SQL confirmado. Boleto não aparece
  entre opções acessíveis de identificação em BASIC.
- Controlador no Dashboard + Assistente em outra sessão abre Pendência de extrato:
  **1 leitura escolar, 0 globais**, HTTP 200, resposta **21.318 bytes**. Indicador
  Aberta passa de 0 para 1 escola; as três escolas da CRE permanecem no recorte.
  Amostra única, sem comparação percentual de performance.
- Tentar análise de extrato sem entrega preenchida produziu mensagem explicativa
  e não escreveu análise. Preencher Sim permitiu a abertura. Essa regra de extrato
  não é a independência operacional das despesas fiscais.
- Carteira → escola de outro controlador da mesma CRE → retorno preserva busca;
  busca global encontra unidade e Pendências relacionadas, levando à rota escolar.

## Limites do checkpoint

Os REDs acima receberam os GREENs dirigidos descritos, com revisão independente.
Não equivalem a homologação integral, CI remoto final ou aprovação para merge.
Restam os dois cenários legados não certificados, comparação do footer e cobertura
operacional A–N ainda parcial. A tabela de Pendências continua a apresentar
descrição como título em alguns registros, sem número visível na linha; a correção
de identidade desta rodada se restringe aos dois modais e ao rótulo de documento.
Não há comprovação nova de fluidez, DOM/CPU ou efeito em Production.
