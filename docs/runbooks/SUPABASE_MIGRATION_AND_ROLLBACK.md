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
7. O rollback deve exigir apenas retornar o modo para `local` e publicar a versão anterior.
8. Snapshot com dados pessoais não deve ser versionado no GitHub.

## 1. Congelamento operacional

Antes da exportação:

- comunicar janela de migração;
- impedir alterações concorrentes;
- registrar data, navegador, usuário e versão do RADAR;
- executar a regressão local;
- confirmar que o armazenamento local está íntegro;
- manter `dataMode: 'local'` e ambas as feature flags desativadas.

## 2. Exportação canônica do estado atual

O estado funcional atual não está gravado nas novas chaves do `LocalStorageRepository`; ele utiliza as chaves legadas `radar_pdde_*` do `app.js`. Portanto, a exportação inicial deve usar o adaptador dedicado:

```javascript
const result = window.RadarLegacyStateAdapter.exportLegacySnapshot(
  window.localStorage,
  {
    version: '1',
    importId: 'identificador-unico-da-migracao',
    exportedAt: new Date().toISOString()
  }
);

const { snapshot, warnings, rejected, sourceDataVersion } = result;
```

O adaptador:

- lê o armazenamento sem alterá-lo;
- converte escolas, programas, verificações, pendências, tentativas, contatos, bens, notas e logs;
- preserva atributos legados em `payload`;
- gera IDs determinísticos somente quando o registro antigo não possui identificador;
- registra advertências e rejeições para análise humana.

A exportação deve ser interrompida se `rejected` não estiver vazio ou se houver advertência não explicada.

O snapshot resultante possui:

```json
{
  "format": "radar-pdde-snapshot",
  "version": "1",
  "importId": "identificador-unico",
  "exportedAt": "data ISO-8601",
  "entities": {}
}
```

Salvar duas cópias:

- cópia de trabalho;
- cópia imutável de contingência.

Registrar também:

- `sourceDataVersion`;
- hash SHA-256 do arquivo;
- contagem por entidade;
- navegador e usuário que realizaram a exportação.

## 3. Validação prévia

Executar:

```javascript
const validation = window.RadarSnapshotTools.validateSnapshot(snapshot);
```

Interromper se houver:

- entidade que não seja array;
- registro sem `id`;
- ID duplicado;
- versão ausente;
- data inválida;
- formato desconhecido;
- FK lógica ausente na origem;
- registro rejeitado pelo adaptador.

## 4. Preparação do banco

- criar projeto ou branch de desenvolvimento autorizada;
- aplicar as migrations na ordem versionada;
- executar os advisors de segurança e desempenho;
- confirmar banco vazio ou ambiente descartável;
- criar usuários de homologação sem dados reais desnecessários;
- criar registro em `data_import_runs` com estado `pending`;
- verificar se `import_id` ainda não existe;
- alterar estado para `running` apenas no início efetivo.

Nenhuma migration é aplicada automaticamente pelo frontend.

## 5. Ordem relacional de importação

A ordem não deve ser simplesmente alfabética. Deve respeitar as FKs:

1. `competences` e `programs`;
2. `app_config`;
3. `controllers` e `inventory_team_members`;
4. `schools`;
5. `school_programs`;
6. `verifications`;
7. `pendencies`;
8. `pendency_attempts` e `pendency_contacts`;
9. `assets` e `registered_invoices`;
10. `administrative_logs`;
11. perfis, usuários e escopos de homologação;
12. controle da importação.

`profiles` é semeada pela migration de autenticação. `audit_events` não deve ser importada a partir do navegador.

## 6. Importação em lotes

Gerar lotes com:

```javascript
const batches = window.RadarSnapshotTools.buildImportBatches(snapshot, 100);
```

Antes de executar, reordenar os lotes conforme a ordem relacional acima.

Requisitos:

