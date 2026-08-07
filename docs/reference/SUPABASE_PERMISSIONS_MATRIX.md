# Matriz de permissões — Supabase

**Atualizado em:** 7 de agosto de 2026  
**Estado:** referência vigente

Esta matriz representa o contrato funcional vigente entre interface, serviços, Auth, RLS, RPCs e Edge Functions. O baseline mutável fica em [`../CURRENT_STAGE.md`](../CURRENT_STAGE.md).

## 1. Papéis

| Papel | Nome exibido | Natureza | Escopo padrão |
|---|---|---|---|
| `controller` | Controlador | funcional | própria CRE; carteira como responsabilidade principal |
| `federal_assistant` | Assistente de Verbas Federais | funcional | operação transversal e Gestão de Equipe da CRE |
| `inventory` | Equipe de Inventário | funcional | fluxo patrimonial da própria CRE |
| `sme_management` | SME (Gestão) | gerencial | leitura consolidada e configurações autorizadas |
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
| Escolas da própria CRE | L/A cadastral autorizada | L/C/A | L patrimonial | L | L/C/A/E |
| Identidade institucional da escola | L | L/C/A | L | L | L/C/A/E |
| Carteiras / `controller_id` | L | L/C/A | L | L | L/C/A/E |
| Programas | L | L | L patrimonial | L/C/A | L/C/A/E |
| Competências | L | L | L | L/C/A | L/C/A/E |
| Configuração global | L | L | L | L/C/A | L/C/A/E |
| Bonificação | L/C/A | L/C/A | — | L | L/C/A/E |
| Análise técnica | L/C/A | L/C/A | — | — | L/C/A/E |
| Pendências | L/C/A | L/C/A | L patrimonial restrita | L | L/C/A/E |
| Tentativas | L/C/A | L/C/A | L patrimonial restrita | L | L/C/A/E |
| Contatos/cobranças | L/C/A | L/C/A | — | L | L/C/A/E |
| Notas fiscais | L/C/A | L/C/A | L | L | L/C/A/E |
| Bens | L/C/A autorizada | L/C/A | L/C/A de inventariação | L | L/C/A/E |
| Controladores | L | L/C/A/S | L | L | L/C/A/E/S |
| Equipe de Inventário | L | L/C/A/S | L própria | L | L/C/A/E/S |
| Contas Auth da equipe | — | C/A/S | — | — | C/A/S |
| Perfis e escopos | própria associação | própria associação | própria associação | L autorizada | L/C/A/E |
| Logs administrativos | L da CRE | L da CRE | L patrimonial | L conforme política de autoria | L amplo/E excepcional |
| Auditoria técnica | — | — | — | L autorizada | L |
| Importações | — | L/C/A autorizada | — | L | L/C/A/E |

## 4. Controlador

A carteira organiza responsabilidade e filtro inicial; não constitui fronteira de segurança entre Controladores da mesma `cre_scope`.

O Controlador:

- consulta escolas autorizadas na própria CRE;
- atua em escola de colega quando a política permite, sem transferir `controller_id`;
- registra autoria real;
- não acessa outra CRE sem escopo explícito;
- pode receber exceção em `user_school_scopes`;
- não cria nova unidade escolar pela superfície funcional cotidiana;
- não altera identidade institucional de escola;
- não altera `controller_id` por edição cadastral.

A última restrição é protegida também por trigger de autorização no banco.

## 5. Assistente de Verbas Federais

Possui operação transversal na CRE e Gestão de Equipe:

- cadastrar/editar Controladores;
- criar ou reutilizar conta Auth autorizada;
- manter `user_profiles` e vínculos;
- redistribuir escolas individualmente e em lote;
- desativar integrante e bloquear acesso;
- cadastrar/editar/desativar integrantes do Inventário;
- cadastrar nova escola com identidade institucional real;
- alterar identidade institucional quando necessário;
- executar operações e exportações autorizadas;
- registrar auditoria.

### Fronteira server-side da Gestão de Equipe

```text
frontend
→ team-account-management
→ Auth Admin + RPC transacional
```

A Edge Function:

- exige JWT;
- valida papel institucional;
- aplica CORS fail-closed;
- aceita somente origens autorizadas;
- resolve conta Auth por e-mail com RPC restrita a `service_role`;
- não depende de varredura global `listUsers`;
- recupera vínculo histórico seguro;
- rejeita divergência ambígua;
- executa compensação em falha parcial.

A versão efetiva da função fica em `CURRENT_STAGE.md`.

## 6. Inventário

O perfil:

