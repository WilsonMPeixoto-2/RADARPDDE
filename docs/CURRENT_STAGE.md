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
- dashboard, carteira, competências, pendências, prontuário, Gestão de Equipe, Inventário e registros;
- contrato único de repositório;
- `LocalStorageRepository` operacional;
- `SupabaseRepository` implementado;
- concorrência otimista por `row_version`;
- **16 migrations SQL versionadas nesta branch; 15 aplicadas remotamente até a revisão da migration colaborativa**;
- índices de chaves estrangeiras e políticas RLS otimizadas pela migration `20260720193000`;
- acesso colaborativo dos Controladores da mesma CRE definido pela migration `20260721090000`;
- RLS, auditoria, importação, reconciliação e rollback;
- Edge Function e RPCs de Gestão de Equipe preparadas;
- testes unitários, integração, E2E e pgTAP;
- Production preservada em modo local e fail-closed.

## 3. Regra funcional corrigida dos Controladores

A carteira individual é responsabilidade principal, filtro inicial e organização do trabalho. Não é barreira de acesso entre os cinco Controladores da 4ª CRE.

Após aplicação da migration 16 no Preview:

- Controladores poderão consultar e operar todas as escolas da própria `cre_scope`;
- o Dashboard continuará abrindo pela carteira individual;
- atuar em escola de colega não mudará automaticamente `schools.controller_id`;
- a autoria permanecerá associada ao usuário executor;
- escola de outra CRE continuará bloqueada sem exceção explícita.

A expectativa anterior de bloqueio entre as carteiras de Tuane e Alzira está substituída.

## 4. Supabase remoto

Projeto autorizado: `scnryinorqeucbfkioxo`.

Carga canônica validada:

| Entidade | Quantidade |
|---|---:|
| Configuração geral | 1 |
| Programas | 8 |
| Controladores | 5 |
| Equipe de Inventário | 3 |
| Competências | 12 |
| Escolas | 163 |
| Vínculos escola–programa | 430 |

A validação confirmou ausência de referências órfãs e duplicidades materiais no conjunto carregado.

Os Advisors de desempenho não apresentam mais chaves estrangeiras sem índice, reavaliação de `auth.uid()` por linha ou políticas permissivas duplicadas. Avisos de índices ainda não utilizados são informativos enquanto o ambiente não recebe carga operacional real.

## 5. Identidades iniciais

Foram vinculados e validados:

- um Administrador técnico com escopo da 4ª CRE;
- uma Assistente de Verbas Federais com escopo da 4ª CRE;
- duas Controladoras vinculadas aos respectivos registros funcionais.

Os quatro usuários estão confirmados no Auth e possuem um único perfil institucional ativo.

A proteção contra senhas vazadas foi solicitada pela Management API, mas o Supabase recusou a ativação com HTTP 402 porque a organização está no plano Free. O recurso exige plano Pro ou superior. Nenhuma mudança de plano ou cobrança foi realizada.

## 6. Contrato Vercel

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

## 7. Ocorrências operacionais resolvidas

A primeira tentativa de workflow manual falhou porque `VERCEL_TOKEN`, `VERCEL_ORG_ID` e `VERCEL_PROJECT_ID` não estavam cadastrados no GitHub Actions.

A solução vigente elimina essa dependência:

- Preview é produzido pela integração Git–Vercel já existente;
- o próprio build aplica a configuração pública de homologação;
- Production continua local pelo valor real de `VERCEL_ENV`;
- configuração RADAR explícita continua prevalecendo sobre o padrão automático.

A migration 15 foi aplicada pelo conector do Supabase e teve o identificador do histórico reconciliado para o valor versionado `20260720193000`.

## 8. Próxima tarefa única

1. concluir os gates do PR de acesso colaborativo;
2. aplicar somente a migration `20260721090000` no Supabase de Preview após revisão;
3. executar uma única homologação remota corrigida para Tuane e Alzira;
4. comprovar leitura da 4ª CRE, escrita cruzada e autoria;
5. confirmar bloqueio fora da CRE e limpeza dos registros HML;
6. manter Production sem alteração.

## 9. Gate de Production

Production somente poderá usar Supabase após todos os itens abaixo:

- Preview conectado e estável;
- homologação funcional de todos os perfis, abas e telas;
- RLS positiva e negativa comprovada;
- persistência e concorrência otimista comprovadas;
- Gestão de Equipe homologada;
- Advisors analisados e bloqueadores de segurança tratados;
- backup, restauração e rollback testados;
- política de MFA definida;
- CI verde no mesmo commit implantado;
- autorização funcional e técnica específica.

Até lá, `productionActivationApproved` permanece `false`.

## 10. Critério de atualização

Atualize este documento quando ocorrer:

- merge que altere estágio ou prioridade;
- implantação de Preview conectado;
- alteração de identidades ou perfis;
- nova carga ou correção de dados;
- alteração de Production;
- decisão funcional que substitua regra vigente.
