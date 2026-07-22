# Matriz de permissões — Supabase

Esta matriz representa o contrato funcional aprovado para Auth, RLS e operações server-side do RADAR PDDE.

## Perfis funcionais e papel técnico

O produto possui quatro perfis operacionais e um papel técnico transversal, autorizado a inspecionar todas as superfícies funcionais:

| Papel técnico | Nome exibido | Natureza | Escopo padrão |
|---|---|---|---|
| `controller` | Controlador | funcional | 4ª CRE; carteira própria como recorte inicial e responsabilidade principal |
| `federal_assistant` | Assistente de Verbas Federais | funcional | gestão operacional transversal da 4ª CRE e liderança da equipe |
| `inventory` | Equipe de Inventário | funcional | seção Capital e Inventário das escolas da própria CRE |
| `sme_management` | SME (Gestão) | funcional gerencial | leitura consolidada e parâmetros institucionais |
| `technical_admin` | Administrador técnico | técnico com acesso operacional transversal | todos os recursos, escopos e quatro modos de visualização funcional |

`technical_admin` não é convertido permanentemente em Assistente nem perde sua identidade técnica. Na interface, inicia pela visualização de Controlador e pode alternar entre Controlador, Assistente de Verbas Federais, SME (Gestão) e Equipe de Inventário para diagnóstico, homologação e suporte. O banco continua admitindo somente um perfil institucional ativo por usuário; a alternância visual não troca o JWT nem reduz as permissões RLS do administrador técnico.

## Matriz funcional

Legenda: **L** leitura; **C** criação; **A** alteração ou desativação lógica; **E** exclusão física; **S** operação server-side protegida; **—** sem acesso direto.

| Recurso | Controlador | Assistente | Inventário | SME (Gestão) | Admin técnico |
|---|---:|---:|---:|---:|---:|
| Escolas da 4ª CRE | L/A | L/C/A | L patrimonial | L | L/C/A/E |
| Distribuição de carteiras | L | L/C/A | L | L | L/C/A/E |
| Programas | L | L | L patrimonial | L/C/A | L/C/A/E |
| Competências | L | L | L | L/C/A | L/C/A/E |
| Bonificação e análise | L/C/A | L/C/A | — | L | L/C/A/E |
| Pendências | L/C/A | L/C/A | L patrimonial restrita | L | L/C/A/E |
| Tentativas de regularização | L/C/A | L/C/A | L patrimonial restrita | L | L/C/A/E |
| Contatos e cobranças | L/C/A | L/C/A | — | L | L/C/A/E |
| Bens e inventário | L | L/C/A | L/C/A | L | L/C/A/E |
| Notas registradas | L/C/A | L/C/A | L | L | L/C/A/E |
| Configuração global | L | L | L | L/C/A | L/C/A/E |
| Controladores | L | L/C/A/S | L | L | L/C/A/E/S |
| Equipe de Inventário | L | L/C/A/S | L própria | L | L/C/A/E/S |
| Convites e contas Auth da equipe | — | C/A/S | — | — | C/A/S |
| Perfis e escopos | própria associação | própria associação | própria associação | L | L/C/A/E |
| Logs administrativos | L da 4ª CRE | L da 4ª CRE | L do escopo patrimonial | L amplo | L amplo/E excepcional |
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

O perfil `inventory` abre automaticamente a interface **Equipe de Inventário** e mantém disponível a seção **Capital e Inventário**.

Dentro dessa seção, o integrante autenticado:

- consulta todas as escolas cuja `cre` corresponda ao seu `cre_scope`;
- consulta os vínculos escola–programa necessários ao painel patrimonial;
- consulta os bens dessas escolas;
- pode criar e atualizar registros patrimoniais permitidos pela interface, inclusive concluir a inventariação de bem encaminhado;
- não altera o cadastro da escola, a distribuição de carteiras, bonificação, análise técnica, contatos ou configuração global;
- não recebe acesso patrimonial a escola de outra CRE.

A ampliação é implementada diretamente nas políticas de `schools`, `school_programs` e `assets`. O predicado genérico `can_write_school` não é ampliado para o Inventário.

### SME (Gestão)

Possui leitura ampla e visões consolidadas, como Situação Operacional por Coordenadoria. Administra parâmetros institucionais autorizados, mas não substitui a liderança local da Assistente na equipe da CRE.

### Administrador técnico

Administra infraestrutura, perfis, escopos, auditoria e procedimentos excepcionais. Também precisa percorrer todas as telas operacionais para diagnosticar relatos, homologar alterações e verificar regressões sob a organização visual de cada perfil.

Ao autenticar:

- recebe a navegação operacional completa;
- inicia pela visualização de Controlador;
- vê exclusivamente para sua conta o seletor de simulação funcional;
- pode alternar entre Controlador, Assistente, SME e Inventário sem novo login;
- mantém `technical_admin` como papel efetivo no contexto de autenticação e nas políticas RLS;
- não concede o seletor a usuários operacionais comuns.

A simulação reproduz navegação, componentes, filtros e organização da interface. Como a identidade de banco permanece técnica, testes de bloqueios RLS específicos de um usuário operacional continuam exigindo as contas de homologação correspondentes.

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
10. o Inventário recebe somente o escopo necessário à superfície patrimonial;
11. a simulação funcional do Administrador técnico não altera sua identidade Auth nem enfraquece a RLS;
12. toda alteração desta matriz exige decisão funcional expressa e testes cruzados de UI, Auth e RLS.

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
- Inventário carrega as escolas da própria CRE na seção Capital e Inventário;
- Inventário conclui a inventariação de um bem encaminhado;
- Inventário não altera cadastro escolar, bonificação ou análise técnica;
- Inventário não acessa escola de outra CRE;
- Administrador técnico autentica com navegação operacional completa;
- Administrador técnico alterna entre as quatro visualizações funcionais;
- o papel efetivo permanece `technical_admin` após cada alternância visual e recarga;
- usuários operacionais não visualizam o seletor de simulação;
- falha após convite remove a conta recém-criada;
- falha após bloqueio restaura o acesso;
- repetição idempotente não cria conta duplicada;
- apenas Administrador técnico executa exclusão física;
- nenhuma política permite acesso anônimo.
