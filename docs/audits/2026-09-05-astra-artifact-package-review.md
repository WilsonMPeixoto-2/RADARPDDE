# RADAR PDDE — Revisão do pacote de artefatos da auditoria Astra

**Data:** 5 de setembro de 2026  
**Pacote estudado:** `resultados-auditoria(1).zip`  
**Baseline auditada pelo Astra:** `876c5976124815d2848f7d2d9e8a82b7cd3a43c5`  
**Classe:** evidência de auditoria e aprendizado metodológico; não altera runtime.

## 1. Conteúdo preservado no pacote

O pacote contém 27 artefatos, incluindo:

- relatório consolidado `01-auditoria-regras-concorrentes.md`;
- inventário do repositório;
- cobertura textual integral;
- evidências remotas;
- mapa estático AST/SQL;
- três relatórios semânticos de domínio;
- probes focalizados de patrimônio e exportação;
- comparação de dependências do workspace;
- logs unitários, integração, E2E e `npm ci`;
- snapshots de PRs #253, #254, #256, #257, #258, #260, #261, #262 e #263.

A preservação desses arquivos permite estudar o raciocínio efetivamente executado, em vez de inferir o método apenas pelo relatório final.

## 2. Cobertura mecânica real observada

O inventário daquele checkout registrou **840 arquivos**. Categorias principais:

| Categoria | Quantidade |
|---|---:|
| documentação | 242 |
| testes unitários | 187 |
| E2E | 56 |
| integrações | 51 |
| scripts | 47 |
| migrations | 46 |
| testes de banco | 28 |
| workflows | 26 |
| domínio | 24 |
| application | 13 |
| data | 9 |

Essa contagem não deve ser misturada com inventários anteriores de 842 arquivos sem comparar versão/critério do gerador. A lição é registrar o artefato e o SHA, não transformar uma contagem em constante eterna.

## 3. Mapa estático produzido

O script `source-map.cjs` analisou `app.js`, `src/**` e Edge Functions com Acorn/acorn-walk e indexou:

- **3.797 funções**;
- **151 chamadas** relevantes de write/load;
- **88 definições SQL de função** encontradas nas migrations;
- **57 nomes SQL distintos** na última ocorrência por nome;
- **0 erros de parse**.

O próprio artefato registra uma limitação correta: a última ocorrência por **nome** não resolve automaticamente overload, DROP, ALTER ou alteração de assinatura. A autoridade SQL precisa ser confirmada pela assinatura/corpo efetivos.

## 4. Normalização do ambiente

Antes de confiar no `node_modules` já existente, o Astra comparou versões com o `package.json` da baseline.

Foram encontradas divergências/ausências em vários pacotes, incluindo Playwright, Supabase JS/CLI, ESLint, esbuild, knip, msw, fast-check e dependency-cruiser. Em seguida foi executado `npm ci`, instalando 442 pacotes.

O log também contém warnings de pacotes transitivos depreciados (`inflight`, `lodash.isequal`, `rimraf@2`, `glob@7`, `whatwg-encoding`, `fstream`, `uuid@8`). Esses warnings são dívida de dependência a rastrear por cadeia, **não evidência automática de bug funcional ou vulnerabilidade explorável em Production**.

## 5. Resultados de testes preservados

### Unitários amplos

A execução registrou:

- 873 testes;
- 871 aprovados;
- 2 falhas.

As duas falhas ocorreram em verificações de artefato/reprodutibilidade do checkout:

- Markdown gerado da matriz funcional divergente do versionado;
- hash esperado de uma migration SME divergente do arquivo lido.

Elas precisavam de classificação ambiental/reprodutibilidade e não foram usadas para negar ou confirmar os bugs funcionais focalizados.

### Integração

- **7/7 aprovados**.

### Desktop E2E

- 178 cenários enumerados;
- **141 aprovados**;
- **37 ignorados**;
- **0 falhas**.

Esse resultado é metodologicamente central: a auditoria encontrou problemas apesar da ampla suíte E2E verde.

## 6. Evidência remota preservada

O pacote registrou:

- 46 migrations aplicadas;
- deployments de Production para #260/#261;
- definições remotas de `production_integrity_check`, `save_asset_with_verification_and_log` e `save_invoice_with_effects`;
- `production_integrity_check()` com `status = healthy` e `totalIssues = 0` naquele snapshot.

Esse estado remoto saudável não invalida o bug patrimonial reproduzido em código. Ele apenas mostra que o conjunto de dados existente naquele instante não continha a inconsistência monitorada. Uma sequência futura ainda poderia produzi-la.

## 7. Achados adicionais confirmados pelo pacote completo

Além dos P1 já registrados no ledger adversarial, o pacote mostra com mais precisão:

### 7.1 Desativação de Controlador

O contrato atual exige carteira previamente zerada antes da desativação. Ainda existe teste/helper ativo com linguagem de “desativada + 13 escolas transferidas”, ramo incompatível com o fluxo vigente.

Classificação: **D — teste/helper obsoleto perigoso**, não bug atual de desativação.

### 7.2 Competência em teste E2E

`school-timeline.spec.js` manipula estado global legado diretamente (`activeCompetenciaKey`) em vez de usar o contexto canônico. Isso pode mascarar sincronização e ensinar bypass de arquitetura.

Classificação: **D — fixture/teste perigoso**.

### 7.3 Readiness

`RadarProductExtensionsReady` pode existir como Promise publicada antes de a capacidade estar efetivamente instalada. Teste que verifica apenas truthiness da Promise não certifica a capability.

Classificação: **E/F — risco arquitetural/semântico**, alinhado à Frente 2 do plano corrente.

### 7.4 Performance com autoridade funcional

`operational-write-performance.js` ainda altera políticas e composição funcional; não pode ser tratado como mera telemetria fail-open.

Classificação: **E — dívida arquitetural de alto risco**, já compatível com Frente 1.

### 7.5 Exportações

O pacote comprova três contratos que não podem ser misturados:

- Excel SME: uma competência, uma aba, 27 colunas;
- XLSX institucional atual: decisão posterior limita à competência global ativa;
- CSV: mantém caminho legado e precisa de contrato explícito antes de convergência.

Documentos que ainda descrevem XLSX institucional como histórico multicompetência estão superados pela decisão posterior.

### 7.6 Pendências

A UI moderna possui quatro estados/abas, mas `app.js` conserva renderer/fallback antigo de duas abas. Hoje não há prova de regressão visível na composição completa, mas a segunda implementação é risco real se loader/readiness mudar.

## 8. O que deve ser replicado em futuras auditorias

O valor do Astra não foi apenas encontrar textos antigos. Foi combinar:

```text
cobertura mecânica ampla
→ mapa de risco
→ divisão semântica por domínio
→ busca por autoridades concorrentes
→ cronologia de hotfix/migration
→ contraexemplo
→ probe com código real
→ suíte para medir a lacuna
→ evidência remota
→ classificação explícita
```

Esse pipeline foi formalizado em:

- [`../architecture/adversarial-analysis-and-implementation-method.md`](../architecture/adversarial-analysis-and-implementation-method.md);
- [`../architecture/adversarial-analysis-replication-playbook.md`](../architecture/adversarial-analysis-replication-playbook.md).

## 9. Regra de continuidade

Novas sessões não precisam repetir toda a exploração se os artefatos existentes correspondem ao mesmo SHA e à mesma superfície. Devem:

1. verificar validade do SHA;
2. reutilizar inventário/matches/mapa como ponto de partida;
3. aprofundar novos riscos;
4. salvar novos probes e evidências progressivamente;
5. nunca usar a existência do relatório anterior como prova de que não restam defeitos.
