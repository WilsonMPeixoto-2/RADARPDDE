# RADAR PDDE — Estado atual do projeto

**Classe documental:** Canônico — estado mutável e retomada futura  
**Atualizado em:** 13 de setembro de 2026

## Frente vigente

A correção da arquitetura de dados baseada em Supabase foi concluída e certificada na branch:

`fix/supabase-query-architecture-2026-09-11`

**Candidato funcional certificado:** `054aeb26f6f0ad12bf66b3965b9adcb59bca1a8a`  
**Base reconciliada da `main`:** `2eff1321a8abaccd46d9627ee2eed060741ce3b7`  
**Merge sintético do PR #300 validado:** `1c0750a3543af8b681a20a4a8fb0d0a35074c42e`

O relatório técnico de fechamento é:

[`audits/SUPABASE_ARCHITECTURE_FINAL_2026-09-13.md`](audits/SUPABASE_ARCHITECTURE_FINAL_2026-09-13.md)

O arquivo [`audits/ASTRA_AUDITORIA_RADAR_2026.md`](audits/ASTRA_AUDITORIA_RADAR_2026.md) permanece como diário investigativo incremental. Seus checkpoints intermediários podem descrever defeitos que foram corrigidos depois. Para o estado vigente, este arquivo e o relatório final acima têm precedência temporal.

## Estado de Production e governança

- A `main` ainda está em `2eff1321a8abaccd46d9627ee2eed060741ce3b7` enquanto o PR #300 aguarda a integração controlada.
- O candidato funcional `054aeb26...` passou os gates de release contra a `main`, inclusive o merge sintético `1c0750a...`.
- O PR #300 não adiciona, remove nem altera migrations do Supabase.
- Nenhuma alteração manual de dados, secret ou configuração do Supabase é necessária para esta integração.
- O rollback de acesso introduzido em `2eff1321...` foi reconciliado e permanece preservado; a funcionalidade de retificação de avaliação removida com o rollback do PR #299 não foi reintroduzida.
- A próxima mudança de estado autorizada é a integração do PR #300 e a validação do deployment de Production.

## Causa raiz encerrada

O Supabase já era a fonte oficial, mas o frontend ainda conservava partes do modelo anterior baseado em snapshots amplos no navegador. Isso fazia dados históricos ou operacionais serem carregados, copiados ou reconciliados em situações onde a superfície ativa não precisava deles.

O caso mais evidente era `administrativeLogs` no login. A auditoria mostrou que o problema era sistêmico: a fronteira entre dados estruturais, contexto operacional e histórico não estava concluída.

A correção adotada foi estrutural, preservando as regras de negócio:

- bootstrap remoto somente com dados estruturais necessários à entrada;
- dados operacionais carregados pela competência/contexto ativo;
- Pendências e bens antigos ainda ativos incorporados seletivamente ao contexto corrente;
- dependências necessárias de reanálise, Inventário e cálculos agregados carregadas sem recuperar todo o histórico;
- históricos administrativos e escolares somente sob demanda;
- gravações remotas autoritativas/incrementais por entidades afetadas;
- navegador sem função de segundo banco operacional no modo Supabase;
- invalidação real da sessão operacional no logout;
- atualização contextual segura ao retomar/focar a aplicação;
- troca de competência com hidratação remota, preservação da escola aberta e rollback visual em caso de falha;
- consultas remotas genéricas fail-closed quando faltam ordenação determinística ou limites explícitos;
- acesso direto às tabelas operacionais do Supabase restrito à camada de dados, com exceções de autenticação limitadas a `user_profiles` e `user_school_scopes`.

## Prioridade funcional preservada

Continuam sendo superfícies prioritárias e protegidas por testes:

- Análise e Bonificação;
- Pendências, contatos, tentativas e reanálise;
- Notas, documentos, edição/retificação e despesa a identificar;
- Inventário e efeitos derivados de despesas permanentes;
- navegação entre escolas, programas e competências;
- confirmações e estados visuais das operações;
- histórico escolar e Auditoria quando solicitados.

O histórico administrativo não participa do login nem da navegação operacional comum.

## Estado arquitetural por classe de dados

### Bootstrap remoto

- configuração da aplicação;
- programas;
- controladores;
- equipe de inventário;
- escolas autorizadas;
- vínculos escola/programa;
- competências.

### Autorização

- perfis;
- vínculos usuário/perfil;
- escopos escolares do usuário.

### Contexto operacional

- verificações/avaliações;
- Pendências;
- tentativas;
- contatos necessários ao contexto;
- bens;
- notas/despesas.

### Sob demanda

- logs administrativos;
- histórico completo da escola;
- histórico de contatos escolares quando a superfície correspondente é aberta.

### Manutenção

- execuções de importação;
- auditoria técnica.

## PR #299 e reconciliação com a `main`

