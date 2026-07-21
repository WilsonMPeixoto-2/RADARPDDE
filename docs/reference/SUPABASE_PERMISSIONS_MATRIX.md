# Matriz de permissões — Supabase

Esta matriz representa o contrato funcional aprovado para Auth, RLS e operações server-side do RADAR PDDE.

## Perfis funcionais e papel técnico

O produto possui quatro perfis operacionais visíveis e um papel técnico separado:

| Papel técnico | Nome exibido | Natureza | Escopo padrão |
|---|---|---|---|
| `controller` | Controlador | funcional | 4ª CRE; carteira própria como recorte inicial e responsabilidade principal |
| `federal_assistant` | Assistente de Verbas Federais | funcional | gestão operacional transversal da 4ª CRE e liderança da equipe |
| `inventory` | Equipe de Inventário | funcional | operação patrimonial autorizada |
| `sme_management` | SME (Gestão) | funcional gerencial | leitura consolidada e parâmetros institucionais |
| `technical_admin` | Administrador técnico | técnico, fora do seletor operacional | infraestrutura, perfis, escopos e auditoria |

`technical_admin` não é convertido em Assistente e não deve ser usado para operação cotidiana. O banco admite somente um perfil ativo por usuário.

## Matriz funcional

Legenda: **L** leitura; **C** criação; **A** alteração ou desativação lógica; **E** exclusão física; **S** operação server-side protegida; **—** sem acesso direto.

| Recurso | Controlador | Assistente | Inventário | SME (Gestão) | Admin técnico |
|---|---:|---:|---:|---:|---:|
| Escolas da 4ª CRE | L/A | L/C/A | L | L | L/C/A/E |
| Distribuição de carteiras | L | L/C/A | L | L | L/C/A/E |
| Programas | L | L | L | L/C/A | L/C/A/E |
| Competências | L | L | L | L/C/A | L/C/A/E |
| Bonificação e análise | L/C/A | L/C/A | L | L | L/C/A/E |
| Pendências | L/C/A | L/C/A | L patrimonial | L | L/C/A/E |
| Tentativas de regularização | L/C/A | L/C/A | L patrimonial | L | L/C/A/E |
| Contatos e cobranças | L/C/A | L/C/A | L | L | L/C/A/E |
| Bens e inventário | L | L/C/A | L/C/A | L | L/C/A/E |
| Notas registradas | L/C/A | L/C/A | L | L | L/C/A/E |
| Configuração global | L | L | L | L/C/A | L/C/A/E |
| Controladores | L | L/C/A/S | L | L | L/C/A/E/S |
| Equipe de Inventário | L | L/C/A/S | L própria | L | L/C/A/E/S |
| Convites e contas Auth da equipe | — | C/A/S | — | — | C/A/S |
| Perfis e escopos | própria associação | própria associação | própria associação | L | L/C/A/E |
| Logs administrativos | L da 4ª CRE | L da 4ª CRE | L do escopo | L amplo | L amplo/E excepcional |
| Auditoria técnica | — | — | — | L | L |
| Execuções de importação | — | L/C/A | — | L | L/C/A/E |

## Gestão de Equipe pela Assistente

A Assistente de Verbas Federais é a liderança direta dos controladores no âmbito da GAD da 4ª CRE. Sua permissão é plena para os efeitos funcionais da tela Gestão de Equipe:

- cadastrar e editar controladores;
- convidar o usuário e criar a conta Auth;
- criar e manter o vínculo `user_profiles`;
- distribuir e redistribuir escolas;
- desativar o controlador e seu acesso, escolhendo o destinatário da carteira;
- cadastrar, editar, convidar e desativar integrantes da Equipe de Inventário;
- registrar todas as operações no histórico administrativo.

As políticas RLS permitem `INSERT` e `UPDATE` em `controllers` e `inventory_team_members` a `federal_assistant` e `technical_admin`. A SME possui leitura, mas não manutenção cotidiana desses diretórios.

