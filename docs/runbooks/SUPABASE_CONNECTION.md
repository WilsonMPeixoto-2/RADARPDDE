# Runbook — conexão e operação controlada do Supabase

**Estado:** vigente; Production conectada  
**Atualizado em:** 5 de setembro de 2026

> Antes de qualquer operação dependente do ambiente, comece em [`../../START_HERE.md`](../../START_HERE.md), leia [`../CURRENT_STATE.md`](../CURRENT_STATE.md) e revalide o remoto. Este runbook não autoriza migration, importação, alteração de Auth/RLS, deploy de Edge Function ou release por si só.

## 1. Baseline

A baseline funcional do PR #260 contém **46 migrations**. A lista e a ordem reais vêm de `supabase/migrations/` e do histórico do CLI, não de uma lista manual paralela.

Contratos estáveis:

```text
Production data mode: supabase-production
Production repository: SupabaseRepository
fallback local em Production: proibido / fail-closed
Supabase JS e CLI: versões fixadas em package.json/lockfile
Node.js CI: versão definida nos workflows do projeto
```

Valores mutáveis de deployment, projeto e ambiente devem ser consultados novamente quando forem necessários.

## 2. Regras permanentes

- não reutilizar projeto de outra aplicação;
- não inserir chave administrativa no frontend, GitHub, logs ou artefatos;
- navegador usa somente credencial publicável;
- Preview e Production são ambientes distintos;
- não aplicar seed implicitamente em banco remoto;
- não alterar schema com histórico divergente;
- não transformar falha de configuração de Production em fallback local;
- não publicar dump SQL como evidência;
- não executar operação remota apenas porque teste local passou;
- não reutilizar contas pessoais/operacionais como identidades técnicas automatizadas;
- não editar migration histórica para corrigir comportamento posterior.

## 3. Validação local

```bash
npm ci
npm run test:readiness
npm run check:runtime-config
npm run build:vercel
npm run supabase:start
npm run supabase:reset
npm run supabase:test:db
npm run supabase:lint:db
npm run typecheck:database
```

Para escrita crítica, a evidência preferida atravessa:

```text
ação real da aplicação
→ persistência no Supabase descartável
→ leitura direta
→ reload
→ nova leitura/renderização
```

Os workflows funcionais do PR #260 usam esse padrão em jornadas de NF, patrimônio, avaliação mensal e fluxos correlatos.

## 4. Readiness Supabase

O gate local de Supabase executa, conforme o workflow corrente:

```text
start/reset
→ preflight de contratos
→ pgTAP
→ lint PL/pgSQL
→ regeneração de tipos/cliente
→ reprodutibilidade
→ Auth das fixtures
→ Gestão de Equipe
→ frontend + Auth + RLS
→ cleanup
```

### Regra para falha do CI

Classificar o primeiro componente que divergiu e tentar reproduzir antes de alterar código. Falha transitória de runner não autoriza “correção” funcional.

No PR #263, a primeira execução do SHA `617355e1...` falhou em **Regenerar tipos e cliente fixado**. O mesmo job foi reexecutado no mesmo SHA, sem mudança de código, e passou integralmente, inclusive regeneração, reprodutibilidade, Auth, Edge Function e frontend/RLS. A falha foi classificada como transitória.

## 5. Validação remota somente leitura

Antes de diagnosticar Production, confirmar:

1. projeto correto e saúde do serviço;
2. deployment e SHA publicados;
3. `radar-build-manifest.json`;
4. modo de dados Production;
5. sessão/papel efetivo;
6. `cre_scope`/escopos;
7. histórico de migrations;
8. Edge Functions necessárias;
9. logs sanitizados do componente afetado;
10. integridade agregada quando pertinente.

Não imprimir chaves, tokens ou payloads pessoais.

## 6. Migrations

Consulta/dry-run, quando o ambiente estiver vinculado:

```bash
supabase migration list --linked
supabase db push --linked --dry-run
```

Aplicação real:

```bash
supabase db push --linked
```

O comando disponível não é autorização. Antes de aplicar: branch/PR, histórico alinhado, reset, pgTAP, lint, tipos, backup/restauração quando aplicável, revisão do SQL/grants/RLS e plano de reversão.

Seguir [`SUPABASE_MIGRATION_AND_ROLLBACK.md`](SUPABASE_MIGRATION_AND_ROLLBACK.md).

## 7. Baseline técnica recente

A linha recente já incorporada inclui:

- Gestão de Equipe com lookup Auth exato e compensação;
- identidade institucional de escola;
- criação transacional de exercício/competências;
- individualização fiscal/Assessoria por `registered_invoice_id`;
- `a_identificar` atômico;
- novo envio/substituição/reabertura e sincronização do próximo ator;
- vínculo Nota Fiscal ↔ bem patrimonial;
- derivação `encampInventario` do conjunto de permanentes;
- PR #260 com `save_asset_with_verification_and_log` e limpeza/proteção de aliases técnicos no payload de verificação.

