# Auditoria funcional Frontend ↔ Supabase

**Data de abertura:** 6 de agosto de 2026  
**Estado:** Task 1 concluída — baseline fixado; 41 operações aguardando revalidação  
**Registro estruturado:** `docs/audits/2026-08-06-functional-supabase-audit.json`

## Hierarquia das fontes

1. código efetivamente versionado na `main`;
2. estado remoto comprovado do Supabase Production;
3. deployment efetivamente publicado na Vercel Production;
4. documentação, descrições de PR e resumos de workflows como fontes auxiliares.

Nenhuma conclusão desta auditoria será baseada apenas em documentação.

## Baseline confirmado

| Componente | Estado confirmado |
|---|---|
| `main` | `97c8bedbd7c93d82d527e183762b37a0934bd5f0` |
| PR mais recente integrado | nº 155 — atualização documental após a autorização da carteira |
| Vercel Production | `dpl_3XkgxsWF58VKiScasmUkUcwtJWxu`, `READY` |
| Commit da Vercel Production | `97c8bedbd7c93d82d527e183762b37a0934bd5f0` |
| Projeto Supabase | `scnryinorqeucbfkioxo` |
| Migrations em Production | 27 |
| Última migration | `202608050001_school_assignment_authorization` |
| Auditoria agregada | `healthy`, `totalIssues = 0`, `schemaVersion = 1` |
| Edge Function | `team-account-management`, versão 108, `ACTIVE`, JWT obrigatório |
| Supabase JS | `2.110.9` |
| Supabase CLI | `2.110.0` |
| Issues abertas | nenhuma |
| Workflows observados no SHA da `main` | 6 execuções; nenhuma falha localizada |

## Operações inicializadas

O registro estruturado contém exatamente 41 operações, distribuídas nos seguintes grupos:

| Grupo | Quantidade |
|---|---:|
| autenticação, navegação, leituras e exportações | 10 |
| configurações, escolas e Gestão de Equipe | 11 |
| verificações, pendências, notas, bens e auditoria | 17 |
| operações técnicas e monitoramento | 3 |
| **Total** | **41** |

Todas começam com estado `pending`. Nenhuma classificação anterior será mantida sem nova conferência contra o código atual.

## Itens que precisam ser revalidados

Os itens abaixo são hipóteses ou lacunas anteriores, não conclusões desta auditoria:

1. **Cadastro institucional de escola:** verificar se identificadores como INEP, CNPJ, designação e SICI são informados e persistidos corretamente ou substituídos por valores artificiais.
2. **Edição genérica de bem (`ASSET-02`):** verificar se a rota usa persistência padrão sem o mesmo RPC atômico, log e versão das demais mutações patrimoniais.
3. **Auditoria das exportações XLSX:** verificar se o evento chega efetivamente a `administrative_logs` ou permanece apenas no estado local/é rejeitado pela persistência ou RLS.
4. **Smoke autenticado de leitura em Production:** a infraestrutura existe, mas permanece desativada por ausência de cinco identidades técnicas autorizadas. A auditoria não criará essas contas nem ativará o workflow.

## Limites desta frente

- nenhuma alteração de regra de negócio;
- nenhuma mutação de dados reais em Production;
- nenhuma criação de conta técnica;
- nenhuma correção antes da reprodução e da localização da primeira fronteira divergente;
- novos testes apenas quando ligados diretamente a uma falha comprovada;
- correções funcionais em PRs separados da documentação da auditoria.

## Próxima etapa

A Task 2 revalidará estaticamente cada uma das 41 operações pelo percurso:

```text
controle visível
→ handler
→ serviço de aplicação
→ DataService/UnitOfWork
→ SupabaseRepository
→ tabela, RPC ou Edge Function
→ Auth/RLS/grants
→ resposta
→ estado local
→ persistência
→ releitura
→ mensagem de sucesso ou erro
```

A classificação estática permitida será: `static-confirmed`, `static-gap`, `authorization-mismatch`, `backend-mismatch` ou `documentation-divergence`.
