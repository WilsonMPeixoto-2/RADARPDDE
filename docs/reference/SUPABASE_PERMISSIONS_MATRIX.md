# Matriz de permissões — Supabase

**Atualizado em:** 5 de agosto de 2026

Esta matriz representa o contrato funcional vigente para interface, serviços, Auth, RLS, RPCs e Edge Functions.

## 1. Papéis

| Papel | Nome exibido | Natureza | Escopo padrão |
|---|---|---|---|
| `controller` | Controlador | funcional | própria CRE; carteira como responsabilidade principal |
| `federal_assistant` | Assistente de Verbas Federais | funcional | operação transversal e gestão da equipe da CRE |
| `inventory` | Equipe de Inventário | funcional | fluxo patrimonial da própria CRE |
| `sme_management` | SME (Gestão) | gerencial | leitura consolidada e parâmetros autorizados |
| `technical_admin` | Administrador técnico | técnico | infraestrutura, escopos, importação, auditoria e simulação visual |

A simulação visual do administrador técnico não troca o JWT nem transforma seu papel efetivo.

## 2. Legenda

- **L:** leitura;
- **C:** criação;
- **A:** alteração ou desativação lógica;
- **E:** exclusão física excepcional;
- **S:** operação server-side protegida;
- **—:** sem acesso direto.

## 3. Matriz funcional

| Recurso | Controlador | Assistente | Inventário | SME | Admin técnico |
|---|---:|---:|---:|---:|---:|
| Escolas da própria CRE | L/A autorizada | L/C/A | L patrimonial | L | L/C/A/E |
| Carteiras | L | L/C/A | L | L | L/C/A/E |
| Programas | L | L | L patrimonial | L/C/A vigente | L/C/A/E |
| Competências | L | L | L | L/C/A | L/C/A/E |
| Configuração global | L | L | L | L/C/A | L/C/A/E |
| Bonificação | L/C/A | L/C/A | — | L | L/C/A/E |
| Análise técnica | L/C/A | L/C/A | — | — | L/C/A/E |
| Pendências | L/C/A | L/C/A | L patrimonial restrita | L | L/C/A/E |
| Tentativas | L/C/A | L/C/A | L patrimonial restrita | L | L/C/A/E |
| Contatos e cobranças | L/C/A | L/C/A | — | L | L/C/A/E |
| Notas fiscais | L/C/A | L/C/A | L | L | L/C/A/E |
| Bens e inventário | L | L/C/A | L/C/A | L | L/C/A/E |
| Controladores | L | L/C/A/S | L | L | L/C/A/E/S |
| Equipe de Inventário | L | L/C/A/S | L própria | L | L/C/A/E/S |
| Contas Auth da equipe | — | C/A/S | — | — | C/A/S |
| Perfis e escopos | própria associação | própria associação | própria associação | L autorizada | L/C/A/E |
| Logs administrativos | L da CRE | L da CRE | L patrimonial | L própria autoria | L amplo/E excepcional |
| Auditoria técnica | — | — | — | L autorizada | L |
| Importações | — | L/C/A autorizada | — | L | L/C/A/E |

A permissão atual da SME para programas, competências e configuração existe no frontend e no Supabase. Como a frente de programas havia sido separada para decisão posterior, qualquer alteração deve começar por confirmação de regra de negócio, não por mudança unilateral da matriz.

## 4. Controlador

A carteira organiza responsabilidade e filtro inicial; não constitui fronteira de segurança entre Controladores da mesma `cre_scope`.

O Controlador:

- consulta escolas autorizadas na própria CRE;
- atua em escola de colega sem transferir `controller_id`;
- registra autoria real da ação;
- não acessa outra CRE sem escopo explícito;
- pode receber exceção em `user_school_scopes`, com leitura e escrita separadas por `can_write`.

Essa regra deve ser confirmada institucionalmente antes de eventual restrição à carteira própria.

## 5. Assistente de Verbas Federais

Possui operação transversal na CRE e gestão funcional da equipe:

