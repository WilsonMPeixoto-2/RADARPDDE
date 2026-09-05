# AGENTS.md — RADAR PDDE 2026

**Atualizado em:** 5 de setembro de 2026

> **PRIMEIRA LEITURA OBRIGATÓRIA:** [`START_HERE.md`](START_HERE.md).

## 1. Continuidade obrigatória

Toda sessão/agente deve:

1. ler `START_HERE.md`;
2. confirmar `main`/SHA/PRs;
3. ler `docs/CURRENT_STATE.md`;
4. ler o método adversarial e o playbook reproduzível;
5. consultar achados Astra ainda abertos;
6. usar `docs/MASTER_PLAN_CURRENT.md` como único plano executável;
7. abrir código/testes/ADRs/migrations específicos da tarefa.

Planos/handoffs datados são história de checkpoint, não fila concorrente.

## 2. Regra metodológica permanente

Para qualquer análise ou implementação crítica, responder proporcionalmente ao risco:

1. **Onde esta regra está implementada pela segunda vez?**
2. **Que estado mais avançado esta operação pode destruir?**
3. **Existe caminho real da UI que contorna a autoridade considerada correta?**
4. **Que combinação de dois fluxos verdes ainda não foi testada em sequência?**
5. **Qual contraexemplo tentamos produzir para provar que o contrato estava errado?**

Método: [`docs/architecture/adversarial-analysis-and-implementation-method.md`](docs/architecture/adversarial-analysis-and-implementation-method.md)  
Playbook: [`docs/architecture/adversarial-analysis-replication-playbook.md`](docs/architecture/adversarial-analysis-replication-playbook.md)

Se essas perguntas não foram investigadas em fluxo crítico, não chamar a revisão de completa.

## 3. Identidade do produto

O RADAR PDDE é sistema institucional de gestão, controle, acompanhamento e fiscalização do PDDE da 4ª CRE/SME-Rio. Não é CRUD genérico.

Uma função não está pronta só porque grava no banco. O usuário deve conseguir encontrá-la, executá-la, compreender o estado e reencontrar o resultado com coerência entre telas/dados.

Toda entrega considera:

- correção técnica/funcional;
- coerência entre perfis/telas/dados;
- integridade/rastreabilidade/auditabilidade;
- feedback/próxima ação;
- persistência/releitura;
- acessibilidade/mobile quando material.

## 4. Fontes de verdade e cronologia

Para saber o que está implementado:

1. comportamento efetivo do SHA/ambiente;
2. código-fonte e cadeia real de execução;
3. Supabase efetivo: migrations, funções, Auth, RLS e dados;
4. decisões funcionais vigentes;
5. testes que representam o contrato atual;
6. documentação corrente;
7. histórico.

Código atual pode estar errado. Teste verde pode estar incompleto. Documento antigo pode estar superado.

Para SQL/RPC, resolver a **última definição efetiva da mesma assinatura**, não a primeira migration encontrada por busca.

## 5. Inventário e cobertura adversarial

Em auditorias amplas:

- gerar inventário mecânico do repositório;
- varrer código, testes, docs, migrations, pgTAP, scripts, fixtures, mocks e fallbacks;
- registrar hits por arquivo/linha;
- construir mapa de funções/calls/SQL quando útil;
- aprofundar semanticamente pelos clusters de risco;
- preservar artefatos para não repetir exploração em nova sessão.

Busca por palavras é descoberta de candidatos, nunca decisão semântica.

## 6. Mapa de autoridade

Para fluxo crítico, rastrear:

```text
UI real
→ handler/entrada pública
→ application service
→ domínio/planner
→ repository/data service
→ RPC/Edge Function
→ persistência
→ leitura/reload
→ renderização
→ superfícies relacionadas
```

Depois procurar explicitamente:

- outra implementação;
- closure privada;
- wrapper;
- extensão dinâmica;
- callback global;
- fallback/renderer legado;
- chamada direta a repository/RPC;
- regra repetida em `app.js` e `src/`.

Encontrar uma implementação correta não encerra a investigação.

## 7. Teste de estado avançado

Não limitar lifecycle a `criar → editar → excluir`.

Quando entidade avança em outro subsistema:

```text
criar
→ avançar em outro domínio
→ voltar à origem
→ salvar/editar novamente
→ persistir
→ reload
→ confirmar que o estado avançado sobreviveu
```

Exemplo obrigatório após achado Astra:

```text
NF permanente
→ Inventário conclui bem
→ salvar a mesma NF
→ bem deve continuar Inventariada
```

## 8. Teste pelo ponto de entrada real

Função correta isolada não certifica composição.

Exemplo:

```text
regra: auditoria antes do download

necessário:
clicar botão real
→ falhar auditoria inicial
→ nenhum download
```

Aplicar o mesmo raciocínio a modal, atalho, callback, wrapper, API pública e função exposta em `window`.

## 9. Testes não são autoridade autônoma

Aplicar [`docs/reference/TEST_GOVERNANCE.md`](docs/reference/TEST_GOVERNANCE.md).

Classificar teste/fixture como:

- contrato atual;
- legado/migração;
- estado adversarial inválido;
- mock sintético;
- teste excluído com sucessor;
- expectativa obsoleta;
- função isolada;
- composição real.

