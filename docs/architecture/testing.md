# Estratégia de testes e gates de qualidade

**Estado:** vigente  
**Atualizado em:** 29 de julho de 2026

## 1. Objetivo

Garantir que cada mudança preserve regras de negócio, persistência, autorização, acessibilidade, responsividade, navegação, relatórios e operação remota do RADAR PDDE.

Nenhum comando isolado representa o gate completo. A seleção depende das camadas tocadas e a decisão de release exige evidências cumulativas no mesmo SHA.

## 2. Pirâmide de validação

```text
domínio puro e contratos
→ serviços e integrações
→ persistência local e Supabase
→ banco, Auth, RLS e histórico de migrations
→ jornadas de interface
→ acessibilidade e responsividade
→ artefato Vercel
→ homologação operacional e UAT
```

## 3. Readiness local

Comando principal:

```bash
npm run test:readiness
```

O script executa, na ordem vigente:

1. `npm run check` — sintaxe dos arquivos críticos;
2. `npm run lint:security` — regras de segurança do frontend;
3. `npm run lint:e2e` — qualidade dos testes Playwright;
4. `npm run test:unit` — domínios, contratos puros e regressões, inclusive alinhamento da migration SME;
5. `npm run certify:excel:fixture` — certificação integral da massa sintética;
6. `npm run test:integration` — serviços, repositórios e integrações;
7. `npm run check:supabase` — prontidão do contrato Supabase;
8. `npm run check:supabase-final` — alinhamento final das camadas remotas;
9. `npm run check:runtime-config` — configuração pública gerada;
10. `npm run check:generated` — artefatos determinísticos;
11. `npm run typecheck:database` — tipos do banco;
12. `npm run audit:functional` — persistência e capacidades funcionais.

Readiness aprovado é condição necessária, mas não suficiente, para mudanças de banco, layout, navegação ou release.

## 4. Testes unitários

```bash
npm run test:unit
```

Devem cobrir regras puras e regressões em:

- competência e contexto global;
- avaliação mensal APTA/INAPTA;
- estados e transições de pendência;
- projeção operacional;
- timeline e deduplicação;
- navegação contextual;
- autorização e política de capacidades;
- modelos e renderers Excel;
- certificação célula a célula;
- contratos JSON;
- adaptadores e normalizações;
- identidade, ausência de alias derivado e hash da migration SME.

Teste específico:

```bash
node --test tests/unit/sme-migration-history-alignment.test.js
```

Ele protege o identificador canônico `20260728182226`, a ausência do identificador `20260728190344` e o SHA-256 do SQL já aplicado.

Correção de regressão deve acrescentar caso que falhe antes da correção e passe depois.

## 5. Testes de integração

```bash
npm run test:integration
```

Validam, entre outros:

- serviços de aplicação;
- unidade de trabalho;
- repositórios local e Supabase;
- persistência atômica;
- concorrência otimista;
- compensação de falhas;
- importação, reconciliação e rollback;
- integração de Auth e diretórios;
- contratos de runtime e build.

## 6. Banco local, migrations e pgTAP

Para mudanças que afetem banco, RLS, RPC, Auth, Edge Function ou tipos:

```bash
node --test tests/unit/sme-migration-history-alignment.test.js
npm run supabase:start
npm run supabase:reset
npm run supabase:test:db
npm run supabase:lint:db
npm run supabase:gen:types
npm run typecheck:database
```

Requisitos:

- `supabase migration list --linked` apresenta histórico local/remoto alinhado;
- o identificador derivado `20260728190344` não reaparece;
- migrations aplicam do zero;
- pgTAP aprova leitura e escrita por perfil e escopo;
- lint SQL não apresenta erro bloqueante;
- tipos são regenerados quando o schema muda;
- acesso anônimo continua bloqueado;
- funções privilegiadas e wrappers preservam o modelo de segurança;
- `db push --linked --dry-run` contém somente a migration deliberadamente nova;
- backup e rollback existem antes de qualquer operação remota.

`migration repair` altera o histórico e não reverte SQL. Não deve ser usado como atalho para corrigir falha funcional.

## 7. Certificação dos relatórios Excel

```bash
npm run certify:excel:fixture
```

O gate verifica:

