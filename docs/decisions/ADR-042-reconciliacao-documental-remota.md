# ADR-042 — Reconciliação documental baseada nas fontes remotas

**Status:** Aprovada  
**Data:** 5 de agosto de 2026

## Contexto

Documentos canônicos acumularam estados superados: deployments antigos, incidente 404 já resolvido, Excel SME descrito com 30 colunas, `row_version` anterior e ausência das últimas correções funcionais. Essa divergência pode induzir outro agente a restaurar defeitos, repetir investigação encerrada ou seguir uma ordem cronológica incorreta.

## Decisão

A documentação atual deve ser reconstruída a partir desta precedência:

1. código e contratos executáveis da referência analisada;
2. Supabase efetivo, incluindo migrations, funções, Auth, RLS e dados mutáveis;
3. deployment Vercel efetivo e seu SHA;
4. PRs integrados e PRs ainda abertos;
5. testes e evidências reproduzíveis;
6. decisões vigentes;
7. documentação canônica;
8. documentos históricos.

## Regras

- PR aberto não é funcionalidade integrada;
- deployment de Preview não é Production;
- migration em branch não altera a contagem de Production;
- evidência datada comprova somente o evento e o SHA correspondentes;
- planos históricos não são reescritos para parecer atuais;
- documentos superados recebem classificação explícita;
- links do índice devem corresponder a arquivos existentes;
- mudanças materiais atualizam estado, contexto, roadmap, decisões e matriz documental no mesmo ciclo;
- a documentação não autoriza merge ou publicação.

## Baseline desta decisão

```text
main: f812e5dbf3aaa18fb9851948445b0820ac7a5435
Production: dpl_7G3Wmh1YiV4c4aXVwe2P5tN7N7Y4
Supabase: scnryinorqeucbfkioxo
migrations em Production: 25
PR #141: aberto em rascunho
```

## Consequências

- `CURRENT_STAGE.md` controla a sequência corrente;
- `PROJECT_CONTEXT.md` descreve a arquitetura estável;
- o roadmap separa concluído, publicado e em andamento;
- `STATUS_DOCUMENTOS.md` identifica validade e precedência;
- informações mutáveis devem ser revalidadas antes de tarefa dependente do ambiente;
- erro documental deve ser corrigido na documentação, não por alteração do código para coincidir com texto antigo.
