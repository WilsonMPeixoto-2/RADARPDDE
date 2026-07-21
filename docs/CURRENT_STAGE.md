# RADAR PDDE — Estado atual do projeto

**Atualizado em:** 21 de julho de 2026  
**Natureza:** documento operacional e transitório

## 1. Regra de leitura

Antes de iniciar tarefa:

1. confirme o HEAD remoto da `main`;
2. verifique PRs e workflows posteriores;
3. confirme o deployment Vercel correspondente;
4. confirme o estado real do projeto Supabase;
5. atualize este documento quando o estado mudar.

Relatórios históricos não substituem este estado operacional.

## 2. Estado consolidado

O RADAR possui:

- quatro perfis funcionais e papel técnico separado;
- dashboard, carteira, competências, pendências, prontuário, Gestão de Equipe, Capital e Inventário e registros;
- `LocalStorageRepository` operacional em Production;
- `SupabaseRepository` conectado no Preview;
- concorrência otimista por `row_version`;
- **20 migrations SQL aplicadas no Supabase remoto e registradas na branch de sincronização patrimonial**;
- acesso colaborativo dos Controladores da mesma CRE;
- escopo específico de Capital e Inventário para a própria CRE;
- RLS, auditoria, importação, reconciliação e rollback;
- Edge Function e RPCs de Gestão de Equipe;
- testes unitários, integração, E2E e pgTAP;
- Production preservada em modo local e fail-closed.

## 3. Controladores

A carteira individual é responsabilidade principal, filtro inicial e organização do trabalho. Não é barreira de acesso entre os cinco Controladores da 4ª CRE.

- os cinco Controladores possuem contas vinculadas;
- as carteiras somam 163 escolas;
- cada Controlador consulta e opera todas as escolas da 4ª CRE;
- atuação fora da carteira não transfere responsabilidade;
- autoria permanece vinculada ao executor;
- outra CRE permanece bloqueada sem exceção explícita.

## 4. Capital e Inventário

Odair e Aylane possuem contas Auth confirmadas, vínculo ativo com o perfil `inventory` e `cre_scope = '4ª CRE'`.

O estado final das migrations 17 a 20 estabelece que o perfil `inventory`:

- consulta as 163 escolas da própria CRE;
- consulta os 430 vínculos escola–programa necessários à seção patrimonial;
- consulta e atualiza bens patrimoniais da própria CRE;
- pode concluir a inventariação de bem encaminhado;
- não recebe escrita cadastral nas escolas;
- não recebe acesso funcional a bonificação, análise técnica, contatos ou configuração global;
- não acessa escolas ou bens de outra CRE, mesmo quando a escola externa possui bem cadastrado.

A migration 20 corrigiu a fronteira genérica legada de acesso a escolas com bens.

## 5. Supabase remoto

Projeto autorizado: `scnryinorqeucbfkioxo`.

| Entidade | Quantidade |
|---|---:|
| Configuração geral | 1 |
| Programas | 8 |
| Controladores | 5 |
| Equipe de Inventário no diretório | 3 |
| Competências | 12 |
| Escolas | 163 |
| Vínculos escola–programa | 430 |

A validação confirmou ausência de referências órfãs e duplicidades materiais no conjunto carregado.

## 6. Identidades configuradas

Foram vinculados e validados:

- um Administrador técnico;
- uma Assistente de Verbas Federais;
- cinco Controladores;
- dois integrantes operacionais da Equipe de Inventário.

As contas verificadas possuem e-mail confirmado, senha configurada e um único perfil institucional ativo.

## 7. Contrato Vercel

Production permanece:

```text
runtimeEnvironment: local
dataMode: local
supabaseRepositoryEnabled: false
productionActivationApproved: false
```

Preview permanece:

```text
runtimeEnvironment: preview
dataMode: supabase-preview
supabaseRepositoryEnabled: true
productionActivationApproved: false
```

O Preview não pode ser promovido automaticamente para Production.

## 8. Histórico patrimonial

- migration 17: primeiro ajuste remoto de leitura do Inventário por CRE;
- migration 18: separação do escopo patrimonial;
- migration 19: consolidação das políticas de Capital e Inventário e remoção da helper transitória;
- migration 20: bloqueio do acesso genérico a escola de outra CRE apenas por possuir bem.

## 9. Próxima tarefa única

1. concluir os gates do PR de sincronização patrimonial;
2. mesclar apenas após CI verde e autorização;
3. homologar login real de Controladores e Inventário no Preview;
4. testar lançamento patrimonial identificado e reversível;
5. confirmar autoria, persistência e auditoria;
6. manter Production sem alteração.

## 10. Gate de Production

Production somente poderá usar Supabase após:

- homologação funcional de todos os perfis, abas e telas;
- RLS positiva e negativa comprovada;
- persistência e concorrência otimista comprovadas;
- Gestão de Equipe homologada;
- Capital e Inventário homologado com usuários reais;
- Advisors analisados;
- backup, restauração e rollback testados;
- política de MFA definida;
- CI verde no mesmo commit;
- autorização funcional e técnica específica.

Até lá, `productionActivationApproved` permanece `false`.