Título de teste ativo deve descrever a regra atual.

Não alterar produto para satisfazer expectativa histórica.

## 10. Ambiente de teste

Não confiar em `node_modules` reaproveitado sem comparar com `package.json`/lock.

Quando houver divergência material:

1. registrar versões;
2. normalizar por instalação reproduzível;
3. separar warning de depreciação de vulnerabilidade/bug funcional;
4. não atribuir falha ao produto sem reprodução na cadeia real.

## 11. Perfis e autorização

Perfis funcionais visíveis:

- Controlador;
- Assistente de Verbas Federais;
- Gestão SME;
- Equipe de Inventário.

`technical_admin` é papel técnico separado. Simulação visual não altera identidade/JWT/autoridade real.

Regras:

- Controlador não redistribui `controller_id` em edição comum;
- desativação de Controlador exige carteira zerada;
- Assistente tem atuação transversal e Gestão de Equipe;
- SME não recebe mutações operacionais de Pendências por simples visibilidade;
- Inventário opera recorte patrimonial;
- autorização crítica deve existir além da UI.

## 12. Competência

`RadarCompetenceContext` é autoridade global.

- não escrever `activeCompetenciaKey` diretamente para simular troca real;
- Pendências é exceção transversal e pode usar filtro local `Todas` sem alterar contexto global;
- competências futuras são consultáveis, mas operações mensais protegidas ficam somente leitura.

## 13. Pendências

Preservar:

- `Aberta`, `Aguardando reanálise`, `Resolvida`, `Cancelada`;
- novo envio não resolve;
- substituição em `Aguardando reanálise`;
- reanálise correta resolve; incorreta/indisponível reabre;
- reabertura de Resolvida/Cancelada quando autorizado;
- `Aberta → Escola`, `Aguardando → Controlador`, terminal → ninguém;
- bonificação/análise/Pendência independentes;
- histórico de cancelamento distinto de `canceled_at` terminal.

A divergência “idade total × tempo do ator atual” está **aberta para decisão** e não deve ser unificada por inferência.

## 14. NF / Assessoria / `a_identificar`

- análise/Pendência fiscal individual por `registered_invoice_id`;
- `a_identificar` novo = `Incorreto + Pendência` atômico;
- identificação preserva ID;
- legados legítimos sem backfill heurístico;
- Assessoria individual por NF de serviço;
- Boleto Internet é tipo de gasto em NF de Educação Conectada;
- análise fiscal agregada antiga não volta a ser autoridade só porque existe ramo/helper histórico.

## 15. Capital e Inventário

- permanente + número + processo existente → bem novo `Encaminhada` / Aguardando Inventariação;
- sem processo → bem novo `Não encaminhada`;
- sequência `Não encaminhada → Encaminhada → Inventariada` vale apenas para esse ramo;
- `encampInventario` é derivado do conjunto;
- NF ↔ bem usa identidade técnica;
- encaminhamento posterior é atômico;
- número fiscal derivado não é editado isoladamente.

**Defeito P1 aberto:** salvar NF vinculada a bem `Inventariada` pode rebaixá-lo para `Encaminhada`. Não considerar patrimônio fechado até hotfix/reload correspondente.

## 16. Exportações

- Excel SME: competência ativa, uma aba, 27 colunas A:AA;
- XLSX institucional: competência global ativa por decisão posterior;
- CSV: contrato temporal/auditoria ainda precisa decisão;
- Pendências XLSX: segue filtros locais da fila.

**Defeito P1 aberto:** botão Excel SME pode contornar auditoria pré-download. Teste feliz de workbook não prova ordem da auditoria.

## 17. Gestão de Equipe

Fluxo:

```text
DirectoryService
→ TeamAccountGateway
→ team-account-management
→ Auth Admin + RPC
```

Preservar lookup exato, CORS/JWT/papel, compensação e bloqueio de desativação com carteira não vazia.

Não reintroduzir fluxo antigo de “desativar + transferir 13 escolas” por título/helper histórico.

## 18. Production/Supabase

- Production fail-closed;
- migrations imutáveis e ordenadas;
- nenhuma chave admin no frontend;
- writes compostos atômicos quando o domínio exige;
- conflito de versão não é sobrescrito silenciosamente;
- integridade atual saudável não prova que um write futuro seja seguro;
- nova migration somente para mudança real de banco/contrato.

## 19. Critério de conclusão

Antes de “fechamento confirmado”, registrar:

> **O que foi tentado para provar que ainda estava errado?**

Incluir, conforme risco:

- contraexemplos;
- sequências entre fluxos;
- retorno à origem após estado avançado;
- caminhos paralelos;
- falhas intermediárias;
- cross-view;
- reload;
- migrations sucessoras;
- classificação de fixtures/testes.

Se só existem jobs verdes, a frase correta é:

> **os gates conhecidos passaram**.

## 20. Git e integração

- não trabalhar diretamente na `main`;
- branch isolada;
- causa atual antes da mudança;
- mudança mínima;
- validação adversarial proporcional;
- PR com riscos/evidências;
- merge/deploy somente quando autorizado;
- atualizar continuidade no mesmo PR funcional.
