# Achados causais — 11/10/2026

Ambiente descartável autenticado, runtime baseline `113841bd`. Não são relatos
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
Não aumentar timeout nem introduzir novo polling: avaliar instalação pelo evento
existente, idempotência e ordem dos wrappers, com revisão independente.

## Identidade omitida em ações corretivas individuais

Drawer identifica a NF, mas novo envio mostra apenas Notas Fiscais. Reanálise
destaca descrição/tipo/valor, omitindo o número. Com duas despesas de mesma descrição
e valor, o operador não consegue distingui-las pelo contexto do modal.

RED de apresentação, fixtures locais + UI real: seis casos falharam na baseline
em `corrective-document-identity.spec.js` (número no envio, número na reanálise
fiscal e de Assessoria, snapshot sem NF carregada, indicação de legado, referência
de boleto). A primeira tentativa usou título antigo de modal; foi corrigida antes
da execução causal. Log causal: `controller-identity-red-causal.log`.
Reutilizar formatadores existentes; preservar dimensão, descrição, valor e
legados. Não mudar IDs, regras, writes ou sincronização.

## Contraprovas positivas novas

- Identificação `AUD-EXP-PROV-01` → `AUD-IDENT-01`: NF/Pendência mantêm seus IDs,
  uma tentativa, resolução após reanálise; SQL confirmado. Boleto não aparece
  entre opções acessíveis de identificação em BASIC.
- Controlador no Dashboard + Assistente em outra sessão abre Pendência de extrato:
  **1 leitura escolar, 0 globais**, HTTP 200, resposta **21.318 bytes**. Indicador
  Aberta passa de 0 para 1 escola; demais três escolas da CRE permanecem no recorte.
  Amostra única, sem comparação percentual de performance.
- Tentar análise de extrato sem entrega preenchida produziu mensagem explicativa
  e não escreveu análise. Preencher Sim permitiu a abertura. Essa regra de extrato
  não é a independência operacional das despesas fiscais.
- Carteira → escola de outro controlador da mesma CRE → retorno preserva busca;
  busca global encontra unidade e Pendências relacionadas, levando à rota escolar.

Restam jornadas, GREEN/revisão das correções e validação visual. Não publicar
nenhum desses REDs como defeito corrigido antes das provas posteriores.
