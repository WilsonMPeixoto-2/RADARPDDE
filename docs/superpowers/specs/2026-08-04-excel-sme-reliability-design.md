# Confiabilidade integral do Excel SME — Especificação de design

## Objetivo

Eliminar as falhas conhecidas e plausíveis do fluxo Excel SME, desde o carregamento dos módulos e ativos publicados até a integridade semântica do workbook baixado, sem alterar Supabase, Auth, RLS, migrations ou dados de produção.

## Diagnóstico consolidado

A causa original comprovada foi a ausência do template no artefato publicado. O build atual corrige essa omissão, mas o sistema ainda possui classes independentes de falha que podem produzir sintomas semelhantes:

1. carregamento de scripts sem estado confiável, timeout ou recuperação;
2. requisição do template sem timeout e com retry insuficientemente observável;
3. resolução de competência com seletor frágil, efeito colateral e fallback arbitrário;
4. validação E2E limitada à assinatura ZIP;
5. risco de divergência entre dados atuais e linhas cadastrais do template;
6. smoke de produção incompleto para mudanças em todo o pipeline SME.

## Arquitetura proposta

### 1. Loader de recursos com máquina de estados

Cada recurso crítico terá estado explícito `idle`, `loading`, `ready` ou `failed`. A existência de um elemento `<script>` não será considerada sucesso. Falha ou timeout removerá o elemento incompleto, limpará a Promise compartilhada e permitirá nova tentativa real sem recarregar a página.

O template será carregado com `AbortController`, timeout configurável, validação mínima de bytes e erros tipados. Chamadas concorrentes compartilharão somente a operação em andamento; após sucesso, os bytes validados poderão ser clonados para cada consumidor.

### 2. Bootstrap recuperável

O carregador dos módulos de exportação também controlará estado, eventos, timeout e retry. O marcador global somente representará uma instalação concluída. Módulos já presentes serão aceitos apenas quando estiverem marcados como carregados ou quando o contrato global esperado estiver disponível.

### 3. Competência como contrato puro

A competência SME será resolvida por função sem efeitos colaterais. O seletor receberá identificador estável `data-radar-sme-competence`. Não haverá fallback para o primeiro mês cadastrado.

Uma exportação só será permitida quando existir uma competência mensal única e confiável. Divergência entre estado e seletor ativo será tratada explicitamente; a operação não modificará o estado durante atualização de botões ou observação do DOM.

### 4. Snapshot imutável de exportação

No clique, a integração capturará um snapshot com a competência resolvida. Esse valor alimentará modelo, nome do arquivo, nome da aba e log. O modelo continuará validando o formato `YYYY-MM` e o renderer validará que o nome da aba corresponde à competência.

### 5. Template como modelo visual

O sistema será a fonte de verdade para ordem, CRE, designação e denominação. O template fornecerá estrutura e estilo. Designações normalizadas duplicadas no sistema ou no template bloquearão a geração com erro explícito, evitando sobrescrita silenciosa.

O renderer reconstruirá deterministicamente a área de dados conforme a lista atual de escolas e reescreverá as colunas cadastrais `A:D`, preservando estilos e contratos visuais.

### 6. Teste semântico do arquivo baixado

O E2E clicará no botão real, salvará o arquivo e o reabrirá com ExcelJS. Validará nome, aba, quantidade de colunas, cabeçalhos, congelamento, autofiltro, dados representativos, competência e unicidade das designações.

Cenários de recuperação simularão falha inicial do ExcelJS, `404` do template, resposta pendente e conteúdo HTML com status 200.

### 7. Assets identificados por manifesto

O build gerará manifesto com caminho, tamanho e SHA-256 do template e do bundle ExcelJS. O runtime consumirá a versão derivada do conteúdo, eliminando a constante manual como fonte de verdade. O build falhará se qualquer ativo estiver ausente ou divergente.

### 8. Smoke integral de produção

O workflow será acionado por alterações em qualquer componente do pipeline SME. A camada estática verificará commit, MIME, tamanho, hash e OOXML. A camada de navegador executará o botão contra o deployment do commit e reabrirá o workbook.

### 9. Observabilidade segura

Erros receberão códigos estáveis por fase, sem registrar conteúdo de células ou dados pessoais. As mensagens ao usuário distinguirão carregamento do motor, template, competência, parse, serialização e download.

## Invariantes

- nenhuma atualização visual altera `activeCompetenciaKey`;
- não existe fallback silencioso de competência;
- Promise de carregamento não pode permanecer pendente após timeout;
- recurso fracassado pode ser carregado novamente sem refresh;
- competência da tela, snapshot, modelo, aba e nome do arquivo são iguais;
- designação normalizada é única;
- `A:D` refletem o estado atual do sistema;
- o arquivo baixado é um workbook semântico válido, não apenas um ZIP;
- build, deployment e runtime são verificados contra o mesmo conteúdo.

## Fora de escopo

- troca do ExcelJS;
- atualização geral de dependências;
- refatoração do relatório institucional;
- alterações em banco, Supabase, Auth, RLS ou migrations;
- mudança de regras de negócio do PDDE.

## Critérios de aceitação

1. testes de reprodução falham antes das correções e passam depois;
2. todas as suítes unitárias, integração, E2E e readiness aplicáveis ficam verdes;
3. o artefato Vercel contém template, bundle e manifesto coerentes;
4. falhas transitórias permitem nova tentativa sem recarregar a página;
5. competência ambígua ou divergente bloqueia a exportação;
6. o arquivo baixado reabre via ExcelJS e satisfaz os contratos semânticos;
7. smoke de produção valida o SHA efetivamente implantado;
8. Microsoft Excel desktop abre o arquivo sem solicitação de reparo na homologação manual final.
