# RADAR PDDE — Estado atual do projeto

**Atualizado em:** 30 de julho de 2026  
**Commit funcional publicado:** `dfc8aa3030b02edb73f764f5f56bd6759a7a1d77`  
**Deployment Production:** `dpl_7tLM3RZ7MEuRRTzvGmc9EiAARmDY` — `READY`  
**Reconciliação da migration SME:** `79cb67c84720b1850879d9c50c262e1623d5d8cc`  
**Hardening atual:** Node 24 e gate remoto por papel/viewport concluídos e validados  
**Próxima frente:** ainda não escolhida

## 1. Como usar este documento

Antes de iniciar tarefa:

1. consultar a `main` atual e os PRs abertos;
2. verificar workflows e checks do SHA candidato;
3. confirmar deployment e SHA na Vercel;
4. confirmar projeto e estado do Supabase;
5. comparar migrations local/remoto quando houver assunto de banco;
6. ler `PROJECT_CONTEXT.md` e `DECISION_LOG.md`;
7. verificar os gates exigidos pela camada alterada;
8. atualizar este arquivo quando o estado material mudar.

Código, banco e deployment prevalecem sobre plano, relatório ou memória de chat.

## 2. Situação executiva

A integração entre frontend, Supabase Auth, PostgREST, RLS, PostgreSQL e Vercel Production está ativa.

Concluídos e publicados:

- governança da Gestão SME;
- competência global de janeiro a dezembro de 2026;
- avaliação mensal canônica;
- timeline cronológica da unidade;
- certificação automatizada dos relatórios Excel;
- integração dos botões XLSX institucional e Excel SME;
- CSV legado preservado como fallback;
- navegação contextual com retorno seguro;
- restauração do bloqueio de deployments automáticos;
- reconciliação do histórico da migration SME.

Concluídos neste ciclo de hardening:

- compatibilidade do Node.js 24 confirmada;
- major operacional fixada em `24.x`;
- `.nvmrc` e `.node-version` versionados;
- contratos de `package.json`, `package-lock.json`, GitHub Actions e Vercel alinhados;
- gate remoto permanente por papel institucional e viewport;
- Supabase descartável no runner do GitHub Actions;
- validação de Auth/RLS no desktop;
- matriz de cinco papéis em Desktop Chrome, Pixel 7 e iPhone 15;
- correção da sobreposição entre seletor técnico e botão **Sair** no cabeçalho móvel;
- regressões automatizadas para o runtime, o workflow e o layout móvel.

A liberação oficial do produto ainda não foi declarada.

## 3. Produção

### 3.1 Vercel

```text
project: radarpdde
production deployment: dpl_7tLM3RZ7MEuRRTzvGmc9EiAARmDY
state: READY
artifactCommitSha: dfc8aa3030b02edb73f764f5f56bd6759a7a1d77
nodeVersion: 24.x
```

O hardening de Node, testes e documentação não exige publicação funcional em Production. O artefato publicado permanece inalterado até nova janela deliberada.

### 3.2 Supabase

```text
project: scnryinorqeucbfkioxo
status: ACTIVE_HEALTHY
PostgreSQL: 17
runtime Production: supabase-production
activeRepository: supabase
migrations correspondentes: 25
```

Estado de configuração confirmado:

```text
closing_competence = 2026-12
app_config.row_version = 5
```

Contagens operacionais devem ser consultadas novamente quando forem necessárias; não são invariantes documentais.

## 4. Runtime Node.js

Contrato canônico:

```text
package.json        engines.node = 24.x
package-lock.json   packages[""].engines.node = 24.x
.nvmrc              24
.node-version       24
GitHub Actions      node-version: 24
Vercel              nodeVersion: 24.x
```

A fixação consolida a major já usada na Vercel e nos workflows. Não houve promoção para uma major sem histórico de compatibilidade.

Proteção automatizada:

```text
tests/unit/release-hardening-contract.test.js
```

O teste rejeita:

- reabertura da faixa para outra major;
- divergência entre package e lockfile;
- ausência dos arquivos de versão;
- workflow com Node 20, 22 ou 26.

## 5. Gate remoto por papel e viewport

Workflow canônico:

```text
.github/workflows/gate-remoto-perfis-viewports.yml
```

O gate é executado em runner remoto do GitHub Actions e não utiliza segredo de Production. Ele:

1. instala Node 24 e dependências reproduzíveis;
2. instala Chromium e WebKit;
3. inicia um Supabase descartável;
4. aplica as 25 migrations versionadas;
5. cria identidades Auth efêmeras;
6. valida autenticação e contratos RLS no desktop;
7. serve o código do próprio PR;
8. executa a matriz responsiva;
9. publica artefatos Playwright;
10. restaura a configuração e destrói o ambiente.

