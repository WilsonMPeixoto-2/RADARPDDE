# Catálogo de superfícies do RADAR PDDE

**Estado:** referência operacional vigente da baseline funcional do PR #260  
**Atualizado em:** 5 de setembro de 2026

> Para retomar o projeto, comece em [`../../START_HERE.md`](../../START_HERE.md). Este catálogo descreve superfícies, usuários e relações. A autorização efetiva continua cumulativa entre UI, `access-policy`, serviços, Auth, RLS, RPCs e Edge Functions.

## 1. Regras gerais

Toda superfície deve:

- consumir o mesmo universo canônico de dados;
- respeitar competência, exercício, escola, programa e perfil;
- preservar autoria e escopo;
- indicar próxima ação sem inventar estado;
- preservar conteúdo/capacidade essencial no mobile;
- persistir por serviço/repositório apropriado;
- manter coerência depois de reload quando houver escrita;
- não transformar um resumo visual em nova fonte de verdade.

`technical_admin` é papel técnico real. Simular outro perfil muda a apresentação, não o JWT nem a identidade.

## S-01 — Dashboard

**Finalidade:** síntese gerencial/operacional de estado, prioridade e próximos passos.  
**Perfis:** Controlador, Assistente, SME e Inventário conforme recorte; `technical_admin` sob política técnica.  
**Dados:** escolas, verificações, Pendências, bens e projeções.  
**Regra:** cartões/filtros/navegação não reescrevem estado; ações aparecem por capacidade.

## S-02 — Carteira de Escolas

**Finalidade:** localizar, comparar e abrir unidade.  
**Regra:** `controller_id` define responsável principal. Colaboração autorizada na mesma CRE não transfere carteira automaticamente. Controlador não redistribui a escola pelo cadastro comum.

## S-03 — Competências

**Contexto:** competência global única `YYYY-MM` via `RadarCompetenceContext`.  
**Perfis:** Controlador/Assistente operam; SME acompanha o recorte permitido.  
**Regra:** competência futura pode ser consultada, mas não editada nas operações mensais protegidas. Não criar seletor global concorrente.

## S-04 — Pendências Operacionais

**Estados:** `Aberta`, `Aguardando reanálise`, `Resolvida`, `Cancelada`.  
**Ativas:** `Aberta` e `Aguardando reanálise`.  
**Perfis de mutação:** Controlador/Assistente e `technical_admin` conforme capacidade; SME e Inventário não recebem mutações documentais só por visualizar.

Regras pós-#254/#256:

- novo envio não resolve;
- primeiro envio corretivo pode partir de `Aberta`;
- substituição mais recente pode ser registrada enquanto já está `Aguardando reanálise`;
- a nova tentativa fica aguardando análise e a Pendência permanece `Aguardando reanálise`;
- reanálise correta resolve; incorreta/arquivo indisponível volta a `Aberta`;
- `Resolvida` ou `Cancelada` pode ser reaberta quando autorizado;
- próximo ator: `Aberta → Escola`, `Aguardando reanálise → Controlador`, terminal → nenhum;
- a página pode operar em **Todas as competências** como passivo transversal.

## S-05 — Prontuário

**Finalidade:** concentrar identificação, programas, avaliação, Pendências, NFs, patrimônio e timeline da escola.  
**Regra:** bonificação, análise e Pendência são dimensões distintas. SME real não recebe controles de análise/mutação apenas por acessar o Prontuário.

Notas Fiscais e Consulta Assessoria mantêm individualização por invoice onde aplicável. O tópico de inventário mostra a NF/bem vinculados por identidade técnica.

## S-06 — Capital e Inventário

**Dados:** bens, NFs permanentes vinculadas, processo, status, responsável e conclusão da inventariação.  
**Backend:** `InventoryService`, `assets` e RPCs compostas.

Existem **dois ramos legítimos**, que não podem ser confundidos:

```text
NF permanente + número + processo já cadastrado
→ bem nasce Encaminhada
→ UI mostra Aguardando Inventariação
→ ação seguinte: Inventariar

NF permanente sem processo
→ bem nasce Não encaminhada
→ quando o processo existir: Encaminhar
→ depois: Inventariar
```

Portanto, o botão/ação **Encaminhar** aplica-se ao bem que realmente está `Não encaminhada`; não é etapa obrigatória de toda NF permanente.

Outras regras:

