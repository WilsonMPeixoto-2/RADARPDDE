# RADAR PDDE — Estado atual do projeto

**Atualizado em:** 28 de julho de 2026  
**PR funcional em validação:** `#92 — feat: implementar competência mensal global`  
**Commit funcional publicado em Production:** `6f165f61016261073eba4b56ce7a0afd0074a904`  
**Natureza:** documento operacional e transitório

## 1. Regra de leitura

Antes de iniciar tarefa:

1. confirmar o HEAD remoto da `main`;
2. verificar PRs e workflows posteriores;
3. confirmar o deployment Vercel correspondente;
4. confirmar o estado do Supabase autorizado;
5. confrontar documentação e artefatos com código e ambientes;
6. atualizar este documento quando o estado mudar.

Código, banco e deployment prevalecem sobre planos e relatórios históricos.

## 2. Situação executiva

A integração entre frontend, Supabase Auth, PostgREST, RLS, PostgreSQL e Vercel Production está ativa. A governança da Gestão SME está aplicada e publicada.

O ciclo de oficialização está em execução. O primeiro PR funcional introduz:

- contexto mensal global sem dependência de DOM;
- seletor mensal no header;
- janeiro a dezembro de 2026 no controle global;
- persistência da seleção durante navegação, troca de perfil e recarga;
- sincronização entre competência e exercício;
- eliminação do seletor local concorrente da tela mensal;
- cobertura unitária, desktop, Android e iPhone;
- compatibilidade com o bootstrap Supabase existente.

O PR não altera schema, migrations ou dados. Production permanece no deployment funcional anterior até publicação controlada.

## 3. Estado por camada

| Camada | Estado |
|---|---|
| GitHub | PR #92 em validação; `main` ainda não recebeu o novo contexto mensal. |
| Vercel Production | deployment do commit `6f165f610...` em estado `READY`. |
| Runtime publicado | `production`, `supabase-production`, repositório remoto habilitado. |
| Supabase | projeto `scnryinorqeucbfkioxo` ativo e saudável. |
| Auth/RLS | ativos; acesso anônimo bloqueado. |
| Governança SME | concluída e publicada. |
| Competência global | implementada no PR #92; publicação pendente dos gates. |
| Excel SME | implementado; certificação integral pendente. |
| Liberação oficial | não declarada. |

## 4. Dados observados em Production

Data de corte: 28/07/2026.

| Entidade | Quantidade |
|---|---:|
| Configuração global | 1 |
| Programas | 8 |
| Controladores | 6 |
| Integrantes no diretório de Inventário | 4 |
| Competências | 12 |
| Escolas | 164 |
| Vínculos escola–programa | 431 |
| Perfis ativos | 13 |
| Verificações | 6 |
| Pendências | 3 |
| Tentativas | 3 |
| Contatos | 5 |
| Registros administrativos | 81 |
| Bens | 2 |

As quantidades são um retrato operacional e podem mudar com o uso real.

## 5. Perfis

| Perfil | Quantidade |
|---|---:|
| Controlador | 6 |
| Assistente de Verbas Federais | 1 |
| Equipe de Inventário | 4 |
| Gestão SME | 1 |
| Administrador técnico | 1 |

A carteira organiza responsabilidade, mas não impede colaboração entre Controladores da mesma CRE. A Gestão SME permanece somente leitura nas superfícies definidas pela ADR-022. O Inventário permanece restrito ao fluxo patrimonial autorizado.

## 6. Competências 2026

O Supabase contém `2026-01` a `2026-12`. A configuração de Production permanece:

```text
closing_competence = 2026-05
```

No PR #92, as 12 competências passam a ser apresentadas pelo contexto global. A seleção inicial segue:

1. chave persistida válida;
2. competência ativa carregada;
3. fechamento válido;
4. competência mais recente do exercício.

O exercício é derivado da competência persistida ou carregada. Assim, um exercício futuro não retorna indevidamente a 2026 após recarga.

### Ativação operacional

A alteração de `closing_competence` para `2026-12` ocorrerá somente após:

1. aprovação de readiness, Supabase local, Playwright, Lighthouse e dependências;
2. merge do PR #92;
3. build e publicação controlados;
4. smoke do deployment novo;
5. atualização transacional e auditada do calendário;
6. verificação pós-alteração em todos os perfis.

Não criar coluna ou migration de status mensal sem requisito adicional comprovado.

## 7. Avaliações e pendências

A estrutura atual contempla:

- avaliação por escola, competência e programa;
- bonificação e análise técnica independentes;
- consolidação APTA/INAPTA;
- pendências `Aberta`, `Aguardando reanálise`, `Resolvida` e `Cancelada`;
- tentativas, contatos, autoria, auditoria e concorrência otimista.

O próximo PR funcional certificará a jornada completa de avaliação e a coerência entre Dashboard, Carteira, Competências, Prontuário, persistência e nova sessão.

## 8. Excel

O Excel SME mensal está implementado e não possui o defeito conhecido de reparo. Permanecem pendentes:

- massa representativa;
- reconciliação Supabase → frontend → modelo → célula XLSX;
- isolamento entre competências;
- correção do escopo mensal do Excel editorial;
- certificação dos dois modelos;
- abertura no Microsoft Excel desktop;
- manifesto e hashes de evidência.

## 9. Segurança operacional

Comprovado:

- acesso anônimo bloqueado;
- somente chave publicável no frontend;
- RLS por papel e escopo;
- Edge Function protegida por JWT;
- alterações auditáveis;
- backup lógico pré-ativação disponível.

Bloqueadores antes do release oficial:

- habilitar proteção contra senhas vazadas no Supabase Auth;
- fixar deliberadamente a major do Node;
- validar backup e restauração em ambiente descartável;
- executar gate remoto por perfil;
- certificar os relatórios Excel;
- concluir UAT.

## 10. Gates do PR #92

Obrigatórios:

- sintaxe e lint sem aumento do débito existente;
- testes unitários do contexto mensal;
- readiness completo;
- migration smoke;
- Supabase local, pgTAP, lint SQL, Auth e RLS;
- dependências;
- Lighthouse;
- Playwright desktop;
- Playwright Android e iPhone;
- preservação da seleção após recarga;
- ausência de seletor mensal concorrente.

## 11. Ordem das próximas entregas

1. concluir, publicar e ativar o contexto global de competência;
2. certificar avaliação mensal e APTA/INAPTA;
3. construir timeline cronológica da unidade;
4. reconciliar e certificar os dois relatórios Excel;
5. implementar navegação contextual e botões de voltar;
6. executar polimento editorial e visual;
7. fortalecer segurança, realizar UAT e decidir a liberação oficial.

Plano detalhado: [`superpowers/plans/2026-07-28-oficializacao-operacional-radar-pdde.md`](superpowers/plans/2026-07-28-oficializacao-operacional-radar-pdde.md).
