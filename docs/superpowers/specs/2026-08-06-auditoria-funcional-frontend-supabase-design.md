# Auditoria Funcional Frontend ↔ Supabase — Design

**Data:** 6 de agosto de 2026  
**Baseline inicial:** `main` em `97c8bedbd7c93d82d527e183762b37a0934bd5f0`  
**Estado do banco:** 27 migrations em Production, última `202608050001_school_assignment_authorization`

## 1. Objetivo

Verificar, no sistema atual, se todas as funcionalidades oferecidas pela interface realmente executam a leitura, gravação, atualização, exclusão, geração ou visualização esperada no Supabase, sem botões inertes, persistências incompletas, releituras divergentes, autorizações incorretas ou erros mascarados.

O código-fonte remoto é a fonte absoluta de verdade. A documentação serve como registro auxiliar de objetivos, decisões e eventos; qualquer divergência deve ser resolvida a favor do código efetivamente versionado e do estado remoto comprovado.

## 2. Restrições obrigatórias

- Não reabrir regras de negócio já consolidadas.
- Tratar regras existentes como premissas fixas.
- Parar e solicitar confirmação apenas diante de contradição real entre regras aplicáveis ou quando uma mudança funcional for indispensável.
- Não alterar dados reais em Production durante a auditoria.
- Usar Production apenas para consultas e provas estritamente não destrutivas.
- Usar Supabase local ou ambiente descartável para mutações, compensações e fluxos de escrita.
- Não transformar a frente em criação ilimitada de testes preventivos.
- Criar somente regressões diretamente relacionadas a falhas comprovadas.
- Manter correções pequenas, coesas e separadas por risco ou domínio.
- Atualizar documentação somente após confirmar o estado efetivo do código e do ambiente remoto.

## 3. Escopo funcional

A auditoria cobre apenas funcionalidades já existentes no sistema:

1. autenticação, perfil, escopo, refresh e logout;
2. navegação, busca e filtros globais;
3. dashboards e indicadores;
4. Carteira e redistribuição de escolas;
5. Prontuário e timeline;
6. Gestão de Equipe;
7. cadastro e edição de escolas;
8. programas e configurações;
9. pendências, contatos e verificações;
10. notas fiscais;
11. bens e Inventário;
12. importações e promoções;
13. relatórios, Excel SME e demais exportações;
14. logs administrativos e auditoria;
15. tratamento de erros, concorrência, compensação e releitura.

Ficam fora do escopo:

- redesenho amplo da interface;
- novas funcionalidades;
- revisão genérica de dependências;
- criação de observabilidade adicional sem relação direta com falha encontrada;
- revisão abstrata de regras de negócio.

## 4. Unidade de análise

Cada funcionalidade será analisada pelo mesmo percurso:

```text
controle visível no frontend
→ evento ou handler
→ serviço de aplicação
→ repositório
→ tabela, RPC ou Edge Function
→ Auth, RLS, grants e escopo
→ resposta do backend
→ atualização do estado local
→ persistência efetiva
→ releitura após refresh ou nova consulta
→ mensagem de sucesso ou erro
```

A análise não será considerada completa quando parar apenas no frontend, no teste unitário ou na documentação.

## 5. Fonte canônica de inventário

A matriz funcional criada no PR nº 145 será usada apenas como índice inicial. Cada item deverá ser revalidado contra a `main` atual.

Para cada operação, o inventário deverá registrar:

- identificador funcional;
- perfil autorizado;
- tela e controle;
- handler ou evento;
- serviço;
- repositório;
- tabela, RPC ou Edge Function;
- política de autorização;
- comportamento de persistência;
- comportamento de releitura;
- tratamento de erro;
- evidência disponível;
- classificação final.

## 6. Classificações permitidas

Cada operação receberá exatamente uma classificação:

### Comprovada

O caminho completo está identificado e a leitura ou mutação foi comprovada no ambiente apropriado, incluindo persistência e releitura quando aplicável.

### Parcialmente comprovada

O caminho existe, mas falta prova de uma etapa relevante, como persistência real, releitura, compensação ou autorização negativa.

### Quebrada ou desconectada

Existe controle, rota ou funcionalidade visível que não alcança o backend correto, não persiste, não relê, falha silenciosamente ou produz resultado incompatível.

### Documentação divergente

O código e o estado remoto funcionam de uma forma diferente da documentação. A correção prioritária é documental, salvo se o código contrariar regra de negócio já confirmada.

### Contradição funcional real

Duas regras vigentes entram em conflito e impedem decidir a correção com segurança. Nenhuma implementação será feita antes de confirmação expressa.

