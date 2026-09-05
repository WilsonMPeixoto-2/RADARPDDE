# Matriz de permissões — Supabase e aplicação

**Atualizado em:** 5 de setembro de 2026  
**Estado:** referência vigente da baseline funcional do PR #260

> Antes de usar esta matriz para alterar autorização, comece em [`../../START_HERE.md`](../../START_HERE.md) e confirme o código/RLS do SHA corrente. Esta página resume o contrato entre interface, serviços, Auth, RLS, RPCs e Edge Functions; não concede permissão por si só.

## 1. Papéis

| Papel | Nome | Natureza | Escopo padrão |
|---|---|---|---|
| `controller` | Controlador | funcional | própria CRE; carteira como responsabilidade principal |
| `federal_assistant` | Assistente de Verbas Federais | funcional | operação transversal e Gestão de Equipe da CRE |
| `inventory` | Equipe de Inventário | funcional | fluxo patrimonial autorizado da própria CRE |
| `sme_management` | Gestão SME | gerencial | leitura consolidada e configurações autorizadas |
| `technical_admin` | Administrador técnico | técnico | infraestrutura, escopos, importação, auditoria e simulação visual |

Simular visualmente outro perfil não muda o papel efetivo do JWT.

## 2. Matriz funcional resumida

Legenda: `L` leitura, `C` criação, `A` alteração, `S` operação server-side protegida, `—` sem operação funcional comum.

| Recurso | Controlador | Assistente | Inventário | Gestão SME | Admin técnico |
|---|---:|---:|---:|---:|---:|
| Escolas da própria CRE | L/A cadastral autorizada | L/C/A | L patrimonial | L | L/C/A técnica |
| Identidade institucional | L | L/C/A | L | L | L/C/A técnica |
| Carteira / `controller_id` | L | L/C/A | L | L | L/C/A técnica |
| Programas | L | L | L patrimonial | L/C/A | L/C/A técnica |
| Competências/configuração | L | L | L | L/C/A | L/C/A técnica |
| Bonificação | L/C/A | L/C/A | — | L | L/C/A técnica |
| Análise técnica | L/C/A | L/C/A | — | leitura apenas onde autorizada | L/C/A técnica |
| Pendências/tentativas | L/C/A | L/C/A | L restrita | L sem mutações operacionais | L/C/A técnica |
| Contatos/cobranças | L/C/A | L/C/A | — | L | L/C/A técnica |
| Notas Fiscais | L/C/A | L/C/A | L | L | L/C/A técnica |
| Bens | L/C/A autorizada | L/C/A | L + conclusão de inventariação | L | L/C/A técnica |
| Controladores/Inventário | L | L/C/A/S | L pertinente | L | L/C/A/S técnica |
| Contas Auth da equipe | — | C/A/S | — | — | C/A/S |
| Logs administrativos | L conforme política | L da CRE | L patrimonial | L conforme política de autoria | L amplo técnico |
| Importações | — | somente quando procedimento autorizar | — | L quando autorizado | L/C/A técnica |

A tabela resume a capacidade; a operação específica pode ter pré-condições adicionais no serviço/RPC.

## 3. Controlador

- atua nas escolas autorizadas da própria `cre_scope`;
- carteira organiza responsabilidade principal e filtro, não transfere automaticamente a propriedade de uma escola quando há colaboração;
- não acessa outra CRE sem escopo explícito;
- pode editar os campos escolares que o serviço autoriza;
- não altera identidade institucional nem `controller_id` por edição comum;
- não gerencia contas Auth da equipe;
- autoria deve continuar identificando o executor real.

## 4. Assistente de Verbas Federais

- atuação transversal na CRE;
- cadastra/edita a escola no fluxo autorizado, inclusive identidade institucional;
- redistribui carteira individualmente ou em lote;
- administra Controladores e Equipe de Inventário;
- opera análise/Pendências e retificações autorizadas;
- acessa exportações/relatórios correspondentes;
- usa backend protegido para operações que envolvem Auth Admin.

## 5. Equipe de Inventário