- cadastrar e editar Controladores;
- criar ou convidar conta Auth;
- manter `user_profiles` e vínculos funcionais;
- redistribuir escolas individualmente e em lote;
- desativar integrante e bloquear acesso;
- cadastrar, editar e desativar integrantes do Inventário;
- registrar auditoria.

### Fronteira server-side

```text
frontend
→ team-account-management
→ Auth Admin + RPC transacional
```

A Edge Function:

- está ativa na versão 95;
- exige JWT;
- valida o papel institucional;
- aplica CORS fail-closed;
- aceita origens canônicas autorizadas;
- rejeita origem indevida;
- recupera vínculo histórico seguro;
- rejeita divergência ambígua;
- executa compensação em falha parcial.

## 6. Inventário

O perfil:

- consulta escolas e programas necessários ao painel patrimonial da própria CRE;
- consulta, cria e atualiza bens autorizados;
- conclui inventariação de bem encaminhado;
- não altera escola, carteira, bonificação, análise técnica, contatos ou configuração;
- não recebe acesso patrimonial a outra CRE.

O predicado genérico de escrita escolar não é ampliado para todas as operações do Inventário; as políticas patrimoniais são específicas.

## 7. Gestão SME

- consulta identificação e bonificação;
- não vê análise técnica nas superfícies restritas;
- consulta Pendências sem mutações operacionais;
- consulta Registros Internos somente com `actor_user_id = auth.uid()`;
- registros sem UUID de autor não aparecem nesse recorte;
- acessa configurações permitidas pelas políticas vigentes.

A SME não administra cotidianamente a equipe da CRE.

## 8. Administrador técnico

- mantém `technical_admin` como papel efetivo;
- pode alternar organização visual entre os quatro perfis funcionais;
- administra infraestrutura, perfis, escopos, importações e auditoria;
- executa exclusão física somente em procedimento técnico excepcional;
- não substitui testes com contas operacionais reais.

## 9. Exclusão e desativação

- remoção visual de integrante significa desativação lógica;
- histórico e autoria são preservados;
- carteira deve ser redistribuída quando necessário;
- conta Auth é bloqueada pelo backend protegido;
- exclusão física permanece restrita ao administrador técnico;
- `audit_events` não recebe mutação direta de usuários operacionais.

## 10. Casos obrigatórios de homologação

### Autorização

- anônimo e usuário sem perfil são bloqueados;
- cada perfil vê somente superfícies permitidas;
- outra CRE é bloqueada sem exceção;
- SME não executa mutações de Pendências;
- Inventário não altera bonificação ou cadastro escolar;
- usuários operacionais não veem simulação técnica.

### Controlador

- inicia pela própria carteira;
- atua em carteira de colega da mesma CRE;
- autoria identifica o executor;
- responsável principal não muda automaticamente;
- conflito de versão não sobrescreve silenciosamente.

### Gestão de Equipe

- Assistente cadastra, edita e desativa Controlador;
- convite e vínculos são criados;
- redistribuição em lote persiste após recarga;
- Assistente administra integrante do Inventário;
- repetição idempotente não duplica conta;
- falha após convite remove ou neutraliza o efeito parcial;
- falha após bloqueio restaura o acesso anterior;
- CORS oficial passa e origem indevida falha.

### Inventário

- carrega escolas da própria CRE;
- conclui inventariação;
- persistência permanece após recarregar;
- outra CRE permanece bloqueada.

### Gestão SME

- recortes de análise, Pendências e logs permanecem restritivos;
- configurações autorizadas alcançam o backend correto;
- regra de programas é confirmada antes de nova mudança.

## 11. Princípios permanentes

1. chave publicável não substitui RLS;
2. credencial administrativa nunca chega ao navegador;
3. leitura e mutações possuem políticas separadas;
4. RPC privilegiada valida autorização internamente;
5. Edge Function administrativa exige JWT e papel;
6. falha parcial exige compensação;
7. carteira não muda sem ação explícita;
8. mobile não remove capacidade essencial;
9. alteração da matriz exige decisão funcional e testes cruzados;
10. função crítica exige prova ponta a ponta conforme ADR-041.