A `main` foi restaurada em `2eff1321a8abaccd46d9627ee2eed060741ce3b7` após a regressão global de acesso associada ao PR #299. A branch arquitetural havia divergido antes desse hotfix.

A reconciliação foi feita por merge formal em `f064c189ff26a4f22357f61dda6e16d218599900`, preservando o hotfix da `main` e a nova arquitetura Supabase. Em seguida, `7fac373ec4481b5ca5140f923312b9fb7a5f5fee` restaurou apenas os contratos arquiteturais necessários da retificação manual (`incrementalStateEntities` e `remoteResultIsAuthoritative`), sem restaurar a funcionalidade de retificação de avaliação removida pelo rollback.

Os artefatos centrais removidos pelo rollback continuam ausentes no merge sintético validado, inclusive a migration `20260910201500_evaluation_retification_atomic_cancel.sql` e os módulos/UI/testes correspondentes. O PR #300 não contém mudança de migration.

## Certificação objetiva do candidato

No candidato funcional `054aeb26f6f0ad12bf66b3965b9adcb59bca1a8a`, todos os workflows acionados pelo PR concluíram com sucesso:

- `Validar RADAR PDDE`;
- `Testes E2E Playwright`;
- `Homologação integral pré-production`;
- `Supabase readiness`;
- `Confiabilidade funcional com Supabase real`;
- `Ciclos funcionais reais com Supabase`;
- `Gate remoto de perfis e viewports`;
- `Retificação auditável direcionada`;
- `CodeQL`;
- `Saúde das dependências`;
- `Contratos-fonte do Excel SME`;
- `Homologação do Excel SME`;
- `Validar snapshot canônico do RADAR`;
- `Lighthouse CI`.

A suíte unitária alcançou **1.018 testes aprovados, 0 falhas**, além das baterias de domínio, integração e jornadas reais autenticadas contra Supabase descartável.

### Lighthouse

A otimização `054aeb26...` apenas antecipou a descoberta das fontes principais, sem alterar regras de negócio, layout funcional ou arquitetura de dados.

Resultado desktop final, mediana de três execuções:

- Performance: **78%**;
- Acessibilidade: **100%**;
- Boas práticas: **100%**;
- FCP: **737 ms**;
- LCP: **3,46 s**;
- Speed Index: **1,29 s**;
- TBT: **0 ms**;
- CLS: **0,082**;
- TTI: **3,46 s**.

O piso desktop de LCP de 3,5 s foi atendido. O perfil mobile permanece como dívida de performance conhecida e não bloqueante para o alvo operacional desktop; a evidência foi preservada em vez de mascarada.

## Situação dos achados principais

Corrigidos e cobertos por regressão:

- logs administrativos no bootstrap;
- readiness remoto/local;
- coleções operacionais crescentes no login;
- snapshots completos em pequenas escritas remotas;
- persistência operacional legada em `localStorage` no modo Supabase;
- caminho legado de logs na exportação Excel;
- histórico escolar truncado pelos registros mais recentes;
- seletor global de competência e hidratação remota;
- dependências de obrigações antigas ativas;
- notas irmãs necessárias a reanálise/inventário;
- histórico de contatos sem vínculo com Pendência;
- índices derivados após patch remoto;
- atualização contextual durante edição/gravação;
- invalidação de sessão no logout;
- classificação de `dataImportRuns`;
- simuladores de integração incompatíveis com paginação por cursor;
- releitura corretiva integral após falha de sincronização;
- duplicidade de logout e expectativas E2E obsoletas;
- consultas administrativas e paginação genérica sem contrato determinístico explícito.

Uma possível micro-otimização futura é substituir alguns filtros locais repetidos em cálculos de interface por índices auxiliares. Com o novo recorte contextual, isso não opera sobre o histórico global e não constitui pendência desta correção arquitetural.

## Próximo passo autorizado

O candidato foi certificado para integração. A sequência de release é:

1. integrar o PR #300 na `main` preservando o SHA esperado da branch;
2. confirmar a `main` integrada;
3. aguardar o deployment automático da Vercel em Production;
4. confirmar que Production está `READY` no SHA integrado;
5. executar smoke check não destrutivo no endereço oficial;
6. registrar o estado final de release.

## Rota obrigatória para retomada futura

1. `AGENTS.md`;
2. `reference/SYSTEM_CANONICAL_MODEL.md`;
3. este arquivo;
4. `audits/SUPABASE_ARCHITECTURE_FINAL_2026-09-13.md`;
5. `reference/ENGINEERING_METHOD.md`;
6. `reference/FRONTEND_USER_VALIDATION_GATE.md`;
7. referências especializadas da frente pretendida.

A retomada não deve partir de memória de chat ou de checkpoints intermediários da auditoria sem reconciliá-los com este estado canônico.