Convite, alteração e bloqueio de contas Auth não são executados diretamente pelo navegador. O frontend chama a Edge Function autenticada `team-account-management`; a função valida o papel e usa Auth Admin e RPCs restritas ao `service_role`.

## Regra de exclusão

A opção visual de remover integrante executa desativação lógica e auditada, não `DELETE`.

- exclusão física de escolas, verificações, pendências, tentativas, contatos, bens, notas, controladores e equipe: somente `technical_admin`;
- usuários operacionais preservam registros e histórico;
- cancelamento, retificação e desativação são eventos de domínio;
- `audit_events` não recebe inserção, alteração ou exclusão direta por usuários autenticados.

## Regras de escopo

### Controlador

A carteira define a responsabilidade principal de acompanhamento e o filtro inicial do Dashboard. Ela não constitui fronteira de segurança entre os cinco Controladores da equipe.

Todo Controlador autenticado com `cre_scope = '4ª CRE'` pode consultar e executar ações operacionais em qualquer escola da 4ª CRE. Isso permite cobertura de férias, licenças, ausências, sobrecarga e colaboração cotidiana sem redistribuir formalmente a carteira.

A atuação em escola de outro Controlador:

- preserva `schools.controller_id` como responsável principal;
- registra em `created_by`, logs e auditoria o usuário que executou a ação;
- não transfere automaticamente a carteira;
- não concede acesso a escola de outra CRE.

`user_school_scopes` permanece disponível para exceções explícitas fora da CRE, distinguindo leitura e escrita pelo campo `can_write`.

### Assistente de Verbas Federais

Possui acesso transversal à 4ª CRE para operação, retificação e Gestão de Equipe. `cre_scope` permanece registrado para futura segmentação entre coordenadorias.

### Inventário

Atua prioritariamente nas escolas com bens registrados ou escopo explícito. Não altera análise técnica, bonificação ou configuração global.

### SME (Gestão)

Possui leitura ampla e visões consolidadas, como Situação Operacional por Coordenadoria. Administra parâmetros institucionais autorizados, mas não substitui a liderança local da Assistente na equipe da CRE.

### Administrador técnico

Administra infraestrutura, perfis, escopos, auditoria e procedimentos excepcionais. Não aparece no seletor operacional nem herda telas da Assistente.

## Princípios de segurança

1. usuário não autenticado não acessa dados institucionais;
2. chave publicável nunca substitui RLS;
3. leitura, criação, alteração e exclusão possuem políticas separadas;
4. credencial administrativa nunca chega ao navegador;
5. RPCs de contas são executáveis apenas por `service_role`;
6. Edge Function exige JWT e valida o papel institucional;
7. convite ou bloqueio falho é compensado para evitar conta órfã;
8. exclusão física é excepcional e técnica;
9. carteira organiza o trabalho, mas não bloqueia colaboração dentro da mesma CRE;
10. toda alteração desta matriz exige decisão funcional expressa e testes cruzados de UI, Auth e RLS.

## Casos obrigatórios de homologação

- anônimo e usuário sem perfil recebem acesso negado;
- Controlador inicia pelo recorte da própria carteira;
- Controlador consulta e atua em carteira de colega da mesma CRE;
- a autoria da ação colaborativa identifica quem efetivamente a executou;
- atuar fora da carteira não altera automaticamente o responsável principal;
- Controlador não acessa outra CRE sem exceção explícita;
- Assistente cadastra controlador, envia convite e cria vínculos;
- Assistente edita e desativa controlador, redistribuindo escolas;
- Assistente administra integrantes do Inventário;
- SME consulta equipe e situação operacional, mas não altera os diretórios;
- Inventário não altera análise técnica;
- Administrador técnico não recebe interface da Assistente;
- falha após convite remove a conta recém-criada;
- falha após bloqueio restaura o acesso;
- repetição idempotente não cria conta duplicada;
- apenas Administrador técnico executa exclusão física;
- nenhuma política permite acesso anônimo.