- `Não encaminhada` não pode pular direto para `Inventariada`;
- `encampInventario`: nenhuma permanente = N/A; alguma não encaminhada = Não; todas encaminhadas/inventariadas = Sim;
- encaminhamento posterior de bem vinculado sincroniza bem + verificação + log atomicamente;
- bem derivado de NF não aceita edição isolada do número fiscal;
- concluir inventariação exige `Encaminhada` e responsável.

## S-07 — Registros Internos

**Dados:** `administrative_logs` e contexto funcional.  
**Regra:** leitura respeita papel/escopo. `technical_admin` possui autoridade técnica própria; SME real não ganha visão ampla de logs apenas por ser perfil gerencial.

## S-08 — Configurações SME

**Perfis:** Gestão SME e `technical_admin`.  
**Dados/ações:** exercício, competências, calendário/prazo, programas e configurações autorizadas.  
**Regra:** UI não substitui serviço/RPC/RLS/concorrência.

## S-09 — Gestão de Equipe

**Responsável funcional:** Assistente de Verbas Federais; `technical_admin` conforme autoridade técnica.  
**Fluxo:**

```text
DirectoryService
→ TeamAccountGateway
→ team-account-management
→ Auth Admin + RPC transacional
```

**Proteções:** CORS fail-closed, JWT/papel, lookup Auth exato, reutilização segura, conflito de vínculo, desativação lógica e compensação.

## S-10 — Exercícios

Criação de exercício é operação composta: configuração + doze competências + log. Competência inicial precisa pertencer ao novo exercício e o contrato preserva optimistic concurrency.

## S-11 — Programas

Gestão SME/`technical_admin` mantêm catálogo conforme políticas atuais. Desativação lógica preserva histórico. Alteração de autorização exige decisão expressa e mudança coordenada de UI, serviço e banco.

## S-12 — Alertas

Localiza itens que exigem atenção e transporta o contexto adequado. Não cria mutação de negócio por si só.

## S-13 — Busca global

Pesquisa apenas recursos autorizados e navega para o destino contextual. Não deve revelar entidade fora do escopo.

## S-14 — Exportações

- relatório institucional: XLSX, com fallback secundário onde previsto;
- Excel SME: uma competência, uma aba, **27 colunas A:AA**;
- XLSX de Pendências: respeita busca/filtros e não expõe IDs técnicos;
- download auditável quando o contrato exige `AuditService`;
- alteração material do Excel SME exige gate específico.

## S-15 — Autenticação

Backend: Supabase Auth. Aplicação permanece inerte antes da sessão/autorização necessárias. `user_profiles`, papel, CRE/escopos e RLS compõem a fronteira real. Anônimo não recebe dados institucionais.

## S-16 — Modais e confirmações

Devem preservar foco, Escape, retorno, contexto, estados de salvando/sucesso/erro e impedir repetição indevida do gesto quando a ação estiver em andamento.

## S-17 — Formulários

Validação, erro, conflito e persistência devem preservar os valores e o contexto do usuário. Escrita não é repetida silenciosamente. Quando material, salvar deve sobreviver a reload.

## S-18 — Estados vazios/loading/erro

Devem explicar o estado e oferecer próxima ação segura. Retry automático só é aceitável quando o contrato é idempotente/protegido.

## S-19 — Monitoramento de Production

GitHub Actions/monitoramento verificam componentes técnicos do sistema publicado. Um monitor verde não substitui teste funcional quando houver risco real; uma falha isolada também não redefine regra sem diagnóstico do componente.

## 2. Relações obrigatórias

```text
Dashboard
↔ Carteira
↔ Competências
↔ Prontuário
↔ Pendências
↔ Timeline
↔ Alertas
↔ Busca
↔ Exportações
```

Gestão de Equipe, Capital/Inventário, Registros Internos e Configurações conectam-se ao núcleo por capacidades específicas.

## 3. Gate de mudança de superfície

Para a superfície alterada, verificar proporcionalmente:

1. perfis positivos/negativos;
2. dados lidos/escritos;
3. handler → serviço → repositório → backend;
4. persistência/reload quando houver escrita;
5. erro/conflito/compensação;
6. desktop/mobile se a apresentação mudou;
7. acessibilidade/teclado/foco quando a interação mudou;
8. documentação corrente e rastreabilidade quando a regra/continuidade mudou.

Não executar todos os gates por ritual quando a alteração não os alcança, e não declarar um fluxo defeituoso apenas porque uma descrição histórica mais curta omitiu suas pré-condições.