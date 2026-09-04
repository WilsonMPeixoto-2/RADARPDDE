# Estabilização funcional do RADAR PDDE — PR #260

**Data:** 4 de setembro de 2026  
**Classe:** checkpoint canônico da estabilização funcional  
**Escopo:** confiabilidade de execução, persistência, releitura, sincronização entre telas e prevenção de regressões

## Objetivo

Esta etapa substitui a prática de considerar uma funcionalidade validada apenas porque suas camadas isoladas passaram em testes. Para os fluxos críticos alterados ou revalidados, o padrão de prova passa a ser:

`ação real → persistência → leitura direta do banco → recarregamento da aplicação → nova leitura/renderização`

Quando a operação admite repetição de gesto, também se verifica que um segundo clique enquanto o primeiro salvamento está em andamento não produz uma segunda gravação.

## Defeitos funcionais reproduzidos antes da correção

Os testes novos foram introduzidos antes das correções e reproduziram quatro falhas reais do estado anterior:

1. era possível concluir a inventariação sem o bem ter passado pelo estado Encaminhada;
2. o número da NF podia ser alterado isoladamente no bem patrimonial, divergindo da Nota Fiscal que o originou;
3. um encaminhamento patrimonial realizado depois do cadastro da NF podia atualizar Capital e Inventário sem atualizar o tópico Encaminhado para Inventariação no Prontuário;
4. metadados técnicos antigos de versão podiam voltar a ser gravados dentro do conteúdo da verificação.

A suíte anterior permaneceu verde durante essa fase, comprovando que os testes novos estavam revelando cenários não cobertos anteriormente, e não regressões artificiais provocadas pela própria preparação do PR.

## Regras funcionais consolidadas

### Capital e Inventário

- A sequência válida é `Não encaminhada → Encaminhada → Inventariada`.
- A conclusão da inventariação antes do encaminhamento é rejeitada.
- Bem gerado por uma Nota Fiscal cadastrada não pode ter o número da NF alterado isoladamente na tela patrimonial; a alteração deve nascer do registro fiscal para preservar a sincronização.
- Ao encaminhar posteriormente um bem permanente vinculado a NF, a situação patrimonial, o tópico Encaminhado para Inventariação no Prontuário e o histórico administrativo são gravados juntos.
- Se todas as aquisições permanentes do mesmo contexto mensal estiverem Encaminhadas ou Inventariadas, o tópico agregado fica `Sim`; havendo alguma não encaminhada, fica `Não`; não havendo aquisição permanente aplicável, fica `Não se aplica`.

### Repetição de ações

Além da proteção já existente para salvamento de Nota Fiscal, passam a ser protegidos contra repetição enquanto a primeira operação está em andamento:

- novo envio de Pendência;
- reanálise;
- encaminhamento ao Inventário;
- conclusão da inventariação.

Uma falha de gravação libera uma nova tentativa normalmente.

### Persistência das verificações

Metadados técnicos de controle de versão não devem ser armazenados dentro do conteúdo funcional da verificação. A migration da estabilização limpa resíduos existentes e impede a recorrência em novas inserções/atualizações.

## Provas funcionais incorporadas

### NF permanente + Inventário + Prontuário

`tests/e2e/supabase-functional-reliability.spec.js`

Com Supabase descartável e autenticação real de teste:

- cadastra NF permanente;
- lê o registro diretamente do repositório;
- recarrega a aplicação e relê;
- prova o bloqueio da inventariação prematura;
- prova o bloqueio da edição isolada da NF no bem;
- encaminha posteriormente;
- comprova a sincronização do Prontuário;
- relê do banco;
- recarrega e confere novamente;
- conclui a inventariação;
- relê e recarrega novamente.

### Ciclo completo de Nota Fiscal

`tests/e2e/supabase-invoice-lifecycle-reliability.spec.js`

- criar;
- reler/recarregar;
- editar;
- reler/recarregar;
- converter consumo → permanente;
- confirmar criação e vínculo patrimonial;
- converter permanente → consumo;
- confirmar remoção do bem derivado;
- excluir a NF;
- confirmar desaparecimento após nova leitura e reload.

### Verificação mensal

`tests/e2e/supabase-verification-reliability.spec.js`

- lançar bonificação;
- ler diretamente do banco;
- bloquear consolidação incompleta;
- recarregar;
- registrar análise técnica;
- completar os estados documentais;
- reler;
- recarregar;
- consolidar;
- reler;
- recarregar e reavaliar o mês.

### Pendências e despesa a identificar

Permanecem válidas e integradas as jornadas reais já existentes para:

- novo envio e reanálise (`tests/e2e/pendency-reanalysis-auth.spec.js`);
- criação atômica de despesa a identificar com Pendência, identificação posterior preservando o mesmo ID e continuidade do fluxo (`tests/e2e/unidentified-expense.spec.js`).

## Banco e migrations

A estabilização adiciona `20260904040000_functional_reliability_inventory_sync.sql` e leva o conjunto canônico a **46 migrations**.

A nova operação de encaminhamento com sincronização do Prontuário é atômica: ou bem, verificação e histórico são persistidos juntos, ou a operação falha sem deixar uma das telas adiantada em relação à outra.

Os tipos gerados do Supabase fazem parte do contrato reproduzível e devem permanecer sincronizados automaticamente com a estrutura resultante das migrations.

## Critério de fechamento

O PR #260 só deve ser integrado quando o mesmo estado final passar, no mínimo, por:

- validação geral e testes de domínio;
- jornadas funcionais reais com Supabase descartável;
- Playwright completo;
- Supabase readiness e pgTAP;
- migrations em PostgreSQL limpo;
- backup/restauração;
- perfis e viewports;
- CodeQL e dependências;
- Lighthouse desktop sem alteração artificial do limite;
- homologação integral pré-Production.

Falhas de infraestrutura ou volatilidade de benchmark devem ser classificadas por evidência antes de qualquer alteração de regra. Não se deve modificar código funcional apenas para transformar um indicador instável em verde.

## Precedência documental

Este checkpoint e `docs/CURRENT_STAGE.md` passam a controlar a retomada da estabilização. O plano remanescente de 03/09 continua útil como histórico arquitetural, mas não deve ser executado literalmente quando conflitar com decisões, hotfixes e provas funcionais posteriores.

O PR #260 foi integrado após o head certificado `c3d6fc2374476a4884cfebc2f4236e346ccf2700` passar todos os gates finais. A `main` resultante é `8fc58926565a72465980143f253f0a2fee4b8fc2`. Supabase Production está com 46 migrations, integridade saudável e sem aliases técnicos residuais; Vercel Production `dpl_EmgxYkMpprpY2wLTRFk4bJQA4L2e` está READY e o alias oficial serve o manifesto desse mesmo merge. As regras funcionais e regressões descritas neste checkpoint compõem a baseline corrente.
