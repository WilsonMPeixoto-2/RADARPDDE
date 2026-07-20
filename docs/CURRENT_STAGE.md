# RADAR PDDE — Estado atual do projeto

**Atualizado em:** 20 de julho de 2026  
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
- **15 migrations SQL versionadas: 14 aplicadas remotamente e a 15ª pronta para aplicação após o merge**;
- RLS, auditoria, importação, reconciliação e rollback;
- Edge Function e RPCs de Gestão de Equipe preparadas;
- testes unitários, integração, E2E e pgTAP;
- Production preservada em modo local e fail-closed.

## 3. Supabase remoto

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

## 4. Identidades iniciais

Foram vinculados e validados:

- um Administrador técnico com escopo da 4ª CRE;
- uma Assistente de Verbas Federais com escopo da 4ª CRE;
- duas Controladoras vinculadas aos respectivos registros funcionais.

Os quatro usuários estão confirmados no Auth e possuem um único perfil institucional ativo.

## 5. Contrato Vercel

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

## 6. Ocorrência operacional resolvida

A primeira tentativa de workflow manual falhou porque `VERCEL_TOKEN`, `VERCEL_ORG_ID` e `VERCEL_PROJECT_ID` não estavam cadastrados no GitHub Actions.

A solução vigente elimina essa dependência:

- Preview é produzido pela integração Git–Vercel já existente;
- o próprio build aplica a configuração pública de homologação;
- Production continua local pelo valor real de `VERCEL_ENV`;
- configuração RADAR explícita continua prevalecendo sobre o padrão automático.

## 7. Próxima tarefa única

1. validar o manifesto do Preview automático;
2. homologar login, sessão, telas, menus e permissões dos quatro perfis;
3. executar testes de persistência, RLS, auditoria e Gestão de Equipe;
4. analisar Advisors e tratar bloqueadores reais;
5. testar recuperação, backup e rollback;
6. registrar evidências e pendências.

## 8. Gate de Production

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

## 9. Critério de atualização

Atualize este documento quando ocorrer:

- merge que altere estágio ou prioridade;
- implantação de Preview conectado;
- alteração de identidades ou perfis;
- nova carga ou correção de dados;
- alteração de Production;
- decisão funcional que substitua regra vigente.
