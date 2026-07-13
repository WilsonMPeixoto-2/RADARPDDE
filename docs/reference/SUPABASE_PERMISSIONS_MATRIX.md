# Matriz futura de permissões — Supabase

Esta matriz descreve o comportamento previsto para autenticação e RLS. Ela não altera os perfis simulados existentes enquanto o sistema permanecer em modo local.

## Perfis

| Perfil técnico | Nome exibido | Escopo padrão |
|---|---|---|
| `controller` | Controlador | escolas vinculadas ao controlador e exceções explícitas |
| `federal_assistant` | Assistente de Verbas Federais | operação transversal das escolas autorizadas |
| `inventory` | Equipe de Inventário | dados patrimoniais das escolas com bens registrados ou escopo explícito |
| `sme_management` | Gestão SME | leitura gerencial ampla e parâmetros institucionais |
| `technical_admin` | Administrador técnico | administração técnica, perfis, escopos e auditoria |

## Matriz funcional

Legenda: **L** leitura; **C** criação; **A** alteração; **E** exclusão; **—** sem acesso direto.

| Recurso | Controlador | Assistente | Inventário | Gestão SME | Admin técnico |
|---|---:|---:|---:|---:|---:|
| Escolas vinculadas | L/A | L/C/A | L | L | L/C/A/E |
| Programas | L | L | L | L/C/A | L/C/A/E |
| Competências | L | L | L | L/C/A | L/C/A/E |
| Bonificação e análise | L/C/A | L/C/A | L | L | L/C/A/E |
| Pendências | L/C/A | L/C/A | L nos casos patrimoniais | L | L/C/A/E |
| Tentativas de regularização | L/C/A | L/C/A | L nos casos patrimoniais | L | L/C/A/E |
| Contatos e cobranças | L/C/A | L/C/A | L | L | L/C/A/E |
| Bens e inventário | L | L/C/A | L/C/A | L | L/C/A/E |
| Notas registradas | L/C/A | L/C/A | L | L | L/C/A/E |
| Configuração global | L | L | L | L/C/A | L/C/A/E |
| Controladores e equipe | L | L | L | L/C/A | L/C/A/E |
| Perfis e escopos | própria associação | própria associação | própria associação | L | L/C/A/E |
| Logs administrativos | L do próprio escopo | L do escopo | L do escopo | L amplo | L amplo |
| Auditoria técnica | — | — | — | L | L |
| Execuções de importação | — | L/C/A | — | L | L/C/A/E |

## Regras de escopo

### Controlador

A escola é acessível quando:

- `schools.controller_id` corresponde ao controlador vinculado ao usuário; ou
- existe registro em `user_school_scopes` para o usuário e a escola.

A exceção de escopo pode ser somente leitura ou permitir escrita.

### Assistente de Verbas Federais

Na primeira versão, possui acesso transversal às escolas para atividades operacionais, inclusive retificação já prevista no sistema. Restrições por CRE poderão ser aplicadas por `cre_scope` ou `user_school_scopes` antes da ativação real.

### Inventário

Acesso prioritário às escolas com registros em `assets` e às exceções concedidas. Não recebe permissão geral para alterar bonificação, análise técnica ou configuração.

### Gestão SME

Leitura ampla para acompanhamento e administração de parâmetros institucionais. Não altera registros operacionais de pendências por padrão.

### Administrador técnico

Administra perfis, escopos e infraestrutura. O perfil não deve ser usado para operação cotidiana.

## Princípios RLS

1. Usuário não autenticado não acessa dados.
2. A chave publicável nunca substitui as políticas RLS.
3. Políticas de leitura e escrita são separadas.
4. Exclusão de dados operacionais é excepcional e restrita.
5. Auditoria não pode ser editada por usuários autenticados.
6. Operações de sistema com privilégios elevados devem ocorrer apenas em backend controlado.
7. Toda mudança na matriz exige aprovação funcional antes da aplicação das migrations.

## Casos obrigatórios de homologação

- controlador não enxerga escola de outro controlador;
- controlador com escopo adicional enxerga apenas a escola concedida;
- inventário não altera análise técnica;
- gestão SME consulta todas as escolas sem editar pendências;
- assistente retifica registro dentro do escopo permitido;
- usuário sem perfil ativo recebe acesso negado;
- administrador técnico consulta auditoria e gerencia perfis;
- nenhuma política permite acesso anônimo.