`20260904040000_functional_reliability_inventory_sync.sql` **não é candidata**: integra a baseline funcional publicada do PR #260.

## 8. Auth e perfis

Papéis correntes:

```text
controller
federal_assistant
sme_management
inventory
technical_admin
```

Diagnóstico de login:

```text
sessão
→ user_profiles ativo
→ profile ativo
→ current_app_role()
→ escopos/vínculos
→ gate da aplicação
→ leitura autorizada
```

A simulação visual de `technical_admin` não muda o JWT real.

## 9. Gestão de Equipe

```text
DirectoryService
→ TeamAccountGateway
→ team-account-management
→ Auth Admin + RPC transacional
```

### Contratos

- origem oficial passa; origem não autorizada falha;
- `OPTIONS` não depende da autenticação do usuário;
- requisição funcional exige JWT e papel autorizado;
- e-mail normalizado é resolvido por `resolve_team_auth_user_id_by_email`;
- conta existente pode ser reutilizada somente sem vínculo ativo conflitante;
- mais de uma conta/associação ambígua gera conflito, não escolha arbitrária;
- desativação preserva histórico;
- falha de banco depois de alteração em Auth exige compensação.

## 10. Escolas e carteira

Nova escola exige identidade institucional real, competência inicial válida e demais campos definidos no serviço/schema. Duplicidades protegidas de INEP/CNPJ/SICI são rejeitadas.

`controller_id` é responsabilidade principal. Controlador não redistribui carteira pelo cadastro comum; redistribuição usa fluxo autorizado próprio.

## 11. Notas Fiscais, Pendências e Assessoria

- análise fiscal e Consulta Assessoria são individualizadas por invoice onde aplicável;
- `a_identificar` novo nasce `Incorreto + Pendência` atomicamente;
- novo envio não resolve a Pendência;
- substituição enquanto `Aguardando reanálise` é suportada conforme PR #254;
- próximo ator segue o estado conforme PR #256;
- reanálise atua sobre a tentativa real e preserva o conteúdo histórico do envio;
- nenhuma regra de legado é criada por pareamento heurístico.

## 12. Patrimônio

Regra atual, sem a simplificação que causou a confusão de regressão:

```text
NF permanente + número + processo de inventário já existente
→ bem nasce Encaminhada
→ UI: Aguardando Inventariação
→ pode concluir inventariação

NF permanente sem processo
→ bem nasce Não encaminhada
→ quando processo existir: Encaminhar
→ depois: Inventariar
```

Logo, `Não encaminhada → Encaminhada → Inventariada` é a sequência do **ramo que realmente está Não encaminhada**, não o estado inicial obrigatório de toda NF permanente.

Outros contratos:

- `encampInventario`: sem permanente = N/A; algum não encaminhado = Não; todos encaminhados/inventariados = Sim;
- Prontuário vincula NF ↔ bem por identidade técnica;
- encaminhamento posterior de bem vinculado persiste bem + verificação + log pela mesma RPC;
- bem derivado não aceita edição isolada do número fiscal;
- conclusão da inventariação exige estado `Encaminhada` e responsável;
- guards de ação crítica evitam duplicação imediata enquanto a chamada está em andamento.

## 13. Backup e recuperação

O gate de backup/restauração usa pilhas descartáveis e comprova equivalência técnica. Não substitui política institucional de retenção/DR.

## 14. Importação

Operação remota de importação exige pacote, janela e autorização próprios. A existência de staging/RPCs não constitui autorização de uso.

## 15. Exportações

Quando o contrato exige auditoria inicial, falha em registrar a auditoria bloqueia o download. Alteração material do Excel SME exige seu gate específico.

## 16. Diagnóstico por fronteira

```text
controle visível/habilitado
→ handler
→ serviço
→ repositório
→ requisição
→ CORS/JWT
→ RLS/RPC/trigger
→ banco
→ resposta
→ estado/renderização
→ releitura
```

Corrigir a primeira fronteira comprovadamente divergente. Não redesenhar regra de negócio para fazer um teste antigo passar.

## 17. Referências

- [`../CURRENT_STATE.md`](../CURRENT_STATE.md)
- [`../reference/SUPABASE_DATA_DICTIONARY.md`](../reference/SUPABASE_DATA_DICTIONARY.md)
- [`../reference/SUPABASE_FUNCTIONAL_COVERAGE.md`](../reference/SUPABASE_FUNCTIONAL_COVERAGE.md)
- [`../reference/SUPABASE_PERMISSIONS_MATRIX.md`](../reference/SUPABASE_PERMISSIONS_MATRIX.md)
- [`../architecture/supabase-readiness.md`](../architecture/supabase-readiness.md)