- lê o recorte patrimonial necessário;
- conclui inventariação de bem que esteja `Encaminhada` e informa responsável;
- não altera bonificação, análise técnica mensal, carteira, identidade escolar ou configuração global;
- não recebe permissão genérica de escrita escolar só por acessar dados da escola.

Um bem permanente criado a partir de NF **pode já chegar `Encaminhada`** quando número fiscal e processo de inventário já existem. O perfil de Inventário não precisa de um “encaminhamento manual” nesse caso; sua próxima ação é a inventariação.

## 6. Gestão SME

- acompanhamento gerencial;
- leitura de Pendências sem mutações operacionais;
- configuração de calendário/exercícios;
- cadastro/edição/desativação de programas conforme o contrato implementado;
- Registros Internos apenas no recorte permitido pela política vigente;
- não administra cotidianamente a equipe da CRE.

## 7. Administrador técnico

`technical_admin` permanece papel técnico efetivo. Possui capacidades técnicas protegidas para infraestrutura/perfis/escopos/importação/auditoria e pode exercer operações permitidas pelas políticas correspondentes. A UI simulada não altera o JWT real.

## 8. Escolas e carteira

Nova unidade exige identidade institucional real e competência inicial válida. O banco/serviço rejeitam campos obrigatórios ausentes e duplicidades protegidas.

`schools.controller_id` é o responsável principal. Redistribuição usa fluxo próprio. Controlador não altera esse vínculo pelo formulário cadastral comum.

## 9. Notas Fiscais e Pendências

Controlador e Assistente são os perfis funcionais comuns de escrita nesses fluxos.

- análise fiscal individual e Consulta Assessoria usam invoice específica;
- `a_identificar` novo usa operação atômica `Incorreto + Pendência`;
- novo envio não resolve a Pendência;
- substituição em `Aguardando reanálise` é suportada conforme PR #254;
- reanálise correta resolve e incorreta reabre;
- SME/Inventário não recebem essas mutações apenas porque conseguem visualizar algum recorte.

## 10. Patrimônio

### Edição rápida

`InventoryService.updateAsset` aceita apenas o campo explicitamente previsto e protege a NF de bem vinculado contra alteração isolada do número fiscal.

### Encaminhamento

Para um bem realmente `Não encaminhada`, Controlador/Assistente usam o fluxo de encaminhamento quando existem NF e processo. A operação sincroniza, no caso vinculado, bem + verificação + log pela RPC do PR #260.

### Inventariação

Controlador, Assistente, Equipe de Inventário e `technical_admin` podem concluir a inventariação conforme a política/serviço, mas somente se o bem já estiver `Encaminhada` e houver responsável informado.

## 11. Gestão de Equipe

```text
frontend
→ DirectoryService / TeamAccountGateway
→ team-account-management
→ Auth Admin + RPC transacional
```

A Edge Function:

- exige Bearer/JWT válido;
- verifica papel de gestor autorizado;
- aplica CORS fail-closed;
- resolve conta Auth por e-mail via RPC restrita;
- rejeita vínculo ativo ambíguo/incompatível;
- permite reutilização segura de conta quando não há conflito;
- bloqueia/desativa logicamente quando aplicável;
- executa compensação se Auth já foi alterado e a etapa posterior falha.

Desativação de Controlador exige carteira zerada; o último Controlador ativo não é desativado pelo fluxo normal. O último integrante ativo do Inventário também é protegido pelo serviço correspondente.

## 12. Princípios permanentes

1. chave publicável não substitui RLS;
2. credencial administrativa nunca chega ao navegador;
3. leitura e escrita podem ter políticas diferentes;
4. RPC privilegiada valida autorização apropriada;
5. Edge Function administrativa exige JWT e papel;
6. falha parcial Auth + banco exige compensação;
7. carteira não muda sem ação explícita autorizada;
8. identidade institucional não é sintetizada;
9. visibilidade não implica capacidade de mutação;
10. mudança de permissão exige decisão funcional explícita e testes cruzados;
11. antes de retirar ou ampliar permissão, confrontar `access-policy.js`, serviço, RLS/RPC e matriz funcional do SHA atual.
