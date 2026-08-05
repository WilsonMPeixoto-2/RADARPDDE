# Estratégia de testes e gates de qualidade

**Estado:** vigente  
**Atualizado em:** 5 de agosto de 2026

## 1. Objetivo

Garantir regras de negócio, persistência, autorização, acessibilidade, responsividade, relatórios, recuperabilidade e operação remota.

O princípio corrente é:

> Nenhuma função crítica é aprovada apenas porque o DOM, o serviço ou o banco funciona isoladamente.

## 2. Pirâmide e percurso

```text
domínio e contratos
→ serviços e integrações
→ repositórios
→ banco, Auth, RLS, RPC e Edge Function
→ jornadas no navegador
→ releitura após refresh
→ artefato publicado
→ monitor de Production
→ UAT
```

Para mutação crítica, acrescentar falha parcial, conflito e compensação.

## 3. Runtime

Node.js está fixado em `24.x` no projeto, lockfile, arquivos de versão, workflows e Vercel.

## 4. Readiness principal

```bash
npm run test:readiness
```

Inclui sintaxe, referências de workflows, bundles, lint, unitários, certificação Excel, integração, Supabase, tipos, artefatos e auditoria funcional.

Readiness é necessário, mas não substitui E2E, banco local, Preview, Production smoke ou homologação humana.

## 5. Unitários e integração

```bash
npm run test:unit
npm run test:integration
```

Toda correção deve criar caso que falha antes e passa depois.

Coberturas centrais:

- competência e avaliação mensal;
- pendências, timeline e navegação;
- capacidades e autorização;
- serviços e unidade de trabalho;
- modelos, renderers e runtime Excel;
- CORS e classificação de erros;
- Gestão de Equipe e compensação;
- importação e rollback;
- monitoramento de Production.

## 6. Supabase local

```bash
npm run supabase:start
npm run supabase:reset
npm run supabase:test:db
npm run supabase:lint:db
npm run supabase:gen:types
npm run typecheck:database
```

Na `main` e em Production existem 25 migrations. Branch que adiciona migration deve declarar sua própria contagem sem reescrever o estado remoto antes da aplicação.

Requisitos:

- migrations do zero;
- pgTAP por perfil e escopo;
- anônimo bloqueado;
- funções privilegiadas e grants corretos;
- tipos alinhados;
- histórico local/remoto reconciliado;
- dry-run e plano de reversão antes de aplicação.

## 7. Backup e restauração

```bash
RADAR_ALLOW_DISPOSABLE_BACKUP_RESTORE=true npm run test:backup-restore
```

Workflow:

```text
.github/workflows/backup-restore-disposable.yml
```

Compara schema, dados, Auth e migrations entre duas pilhas descartáveis. Publica somente `evidence.json` e não usa Production.

## 8. Excel

```bash
npm run certify:excel:fixture
```

### Institucional

- quatro abas;
- equivalência com CSV;
- células, fórmulas e OOXML.

### SME

- competência mensal única;
- 27 colunas A:AA;
- ausência de K, R e Y no produto final;
- designação textual;
- bordas e alinhamento;
- filtro, impressão e congelamento;
- manifesto e assets;
- download real e reabertura;
- abertura manual no Microsoft Excel desktop quando estrutura ou estilo material muda.

## 9. Playwright

```bash
npm run test:e2e
npm run test:mobile
```

Projetos mínimos:

- desktop Chromium;
- Pixel 7/Chromium;
- iPhone 15/WebKit.

Jornadas devem incluir:

- login e restauração de sessão;
- perfis e navegação;
- competência;
- Dashboard, Carteira, Prontuário, Pendências e Inventário;
- Gestão SME;
- Gestão de Equipe;
- exportações;
- erros, foco e overflow.

## 10. Gate remoto por perfil e viewport

```text
.github/workflows/gate-remoto-perfis-viewports.yml
```

Usa Supabase descartável, identidades efêmeras e três viewports. Prova Auth/RLS e organização da interface sem usar Production.

Esse gate não substitui smoke autenticado recorrente no ambiente publicado.

## 11. Contrato ponta a ponta

Para cada ação crítica, a regressão ideal comprova:

1. perfil autorizado e perfil negado;
2. controle visível e acionável;
3. payload correto;
4. serviço e repositório esperados;
5. backend alcançado;
6. estado no banco;
7. resposta e nova renderização;
8. persistência após recarregar;
9. conflito de versão;
10. falha parcial e compensação;
11. mensagem funcional.

A matriz dessa cobertura é a próxima entrega estrutural.

## 12. Monitor de Production

```text
.github/workflows/production-system-smoke.yml
```

Executa após `push` na `main`, a cada hora e manualmente.

Verifica:

- SHA publicado;
- manifesto e modo de dados;
- shell, gate e assets;
- bloqueio anônimo;
- preflight das Edge Functions;
- incidente automático.

O monitor não executa todas as jornadas autenticadas.

## 13. Acessibilidade e responsividade

- teclado, foco e retorno;
- modais e anúncios;
- nomes, papéis e estados;
- equivalência de tabelas e cartões;
- ausência de sobreposição e overflow;
- ações essenciais disponíveis no mobile.

## 14. Desempenho, precedência e build

```bash
npm run audit:lighthouse
npm run audit:baseline
npm run audit:frontend-precedence:check
npm run test:frontend-precedence
npm run build:vercel
```

Executar conforme impacto. Oscilação de Lighthouse deve ser repetida no mesmo SHA sem reduzir o piso silenciosamente.

## 15. Dependências

```bash
npm run lint
npm run analyze:unused
npm run check:team-account-function
```

Atualizações devem usar PR isolado, versão fixada, changelog, lockfile e todos os gates afetados. Supabase JS/CLI exige nova bateria de Auth, RLS, migrations, Edge Function e backup.

## 16. Mesmo SHA

Antes de declarar conclusão:

1. fixar SHA candidato;
2. executar gates nesse SHA;
3. confirmar que a branch não mudou;
4. verificar todos os checks;
5. publicar somente o commit aprovado;
6. repetir smokes após Production.

## 17. Gates externos

- matriz funcional completa;
- smoke autenticado de leitura;
- provas controladas de escrita e compensação;
- UAT;
- homologação humana de arquivos quando aplicável;
- decisão formal de liberação.

## 18. Critério de conclusão

A mudança deve representar a regra correta, funcionar ponta a ponta, preservar autorização e autoria, manter desktop/mobile, passar pelos gates aplicáveis, atualizar documentação e declarar ambiente e SHA da evidência.
