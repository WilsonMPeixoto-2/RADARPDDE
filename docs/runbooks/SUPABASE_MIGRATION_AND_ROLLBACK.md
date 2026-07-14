# Runbook — migração, reconciliação e rollback

## Objetivo

Migrar dados locais para Supabase de forma controlada, auditável e reversível. Este procedimento só será executado em etapa futura e começa pelo Preview.

## Princípios

1. O snapshot local é a fonte de verdade durante a primeira migração.
2. Nenhum dado é apagado do navegador durante a homologação.
3. Toda importação possui `import_id` único.
4. Importação repetida com o mesmo `import_id` deve ser recusada.
5. A reconciliação compara IDs, contagens e conteúdo.
6. Produção não é ativada enquanto houver diferença não explicada.
7. O rollback deve permitir restaurar o estado canônico nas chaves `radar_pdde_*`.
8. Snapshot com dados pessoais não deve ser versionado no GitHub.
9. Campos técnicos do banco não podem ocultar divergências funcionais.
10. Escopo somente leitura jamais pode ser reutilizado como autorização de escrita.

## 1. Congelamento operacional

Antes da exportação:

- comunicar janela de migração;
- impedir alterações concorrentes;
- registrar data, navegador, usuário e versão do RADAR;
- executar a regressão local;
- confirmar que o armazenamento local está íntegro;
- manter `dataMode: 'local'` e ambas as feature flags desativadas.

## 2. Exportação canônica do estado atual

O estado funcional atual utiliza as chaves `radar_pdde_*` do `app.js`. A exportação inicial deve usar a ponte bidirecional:

```javascript
const result = window.RadarStateBridge.exportLegacySnapshot(
  window.localStorage,
  {
    version: '1',
    importId: 'identificador-unico-da-migracao',
    exportedAt: new Date().toISOString()
  }
);

const { snapshot, warnings, rejected, sourceDataVersion } = result;
```

A ponte:

- lê o armazenamento sem alterá-lo;
- converte configuração, exercícios e competências;
- converte escolas, programas e vínculos;
- converte verificações, pendências, tentativas e contatos;
- converte bens, inventariação e notas fiscais;
- preserva `compKey`, programa, verificação, bem associado e data da nota;
- preserva atributos legados em `payload`;
- usa metadados laterais para reconciliação exata sem poluir os objetos operacionais;
- não usa metadados para ocultar alterações posteriores feitas pelo usuário;
- gera IDs determinísticos somente quando o registro antigo não possui identificador;
- registra advertências e rejeições para análise humana.

Interromper a exportação se `rejected` não estiver vazio ou se houver advertência não explicada.

## 3. Evidências da origem

Salvar duas cópias do snapshot:

- cópia de trabalho;
- cópia imutável de contingência.

Registrar também:

- `sourceDataVersion`;
- hash SHA-256;
- contagem por entidade;
- navegador e usuário;
- commit do RADAR;
- lista de chaves locais exportadas;
- versão dos metadados laterais de reconciliação.

## 4. Validação prévia

Executar:

```javascript
const validation = window.RadarSnapshotTools.validateSnapshot(snapshot);
```

Interromper se houver:

- entidade desconhecida ou que não seja array;
- registro sem `id`;
- ID duplicado;
- versão ausente;
- data inválida;
- formato desconhecido;
- FK lógica ausente na origem;
- registro rejeitado pela ponte.

Também executar uma restauração simulada:

```javascript
const simulation = window.RadarStateBridge.restoreCanonicalSnapshotToLegacyStorage(
  snapshot,
  window.localStorage,
  { dryRun: true }
);
```

A simulação deve listar as gravações previstas sem modificar o navegador.

## 5. Preparação do banco

Aplicar, na ordem:

1. `202607130001_core_schema.sql`;
2. `202607130002_auth_and_rls.sql`;
3. `202607130003_audit_and_import.sql`;
4. `202607130004_competence_bonus_deadline.sql`;
5. `202607130005_operational_context.sql`;
6. `202607130006_authorization_hardening.sql`;
7. `202607130007_configuration_audit_coverage.sql`.

Depois:

- executar advisors de segurança e desempenho;
- confirmar banco vazio ou ambiente descartável;
- criar usuários mínimos de homologação;
- registrar `data_import_runs` como `pending`;
- confirmar unicidade de `import_id`;
- confirmar RLS e ausência de acesso `anon`;
- confirmar apenas um perfil ativo por usuário;
- confirmar que `user_school_scopes.can_write = false` não permite escrita;
- confirmar triggers de auditoria em dados operacionais e configurações institucionais.

Nenhuma migration é aplicada automaticamente pelo frontend.

## 6. Ordem relacional de importação

A ordem deve respeitar as FKs:

1. `competences` e `programs`;
2. `app_config`;
3. `controllers` e `inventory_team_members`;
4. `profiles`;
5. `schools`;
6. `school_programs`;
7. `verifications`;
8. `pendencies`;
9. `pendency_attempts` e `pendency_contacts`;
10. `assets`;
11. `registered_invoices`;
12. `administrative_logs`;
13. `user_profiles` e `user_school_scopes`;
14. `data_import_runs`.

