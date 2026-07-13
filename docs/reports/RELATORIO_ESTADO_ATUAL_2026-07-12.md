# RADAR PDDE — Relatório de estado atual

**Data de referência:** 12 de julho de 2026

**Escopo:** progressão das últimas sessões, PRs 18 e 19, validações e situação de publicação.

## Resumo executivo

O pacote integrado planejado para o PR 18 foi concluído. A `main` reúne as Tasks 10–13 do Ciclo A, o Dashboard operacional, os filtros operacionais da Carteira, melhorias de acessibilidade e refinamentos visuais.

Após a publicação do PR 18, foi identificada uma regressão na Carteira de Escolas: a tabela aprovada havia sido substituída, eliminando programas em destaque e a ação **Editar**. O PR 19 restaurou integralmente essa interface e preservou os novos filtros técnicos. A correção já está na `main` e em um Preview pronto.

A produção ainda não recebeu o PR 19 porque o limite diário de implantações do plano gratuito da Vercel foi atingido. A ação recomendada é promover o Preview corrigido quando o limite for restabelecido, sem rollback.

## Progressão registrada

1. A linha de base publicada já continha o Ciclo A até a Task 9: pendências, novo envio, reanálise, quatro filas, busca, navegação contextual e Excel.
2. As Tasks 10 e 11 adicionaram registro de contatos, cancelamento justificado, reabertura com preservação de histórico e alertas alinhados ao responsável pela próxima ação.
3. As Tasks 12 e 13 adicionaram retificação administrativa pelo perfil Assistente, com comparação antes/depois, justificativa e histórico, sem alterar pendências ou análise técnica.
4. O Dashboard passou a separar pendências abertas de itens aguardando reanálise e a apresentar próximas ações priorizadas.
5. A Carteira recebeu filtros por situação documental, busca por INEP e transporte de recortes vindos do Dashboard.
6. O refinamento de qualidade incluiu foco por teclado, adaptação móvel, contenção de diálogos e melhorias de acabamento visual.
7. O PR 18 foi incorporado à `main` e publicado.
8. A regressão da Carteira foi identificada visualmente após a publicação.
9. O PR 19 restaurou a tabela aprovada, programas, dados da direção, **Ver Unidade** e **Editar**, mantendo os novos filtros.
10. A promoção do Preview corrigido ficou pendente exclusivamente pelo limite temporário da Vercel.

## Situação dos ambientes

| Ambiente | Referência | Situação |
|---|---|---|
| `main` | `f882852` | Pacote completo e Carteira restaurada. |
| Preview corrigido | `d59fc79` | Pronto; Dashboard aprovado + Carteira restaurada. |
| Produção | `8069d56` | Dashboard aprovado, porém ainda com a regressão da Carteira. |

**Preview corrigido:** <https://radarpdde-fix-git-fix-restaur-517176-wilson-m-peixotos-projects.vercel.app>

**Produção:** <https://radarpdde-fix.vercel.app/>

## Entregas funcionais

| Área | Entrega disponível na `main` |
|---|---|
| Dashboard | Indicadores separados, carteira ativa, próxima ação e transporte de filtros. |
| Carteira de Escolas | Tabela aprovada, programas em destaque, direção, Controlador, bonificação, análise, pendência, **Ver Unidade** e **Editar**; busca por nome, designação e INEP. |
| Pendências | Quatro filas, busca, detalhes, timeline, contatos, cancelamento e reabertura. |
| Visão por Competência | Separação entre bonificação, análise e pendência; abertas e aguardando reanálise apresentadas separadamente. |
| Prontuário | Novo envio, reanálise, histórico e retificação administrativa auditável. |
| Alertas | Distinção entre providência da escola e conferência do Controlador. |
| Excel | Exportação estruturada preservada. |

## Validação concluída

- **136 testes de regras e dados aprovados**;
- **61 testes completos de uso aprovados**;
- **2 cenários ignorados por configuração**;
- **0 falhas**.

A verificação final confirmou especificamente:

- programas preservados na Carteira;
- 163 ações **Ver Unidade** e 163 ações **Editar** no conjunto exibido;
- filtros de pendências abertas, aguardando reanálise e sem pendência ativa;
- navegação Dashboard → Carteira;
- histórico de contatos, cancelamento, reabertura e retificação;
- preservação da bonificação durante novo envio, reanálise e retificação;
- adaptação das telas principais para desktop e dispositivos móveis.

## Regra de preservação visual e funcional

Está autorizado aprimorar a qualidade de elementos existentes por meio de espaçamento, tipografia, contraste, alinhamento, hierarquia, responsividade e acabamento.

Dependem de aprovação expressa prévia:

- remover ou acrescentar caminhos;
- retirar, substituir ou mudar a finalidade de botões;
- substituir componentes ou tabelas aprovados;
- alterar colunas, permissões, fluxos ou funcionalidades;
- redefinir o conceito estético.

Uma organização visual diferente não autoriza mudança funcional.

## Limitações conhecidas

- persistência baseada no navegador atual;
- ausência de autenticação real;
- Supabase ainda desabilitado;
- ausência de sincronização automática entre dispositivos;
- ausência de integração automática com o Google Drive;
- publicação do PR 19 temporariamente bloqueada pelo limite diário da Vercel.

## Próximos passos

1. Promover o Preview corrigido quando o limite da Vercel for restabelecido.
2. Conferir no domínio de produção o Dashboard e a Carteira restaurada.
3. Executar uma verificação breve de Pendências, Competências e Prontuário.
4. Registrar a conclusão da publicação na documentação.
5. Prosseguir para o próximo ciclo somente a partir da `main` corrigida.

## Rastreabilidade

- [PR 18 — Pacote integrado: operação, retificação, Dashboard e Carteira](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/18)
- [PR 19 — Hotfix: restaurar Carteira de Escolas aprovada](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/19)
- [Commit do PR 18](https://github.com/WilsonMPeixoto-2/RADARPDDE/commit/8069d564924648025bf4f8bf5e5c95d56238e268)
- [Commit do PR 19](https://github.com/WilsonMPeixoto-2/RADARPDDE/commit/f8828523ff8fd31bfbe98322e6e9387566769499)
