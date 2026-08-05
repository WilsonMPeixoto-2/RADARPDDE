# ADR-040 — Garantia operacional contínua de Production

**Status:** Aprovada e implementada quanto às fases 1 e 2  
**Data:** 5 de agosto de 2026

## Contexto

Falhas de publicação ou integração podem deixar uma função indisponível mesmo quando o código e os testes isolados estão corretos. O incidente do Excel SME demonstrou que o artefato efetivamente servido precisa ser verificado depois do merge.

## Decisão

Production deve possuir monitor automatizado, recorrente e não destrutivo que valide:

- commit esperado e commit publicado;
- manifesto, ambiente e modo de dados;
- shell público e gate de autenticação;
- todos os assets locais referenciados;
- bloqueio de acesso anônimo ao Supabase;
- preflight das Edge Functions catalogadas;
- resultado visível em resumo permanente do GitHub Actions.

O monitor executa:

- após `push` na `main`;
- a cada hora;
- manualmente.

Falha confirmada deve abrir ou atualizar uma única issue automática. Recuperação confirmada deve comentar e encerrar o incidente. Issues humanas e pull requests não podem ser alterados.

## Implementação

- `.github/workflows/production-system-smoke.yml`;
- `scripts/check-production-system.mjs`;
- `scripts/check-production-team-account-preflight.mjs`;
- `scripts/manage-production-incident.mjs`;
- testes unitários dos contratos e do workflow.

Fase 1 integrada pelo PR nº 139. Fase 2 integrada pelo PR nº 140.

## Limites

O monitor prova disponibilidade básica, publicação e fronteiras públicas. Não substitui:

- login autenticado por perfil;
- prova de todas as consultas;
- mutações reais;
- releitura após recarregar;
- compensação de falhas parciais;
- UAT.

Esses itens pertencem à ADR-041.

## Consequências

- Production deixa de depender apenas de verificação humana ocasional;
- incidentes de deployment e preflight tornam-se detectáveis;
- nova Edge Function deve entrar no catálogo do monitor;
- falha do mecanismo de issue não pode mascarar a falha principal;
- nenhuma informação sensível deve aparecer em logs ou incidentes.
