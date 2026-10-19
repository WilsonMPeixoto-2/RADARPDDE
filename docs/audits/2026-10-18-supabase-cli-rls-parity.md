# Auditoria de paridade: service_role, pgTAP e Supabase CLI 2.121.0

**Data:** 18/10/2026  
**Classe:** achado datado em investigação; não é decisão de alterar SQL/RLS nem autorização de release  
**Escopo:** somente leitura de Production, análise de código versionado e testes em Supabase descartável. Nenhuma mudança em registros ou privilégios institucionais.

## Fatos confirmados

1. Na [execução comparativa do PR #452](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/39171252853), mesmo SHA e Ubuntu 24.04, o CLI **2.114.0** passou 41 arquivos / **674 asserções pgTAP**. A versão **2.121.0** montou a stack, executou reset, migrations e preflight, e falhou **exclusivamente em 2 de 674**: asserções 32 e 33 de supabase/tests/database/rls.test.sql.
2. As asserções 32/33 exigem que `has_table_privilege('service_role', 'public.user_profiles', 'DELETE')` e `has_table_privilege('service_role', 'public.user_school_scopes', 'DELETE')` sejam falsos. Nomes dos testes: "service_role não remove perfis pelo bootstrap" e "service_role não remove escopos pelo bootstrap".
3. Em **Supabase Production scnryinorqeucbfkioxo**, uma consulta SQL exclusivamente de leitura em 18/10 mostrou, para **ambas as tabelas**:
   - RLS habilitada; `anon` **não** tem DELETE;
   - `service_role` **tem** DELETE;
   - as ACLs armazenadas nos metadados incluem `service_role=arwdDxtm/postgres`, explicitamente com DELETE. `authenticated` também possui grant de DELETE, sujeito a RLS. Nenhuma leitura de linhas operacionais foi necessária.
4. A migration canônica **20260714180621_preconnection_auth_and_api_grants.sql** comenta que service_role não deve receber DELETE para o bootstrap; concede SELECT/INSERT/UPDATE a essa role, porém **não revoga explicitamente um DELETE preexistente**. Assim, a intenção da migration, a asserção do teste e o privilégio efetivo de Production **não são equivalentes**.
5. A [documentação oficial do Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security) descreve o padrão de service_role com privilégios completos e bypass de RLS, exclusivo de código no servidor. O simples fato de service_role ter DELETE **não comprova acesso indevido por usuários comuns**.

## Diagnóstico e hipóteses

**Confirmado:** existe divergência entre o teste 32/33 e o estado efetivo de Production. A CLI 2.121.0 reproduz os valores booleanos observados em Production para esse privilégio, enquanto a stack local 2.114.0 não os reproduz no mesmo teste.

**Hipótese a confirmar:** mudança do bootstrap/estado inicial de GRANTs entre imagens/versões da CLI explica o resultado. A diferença exata de imagens, grants iniciais, sequências de migrations e função de role deve ser medida em ambas as stacks, não presumida.

**Não comprovado:** que a CLI 2.121.0 tenha defeito funcional de RLS; que a CLI 2.114.0 reproduza fielmente privilégios de Production; que exista vazamento da chave administrativa; que um fluxo do produto execute exclusões indevidas; que modificar a RLS seja necessário ou autorizado.

## Fronteiras e próximos passos obrigatórios

- **Não migrar automaticamente a CLI:** a 2.114.0 permanece baseline do repositório enquanto o contrato não for reconciliado.
- **Não afrouxar testes nem aplicar REVOKE em Production:** primeiro verificar o contrato funcional de Gestão de Equipe, bootstrap e eventual uso legítimo de DELETE por operações server-side.
- Comparar, em stacks efêmeras de CLI 2.114 e 2.121, `pg_class.relacl`, grants efetivos, defaults de roles, lista de imagens/versões da stack e log de aplicação da migration.
- Verificar se o requisito é **"a rotina de bootstrap não executa exclusões"** ou **"a credencial service_role nunca possui privilégio DELETE nessas tabelas"**. São contratos diferentes e exigem provas diferentes.
- Se a política institucional exigir revogar DELETE de service_role, planejar migration explícita isolada com avaliação de Auth/Edge Functions/rotinas administrativas e aprovação antes de mudança em Production.
- Se DELETE administrativo for uma permissão deliberada e necessária, redesenhar os testes para proteger o comportamento do bootstrap sem confundir grant global com o que a rotina executa, sempre com testes reais por perfil.
- Uma decisão futura deve confrontar a matriz de permissões, o código atual e as políticas efetivas, não ser tomada apenas para obter CI verde.

## Governança dos PRs

- [#452](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/452): experimento encerrado sem merge. Falha de pgTAP confirmada, **interpretação funcional inconclusiva diante de Production**.
- [#453](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/453): bloqueio exato de CLI 2.121.0 **em HOLD**, Draft e sem merge enquanto o contrato não for reconciliado.
- [#450](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/450): consolida este registro e roteamento para futuros agentes.
- [#448](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/448): ordenação visual do Prontuário; sem relação causal conhecida com esta discrepância.

**Segurança operacional:** Production consultada somente para metadados e flags booleanas; não executados UPDATE, DELETE, GRANT, REVOKE ou migrations.
