# RADAR PDDE — Estado atual do projeto

**Atualizado em:** 28 de julho de 2026  
**HEAD da `main`:** `503a3f5a6539f84663a674464aef8696a1a546a0`  
**Deployment funcional em Production:** `dpl_6tjSL6iFXAR2CkhPoRBm8kvtyvtJ` — commit `4964049e426181fef1d01cb7d2309b898a7bf9d7`  
**Frente em validação:** certificação da avaliação mensal e do resultado APTA/INAPTA  
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

O primeiro ciclo da oficialização foi concluído:

- contexto mensal global publicado;
- seletor de competência disponível no header;
- competências `2026-01` a `2026-12` selecionáveis;
- seleção preservada entre telas, perfis e recarga;
- sincronização entre exercício e competência;
- seletor local concorrente removido;
- cobertura desktop, Android e iPhone aprovada;
- `closing_competence` alterada de `2026-05` para `2026-12`;
- alteração registrada com autoria técnica, log e `row_version = 5`;
- deployments automáticos novamente bloqueados.

A frente atual certifica que a mesma regra de avaliação mensal sustenta domínio, serviço, interface, persistência e recarga.

## 3. Estado por camada

| Camada | Estado |
|---|---|
| GitHub | `main` contém o ciclo de competência global; ciclo de avaliação em branch isolada. |
| Vercel Production | deployment `dpl_6tjSL6iFXAR2CkhPoRBm8kvtyvtJ` em estado `READY`. |
| Runtime publicado | `production`, `supabase-production`, repositório remoto habilitado. |
| Supabase | projeto `scnryinorqeucbfkioxo` ativo e saudável. |
| Calendário | `closing_competence = 2026-12`, `row_version = 5`. |
| Auth/RLS | ativos; acesso anônimo bloqueado. |
| Governança SME | concluída e publicada. |
| Competência global | concluída, publicada e operacionalizada. |
| Avaliação mensal | projeção e jornada em certificação. |
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
| Registros administrativos | 82 ou mais, incluindo a ativação do calendário |
| Bens | 2 |

As quantidades são retrato operacional e podem mudar com o uso real.

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

O Supabase contém `2026-01` a `2026-12` e Production utiliza:

```text
closing_competence = 2026-12
row_version = 5
```

A seleção inicial segue:

1. chave persistida válida;
2. competência ativa carregada;
3. fechamento válido;
4. competência mais recente do exercício.

O exercício é derivado da competência persistida ou carregada. A seleção mensal orienta Dashboard, Carteira, Competências, Prontuário, Pendências, alertas e exportações.

Não criar coluna ou migration de status mensal sem requisito adicional comprovado.

## 7. Avaliação mensal — frente atual

A avaliação é identificada por:

```text
escola + competência + programa
```

A projeção canônica em validação reúne:

- possibilidade de consolidação;
- resultado `apta`, `inapta` ou nulo;
- campos ausentes;
- estágio da bonificação;
- situação da análise técnica;
- conclusão técnica `not_started`, `in_progress` ou `complete`;
- pendências abertas;
- itens aguardando reanálise;
- total de pendências ativas.

O `VerificationService` utiliza a mesma projeção para consultar e consolidar, preservando:

- persistência atômica existente;
- `row_version`;
- log administrativo;
- autoria;
- validações de nota fiscal;
- bloqueio por perfil;
- impedimento de sobrescrita silenciosa.

### Jornada obrigatória

1. selecionar uma competência posterior a maio;
2. abrir uma unidade com PDDE Básico;
3. preencher entrega e análise dos documentos;
4. consolidar como APTA ou INAPTA;
5. confirmar o mesmo resultado no objeto canônico e no estado persistido;
6. recarregar a aplicação;
7. confirmar competência, consolidação e projeção;
8. confirmar log e ausência de erro de página.

## 8. Pendências e histórico

A estrutura contempla:

- pendências `Aberta`, `Aguardando reanálise`, `Resolvida` e `Cancelada`;
- tentativas, contatos, autoria, auditoria e concorrência otimista;
- novo envio sem resolução automática;
- reanálise positiva para resolução;
- reanálise negativa com retorno da providência.

O ciclo seguinte construirá uma timeline única por unidade, sem criar tabela paralela.

## 9. Excel

O Excel SME mensal está implementado e não possui o defeito conhecido de reparo. Permanecem pendentes:

- massa representativa;
- reconciliação Supabase → frontend → modelo → célula XLSX;
- isolamento entre competências;
- correção do escopo mensal do Excel editorial;
- certificação dos dois modelos;
- abertura no Microsoft Excel desktop;
- manifesto e hashes de evidência.

## 10. Segurança operacional

Comprovado:

- acesso anônimo bloqueado;
- somente chave publicável no frontend;
- RLS por papel e escopo;
- Edge Function protegida por JWT;
- alterações auditáveis;
- backup lógico pré-ativação disponível;
- deployments automáticos bloqueados após a janela controlada.

Bloqueadores antes do release oficial:

- habilitar proteção contra senhas vazadas no Supabase Auth;
- fixar deliberadamente a major do Node;
- validar backup e restauração em ambiente descartável;
- executar gate remoto por perfil;
- certificar os relatórios Excel;
- concluir UAT.

## 11. Ordem das próximas entregas

1. certificar avaliação mensal e APTA/INAPTA;
2. construir timeline cronológica da unidade;
3. reconciliar e certificar os dois relatórios Excel;
4. implementar navegação contextual e botões de voltar;
5. executar polimento editorial e visual;
6. fortalecer segurança, realizar UAT e decidir a liberação oficial.

Plano detalhado: [`superpowers/plans/2026-07-28-oficializacao-operacional-radar-pdde.md`](superpowers/plans/2026-07-28-oficializacao-operacional-radar-pdde.md).
