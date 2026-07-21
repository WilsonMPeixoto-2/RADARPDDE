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
- contrato único de repositório;
- `LocalStorageRepository` operacional;
- `SupabaseRepository` implementado;
- concorrência otimista por `row_version`;
- **19 migrations SQL aplicadas no Supabase remoto e registradas na branch de sincronização patrimonial**;
- índices de chaves estrangeiras e políticas RLS otimizadas pela migration `20260720193000`;
- acesso colaborativo dos Controladores da mesma CRE definido pela migration `20260721090000`;
- escopo específico de Capital e Inventário consolidado pela migration `20260721153758`;
- RLS, auditoria, importação, reconciliação e rollback;
- Edge Function e RPCs de Gestão de Equipe preparadas;
- testes unitários, integração, E2E e pgTAP;
- Production preservada em modo local e fail-closed.

## 3. Controladores

A carteira individual é responsabilidade principal, filtro inicial e organização do trabalho. Não é barreira de acesso entre os cinco Controladores da 4ª CRE.

A migration 16 está aplicada no Preview:

- Controladores consultam e operam todas as escolas da própria `cre_scope`;
- o Dashboard continua abrindo pela carteira individual;
- atuar em escola de colega não muda automaticamente `schools.controller_id`;
- a autoria permanece associada ao usuário executor;
- escola de outra CRE continua bloqueada sem exceção explícita.

Os cinco registros funcionais somam as 163 escolas e possuem contas de Controlador vinculadas no Auth.

## 4. Capital e Inventário

A Equipe de Inventário usa a superfície específica **Capital e Inventário**.

O estado final das migrations 17 a 19 estabelece que o perfil `inventory`:

- consulta as 163 escolas da própria CRE para compor o painel patrimonial;
- consulta os 430 vínculos escola–programa necessários à interface;
- consulta e atualiza bens patrimoniais da própria CRE;
- pode concluir a inventariação de bem encaminhado;
- não recebe escrita cadastral em escolas;
- não recebe acesso funcional a bonificação, análise técnica, contatos, configuração global ou escolas de outra CRE.

Odair e Aylane possuem conta Auth confirmada e vínculo ativo com o perfil `inventory` e `cre_scope = '4ª CRE'`.

## 5. Supabase remoto

Projeto autorizado: `scnryinorqeucbfkioxo`.

Carga canônica validada:

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

Os Advisors de desempenho não apresentam mais chaves estrangeiras sem índice, reavaliação de `auth.uid()` por linha ou políticas permissivas duplicadas. Avisos de índices ainda não utilizados são informativos enquanto o ambiente não recebe carga operacional real.

## 6. Identidades configuradas

Foram vinculados e validados:

- um Administrador técnico com escopo da 4ª CRE;
- uma Assistente de Verbas Federais com escopo da 4ª CRE;
- cinco Controladores vinculados aos respectivos registros funcionais;
- dois integrantes da Equipe de Inventário vinculados aos respectivos registros funcionais.

As contas verificadas possuem e-mail confirmado, senha configurada e um único perfil institucional ativo.

A proteção contra senhas vazadas foi solicitada pela Management API, mas o Supabase recusou a ativação com HTTP 402 porque a organização está no plano Free. O recurso exige plano Pro ou superior. Nenhuma mudança de plano ou cobrança foi realizada.

## 7. Contrato Vercel

### Production

Permanece obrigatoriamente com:

```text
runtimeEnvironment: local
dataMode: local
supabaseRepositoryEnabled: false
productionActivationApproved: false
```

### Preview

O build reconhece diretamente `VERCEL_ENV=preview` e, na ausência de configuração RADAR explícita, gera:

```text
runtimeEnvironment: preview
dataMode: supabase-preview
supabaseRepositoryEnabled: true
productionActivationApproved: false
```

A URL e a chave `sb_publishable_` são material público do cliente Supabase. Nenhum token da Vercel, chave administrativa do Supabase ou senha de banco é necessário para o build automático.

O Preview não pode ser promovido automaticamente para Production.

## 8. Ocorrências operacionais resolvidas

- A migration 15 teve o identificador do histórico reconciliado para `20260720193000`.
- A migration 16 substituiu a interpretação restritiva das carteiras dos Controladores.
- As migrations 17 e 18 registram os ajustes intermediários do Inventário aplicados remotamente.
- A migration 19 consolida a regra final diretamente nas políticas patrimoniais e remove a helper transitória da API pública.

## 9. Próxima tarefa única

1. concluir os gates da branch de sincronização patrimonial;
2. mesclar o PR após CI verde;
3. homologar login real de Controladores e Inventário no Preview;
4. testar um lançamento patrimonial claramente identificado e reversível;
5. confirmar autoria, persistência e auditoria;
6. manter Production sem alteração.

## 10. Gate de Production

Production somente poderá usar Supabase após todos os itens abaixo:

- Preview conectado e estável;
- homologação funcional de todos os perfis, abas e telas;
- RLS positiva e negativa comprovada;
- persistência e concorrência otimista comprovadas;
- Gestão de Equipe homologada;
- Capital e Inventário homologado com usuários reais;
- Advisors analisados e bloqueadores de segurança tratados;
- backup, restauração e rollback testados;
- política de MFA definida;
- CI verde no mesmo commit implantado;
- autorização funcional e técnica específica.

Até lá, `productionActivationApproved` permanece `false`.

## 11. Critério de atualização

Atualize este documento quando ocorrer:

- merge que altere estágio ou prioridade;
- implantação de Preview conectado;
- alteração de identidades ou perfis;
- nova carga ou correção de dados;
- alteração de Production;
- decisão funcional que substitua regra vigente.
