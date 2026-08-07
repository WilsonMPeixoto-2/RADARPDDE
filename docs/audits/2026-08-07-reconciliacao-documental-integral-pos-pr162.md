# Reconciliação documental integral pós-PR #162

**Data:** 7 de agosto de 2026  
**Baseline de origem:** `b347b854bf5af99c3ec9d9b091b77b854cc53a4b`  
**Escopo:** documentação e contratos executáveis da matriz funcional  
**Impacto funcional:** nenhum

## 1. Motivo

A frente CORREÇÕES PARTE 03 avançou por vários PRs enquanto a auditoria #156 permaneceu aberta e divergente da `main`. Documentos canônicos passaram a registrar estados diferentes do GitHub, Vercel, Supabase e da cobertura funcional. Esta reconciliação restaura um ponto de partida único antes da continuidade das correções.

## 2. Fontes utilizadas

Precedência aplicada:

1. código da `main`;
2. Supabase Production efetivo;
3. deployment Vercel Production;
4. testes, workflows e evidências reproduzíveis;
5. decisões vigentes;
6. documentação canônica;
7. históricos.

Auditorias, evidências e planos datados foram preservados como registros do momento em que foram produzidos.

## 3. Baseline revalidado

```text
GitHub main: b347b854bf5af99c3ec9d9b091b77b854cc53a4b
Último merge funcional: PR #162
Vercel Production: dpl_DYHMyxDLGp9nzFz63AWxT7Wej87T — READY
Commit publicado: b347b854bf5af99c3ec9d9b091b77b854cc53a4b
Supabase: scnryinorqeucbfkioxo — ACTIVE_HEALTHY
PostgreSQL: 17.6.1.147
Migrations aplicadas: 30
Última: 202608060003_school_institutional_identity
closing_competence: 2026-12
app_config.row_version: 20
team-account-management: v112 — ACTIVE — JWT obrigatório
production_integrity_check(): healthy / totalIssues=0
```

## 4. Divergências corrigidas

### Baseline

Documentos vigentes ainda citavam 25, 26 ou 27 migrations e versões antigas da Edge Function. `CURRENT_STAGE.md` passa a ser o único documento canônico que concentra valores mutáveis do ambiente.

### `ASSET-02`

A matriz ainda registrava persistência genérica. O código atual usa `saveAssetWithLog`, `row_version` e log administrativo. A operação passa de `gap` para `partial`, pois ainda falta prova controlada completa.

### `CFG-03` e `CFG-04`

A matriz ainda marcava manutenção de programas como decisão pendente. O contrato vigente já permite Gestão SME e administrador técnico por serviço, RPC e permissões. As duas operações passam a `partial` até prova controlada.

### `SCH-01`

O cadastro deixou de sintetizar identidade institucional. O serviço exige os dados reais e o banco protege campos obrigatórios e unicidade normalizada de INEP, CNPJ e SICI. A operação continua `partial` até prova ponta a ponta de criação, edição, negativas e releitura.

### Gestão de Equipe

O contrato atual incorpora a sequência #138 → #150 → #161. O lookup de conta Auth é exato pela RPC `resolve_team_auth_user_id_by_email`, restrita ao backend administrativo, seguido de leitura da conta pelo ID. A documentação deixou de atribuir a correção integral apenas ao CORS do PR #138.

### `CFG-02`, `INV-01` e `PEND-02`

Foram incorporados aos contratos documentais os controles de exercício versionado/mensal, remoção do bem derivado desvinculado de nota e sincronização de tentativas de pendência.

### Exportações

O contrato vigente usa `RadarExcelExportAudit`: auditoria inicial obrigatória antes do download, neutralização do evento legado duplicado e registro posterior da conclusão. O Excel SME permanece com 27 colunas A:AA.

## 5. Matriz funcional reconciliada

Antes:

```text
covered: 9
partial: 29
gap: 1
decision: 2
```

Depois:

```text
covered: 9
partial: 32
gap: 0
decision: 0
```

Próximas provas:

```text
manter regressão: 5
smoke autenticado de leitura: 6
escrita controlada e reversível: 25
observação de Production: 5
```

A mudança não declara UAT concluído. Ela separa correção técnica já incorporada de prova funcional completa ainda pendente.

## 6. Política documental adotada

- `docs/CURRENT_STAGE.md` é o baseline mutável único;
- documentos canônicos mantêm contratos estáveis e referenciam esse baseline;
- matriz JSON é fonte executável e o Markdown é visão gerada;
- auditorias/evidências datadas não são reescritas retrospectivamente;
- planos concluídos permanecem históricos;
- PR aberto ou Preview não altera o estado canônico.

## 7. Arquivos reconciliados

Foram atualizados os documentos canônicos de entrada, estágio, contexto, roadmap, índice e validade documental; referências de arquitetura, Supabase, permissões e testes; runbooks de conexão/migration; contratos Excel; e as fontes JSON/Markdown da matriz funcional.

O arquivo `technical.json` da matriz não exigiu alteração.

## 8. PR #156

O PR #156 permanece registro histórico útil, mas sua branch divergiu da `main`. Não deve ser mesclado cegamente. A continuidade da auditoria deve partir da `main` reconciliada, reaproveitando somente evidências compatíveis com o código atual. O defeito de bootstrap investigado naquela branch foi tratado pelo PR #160.

## 9. Escopo protegido

Esta reconciliação não altera runtime do produto, migrations, dependências, Auth/RLS, Edge Function ou dados. Os JSONs da matriz são contratos de documentação/validação e não runtime funcional.

## 10. Próxima sequência

1. validar e integrar esta reconciliação;
2. encerrar o PR #156 como trabalho superado, preservando a branch/evidências;
3. continuar a auditoria funcional a partir da `main` atual;
4. provar as operações ainda `partial` por risco;
5. decidir separadamente a ativação do smoke autenticado;
6. inspecionar a tela de detalhes da escola;
7. tratar dependências em frente isolada;
8. concluir UAT e decisão formal de liberação.