- regra canônica de avaliação;
- equivalência institucional com o CSV legado;
- células do relatório institucional;
- células do Excel SME mensal;
- escopo histórico e isolamento mensal;
- estrutura OOXML;
- quantidade e ordem de abas;
- ausência de `dataValidations` no produto SME;
- determinismo e hashes.

A massa é sintética e não consulta Production. Antes do release oficial, os arquivos também devem ser abertos manualmente no Microsoft Excel desktop sem reparo.

## 8. Playwright

### 8.1 Jornada completa

```bash
npm run test:e2e
```

### 8.2 Mobile

```bash
npm run test:mobile
```

Projetos mínimos:

- desktop Chromium;
- Android/Chromium;
- iPhone/WebKit.

Jornadas devem validar:

- login e bloqueio pré-auth;
- perfis e capacidades;
- competência global;
- Carteira, Dashboard, Competências e Pendências;
- Prontuário e timeline;
- navegação contextual, scrollport e foco;
- Gestão SME somente leitura;
- Inventário e Gestão de Equipe conforme escopo;
- ausência de `pageerror` e overflow relevante.

## 9. Acessibilidade

Os testes de interface devem cobrir:

- navegação por teclado;
- foco inicial, retorno e restauração;
- modais acessíveis;
- `aria-live` para mensagens;
- nome, papel e estado de controles;
- contraste e semântica não dependente apenas de cor;
- equivalência de conteúdo entre tabela e cartões mobile.

Mudança visual não pode reduzir conteúdo, filtros, ações ou informação acessível.

## 10. Lighthouse e evidência visual

```bash
npm run audit:lighthouse
npm run audit:baseline
```

Aplicar quando houver mudança em layout, carregamento, estilos ou navegação.

A baseline deve ser regenerada pelo script canônico. Capturas antigas são históricas e não devem ser editadas manualmente.

## 11. Precedência do frontend

```bash
npm run audit:frontend-precedence:check
npm run test:frontend-precedence
```

Obrigatório quando houver alteração em:

- `index.html`;
- `config.js`;
- folhas de estilo;
- ordem de extensões;
- wrappers globais;
- bootstraps pós-`app.js`.

## 12. Build Vercel

```bash
npm run build:vercel
```

Deve confirmar:

- runtime coerente com o ambiente;
- somente configuração publicável no bundle;
- nenhum segredo administrativo;
- manifesto de build gerado;
- artefato compatível com o deployment pretendido.

Preview e Production são builds independentes. Preview não deve ser promovido como se fosse o artefato de Production.

## 13. Segurança e dependências

Comandos aplicáveis:

```bash
npm run lint
npm run analyze:unused
npm run check:team-account-function
```

Além dos comandos locais:

- revisar Security e Performance Advisors após alterações de schema;
- verificar proteção contra senhas vazadas no Auth;
- confirmar CORS exato da Edge Function;
- manter dependências fixadas e lockfile versionado;
- não introduzir segredo em frontend, GitHub, artefato ou log;
- não editar diretamente a tabela de histórico de migrations.

## 14. Mesmo SHA

A evidência de merge, deployment e homologação deve apontar para o mesmo SHA ou explicar formalmente a diferença.

Antes de declarar um ciclo concluído:

1. registrar o SHA candidato;
2. executar os gates aplicáveis nesse SHA;
3. confirmar que o PR não mudou depois dos testes;
4. verificar checks e workflows associados;
5. publicar somente o commit aprovado;
6. restaurar o bloqueio automático após a janela controlada;
7. documentar qualquer commit operacional posterior sem mudança funcional.

Ausência de workflow associado não equivale a aprovação. Deve ser relatada como ausência de evidência automatizada.

## 15. Gates externos antes da liberação oficial

Mesmo com CI verde, permanecem necessários:

- proteção contra senhas vazadas;
- fixação deliberada da major do Node;
- backup e restauração em ambiente descartável;
- homologação manual dos arquivos Excel;
- matriz remota por perfil e viewport;
- UAT;
- polimento editorial/visual;
- decisão formal de release.

## 16. Critério de conclusão

Uma mudança está concluída quando:

- representa corretamente o dado e a regra;
- preserva autoria, auditoria e histórico;
- aplica autorização em profundidade;
- mantém coerência entre superfícies e exportações;
- funciona em desktop e mobile;
- mantém acessibilidade;
- passa pelos gates aplicáveis;
- atualiza documentação e evidências;
- declara explicitamente o estado final.