`assets` precisa preceder `registered_invoices`, porque a nota pode referenciar `linked_asset_id`. `audit_events` não deve ser importada a partir do navegador.

## 7. Importação em lotes

O repositório preparado usa paginação integral e lote de escrita configurável:

```javascript
const repository = new RadarSupabaseRepository.SupabaseRepository({
  client,
  pageSize: 500,
  writeBatchSize: 250
});

await repository.restoreSnapshot(snapshot, { batchSize: 250 });
```

Requisitos:

- utilizar backend controlado ou sessão com RLS apropriada;
- registrar entidade, lote, quantidade e resultado;
- parar no primeiro erro de integridade;
- não expor credencial administrativa no navegador;
- não utilizar `service_role` no frontend;
- não repetir automaticamente lote com resultado desconhecido.

## 8. Reconciliação

Exportar o destino por `SupabaseRepository.exportSnapshot()` e executar:

```javascript
const report = window.RadarSnapshotTools.reconcileSnapshots(
  sourceSnapshot,
  targetSnapshot
);
```

O relatório deve apresentar, por entidade:

- contagem de origem e destino;
- IDs ausentes;
- IDs inesperados;
- IDs com conteúdo divergente.

Campos técnicos gerados pelo banco, como `created_at`, `updated_at` e `row_version`, exigem normalização explícita antes da comparação. Nenhum campo funcional pode ser omitido.

Somente marcar `data_import_runs.status = 'reconciled'` quando todas as diferenças estiverem resolvidas ou formalmente justificadas.

## 9. Homologação funcional

No Preview:

- abrir todas as áreas e perfis;
- validar Dashboard, Carteira e competências;
- criar, recarregar e alternar exercício anual;
- editar escola, controlador e equipe;
- abrir, reenviar, reanalisar, resolver e cancelar pendência;
- registrar contato e cobrança;
- testar retificação;
- registrar consumo, serviço e bem permanente;
- verificar efeitos derivados da nota sobre assessoria e inventário;
- editar e remover nota;
- inventariar bem e preservar responsável/data;
- gerar Excel;
- testar negativas de RLS;
- confirmar auditoria operacional e administrativa;
- testar duas sessões alterando o mesmo registro;
- simular indisponibilidade do Supabase;
- confirmar que o snapshot local continua recuperável.

## 10. Concorrência

Para alterar registro existente, usar `updateWithVersion()`:

```javascript
await repository.updateWithVersion(
  'schools',
  { id: school.id, denomination: newName },
  school.row_version
);
```

Quando a versão estiver obsoleta, a operação deve retornar `OPTIMISTIC_CONFLICT`. A interface deverá informar ao usuário e recarregar o registro antes de nova tentativa.

## 11. Casos mínimos de RLS

- usuário anônimo recebe acesso negado;
- controlador não acessa escola de outro controlador;
- controlador com escopo adicional somente leitura não grava;
- controlador com `can_write = true` grava apenas na escola concedida;
- inventário não altera análise técnica;
- Gestão SME consulta sem excluir registros operacionais;
- Assistente opera dentro do escopo permitido;
- tentativa de manter dois perfis ativos para o mesmo usuário é recusada;
- apenas Administrador técnico exclui dados operacionais;
- auditoria não pode ser editada por usuário autenticado.

## 12. Critérios para promoção

- reconciliação sem diferenças não justificadas;
- ida e volta canônico → local → canônico aprovada;
- testes unitários e E2E verdes;
- sete migrations aplicadas em ambiente descartável sem erro;
- advisors avaliados;
- RLS homologada;
- Preview estável;
- snapshot local preservado;
- plano de contingência testado;
- autorização expressa para produção.

## Rollback imediato

### Antes da promoção

1. manter produção em `local`;
2. desativar o Preview Supabase;
3. marcar importação como `failed` ou `rolled_back`;
4. preservar logs e relatório;
5. corrigir em nova branch;
6. repetir em banco limpo.

### Depois da promoção

1. restaurar configuração `dataMode: 'local'` e flags `false`;
2. publicar o último commit local homologado;
3. confirmar HTTP 200 e ausência de requisições Supabase;
4. restaurar o snapshot canônico nas chaves locais, quando necessário:

```javascript
window.RadarStateBridge.restoreCanonicalSnapshotToLegacyStorage(
  snapshot,
  window.localStorage,
  {
    dataVersion: 'rollback-identificado',
    pendencySchemaVersion: 'versao-homologada'
  }
);
```

5. recarregar o RADAR e executar a regressão local;
6. congelar escrita no banco até análise;
7. preservar logs e auditoria;
8. registrar incidente e causa raiz.

## Rollback de dados

Não executar exclusões massivas diretamente. Preferir:

- restaurar branch de banco de desenvolvimento;
- restaurar backup do projeto;
- reimportar snapshot validado em banco limpo;
- utilizar `import_id` e auditoria para delimitar o conjunto afetado.

## Evidências mínimas

- hash e cópia do snapshot;
- versão dos dados locais;
- advertências e rejeições;
- commit e deployment;
- lista das sete migrations;
- relatório de advisors;
- relatório de reconciliação;
- relatório de restauração simulada;
- resultado dos testes;
- matriz de usuários e perfis;
- decisão de promoção ou rollback;
- horário e responsável por cada ação.
