# PR #306 — pacote final de manutenção

**Data:** 14 de setembro de 2026  
**Classe documental:** handoff final de manutenção

## Objetivo

Encerrar a rodada de manutenção do RADAR PDDE sem reabrir regras de negócio, banco ou arquitetura funcional já certificados. O pacote reúne atualização consciente de dependências, redução de custo no carregamento inicial, acabamento visual discreto e reconciliação documental.

## Dependências homologadas

Foram atualizadas somente versões diretas confirmadas no registro npm atual e aprovadas pelos contratos do projeto:

- `@playwright/test` 1.63.0;
- `@supabase/supabase-js` 2.116.0;
- `@types/node` 24.13.4, preservando runtime Node 24;
- `dependency-cruiser` 18.3.0;
- `eslint` 10.10.0;
- `fast-check` 4.10.0;
- `knip` 6.35.1.

Supabase CLI permanece em 2.114.0. A 2.117.0 foi reavaliada nesta rodada e repetiu as duas falhas RLS já observadas na 2.116.0; ambas ficam bloqueadas de forma exata no Dependabot, sem impedir avaliação de versão posterior.

## Performance e acabamento

O Lighthouse anterior ao pacote registrou LCP de aproximadamente 4,12 s no desktop e 16,66 s no mobile. A inspeção encontrou a mesma folha do Google Fonts sendo declarada no HTML e novamente por `@import` no CSS.

O pacote:

- remove a declaração duplicada de fontes no CSS;
- transforma a folha externa de fontes em preload não bloqueante, com fallback `noscript`;
- adiciona fallback imediato por `Segoe UI`/Arial enquanto a fonte institucional não chega;
- reduz discretamente sombra e glow sem alterar identidade, cores semânticas, hierarquia ou layout funcional;
- mantém os scripts locais do bootstrap com `defer` e preserva o carregamento sob demanda do cliente Supabase.

Um contrato unitário específico impede a volta da carga duplicada/bloqueante de fontes.

### Resultado medido

A correção reduziu de forma objetiva o custo bloqueante da renderização inicial, sem alterar artificialmente os limites do Lighthouse:

| Métrica | Antes | Depois |
|---|---:|---:|
| FCP mobile | 3,17 s | 2,48 s |
| Bloqueio de renderização mobile estimado | 1.680 ms | 470 ms |
| FCP desktop | 736 ms | 566 ms |
| Bloqueio de renderização desktop estimado | 390 ms | 60 ms |
| LCP mobile | 16,66 s | 16,65 s |
| LCP desktop | 4,12 s | 4,15 s |

A leitura do relatório bruto identificou que o LCP residual não depende da fonte. No desktop, o elemento LCP é o cabeçalho dinâmico de **Escolas e Carteiras**; no mobile, é o texto dinâmico de contexto da **Carteira ativa**. O carregamento inicial envolve cerca de 114 scripts e 148 requisições no ensaio Lighthouse, e tarefas de bootstrap/autenticação/navegação ainda ocorrem tardiamente no perfil mobile simulado.

Portanto, o LCP residual é tratado como dívida de arquitetura de carregamento. A correção adequada exige uma frente própria de modularização/lazy-loading ou bundle de produção; não será escondida neste PR nem contornada relaxando o piso do Lighthouse.

## Documentação corrente

`docs/CURRENT_STAGE.md` foi reconciliado com o estado efetivo após o PR #305:

- PR #305 reconhecido como integrado e publicado;
- merge funcional `b151f3f27cb28d5165916aa9be4086355742e839`;
- candidato funcional certificado `86db8651134616fe03d6506e7f9bd073e1e1eb3f`;
- deployment Production `dpl_c9Be1LfZocKVBVmrB5pDHaVB7w3X`;
- build de Production com 1.034 testes aprovados;
- restauração auditável de edição deixa de aparecer incorretamente como trabalho em andamento;
- certificação, handoffs e rota de retomada distinguem o baseline publicado do PR #305 da manutenção ainda aberta no PR #306.

## Banco e regras preservados

Este pacote não altera:

- regras de bonificação, análise, Pendência, novo envio ou reanálise;
- identidade ou individualização de Notas Fiscais;
- fluxo patrimonial e inventário;
- schema, migrations, RPCs, RLS ou Auth;
- modelo de dados, competência, programa, escola ou perfis;
- autoridade funcional das superfícies.

O estado do banco Production foi conferido somente por leitura. `production_integrity_check()` retornou `healthy`, com zero problemas nas verificações agregadas. Verificações adicionais de vínculos entre Nota Fiscal, avaliação, Pendência e patrimônio também retornaram zero inconsistências.

## Evidência de validação

No candidato de runtime `5ffacebc5cce685d9ed41f15d1a60c5ac437a2a9`, ficaram verdes, entre outros:

- validação geral;
- saúde das dependências;
- CodeQL;
- confiabilidade funcional com Supabase real;
- ciclos funcionais reais com Supabase;
- gate remoto de perfis e viewports;
- backup e restauração descartáveis;
- homologação Excel SME;
- Supabase readiness após retry de uma falha externa do registry ECR.

No Supabase readiness, antes da falha externa, 31 arquivos pgTAP e 440 testes passaram, além de migrations e lint. A única interrupção foi `toomanyrequests: Rate exceeded` ao baixar `postgres-meta:v0.97.0`; o retry concluiu o gate com sucesso.

O Lighthouse continua vermelho exclusivamente pelo LCP acima do piso definido. A melhoria aplicada é mensurável em FCP e bloqueio de renderização, mas não resolve a dívida estrutural de LCP.

Os commits documentais posteriores ao candidato de runtime apenas reconciliam o estado canônico e este handoff; não alteram o código executável exercitado.

## Critério de encerramento

O PR #306 está preparado como pacote final de manutenção e deve permanecer aberto até decisão explícita de merge. O próximo trabalho de performance, caso venha a ser autorizado, deve ser uma frente independente de carregamento/modularização, sem misturar nova alteração funcional ou de banco.