# #494 — saída da conta PDDE Qualidade e identificação posterior

Objetivo: registrar a saída observada no extrato mesmo sem conhecer a Ação
Integrada, reencontrá-la e converter somente quando houver identificação fiscal.
Baseline incorporada: `main@22faf548` (F06 publicada). Esta evidência não confirma
aplicação da migration 62 ou publicação do #494 em Production.

## Jornada executada

Chromium 156 / Playwright 1.64.1, Controlador com Auth e RLS reais, Supabase
**local descartável**, PostgreSQL 17.6. A UI recebe somente a chave pública;
identidade/escola sintéticas são preparadas fora do navegador e removidas ao final.

1. Prontuário em maio/2026 → Registrar saída → Salvar sem preencher opcionais.
2. Reload: mesma movimentação aberta, sem descrição/valor inventados.
3. Editar descrição, referência, observação e R$ 250,35 → reload preserva dados.
   Até aqui não se cria NF/Pendência nem se altera bonificação.
4. Selecionar Educação Conectada → Identificar despesa → formulário fiscal
   reaproveita os dados. Uma rejeição HTTP 503 mantém registro aberto e banco
   inalterado, sem NF parcial. Nova tentativa conclui e sobrevive ao reload.
5. Banco e tela: uma NF vinculada, tipo Consumo, valor e contexto corretos,
   provisório Identificado sem botão para repetir identificação e sem Pendência
   nova. Consumo aplica o N/A canônico de Assessoria; não marca bonificação manual.

O spec versionado `supabase-quality-provisional.spec.js` reproduz essa jornada
e é executado no gate Supabase/Auth da homologação pré-Production, após as suítes
que substituem a base. Inclui imagens do painel, formulário e Prontuário integrado,
JSON final do banco e checagem de erros não tratados no navegador.

## Evidência proporcional e correções de integração

- 22 pgTAP específicos: criação vazia, versão, vínculo, replay idempotente,
  segunda identificação rejeitada, rollback por conflito fiscal, anonimato,
  proteção de escola/status e escrita SME negada por RLS.
- 36 testes relacionados de InvoiceService/Repository; 3 regressões visuais
  existentes aprovadas, **sem alterar golden**.
- Tipos da tabela/RPC gerados pela CLI canônica 2.121.0 e comparados por tokens;
  checks de tipos, readiness, alinhamento e referências de workflow aprovados.
- Os checks antigos ainda esperavam 61 migrations. Manifesto pós-aplicação,
  contagem de schema/runbook/checker e tipos passam a representar a 62ª candidata.
- O contrato pós-aplicação também revelou políticas novas fora da convenção
  canônica: chamadas por linha a can_access_school/can_write_school. Foram
  substituídas **somente na tabela nova** pelos conjuntos escolares já utilizados
  por NF e Pendências. O contrato original passa sem relaxamento.
- O painel aparecia no modo local sem backend suportado e com ações inertes.
  A visibilidade agora exige a capacidade remota real. No Supabase a funcionalidade
  permanece disponível; os snapshots existentes do modo local foram preservados.
- Preparação do teste foi ajustada ao JSON efetivamente retornado pelo HTTP,
  ao identificador real de perfil SME e ao N/A legítimo de Consumo. Essas falhas
  iniciais não foram classificadas como defeitos do produto.

Inspeção visual: escola e competência visíveis no Prontuário, separação do painel
em relação às análises, campos legíveis, ações identificáveis, formulário fiscal
com contexto e dados preservados; sem corte/overposição observados no desktop.

## Publicação e limites

Revalidar o HEAD e todos os checks no próprio #494. Banco primeiro: aplicar a
migration 20261024120000, confirmar tabela/RLS/grants/RPC e integridade anterior;
frontend depois. Reverter frontend não exige apagar registros provisórios já
criados. Não usar fixtures ou contas sintéticas em Production.

Não é benchmark de fluidez, auditoria universal de segurança ou sessão autenticada
em Production. A leitura do painel é dirigida, com Atualizar manual; não foi
prometida sincronização contínua de provisórios entre sessões. O contrato fiscal
`a_identificar` e as demais jornadas permanecem protegidos pelos gates existentes.
