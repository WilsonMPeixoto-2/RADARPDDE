# RADAR PDDE — Playbook reproduzível da auditoria adversarial

**Estado:** protocolo complementar obrigatório ao método adversarial  
**Instituído em:** 5 de setembro de 2026  
**Origem:** estudo dos artefatos reais produzidos pela auditoria Codex/Astra Ultra sobre a baseline `876c5976124815d2848f7d2d9e8a82b7cd3a43c5`.

> Este documento não descreve apenas princípios. Ele registra **como reproduzir tecnicamente** o tipo de investigação que encontrou defeitos fora da cobertura conhecida. Leia junto com [`adversarial-analysis-and-implementation-method.md`](adversarial-analysis-and-implementation-method.md).

## 1. Objetivo

Evitar que uma auditoria futura se limite a abrir os arquivos mais óbvios, executar a suíte existente e certificar o que já estava coberto. O procedimento deve produzir cobertura mecânica ampla, mapa de autoridades, contraexemplos e provas focalizadas antes de concluir.

A unidade de trabalho não é “arquivo revisado”. É **regra/fluxo investigado através de todas as suas implementações e superfícies**.

## 2. Pipeline observado e que deve ser replicado

### Passo A — congelar baseline e distinguir estados do Git

Registrar explicitamente:

- SHA da `main` integrada examinada;
- último PR funcional integrado;
- PR documental/candidato aberto, sem promovê-lo a baseline;
- PRs abortados/sem merge excluídos do contrato;
- deployments remotos correspondentes quando materiais.

Não misturar conteúdo da branch candidata com comportamento da `main` sem marcar a origem.

### Passo B — gerar inventário mecânico do repositório

Usar o gerador existente de inventário e salvar resultado estruturado antes da leitura semântica.

Na coleta Astra de 05/09/2026, o inventário do checkout examinou **840 arquivos rastreados**. O próprio artefato classificou, entre outros:

- 242 documentos;
- 187 testes unitários;
- 56 E2E;
- 28 testes de banco;
- 51 integrações;
- 47 scripts;
- 46 migrations;
- 24 arquivos de domínio;
- 13 de application service;
- 9 de data;
- 26 workflows.

Essas contagens pertencem à coleta Astra daquele checkout e não substituem contagens de outros inventários executados com critérios diferentes.

### Passo C — varredura textual integral orientada a risco

Para cada arquivo textual inventariado, procurar classes de risco e salvar **arquivo + linha + trecho**, não apenas contagem.

Categorias usadas com sucesso pelo Astra:

```text
transições
  pendência | reanálise | novo envio | substituição | proximoAtor | responsavel | bonificação

entidades/acoplamentos
  invoice | nota fiscal | a_identificar | assessoria | patrimônio | inventário | encampInventario

identidade
  row_version | rowVersion | linked_asset | bemId | source_context | verification_id | Date.now | Math.random

writes
  rpc | upsert | update | insert | delete | save | remove | persist | execute

autoridade paralela / legado
  window | globalThis | setInterval | setTimeout | MutationObserver | prototype | legacy | legado | fallback | mock | fixture | skip | obsolete | superado
```

A busca é **mapa de candidatos**, nunca juiz semântico. Palavras isoladas não autorizam remoção ou refatoração.

### Passo D — construir mapa estático de código e SQL

A auditoria produziu um índice AST com Acorn/acorn-walk para:

- funções e localização;
- tamanho aproximado por linhas;
- quantidade de ramos;
- chamadas relevantes de write/load;
- definições SQL cronológicas.

Na baseline auditada, o mapa encontrou:

- **3.797 funções**;
- **151 chamadas** de métodos relevantes mapeadas;
- **88 definições SQL de funções** em migrations;
- **57 nomes SQL distintos** no índice de última ocorrência;
- **0 erros de parse**.

Limite obrigatório: índice por nome **não resolve sozinho overload, DROP, ALTER ou mudança de assinatura**. Antes de afirmar autoridade SQL, confirmar assinatura e corpo da última definição efetiva.

### Passo E — normalizar o ambiente antes de confiar em testes

Não reutilizar `node_modules` antigo por conveniência sem comparar com `package.json`.

No workspace Astra havia versões reaproveitadas divergentes para vários pacotes e dependências ausentes. A auditoria registrou o desvio e executou instalação limpa (`npm ci`), que adicionou 442 pacotes.

Regra:

1. comparar dependências declaradas com o ambiente existente;
2. se houver incompatibilidade material, usar instalação reproduzível;
3. registrar warnings de depreciação separadamente;
4. não transformar warning transitivo em bug funcional sem rastrear a cadeia que o introduz.

### Passo F — dividir a leitura semântica por domínio, preservando sobreposição

A coleta Astra dividiu a auditoria em três recortes complementares:

1. NF / `a_identificar` / Assessoria / Inventário;
2. Pendências / avaliação mensal / competência;
3. superfícies transversais: perfis, autorização, escolas, equipe, bootstrap, state bridge, Production fail-closed e exportações.

A sobreposição é intencional quando duas áreas tocam a mesma regra. Não deduplicar cedo demais: divergência entre dois recortes pode ser justamente o achado.

