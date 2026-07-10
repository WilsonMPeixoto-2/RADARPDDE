# Estratégia inicial de testes

## Escopo atual

A primeira suíte cobre regras puras de competência sem depender do DOM, do armazenamento local ou do Supabase.

## Comandos utilizados pela integração contínua

```bash
node --check app.js
node --test tests/*.test.js
```

## Princípios

1. regras de negócio devem ser testadas fora das funções de renderização;
2. entradas persistidas devem possuir formato canônico;
3. formatos de apresentação não devem alterar o valor persistido;
4. comparações mensais devem ser explícitas e testáveis;
5. cada correção de regressão deve acrescentar um caso de teste correspondente.

## Próximas suítes

- estatísticas por escola;
- estatísticas por programa;
- situação dos programas;
- situação agregada das escolas;
- escopo por competência;
- serialização CSV;
- migrações do armazenamento local;
- operações de alto impacto.
