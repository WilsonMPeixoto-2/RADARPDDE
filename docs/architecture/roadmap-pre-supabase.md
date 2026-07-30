# Roteiro técnico anterior ao Supabase

**Classificação:** histórico substituído  
**Período:** etapa em que o RADAR ainda utilizava persistência local  
**Fonte atual:** [`../CURRENT_STAGE.md`](../CURRENT_STAGE.md)

> Este roteiro não representa pendências atuais. Vários itens não marcados foram implementados posteriormente por outras frentes, PRs e arquiteturas. Não retomar caixas deste documento sem verificar código, ambientes e documentação vigente.

Este roteiro organizava as entregas que poderiam ser concluídas enquanto o RADAR PDDE ainda utilizava persistência local.

## Etapa 1 — Fundação lógica

- [x] Criar contrato canônico de competências.
- [x] Criar testes unitários de competências.
- [x] Configurar validação automática no GitHub Actions.
- [ ] Integrar o módulo de competências ao `app.js`.
- [ ] Separar estatísticas por escola e por programa.
- [ ] Extrair funções puras para cálculo de situação.
- [ ] Validar a matriz institucional de situações.

## Etapa 2 — Estado e persistência local

- [ ] Encapsular mutações por domínio.
- [ ] Separar auditoria de persistência.
- [ ] Eliminar gravações duplicadas.
- [ ] Criar interface de repositório.
- [ ] Implementar migrações versionadas do armazenamento local.

## Etapa 3 — Operações críticas e exportação

- [ ] Revisar exclusão e redistribuição de controladores.
- [ ] Adotar desativação lógica quando houver histórico relacionado.
- [ ] Padronizar confirmações de alto impacto.
- [ ] Criar serializador CSV seguro.
- [ ] Testar caracteres especiais e neutralização de fórmulas.

## Etapa 4 — Mobile e acessibilidade

- [ ] Criar navegação móvel em drawer.
- [ ] Corrigir elementos interativos sem semântica.
- [ ] Implementar gerenciamento de foco dos modais.
- [ ] Adicionar fechamento por teclado.
- [ ] Revisar tabelas críticas em telas estreitas.

## Etapa 5 — Consolidação arquitetural

- [ ] Remover progressivamente eventos inline.
- [ ] Dividir o `app.js` por domínio e interface.
- [ ] Consolidar media queries e estilos repetidos.
- [ ] Documentar o modelo relacional futuro.
- [ ] Documentar a matriz de permissões.

## Regra histórica de execução

Cada etapa deveria ser entregue em pull requests pequenos e revisáveis. Mudanças de regra de negócio deveriam possuir casos de teste antes de serem integradas à interface.

A regra de execução permanece válida, mas a lista acima é histórica. Usar `AGENTS.md`, `CURRENT_STAGE.md` e os contratos atuais para qualquer nova tarefa.
