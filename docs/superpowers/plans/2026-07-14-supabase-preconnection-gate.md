# Gate de Pré-conexão Supabase — Plano de Implementação e Encerramento

## Objetivo

Fazer o RADAR PDDE operar por serviços de aplicação e um contrato único de persistência, mantendo `localStorage` como backend padrão e comprovando o mesmo sistema contra Supabase local com Auth e RLS antes de existir qualquer projeto remoto.

## Arquitetura-alvo

```text
Frontend aprovado
       ↓
Serviços de aplicação
       ↓
Contrato único de persistência
       ├── LocalStorageRepository — modo vigente
       └── SupabaseRepository — modo preparado
```

## Restrições globais

- [x] `main` e produção não foram alteradas durante a implementação.
- [x] O modo versionado padrão permanece `local`, sem URL, chave ou requisição Supabase.
- [x] Nenhuma credencial real, `service_role`, `sb_secret_*`, senha ou token administrativo foi versionado ou enviado ao navegador.
- [x] Regras de bonificação, análise, pendência, retificação, inventário, Excel, telas e botões aprovados foram preservados.
- [x] O armazenamento local e o rollback permanecem disponíveis.
- [x] Nenhum seed é disparado automaticamente por banco vazio.
- [x] Tabelas expostas possuem grants mínimos e RLS.
- [x] Funções privilegiadas têm `search_path` fixo e `EXECUTE` revogado de `PUBLIC` quando aplicável.
- [x] Cada alteração funcional foi acompanhada por teste de regressão.

## Tasks 1 a 7 — fundação do gate

### Task 1 — gateway e unidade de trabalho

- [x] Contrato comum de repositório.
- [x] Porta de estado e snapshot canônico.
- [x] Unidade de trabalho com rollback de memória, armazenamento e repositório.
- [x] Equivalência básica dos adaptadores.

### Task 2 — bootstrap único

- [x] Remoção da integração Supabase legada do `app.js`.
- [x] Bootstrap por configuração pública e comportamento *fail-closed*.
- [x] Zero requisições Supabase no modo local.

### Tasks 3 a 5 — serviços de aplicação

- [x] Configuração, exercícios e competências.
- [x] Programas, controladores, inventário e escolas.
- [x] Verificações, pendências, tentativas, contatos e retificações.
- [x] Notas fiscais, bens e auditoria.
- [x] Handlers restritos a interface, sem persistência institucional direta.

### Task 6 — configuração e artefatos

- [x] Configuração pública gerada apenas com variáveis permitidas.
- [x] Rejeição de segredos e bloqueio de ativação acidental de produção.
- [x] Tipos TypeScript e bundles reproduzíveis.
- [x] Dependências fixadas por versão e lockfile.

### Task 7 — Auth e RLS locais

- [x] Serviço de sessão e gate de login somente no modo Supabase.
- [x] Sete identidades locais, incluindo cinco perfis ativos e cenários de negação.
- [x] `anon` sem acesso institucional.
- [x] Grants explícitos e RLS em todas as tabelas expostas.
- [x] Reset local, 94 verificações pgTAP, lint e E2E Auth/RLS aprovados.

## Task 8 — contratos, transações e resiliência

- [x] Contratos JSON compartilhados entre navegador e PostgreSQL.
- [x] Ajv `8.20.0` no frontend e `pg_jsonschema` no banco.
- [x] Compatibilidade com registros legados válidos.
- [x] RPC atômica para exercício e 12 competências.
- [x] RPC atômica para escola e programas.
- [x] RPC atômica para reanálise, pendência, tentativa e verificação.
- [x] RPCs atômicas de nota, bem, verificação e log.
- [x] `SECURITY INVOKER` utilizado sempre que possível.
- [x] Mensagens funcionais para rede, sessão, RLS, conflito, validação, transação e indisponibilidade.
- [x] Validações de negócio preservam orientação específica.
- [x] Retry limitado a leituras seguras e falhas transitórias.
- [x] Diagnóstico de capacidade do armazenamento local.
- [x] Foco, `aria-live`, Escape, teclado e retorno ao acionador.
- [x] Testes unitários, SQL e E2E aprovados.

## Task 9 — migração operacional segura

- [x] Exportação do estado local para snapshot canônico.
- [x] Validação estrutural e referencial.
- [x] Ordem de dependência determinística.
- [x] Plano com hash SHA-256 e contagens.
- [x] Staging por `importId`, entidade e lote.
- [x] Idempotência e bloqueio de reutilização com hash diferente.
- [x] Checkpoint e retomada de lotes interrompidos.
- [x] Reconciliação obrigatória do staging.
- [x] Promoção atômica para tabelas funcionais.
- [x] Compatibilidade da substituição com `safeupdate`.
- [x] Normalização de instantes ISO equivalentes na comparação canônica.
- [x] Reconciliação obrigatória do destino.
- [x] Rollback automático ou manual com preservação da causa original.
- [x] CLI sem registros integrais ou credenciais.
- [x] Runbook atualizado.
- [x] Fluxo completo aprovado no adaptador local e no Supabase local.

## Task 10 — comprovação integral e encerramento técnico

- [x] Cinco perfis, escopos de leitura e escrita e cenários de negação.
- [x] Escolas, exercícios, competências e cadastros.
- [x] Verificações, bonificação e análise técnica.
- [x] Pendência completa, tentativa, contato, cancelamento, reabertura e reanálise.
- [x] Notas de consumo, serviço e permanente.
- [x] Bens, encaminhamento e inventariação.
- [x] Auditoria, concorrência, sessão expirada e falha de rede.
- [x] Importação, interrupção, retomada, promoção, reconciliação e rollback.
- [x] Mesmo contrato funcional nos dois adaptadores.
- [x] 146 testes unitários e 1 teste de integração.
- [x] 12 migrations em PostgreSQL 17 e Supabase local.
- [x] 94 verificações pgTAP e lint PL/pgSQL.
- [x] Tipos e bundles reproduzíveis.
- [x] Playwright em desktop Chromium, Android/Chromium e iPhone/WebKit.
- [x] Acessibilidade automatizada e navegação por teclado.
- [x] Auditoria funcional sem acesso direto indevido à persistência.
- [x] Documentação de arquitetura, cobertura, auditoria e migração atualizada.

## Aceite externo do HEAD congelado

Depois do último commit documental, o encerramento não deve gerar novo commit. As evidências externas são registradas na descrição do PR 22:

1. todas as pipelines do HEAD final verdes;
2. exatamente um Preview manual correspondente ao mesmo HEAD;
3. HTTP, console, runtime e modo local verificados;
4. PR retirado de rascunho;
5. merge executado somente com autorização expressa;
6. produção confirmada em modo local após o merge.

## Estado esperado após o merge

- produção continua em `localStorage`;
- Supabase remoto continua desconectado;
- nenhuma credencial é adicionada;
- o RADAR fica integralmente preparado para conexão futura;
- criação do projeto, migrations remotas, Auth/RLS remotos, Advisors, backups, MFA e homologação permanecem para a etapa seguinte.
