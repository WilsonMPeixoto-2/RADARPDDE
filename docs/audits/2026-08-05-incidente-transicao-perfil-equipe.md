# Incidente P0 — transição de perfil Inventário → Controlador

**Data:** 5 de agosto de 2026  
**Issue:** nº 149  
**Hotfix:** PR nº 150  
**Estado deste registro:** correção implementada e homologada em ambiente descartável; ainda não integrada nem publicada em Production

## 1. Impacto funcional

Na tela **Gestão de Equipe**, a Assistente de Verbas Federais conseguiu desativar uma integrante do Inventário, mas não conseguiu cadastrar a mesma pessoa como Controladora. Sem o novo controlador, também não foi possível selecionar esse destino para redistribuir a carteira do controlador anterior.

A interface exibiu a mensagem genérica de indisponibilidade do serviço de dados, embora o Supabase estivesse disponível e a operação tivesse sido recusada por um conflito conhecido de conta.

## 2. Evidência de Production

A análise sanitizada dos logs e do estado relacional demonstrou:

1. a desativação do perfil de Inventário chegou ao Auth e ao banco e foi concluída;
2. a conta Auth permaneceu existente e bloqueada, preservando o histórico;
3. não existia registro correspondente no diretório de Controladores;
4. o cadastro como Controladora tentou enviar novo convite ao mesmo e-mail;
5. o Supabase Auth respondeu `422 email_exists`;
6. a Edge Function converteu a resposta em `ACCOUNT_CONFLICT`, HTTP 409;
7. o gateway do frontend não leu o corpo JSON do erro HTTP e o classificou como indisponibilidade remota;
8. a carteira do controlador anterior permaneceu inalterada porque o controlador de destino não chegou a ser criado.

Não houve evidência de indisponibilidade geral do Supabase.

## 3. Relação com o PR nº 138

O PR nº 138 corrigiu problemas reais de CORS, vínculos históricos nulos, cadastro, edição e desativação no mesmo diretório. Entretanto, sua homologação não cobriu a transição entre diretórios e papéis usando a mesma conta Auth.

A recuperação implementada procurava vínculo histórico apenas para o mesmo perfil e a mesma entidade. No percurso Inventário → Controlador, o novo registro de Controlador ainda não existia; por isso, o código concluiu incorretamente que era necessário enviar outro convite.

A descrição de correção integral do PR nº 138 excedeu a cobertura efetivamente comprovada.

## 4. Causa raiz

### Edge Function

- ausência de busca de conta Auth por e-mail normalizado antes de convidar;
- ausência de regra explícita para reutilização segura de conta sem perfil ativo conflitante;
- compensação restaurava acesso irrestrito em vez do estado de bloqueio anterior.

### Gateway e interface

- `FunctionsHttpError.context` não era interpretado;
- código e mensagem funcionais retornados pela Edge Function eram descartados;
- o mapeador recebia apenas erro genérico e mostrava falsa indisponibilidade.

### Testes

- os testes anteriores validavam contratos e vínculos históricos do mesmo perfil;
- não existia percurso integral Inventário → desativação → Controlador → redistribuição → novo login;
- não existia regressão que obrigasse o conflito funcional a atravessar Edge Function, gateway e interface.

## 5. Correção

### Edge Function `team-account-management`

- procura conta Auth existente pelo e-mail antes de convidar;
- reutiliza e reativa a conta quando não existe vínculo ativo conflitante;
- rejeita troca de função enquanto outro perfil ainda estiver ativo, com mensagem funcional;
- mantém um único perfil ativo e preserva perfis históricos inativos;
- restaura e-mail, metadados e bloqueio anterior se a RPC falhar;
- informa se a conta foi convidada ou reutilizada.

### Gateway

- lê o corpo JSON de `FunctionsHttpError.context`;
- preserva `code`, `message` e `details` do backend;
- mantém `ACCOUNT_CONFLICT` como conflito funcional, sem classificá-lo como indisponibilidade.

### Testes e gates

- regressões unitárias específicas para conta existente, conflito ativo, compensação e mensagem exibida;
- ciclo integral com usuários, diretórios e escola sintéticos no Supabase local descartável;
- preparação, verificação e limpeza por mecanismos restritos ao ambiente descartável;
- nenhuma permissão, RLS ou grant de Production foi afrouxado.

## 6. Prova funcional descartável

O gate executa:

```text
criar contas Auth sintéticas
→ cadastrar pessoa no Inventário
→ desativar no Inventário
→ cadastrar a mesma conta como Controladora
→ cadastrar controlador de origem
→ criar escola sintética vinculada à origem
→ desativar origem com nova Controladora como destino
→ confirmar transferência da escola
→ confirmar um único perfil ativo
→ preservar perfil histórico de Inventário inativo
→ autenticar a nova Controladora
→ confirmar current_app_role = controller
→ remover integralmente usuários e dados sintéticos
```

O percurso concluiu com sucesso no Supabase descartável, junto com as 26 migrations, 241 testes pgTAP, lint do banco, Auth, RLS e frontend local.

## 7. Limites e publicação

Este hotfix não altera migrations nem dados reais. O estado de Juliana, Érica e suas escolas não foi modificado durante a investigação ou a homologação.

A correção somente estará disponível aos usuários depois de:

1. todos os gates do SHA final concluírem com sucesso;
2. autorização expressa para integrar o PR nº 150;
3. publicação da Edge Function corrigida;
4. publicação do frontend corrigido;
5. smoke e verificação dos logs em Production.

A operação real de converter a usuária e transferir a carteira deverá ser repetida pela Assistente após a publicação ou executada de forma controlada somente mediante autorização específica.
