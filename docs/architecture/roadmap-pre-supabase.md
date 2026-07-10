# Roteiro técnico anterior ao Supabase

Este roteiro organiza as entregas que podem ser concluídas enquanto o RADAR PDDE ainda utiliza persistência local.

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

## Regra de execução

Cada etapa deve ser entregue em pull requests pequenos e revisáveis. Mudanças de regra de negócio devem possuir casos de teste antes de serem integradas à interface.