- utilizar transação por lote ou função de backend controlada;
- registrar entidade, lote, quantidade e resultado;
- parar no primeiro erro de integridade;
- não expor credencial administrativa no navegador;
- não utilizar a chave `service_role` no frontend;
- não repetir automaticamente lote com resultado desconhecido.

## 7. Reconciliação

Exportar o destino por `SupabaseRepository.exportSnapshot()` e executar:

```javascript
const report = window.RadarSnapshotTools.reconcileSnapshots(
  sourceSnapshot,
  targetSnapshot
);
```

O relatório deve apresentar, por entidade:

- contagem de origem;
- contagem de destino;
- IDs ausentes no destino;
- IDs inesperados no destino;
- IDs com conteúdo divergente.

Campos técnicos gerados pelo banco, como `created_at`, `updated_at` e `row_version`, devem ser tratados por uma normalização de reconciliação aprovada antes da comparação final. Não se deve ocultar divergência de campo funcional.

Somente marcar `data_import_runs.status = 'reconciled'` quando todas as diferenças estiverem resolvidas ou formalmente justificadas.

## 8. Homologação funcional

No Preview:

- abrir todas as áreas principais;
- validar contagens do Dashboard;
- comparar escolas, programas e competências;
- abrir, reenviar, reanalisar, resolver e cancelar pendência de teste;
- registrar contato;
- testar retificação;
- testar inventário e notas;
- gerar Excel;
- testar perfis e negativas de RLS;
- confirmar auditoria;
- testar duas sessões alterando o mesmo registro;
- simular indisponibilidade do Supabase;
- confirmar que o snapshot local continua recuperável.

## 9. Casos mínimos de RLS

- usuário anônimo recebe acesso negado;
- controlador não acessa escola de outro controlador;
- controlador com escopo adicional recebe apenas a escola concedida;
- inventário não altera análise técnica;
- Gestão SME consulta sem excluir registros operacionais;
- Assistente opera dentro do escopo permitido;
- apenas Administrador técnico exclui dados operacionais;
- auditoria não pode ser editada por usuário autenticado.

## 10. Critérios para promoção

- reconciliação sem diferenças não justificadas;
- testes unitários e E2E verdes;
- migrations aplicadas em ambiente descartável sem erro;
- advisors avaliados;
- RLS homologada;
- Preview estável;
- snapshot local preservado;
- plano de contingência testado;
- autorização expressa para produção.

## Rollback imediato

### Situação A — falha antes da promoção

1. manter produção intacta em `local`;
2. desativar o Preview Supabase;
3. marcar importação como `failed` ou `rolled_back`;
4. preservar logs e relatório;
5. corrigir em nova branch;
6. repetir em ambiente limpo.

### Situação B — falha após promoção

1. alterar configuração para:

```javascript
{
  dataMode: 'local',
  productionActivationApproved: false,
  features: {
    supabaseRepositoryEnabled: false,
    legacyAppBridgeEnabled: false
  },
  supabase: {
    url: '',
    publishableKey: ''
  }
}
```

2. publicar o último commit local homologado;
3. confirmar HTTP 200 e ausência de requisições Supabase;
4. restaurar o snapshot local no navegador autorizado, se necessário;
5. congelar escrita no banco até análise;
6. preservar logs e auditoria;
7. registrar incidente e causa raiz.

## Rollback de dados

Não executar exclusões massivas diretamente. Preferir:

- restaurar branch de banco de desenvolvimento;
- restaurar backup do projeto;
- reimportar snapshot validado em banco limpo;
- utilizar `import_id` e auditoria para delimitar o conjunto afetado.

## Evidências mínimas

- hash e cópia do snapshot;
- versão dos dados locais;
- advertências e rejeições da transformação;
- commit e deployment utilizados;
- lista de migrations;
- relatório de advisors;
- relatório de reconciliação;
- resultado dos testes;
- matriz de usuários e perfis homologados;
- decisão de promoção ou rollback;
- horário e responsável por cada ação.
