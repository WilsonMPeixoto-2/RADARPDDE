# Auditoria funcional Frontend ↔ Supabase

**Data de abertura:** 6 de agosto de 2026  
**Estado:** segundo checkpoint concluído — Tasks 1, 2, 3 e 4  
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

O registro estruturado contém exatamente 41 operações. Cada operação registra controles ou âncoras de frontend, serviço, repositório, recursos remotos, perfis permitidos e negados, forma de persistência, concorrência, releitura, evidências e achados.

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

A lacuna `SCH-01` já foi reproduzida dinamicamente na Task 4. As demais continuam aguardando reprodução controlada. Nenhuma mudança funcional foi feita nesta branch.

### Divergências documentais

- **CFG-03 e CFG-04:** a matriz ainda marca a gestão de programas como decisão pendente. O código, o serviço, a RPC e as permissões atuais implementam a operação para Gestão SME e Administrador técnico. A auditoria não alterará essa regra; somente reconciliará a documentação.
- O manifesto da matriz ainda aponta o commit `30bdecc…`, anterior aos PRs 150, 154 e 155.

## Prova dinâmica de autenticação, leitura e navegação

### Ambiente

- Supabase local integralmente descartável;
- 27 migrations;
- sete identidades Auth sintéticas;
- cinco perfis ativos, um histórico inativo e uma identidade sem perfil;
- nenhuma conta ou dado de Production utilizado;
- nenhuma mutação em Production.

### Resultado válido

A execução `31071643516` passou integralmente após separar os modos compatíveis:

1. **Modo Supabase autenticado**
   - login e logout dos cinco perfis;
   - negativa para perfil inativo e usuário sem perfil;
   - papel efetivo e simulação técnica;
   - RLS de Controlador, Assistente e Gestão SME;
   - ciclo real da Gestão de Equipe contra banco e Auth locais.

2. **Modo sintético da interface**
   - rotas canônicas;
   - histórico, reload, nova aba e fallback autorizado;
   - preservação de competência, foco e rolagem;
   - Carteira, filtros, dados e ações;
   - transporte para Prontuário e Pendências;
   - contratos de handlers e IDs do frontend.

### Diagnóstico da primeira execução

A execução `31071070501` não revelou defeito do produto. Ela misturou `canonical-routes` e `cycle-b-carteira`, que não fazem login e manipulam o estado sintético diretamente, com o runtime `supabase-preview`, que exige autenticação. O gate permaneceu fechado e as telas não ficaram visíveis.

A hipótese foi testada sem alterar o produto: as suítes autenticadas permaneceram no runtime Supabase e as suítes sem login foram executadas depois da restauração de `config.runtime.js`. Ambas passaram. O workflow temporário foi removido após o sucesso.

### Classificação dinâmica deste checkpoint

| Operação | Estado atual |
|---|---|
| `AUTH-01` | comprovada localmente; parcial em Production porque o smoke autenticado recorrente permanece desativado |
| `NAV-01` | comprovada |
| `NAV-02` | comprovada localmente; parcial em Production |
| `COMP-01` | comprovada |
| `READ-01` | comprovada localmente; parcial em Production |
| `READ-02` | comprovada localmente; parcial em Production |
| `READ-03` | comprovada localmente; parcial em Production |
| `READ-04` | comprovada localmente; parcial em Production |

A limitação de Production é deliberada: o PR nº 148 preparou o smoke autenticado, mas ele não será ativado nem receberá identidades técnicas nesta auditoria sem autorização específica.

## Prova dinâmica de Gestão de Equipe, escolas e carteira

### Ambiente e execução

A execução `31101490701` foi concluída com sucesso em Supabase local descartável:

- 14 contratos unitários de transição de perfil, gateway e autorização de carteira;
- 27 migrations e 244 testes pgTAP;
- sete identidades Auth sintéticas;
- três percursos Playwright autenticados;
- recriação final do banco e consulta SQL direta com zero registros residuais da auditoria;
- nenhuma conta, dado ou escrita de Production.

### Percursos confirmados

| Operação | Resultado |
|---|---|
| `TEAM-01` | criar e atualizar Controlador, incluindo Auth, perfil, diretório, log e releitura |
| `TEAM-02` | desativar Controlador e redistribuir carteira de forma transacional |
| `TEAM-03` | criar e atualizar integrante da Equipe de Inventário |
| `TEAM-04` | desativar integrante da Equipe de Inventário preservando histórico |
| `SCH-02` | editar unidade, programas e responsável autorizado com versão e log |
| `SCH-03` | redistribuir carteira somente pelo perfil autorizado, com proteção também no backend |

### Lacuna dinâmica confirmada — `SCH-01`

O cadastro foi executado pelo **modal real do produto**, autenticado como Assistente, e relido diretamente em `schools`, `school_programs` e `administrative_logs`.

O fluxo técnico funciona: a transação grava a escola, vincula o programa `BASIC`, preserva o controlador escolhido e registra `Escola Cadastrada` com autoria. Entretanto, o formulário não solicita cinco identificadores institucionais essenciais. Para uma escola nova, o serviço gera e persiste:

- ID no padrão `esc-<timestamp>`;
- INEP aleatório no padrão `330xxxxx`;
- CNPJ fictício no padrão `00.000.000/0001-xx`;
- designação artificial no padrão `01.09.xxx`;
- denominação `Nova Unidade Escolar xx`.

Portanto, `SCH-01` está classificada como **broken/P0** por integridade semântica. Não há falha de rede, RLS ou atomicidade: o problema é que valores artificiais são aceitos como dados institucionais definitivos e o sucesso técnico oculta essa incorreção.

### Fronteira da correção

A branch de auditoria não alterará o cadastro. A correção deve ocorrer em frente separada e somente após fixar o contrato funcional dos campos institucionais, suas validações e a regra do identificador primário, sem inventar dados ou critérios não aprovados.

## Percursos estáticos confirmados

Os demais percursos coerentes usam, conforme o domínio:

- RPCs atômicas com `row_version` e `administrative_logs`;
- `DirectoryService` → `TeamAccountGateway` → Edge Function → RPC transacional;
- proteção de redistribuição de carteira também no banco;
- RPCs específicas para verificações e pendências;
- transações de notas fiscais com efeitos vinculados;
- `saveAssetWithLog` para criação, encaminhamento e inventariação de bens;
- `AuditService.record` para auditoria append-only, embora as exportações ainda não o utilizem;
- rotas próprias de importação, monitoramento e integridade.

`static-confirmed` não equivale a funcionamento integral comprovado. Persistência, autorização negativa e releitura serão exercitadas nas próximas tarefas.

## Limites preservados

- nenhuma alteração de regra de negócio;
- nenhuma mutação de dados reais em Production;
- nenhuma criação de conta técnica;
- nenhuma correção antes da reprodução e da localização da primeira fronteira divergente;
- novos testes apenas quando ligados diretamente a uma falha comprovada;
- correções funcionais em PRs separados da documentação da auditoria.

## Próxima etapa

A Task 5 auditará verificações, pendências e concorrência: alterações documentais, consolidação e retificação, abertura e reanálise de pendências, idempotência, conflitos otimistas, releitura e mensagens de erro.