### Passo G — registrar cada regra em tabela comparável

Formato padrão:

```text
REGRA
→ IMPLEMENTAÇÃO ATUAL
→ TESTES ATUAIS
→ DOCUMENTAÇÃO CORRENTE
→ ARTEFATOS CONFLITANTES
→ CLASSIFICAÇÃO
→ RISCO
→ AÇÃO RECOMENDADA
```

Isso força a investigação a comparar fontes, em vez de apenas narrar um arquivo.

### Passo H — criar probe focal antes de ampliar a suíte

Quando surgir hipótese concreta, criar o menor probe que execute **código real do produto** e substitua apenas a dependência necessária para observar a transição.

Dois exemplos da coleta Astra:

#### Patrimônio

```text
InvoiceService real
+ estado com bem Inventariada
+ mesma NF permanente sem alteração
+ processo existente
→ save
→ observar asset resultante
```

O probe reproduziu `Inventariada → Encaminhada` mantendo metadados de inventariação.

#### Exportação

```text
integração real do botão SME
+ auditoria real/wrapper real
+ renderer sintético
+ falha injetada na auditoria inicial
→ comparar botão real com entrypoint auditado
```

O probe mostrou que o entrypoint auditado bloqueava download, enquanto o botão SME integrado seguia closure privada que baixava antes da confirmação.

Princípio: **mockar a periferia, não a regra sob investigação**.

### Passo I — usar testes verdes para demonstrar a lacuna, não para invalidar o achado

Depois do probe, executar testes focalizados e amplos para responder:

- o fluxo isolado já era coberto?
- a combinação que falhou estava ausente?
- existe teste antigo concorrente?

Na coleta Astra:

- integração: **7/7**;
- desktop E2E: **141 aprovados, 37 ignorados, 0 falhas**, entre 178 cenários;
- uma suíte unitária ampla executou 873 cenários, com 871 aprovados e 2 falhas de verificação de artefato/reprodutibilidade do checkout, que precisavam ser classificadas separadamente e não foram usadas para negar os probes funcionais.

Conclusão: suíte verde em torno do fluxo não falsifica um contraexemplo que exercita uma sequência ausente.

### Passo J — coletar evidência remota sem confundi-la com prova de ausência de bug

A auditoria salvou snapshot remoto de:

- migrations aplicadas;
- deployments;
- definições efetivas de funções relevantes;
- `production_integrity_check()`.

Na coleta, Production reportou **46 migrations** e `totalIssues = 0` / `healthy`.

Isso **não contradiz** o bug patrimonial reproduzido: um monitor saudável descreve o estado existente dos dados naquele instante. Ele não prova que uma sequência ainda não executada não possa criar estado inválido.

Regra permanente:

```text
integridade atual saudável
≠ impossibilidade de um write futuro produzir inconsistência
```

### Passo K — preservar resultados progressivamente

Auditorias longas devem escrever artefatos durante a execução, não apenas no final.

Preservar, conforme utilidade:

- inventário do repositório;
- cobertura de varredura;
- matches textuais;
- mapa estático;
- relatórios semânticos parciais;
- probes;
- logs de testes;
- evidência remota;
- PRs/commits consultados.

Isso evita que perda de cota, sessão ou contexto destrua o raciocínio já produzido e permite retomada sem repetir a exploração cara.

## 3. Heurísticas de descoberta que devem virar hábito

Em qualquer análise séria, procurar deliberadamente:

- **regra de criação reaplicada em update**;
- **estado avançado destruído ao voltar à origem**;
- **wrapper correto contornado por botão/closure/callback**;
- **duas projeções do mesmo conceito**;
- **fallback legado ainda executável**;
- **teste verde com título/regra histórica**;
- **fixture adversarial confundida com estado corrente**;
- **migration antiga citada depois de redefinição sucessora**;
- **Promise/readiness confundida com capacidade instalada**;
- **módulo chamado performance/diagnóstico que ainda muda correção funcional**;
- **atalho de teste que escreve estado global diretamente e mascara o fluxo canônico**.

## 4. Como adaptar o método a implementações

Ao implementar qualquer correção descoberta por esse processo:

1. reproduzir novamente o contraexemplo no baseline atual;
2. criar teste RED na camada mais próxima da causa;
3. localizar todas as autoridades paralelas antes de editar;
4. preservar estados avançados e histórico legítimo;
5. corrigir a causa mínima;
6. executar GREEN focal;
7. executar o ponto de entrada real;
8. persistir/recarregar quando houver write;
9. testar sequência com outro fluxo verde;
10. tentar quebrar a correção com um contraexemplo adjacente;
11. só então ampliar os gates.

## 5. Regra de uso de cota/agente

Para agentes com cota limitada:

- entregar artefato parcial útil antes de abrir nova frente;
- probes focalizados precedem suítes caras;
- salvar resultados em `outputs/`/`work/` progressivamente;
- não repetir inventário e varredura se artefatos válidos já existem para o mesmo SHA;
- interromper exploração nova quando a cota estiver baixa e consolidar o que já foi provado.

A qualidade não vem de consumir mais tokens. Vem de **usar exploração ampla para localizar risco e raciocínio profundo para quebrar hipóteses específicas**.
