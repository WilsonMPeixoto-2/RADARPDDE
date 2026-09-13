# RADAR PDDE — Estado atual do projeto

**Classe documental:** Canônico — estado mutável e retomada futura  
**Atualizado em:** 13 de setembro de 2026

## Frente vigente

A correção da arquitetura de dados baseada em Supabase passou nos gates de fixtures e está em certificação adicional de persistência/Auth/RLS reais, na branch isolada:

`fix/supabase-query-architecture-2026-09-11`

Produto funcional validado: `93a9f24c2d4b24a274d7e071e96b65169a965bbe`.

Após esse SHA, a revisão identificou e corrigiu a releitura corretiva que ainda podia carregar coleções operacionais integrais. O teste desktop autenticado havia sido ignorado por exigir Supabase local; o workflow descartável agora o executa junto às jornadas de persistência. A certificação anterior não cobre essas alterações posteriores. O relatório de fechamento é:

[`audits/SUPABASE_ARCHITECTURE_FINAL_2026-09-13.md`](audits/SUPABASE_ARCHITECTURE_FINAL_2026-09-13.md)

O arquivo [`audits/ASTRA_AUDITORIA_RADAR_2026.md`](audits/ASTRA_AUDITORIA_RADAR_2026.md) permanece como diário investigativo incremental. Seus checkpoints intermediários podem descrever defeitos que foram corrigidos depois. Para o estado vigente, este arquivo e o relatório final acima têm precedência temporal.

## Estado de Production e governança

- `main` foi revalidada por leitura em `2eff1321a8abaccd46d9627ee2eed060741ce3b7`.
- A branch de correção **não foi integrada à main**.
- Nenhum merge, migration, alteração de dados, secret, configuração ou deployment de Production foi executado nesta frente.
- Qualquer integração ou publicação futura é uma etapa de release separada e exige autorização explícita de Wilson.

## Causa raiz encerrada

O Supabase já era a fonte oficial, mas o frontend ainda conservava partes do modelo anterior baseado em snapshots amplos no navegador. Isso fazia dados históricos ou operacionais serem carregados, copiados ou reconciliados em situações onde a superfície ativa não precisava deles.

O caso mais grave era `administrativeLogs` no login. A auditoria mostrou que o problema era sistêmico: a fronteira entre dados estruturais, contexto operacional e histórico não estava concluída.

A correção adotada foi estrutural, preservando regras de negócio:

- bootstrap remoto somente com dados estruturais necessários à entrada;
- dados operacionais carregados pela competência/contexto ativo;
- Pendências e bens antigos ainda ativos incorporados seletivamente ao contexto corrente;
- dependências necessárias de reanálise, Inventário e cálculos agregados carregadas sem recuperar todo o histórico;
- históricos administrativos e escolares somente sob demanda;
- gravações remotas autoritativas/incrementais por entidades afetadas;
- navegador sem função de segundo banco operacional no modo Supabase;
- invalidação real da sessão operacional no logout;
- atualização contextual segura ao retomar/focar a aplicação;
- troca de competência com hidratação remota, preservação da escola aberta e rollback visual em caso de falha.

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

## PR #299 e alinhamento do banco

A branch preserva o merge funcional do PR #299, `d2663f1ae7554516caf315f53b2509fbcd295e01`.

A auditoria somente leitura encontrou 51 migrations locais correspondentes às 51 migrations registradas no projeto Supabase consultado, incluindo `20260910201500_evaluation_retification_atomic_cancel`.

Também foram confrontadas as assinaturas das sete RPCs operacionais mais sensíveis às correções de avaliação, Nota, Pendência, reanálise e Inventário. Não foi identificada incompatibilidade executável entre esses consumidores e as funções examinadas.

## Certificação objetiva

A execução GitHub Actions `34745166616`, no commit `e6a645d523c6883601689545ba16c8d36de71c54`, concluiu com sucesso integral:

- sintaxe;
- regressões direcionadas;
- `npm run check`;
- suíte unitária completa;
- suíte de integração completa;
- fronteiras arquiteturais;
- segurança e lint E2E;
- matriz funcional e referências de workflows;
- certificação de fixture Excel;
- checks estáticos de Supabase;
- configuração de runtime e arquivos gerados;
- typecheck de banco;
- auditoria funcional;
- E2E desktop dos fluxos operacionais prioritários.

Artefato visual preservado:

`architecture-desktop-e6a645d523c6883601689545ba16c8d36de71c54`

Digest:

`sha256:3ffcfe7895e51c786a457efcff4894f5b56ea52439bfa8cf1318f3352198a440`

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
- simuladores de integração incompatíveis com paginação por cursor.

Uma possível micro-otimização futura é substituir alguns filtros locais repetidos em cálculos de interface por índices auxiliares. Com o novo recorte contextual, isso não opera sobre o histórico global e não constitui pendência desta correção arquitetural.

## Próximo passo autorizado

Nenhum passo de integração ou Production está automaticamente autorizado.

A correção técnica está pronta na branch isolada. A próxima mudança de estado, quando explicitamente autorizada, é o processo controlado de integração/release, seguido pelos gates remotos apropriados antes de qualquer publicação em Production.

## Rota obrigatória para retomada futura

1. `AGENTS.md`;
2. `reference/SYSTEM_CANONICAL_MODEL.md`;
3. este arquivo;
4. `audits/SUPABASE_ARCHITECTURE_FINAL_2026-09-13.md`;
5. `reference/ENGINEERING_METHOD.md`;
6. `reference/FRONTEND_USER_VALIDATION_GATE.md`;
7. referências especializadas da frente pretendida.

A retomada não deve partir de memória de chat ou de checkpoints intermediários da auditoria sem reconciliá-los com este estado canônico.