- consulta escolas e programas necessários ao painel patrimonial da própria CRE;
- consulta bens autorizados;
- conclui inventariação de bem encaminhado;
- atua apenas nas mutações patrimoniais expressamente permitidas pelo serviço/RLS;
- não altera bonificação, análise técnica, identidade escolar, carteira, contatos ou configuração;
- não recebe acesso patrimonial a outra CRE.

As políticas patrimoniais são específicas e não derivam de uma permissão genérica de escrita escolar.

## 7. Gestão SME

- consulta identificação e bonificação;
- não vê análise técnica nas superfícies restritas;
- consulta Pendências sem mutações operacionais;
- consulta Registros Internos segundo a política vigente de autoria;
- acessa configurações globais autorizadas;
- cadastra, edita e desativa programas conforme o contrato atualmente implementado;
- cria exercícios/competências e mantém calendário conforme serviço/RPC/RLS vigentes.

`CFG-03` e `CFG-04` não são mais tratadas como decisão funcional pendente. O código já implementa a autoridade. Qualquer retirada ou expansão futura dessa capacidade precisa de decisão expressa, regressão e atualização coordenada das camadas.

A SME não administra cotidianamente a equipe da CRE.

## 8. Administrador técnico

- mantém `technical_admin` como papel efetivo;
- pode alternar organização visual sem alterar JWT;
- administra infraestrutura, perfis, escopos, importações e auditoria;
- executa exclusão física apenas em procedimento técnico excepcional;
- não substitui testes com contas funcionais próprias de cada perfil.

## 9. Escolas e identidade institucional

Nova escola exige:

- código institucional;
- designação;
- denominação;
- INEP;
- CNPJ;
- SICI;
- competência inicial válida;
- Controlador ativo;
- programa básico e demais programas autorizados.

O banco impede identidade vazia e duplicidades normalizadas de INEP, CNPJ e SICI. Não criar identificadores fictícios.

Alteração de identidade institucional por Controlador é bloqueada no serviço.

## 10. Patrimônio

A edição rápida de `ASSET-02`:

- aceita somente o campo explicitamente definido em `DIRECT_EDIT_FIELDS`;
- exige perfil operacional autorizado;
- obtém `row_version` do bem;
- registra `administrativeLog`;
- persiste por `saveAssetWithLog`;
- não reutiliza `DataService.defaultPersist` como contrato normal.

Inventário, encaminhamento e criação de bem continuam com fluxos próprios.

## 11. Exclusão e desativação

- remoção visual de integrante significa desativação lógica;
- histórico/autoria são preservados;
- carteira deve ser redistribuída quando necessário;
- conta Auth é bloqueada pelo backend protegido;
- exclusão física permanece excepcional e técnica;
- `audit_events` não recebe mutação direta de usuários operacionais.

## 12. Homologação obrigatória

### Autorização

- anônimo e usuário sem perfil são bloqueados;
- cada perfil vê somente superfícies permitidas;
- outra CRE é bloqueada sem exceção;
- SME não executa mutações operacionais de Pendências;
- Inventário não altera bonificação ou cadastro escolar;
- usuários operacionais não veem simulação técnica.

### Controlador

- inicia pela própria carteira;
- colaboração na mesma CRE preserva responsável principal;
- não redistribui `controller_id`;
- não altera identidade institucional;
- autoria identifica executor;
- conflito não sobrescreve silenciosamente.

### Gestão de Equipe

- Assistente cadastra, edita e desativa Controlador;
- conta Auth existente é reutilizada quando o contrato permite;
- vínculo ativo conflitante é rejeitado;
- redistribuição persiste após recarga;
- Assistente administra Inventário;
- repetição idempotente não duplica conta;
- falha após convite/bloqueio é compensada;
- origem oficial passa e origem indevida falha;
- conta é resolvida sem varredura global do catálogo Auth.

### Gestão SME

- recortes gerenciais permanecem restritivos;
- configurações alcançam backend correto;
- programas persistem com versão/log e negativas dos perfis indevidos.

## 13. Princípios permanentes

1. chave publicável não substitui RLS;
2. credencial administrativa nunca chega ao navegador;
3. leitura e mutações possuem políticas separadas;
4. RPC privilegiada valida autorização internamente;
5. Edge Function administrativa exige JWT e papel;
6. falha parcial exige compensação;
7. carteira não muda sem ação explícita autorizada;
8. identidade institucional não é sintetizada;
9. mobile não remove capacidade essencial;
10. mudança de permissão exige decisão funcional e testes cruzados;
11. função crítica exige prova ponta a ponta conforme matriz/ADR-041.
