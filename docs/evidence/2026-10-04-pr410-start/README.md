# #410 — primeiro incremento e autorização de direção

A direção incremental foi autorizada pelo usuário em 04/10/2026. O PR foi
revalidado: HEAD inicial `e562f45928dff869c8055deaa4f757c5f40e3ba0`, apenas design,
Draft/mergeável, base `d9bf67f7...`. Manifesto Production confirma essa mesma
baseline, ambiente production, `supabase-production`, repositório Supabase habilitado.

## Autoridade de rota: RED → GREEN

Teste real de navegador `canonical-routes.spec.js` adicionado: abrir uma escola,
clicar Próxima unidade, verificar URL/rota/escola e competência e retornar pelo
histórico. RED sobre a baseline: **1 falha**, URL permanecia na escola anterior
apesar de o renderer exibir a seguinte. A correção usa `switchView` no caminho
existente, mantendo a competência preservada. Não há novo wrapper/controller.

GREEN local: **10/10 Playwright** (sete de rotas e três de busca/menus/transição),
29,8 segundos. **11/11 unitários** de histórico e UX do Prontuário, zero skips.
Sintaxe de app.js e lint do teste aprovados. Isso certifica este incremento local;
não certifica sincronização dirigida, RPC por escola ou publicação em Production.
CI do novo commit deve ser consultada no PR; não declarada verde antecipadamente.

Não foram importados controllers, migrations ou testes de Realtime do #409.
A única mudança funcional desta etapa é uma chamada do botão Próxima unidade.
Plano, design, CURRENT_STAGE, validade documental e handoff registram o início.

## Condições para seguir

O plano explicita lacunas: schoolId não identifica autor da operação; SUBSCRIBED
não prova continuidade após suspensão; exclusões e vínculos históricos precisam
ser definidos pela fatia completa. Não presumir que uma RPC pequena, sozinha,
reduza aplicação do snapshot ou reconstrução de DOM.

Próximos incrementos dependem de caracterização do escopo e provas de RLS,
equivalência, concorrência e custo. #407/#409 servem como evidências. Nenhum
merge, migration remota ou deploy desta etapa. Production continua na baseline.

## Coordenação no GitHub

O usuário informou que outro agente pode atuar como revisor do #410. Commits,
diffs, testes, handoff e descrição do PR formam o registro compartilhado.
Conferir o HEAD antes de cada alteração/publicação; não sobrescrever avanço de
outro agente. Revisões são hipóteses a verificar, não correções a aceitar cegamente.