## 7. Estratégia de execução

### Fase 1 — baseline e conciliação técnica

Confirmar:

- SHA atual da `main`;
- PRs recentes e branches abertas;
- migrations versionadas e aplicadas;
- Edge Functions ativas;
- deployment Vercel efetivamente publicado;
- workflows e incidentes recentes;
- divergências documentais objetivas.

### Fase 2 — autenticação, leitura e navegação

Auditar os cinco perfis e todas as operações de leitura existentes:

- login e bootstrap;
- papel efetivo;
- escopo CRE e escolar;
- Dashboard;
- Carteira;
- Prontuário;
- Pendências;
- busca e filtros;
- refresh e logout.

### Fase 3 — mutações administrativas e operacionais

Auditar operações de escrita por domínio:

1. Gestão de Equipe;
2. escolas e carteira;
3. programas e configurações;
4. pendências, contatos e verificações;
5. notas fiscais;
6. bens e Inventário;
7. importações.

Cada mutação deverá provar:

- autorização positiva;
- autorização negativa;
- persistência;
- releitura;
- concorrência quando houver `row_version`;
- compensação quando houver operação em mais de um sistema;
- log administrativo quando exigido pelo fluxo existente.

### Fase 4 — exportações e auditoria

Auditar:

- relatório institucional;
- Excel SME;
- demais XLSX e CSV existentes;
- correspondência entre filtros, competência e conteúdo;
- download real;
- registro de auditoria quando previsto pelo código;
- tratamento de falha de geração ou download.

### Fase 5 — correções e reconciliação documental

Cada falha comprovada será tratada em PR separado ou em grupo pequeno e coeso. A ordem de prioridade será:

1. risco de alteração incorreta ou perda de dados;
2. autorização indevida ou bloqueio de perfil autorizado;
3. botão ou formulário que não persiste;
4. persistência sem releitura correta;
5. exportação ou log inconsistente;
6. mensagem que mascara a causa real;
7. documentação divergente.

## 8. Achados já conhecidos que entram na auditoria

Estes itens não são considerados resolvidos apenas por terem sido mencionados anteriormente:

- cadastro de escola e uso de identificadores institucionais;
- auditoria dos exports XLSX;
- edição genérica de bens patrimoniais (`ASSET-02`);
- operações classificadas como parciais na matriz funcional;
- smoke autenticado de leitura preparado pelo PR nº 148, ainda sem identidades técnicas ativas.

Cada item será reavaliado diretamente na `main` atual antes de qualquer correção.

## 9. Critério para abrir uma correção

Uma correção só será aberta quando houver pelo menos uma das evidências abaixo:

- caminho do frontend termina sem chamada correspondente;
- chamada usa tabela, RPC ou Edge Function incorreta;
- RLS ou grant bloqueia perfil autorizado;
- RLS ou grant permite perfil indevido;
- backend grava parcialmente ou sem compensação necessária;
- resposta de sucesso não corresponde ao estado persistido;
- refresh ou nova consulta restaura valor anterior;
- log obrigatório não é persistido;
- erro funcional é convertido em indisponibilidade genérica;
- exportação não reflete filtros, competência ou dados atuais;
- documentação contradiz o código e o ambiente remoto.

## 10. Testes e evidências

A auditoria reutilizará prioritariamente os testes e ferramentas existentes:

- testes unitários e de integração;
- Playwright por perfil e viewport;
- Supabase local completo;
- pgTAP;
- migration smoke;
- backup e restauração descartáveis;
- matriz funcional executável;
- consultas somente leitura em Production;
- monitores de Production;
- logs sanitizados de Edge Functions e Postgres.

Novos testes deverão ser mínimos e diretamente vinculados a um achado comprovado.

## 11. Documentação de saída

A frente produzirá:

- matriz funcional reconciliada com o código atual;
- registro de achados com evidência e prioridade;
- PRs corretivos separados;
- documentação canônica atualizada após cada correção;
- relatório final com operações comprovadas, parcialmente comprovadas, corrigidas e dependentes de decisão.

A documentação nunca poderá afirmar que uma correção está em Production antes da comprovação do deployment ou da migration correspondente.

## 12. Critério de encerramento

A frente será encerrada quando todas as funcionalidades atuais tiverem:

- caminho frontend–Supabase identificado;
- perfil autorizado e negativa indevida verificados;
- leitura ou persistência comprovada;
- releitura confirmada quando aplicável;
- tratamento de erro classificado;
- evidência registrada;
- documentação conciliada.

Não será exigida cobertura teórica de cenários futuros que não existam no produto atual.
