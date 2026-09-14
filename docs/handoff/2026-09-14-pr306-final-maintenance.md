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
- reduz discretamente sombra e glow globais sem alterar identidade, cores semânticas, hierarquia ou layout funcional;
- mantém os scripts locais do bootstrap com `defer` e preserva o carregamento sob demanda do cliente Supabase.

Um contrato unitário específico impede a volta da carga duplicada/bloqueante de fontes.

## Documentação corrente

`docs/CURRENT_STAGE.md` foi reconciliado com o estado efetivo após o PR #305:

- PR #305 reconhecido como integrado e publicado;
- merge funcional `b151f3f27cb28d5165916aa9be4086355742e839`;
- candidato funcional certificado `86db8651134616fe03d6506e7f9bd073e1e1eb3f`;
- deployment Production `dpl_c9Be1LfZocKVBVmrB5pDHaVB7w3X`;
- build de Production com 1.034 testes aprovados;
- restauração auditável de edição deixa de aparecer incorretamente como trabalho em andamento.

## Limite deliberado

Este pacote não altera:

- regras de bonificação, análise, Pendência, novo envio ou reanálise;
- identidade ou individualização de Notas Fiscais;
- fluxo patrimonial e inventário;
- schema, migrations, RPCs, RLS ou Auth;
- modelo de dados, competência, programa, escola ou perfis;
- autoridade funcional das superfícies.

O estado do banco Production foi conferido somente por leitura antes desta rodada e o monitor `production_integrity_check()` retornou `healthy`, com zero problemas nas verificações agregadas.

## Critério de encerramento

O head final do PR #306 deve repetir os gates funcionais, Supabase/RLS, backup/restauração, E2E, perfis/viewports, segurança e Lighthouse. A comparação de Lighthouse deve usar como referência o baseline pré-pacote acima, sem relaxar limites para produzir resultado verde artificialmente.
