# Auditoria funcional Frontend ↔ Supabase

**Data de abertura:** 6 de agosto de 2026  
**Estado:** Tasks 1 e 2 concluídas — baseline e revisão estática das 41 operações  
**Registro estruturado:** `docs/audits/2026-08-06-functional-supabase-audit.json`

## Hierarquia das fontes

1. código efetivamente versionado na `main`;
2. estado remoto comprovado do Supabase Production;
3. deployment efetivamente publicado na Vercel Production;
4. documentação, descrições de PR e resumos de workflows como fontes auxiliares.

Nenhuma conclusão desta auditoria será baseada apenas em documentação.

## Baseline confirmado

| Componente | Estado confirmado |
|---|---|
| `main` | `97c8bedbd7c93d82d527e183762b37a0934bd5f0` |
| PR mais recente integrado | nº 155 — atualização documental após a autorização da carteira |
| Vercel Production | `dpl_3XkgxsWF58VKiScasmUkUcwtJWxu`, `READY` |
| Commit da Vercel Production | `97c8bedbd7c93d82d527e183762b37a0934bd5f0` |
| Projeto Supabase | `scnryinorqeucbfkioxo` |
| Migrations em Production | 27 |
| Última migration | `202608050001_school_assignment_authorization` |
| Auditoria agregada | `healthy`, `totalIssues = 0`, `schemaVersion = 1` |
| Edge Function | `team-account-management`, versão 108, `ACTIVE`, JWT obrigatório |
| Supabase JS | `2.110.9` |
| Supabase CLI | `2.110.0` |
| Issues abertas | nenhuma |
| Workflows observados no SHA da `main` | 6 execuções; nenhuma falha localizada |

## Operações auditadas

O registro estruturado contém exatamente 41 operações, distribuídas nos seguintes grupos:

| Grupo | Quantidade |
|---|---:|
| autenticação, navegação, leituras e exportações | 10 |
| configurações, escolas e Gestão de Equipe | 11 |
| verificações, pendências, notas, bens e auditoria | 17 |
| operações técnicas e monitoramento | 3 |
| **Total** | **41** |

Cada operação contém controle ou âncora de frontend, serviço, repositório, recursos remotos, perfis permitidos e negados, forma de persistência, concorrência, releitura, evidências e achados.

## Resultado da revisão estática

A revisão direta do código da `main` classificou as 41 operações sem reaproveitar automaticamente os estados documentais anteriores.

| Classificação | Quantidade |
|---|---:|
| Percurso estático confirmado | 35 |
| Lacuna técnica comprovada | 4 |
| Divergência documental | 2 |
| **Total** | **41** |

### Lacunas técnicas

1. **SCH-01 — cadastro de escola:** novas escolas recebem id, INEP, CNPJ, designação e denominação artificiais; o formulário não fornece os identificadores institucionais.
2. **ASSET-02 — edição de bem:** usa persistência genérica, sem `saveAssetWithLog`, log administrativo ou versão otimista explícita.
3. **EXP-01 — relatório institucional:** o arquivo é gerado, mas a auditoria usa `registerLog` + `persist('logs')`, reenviando o snapshot integral por `upsert`.
4. **EXP-02 — Excel SME:** o pipeline mensal está conectado, porém repete a mesma rota problemática de auditoria assíncrona.

Essas quatro lacunas serão reproduzidas em ambiente local ou descartável antes de qualquer correção. Nenhuma mudança funcional foi feita nesta branch.

### Divergências documentais

- **CFG-03 e CFG-04:** a matriz ainda marca a gestão de programas como decisão pendente. O código, o serviço, a RPC e as permissões atuais implementam a operação para Gestão SME e Administrador técnico. A auditoria não alterará essa regra; somente reconciliará a documentação.
- O manifesto da matriz ainda aponta o commit `30bdecc…`, anterior aos PRs 150, 154 e 155.

### Percursos estáticos confirmados

Os demais 35 percursos possuem ligação identificável entre interface, serviço, repositório e backend. Os principais padrões encontrados foram:

- configurações e programas usam RPCs atômicas com `row_version` e `administrative_logs`;
- Gestão de Equipe usa `DirectoryService` → `TeamAccountGateway` → Edge Function → RPC transacional;
- redistribuição de carteira usa RPC atômica e proteção adicional no banco;
- verificações e pendências usam RPCs específicas com controle de versão, idempotência ou compensação;
- notas fiscais preservam efeitos vinculados em bens, verificações e logs na mesma transação;
- criação, encaminhamento e inventariação de bens usam `saveAssetWithLog`;
- `AuditService.record` usa a rota append-only correta, embora as exportações ainda não o utilizem;
- importação, monitor geral e auditoria de integridade possuem percursos técnicos próprios.

`static-confirmed` não equivale a funcionamento integral comprovado. Significa apenas que o caminho estático existe e é coerente; persistência, autorização negativa e releitura serão exercitadas nas próximas tarefas.

## Limites preservados

- nenhuma alteração de regra de negócio;
- nenhuma mutação de dados reais em Production;
- nenhuma criação de conta técnica;
- nenhuma correção antes da reprodução e da localização da primeira fronteira divergente;
- novos testes apenas quando ligados diretamente a uma falha comprovada;
- correções funcionais em PRs separados da documentação da auditoria.

## Próxima etapa

A Task 3 comprovará autenticação, leitura, navegação e escopos com Supabase local e identidades sintéticas. Production continuará limitada a manifesto, bloqueio anônimo, preflight, integridade agregada e outras consultas não destrutivas. O smoke autenticado remoto permanecerá desativado.