Papéis cobertos:

- Administrador técnico;
- Assistente de Verbas Federais;
- Controlador;
- Equipe de Inventário;
- Gestão SME.

Viewports cobertos:

- Desktop Chrome;
- Pixel 7 / Chromium;
- iPhone 15 / WebKit.

A matriz responsiva contém 15 cenários de papel × viewport. Os contratos Auth/RLS mutáveis são executados uma única vez no desktop para evitar efeitos duplicados.

Evidência principal do ciclo:

```text
GitHub Actions run: 30516532485
job: Perfis × Desktop, Android e iPhone
conclusão: success
```

## 6. Defeito móvel corrigido pelo gate

Em telas de até 520 px, o seletor de perfil do Administrador técnico e o botão **Sair** ocupavam a mesma área da grade. O seletor interceptava o toque no logout.

O cabeçalho passou a reservar áreas distintas:

```text
exercise | theme | alerts | session | profile
```

Proteções:

- teste E2E em Android e iPhone;
- teste unitário do contrato CSS;
- ausência de overflow horizontal relevante;
- logout real após recarga da sessão.

## 7. Migrações

O GitHub e o Supabase Production possuem 25 versões correspondentes.

Migration SME canônica:

```text
arquivo local: 20260728182226_sme_access_governance.sql
registro remoto: 20260728182226_sme_access_governance
registro derivado 20260728190344: ausente
SHA-256: cddda35f4cc08b92093071f888cf958ae052ae82775c91366e4d729434427f0e
```

Migration futura exige:

1. `supabase migration list --linked`;
2. teste de alinhamento SME;
3. reset local;
4. pgTAP e lint SQL;
5. tipos regenerados;
6. `db push --linked --dry-run`;
7. backup e rollback;
8. evidência no mesmo SHA.

## 8. Relatórios Excel

### Institucional

- modelo, renderer, quatro abas e certificação: concluídos;
- botão principal: integrado ao XLSX;
- CSV: preservado como secundário e fallback;
- abertura manual no Excel desktop: pendente.

### SME mensal

- modelo, renderer, integração e certificação: concluídos;
- botão próprio por competência mensal;
- `dataValidations`: ausente por contrato;
- abertura manual no Excel desktop: pendente.

## 9. Gates remanescentes antes da liberação oficial

1. habilitar proteção contra senhas vazadas no Supabase Auth;
2. testar backup e restauração em ambiente descartável;
3. abrir os dois produtos no Microsoft Excel desktop sem reparo;
4. revisar Advisors quando aplicável;
5. concluir UAT funcional;
6. realizar polimento editorial e visual sem alterar produto;
7. registrar decisão formal de release.

A fixação do Node e a matriz remota por papel/viewport estão cumpridas e não integram mais os bloqueadores.

## 10. Próximas frentes elegíveis

Nenhuma foi escolhida expressamente.

### A. Segurança e recuperação

- proteção contra senhas vazadas;
- teste de backup e restauração;
- revisão de Advisors;
- evidências de contingência.

### B. Homologação operacional

- Microsoft Excel desktop;
- UAT por papel real;
- registro e priorização dos achados;
- reteste após ajustes.

### C. Polimento editorial e visual

- hierarquia;
- espaçamento;
- densidade;
- tabelas e cartões;
- ícones e estados;
- mensagens operacionais.

Restrições: preservar paleta, logomarca, capacidades, nomenclatura canônica e equivalência mobile.

### D. Configuração de programas por exercício

Frente funcional separada. Exige desenho próprio e não deve ser misturada com Gestão SME ou polimento.

## 11. Regra de escolha

A próxima frente deve ser escolhida expressamente. Antes de implementar:

1. confirmar o contrato ou criar especificação;
2. registrar escopo e fora de escopo;
3. trabalhar em branch própria;
4. verificar impacto em produto, banco e deployment;
5. definir gates;
6. atualizar documentação no mesmo ciclo.

## 12. Documentos de continuidade

- `AGENTS.md`;
- `README.md`;
- `docs/README.md`;
- `docs/PROJECT_CONTEXT.md`;
- `docs/DECISION_LOG.md`;
- `docs/architecture/testing.md`;
- `docs/reference/STATUS_DOCUMENTOS.md`;
- `docs/audits/2026-07-30-node24-gate-remoto-perfis-viewports.md`;
- `docs/audits/2026-07-29-reconciliacao-migration-sme-evidencias.md`.
