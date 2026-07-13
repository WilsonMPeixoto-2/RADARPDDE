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

## 1. Congelamento operacional

Antes da exportação:

- comunicar janela de migração;
- impedir alterações concorrentes;
- registrar data, navegador, usuário e versão do RADAR;
- executar a regressão local;
- confirmar que o armazenamento local está íntegro.

## 2. Exportação

Usar `LocalStorageRepository.exportSnapshot()` e converter o resultado para o formato canônico com `createSnapshot()`.

O snapshot deve conter:

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

Não versionar snapshots com dados pessoais no GitHub.

## 3. Validação prévia

Executar `validateSnapshot()` e interromper se houver:

- entidade que não seja array;
- registro sem `id`;
- ID duplicado;
- versão ausente;
- data inválida;
- formato desconhecido.

Registrar hash do arquivo e contagem por entidade.

## 4. Preparação do banco

- aplicar migrations;
- confirmar banco vazio ou ambiente descartável;
- criar registro `data_import_runs` com estado `pending`;
- verificar se `import_id` ainda não existe;
- alterar estado para `running` apenas no início efetivo.

## 5. Transformação

Mapear os campos sem alterar significado:

- `designação` → `designation`;
- `denominação` → `denomination`;
- `controladorId` → `controller_id`;
- `programasIds` → linhas em `school_programs`;
- `competenciaInicial` → `initial_competence`;
- `verificacoes` aninhadas → linhas em `verifications`;
- histórico de tentativas → `pendency_attempts`;
- contatos → `pendency_contacts`;
- bens → `assets`;
- notas → `registered_invoices`.

A transformação deve ser pura e produzir relatório de registros rejeitados.

## 6. Importação em lotes

Gerar lotes com `buildImportBatches(snapshot, tamanho)`. Ordem recomendada:

1. configuração, programas e competências;
2. controladores e equipe de inventário;
3. escolas;
4. vínculos escola-programa;
5. verificações;
6. pendências;
7. tentativas e contatos;
8. bens e notas;
9. logs.

Usar transação por lote ou função de backend controlada. Não expor credencial administrativa no navegador.

## 7. Reconciliação

Exportar snapshot do destino e executar `reconcileSnapshots(origem, destino)`.

O relatório deve apresentar, por entidade:

- contagem de origem;
- contagem de destino;
- IDs ausentes no destino;
- IDs inesperados no destino;
- IDs com conteúdo divergente.

Somente marcar `data_import_runs.status = 'reconciled'` quando todas as diferenças estiverem resolvidas ou justificadas formalmente.

## 8. Homologação funcional

No Preview:

- abrir todas as áreas principais;
- validar contagens do Dashboard;
- comparar escolas e programas;
- abrir, reenviar, reanalisar, resolver e cancelar pendência de teste;
- registrar contato;
- testar retificação;
- testar inventário e notas;
- gerar Excel;
- testar perfis e negativas de RLS;
- confirmar auditoria.

## 9. Critérios para promoção

- reconciliação sem diferenças não justificadas;
- testes unitários e E2E verdes;
- RLS homologada;
- Preview estável;
- snapshot local preservado;
- autorização expressa para produção.

## Rollback imediato

### Situação A — falha antes da promoção

1. manter produção intacta em `local`;
2. desativar o Preview Supabase;
3. marcar importação como `failed` ou `rolled_back`;
4. corrigir em nova branch;
5. repetir a importação em ambiente limpo.

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
- commit e deployment utilizados;
- lista de migrations;
- relatório de reconciliação;
- resultado dos testes;
- matriz de usuários e perfis homologados;
- decisão de promoção ou rollback;
- horário e responsável por cada ação.
