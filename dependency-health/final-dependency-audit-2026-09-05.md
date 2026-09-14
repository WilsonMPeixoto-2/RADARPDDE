# Auditoria final de dependências — 05/09/2026

## Resultado

- instalação limpa com `npm ci`: **PASS**, sem avisos `npm warn deprecated`;
- `npm audit`: **0 vulnerabilidades**;
- árvore npm: **válida**, sem dependências inválidas/extraneous;
- contratos, arquitetura, lint, artefatos gerados, TypeScript de banco e Knip: **PASS**;
- testes unitários e de integração completos: **PASS**;
- smoke do servidor SPA e E2E focado em rotas, serviços e Excel: **PASS**.

## Atualizações consolidadas

- `@supabase/supabase-js`: 2.115.0;
- `http-server`: removido; `npm start`/`npm dev` usam o servidor SPA canônico do projeto;
- ExcelJS 4.4.0: UUID 11.1.1, Unzipper 0.12.5, Fast CSV 5.0.7;
- Glob da cadeia Archiver Utils: 13.0.6;
- Archiver 5.3.2 foi preservado porque 6.x/7.x quebraram WorkbookWriter com `INPUTSTEAMBUFFERREQUIRED` e 8.x rompeu a API CommonJS esperada pelo ExcelJS.

## Itens que permanecem fora do latest por decisão deliberada

- `@types/node` 24.13.3: permanece na linha Node 24; o latest 26.x não corresponde ao runtime de Node 24;
- Supabase CLI 2.114.0: 2.116.0 permanece bloqueado pela reprovação já documentada em pgTAP/RLS. O bloqueio é específico dessa versão e não impede avaliar versões futuras.

## Segurança operacional

Esta manutenção não altera migrations, schema, regras de negócio ou Production. Mudanças de dependências foram mantidas na branch isolada e só devem chegar a `main` após revisão/CI do PR.
