# Runbook — migração, reconciliação e rollback

## Objetivo

Migrar uma cópia controlada do estado local para o backend Supabase com validação prévia, staging, retomada, promoção atômica, reconciliação e reversão.

Este runbook não autoriza migração de produção. O projeto remoto, os responsáveis, a janela e a cópia dos dados devem ser formalmente aprovados.

## Salvaguardas

- nunca executar com `service_role` no navegador;
- nunca registrar chaves, senhas ou registros integrais nos relatórios;
- não usar seed automático em tabela vazia;
- não promover quando staging ou referências divergirem;
- manter o arquivo de origem e o snapshot de rollback imutáveis;
- realizar primeiro em ambiente de homologação.

## Ferramentas

```bash
npm ci
npm run test:readiness
npm run supabase:start
npm run supabase:reset
npm run supabase:test:db
npm run supabase:lint:db
```

A CLI operacional aceita:

```bash
npm run migration:plan -- --snapshot <snapshot.json>
npm run migration:validate -- --snapshot <snapshot.json>
npm run migration:dry-run -- --snapshot <snapshot.json>
npm run migration:import:local -- --snapshot <snapshot.json> --state <estado.json> --checkpoints <diretorio>
npm run migration:reconcile -- --snapshot <snapshot.json> --state <estado.json> --checkpoints <diretorio>
npm run migration:rollback -- --import-id <id> --state <estado.json> --checkpoints <diretorio>
```

Arquivos de estado e checkpoint são gravados com permissão restrita. O relatório é sanitizado contra material com aparência de credencial.

## Fase 1 — exportação

Na aplicação local, exportar o snapshot canônico a partir da porta de estado. Registrar:

- data e responsável;
- versão do formato;
- `importId` único;
- contagens por entidade;
- hash SHA-256;
- origem da cópia.

Guardar o arquivo em repositório controlado, fora do GitHub.

## Fase 2 — validação

Executar `plan`, `validate` e `dry-run`.

Critérios obrigatórios:

- formato e versão reconhecidos;
- IDs presentes e não duplicados;
- entidades permitidas;
- referências entre escola, programa, competência, pendência, nota e bem válidas;
- zero escrita no `dry-run`;
- hash e contagens registrados.

Qualquer rejeição bloqueia a continuidade.

## Fase 3 — staging

O coordenador abre uma execução em `data_import_runs` e grava lotes em staging associados a:

- `importId`;
- entidade;
- índice do lote;
- hash da origem.

O mesmo lote pode ser reenviado sem duplicação. Um `importId` não pode ser reutilizado para conteúdo com hash diferente.

## Fase 4 — retomada

Após interrupção:

1. conservar snapshot, estado e checkpoints;
2. repetir a importação com o mesmo `importId` e hash;
3. confirmar que lotes concluídos são ignorados;
4. verificar contagem total do staging.

Não criar novo `importId` apenas para contornar uma falha.

## Fase 5 — reconciliação do staging

Comparar origem e staging por entidade:

- contagem;
- IDs ausentes;
- IDs inesperados;
- registros alterados.

Representações ISO equivalentes do mesmo instante são normalizadas para comparação. Datas civis permanecem inalteradas.

A promoção é bloqueada se houver qualquer divergência.

## Fase 6 — promoção atômica

A RPC de promoção substitui as tabelas funcionais dentro de uma única transação PostgreSQL. As exclusões totais são intencionais e usam `WHERE true`, compatível com a proteção `safeupdate`.

A promoção preserva tabelas técnicas de Auth, perfis, escopos, importação e auditoria. Em falha, a transação é revertida pelo PostgreSQL.

## Fase 7 — reconciliação do destino

Depois da promoção, exportar o destino e repetir a comparação integral. A execução somente pode ser marcada como reconciliada quando:

- todas as entidades estiverem `ok`;
- contagens coincidirem;
- não houver ausências, excedentes ou alterações;
- o relatório resumido estiver armazenado.

## Fase 8 — rollback

O rollback usa o snapshot anterior gravado na abertura da execução. Pode ser acionado:

- automaticamente após divergência pós-promoção;
- manualmente por decisão de homologação.

Após rollback:

1. reconciliar o estado restaurado com o snapshot anterior;
2. registrar data, responsável e motivo;
3. não apagar evidências da execução;
4. classificar a causa antes de nova tentativa.

## Critérios de homologação remota

- migrations aplicadas sem desvio;
- extensões disponíveis;
- Auth e cinco perfis testados;
- RLS de leitura e escrita comprovada;
- importação interrompida e retomada testadas;
- promoção e rollback testados;
- Security Advisor e Performance Advisor revisados;
- backup e restauração comprovados;
- Preview aprovado;
- autorização expressa para eventual ativação.
