# Homologação operacional e observabilidade pós-refatoração

**Data:** 2026-09-13  
**Branch:** `test/operational-uat-supabase-2026-09-13`  
**Baseline:** `1a149174ed4a14d2fc9f92aff57d1957e8538e89`

## Objetivo

Comprovar que a arquitetura contextual baseada no Supabase permanece funcional pela jornada real do usuário, sem transformar memória do navegador ou armazenamento local em fonte concorrente de verdade, e estabelecer monitoramento proporcional ao crescimento previsível do RADAR PDDE.

## Princípio arquitetural

- Supabase é a fonte canônica no modo remoto.
- Estado em memória do navegador é uma projeção operacional descartável e pode ser usado para responsividade.
- `localStorage` permanece permitido no modo local, compatibilidade e metadados explicitamente previstos; no modo Supabase, bootstrap, consultas contextuais e reconciliação pós-escrita não devem persistir coleções operacionais como segunda base.
- Uma escrita remota só é considerada concluída quando a resposta remota é confirmada e o estado visível converge para o resultado autoritativo ou para uma releitura corretiva.
- Consultas devem ser contextuais e limitadas. Coleções operacionais de crescimento contínuo não podem voltar ao bootstrap global.

## Frente 1 — UAT real com Supabase descartável

### 1. Autenticação e primeira tela

Criar prova Playwright que:

1. abre a aplicação sem sessão;
2. autentica pelo formulário real;
3. mede o intervalo entre submit e `RadarDataContext.ready` + dashboard utilizável;
4. confirma que o dashboard abre sem depender de visita prévia a outra tela;
5. registra requisições PostgREST durante o bootstrap;
6. reprova qualquer leitura global de `administrative_logs` no login;
7. confirma ausência de erros materiais de console/rede.

### 2. Logs administrativos sob demanda

Após o bootstrap:

1. abrir Registros Internos pela navegação real;
2. confirmar que a consulta a `administrative_logs` ocorre somente nesse momento;
3. confirmar paginação limitada e ordenação determinística;
4. abrir o histórico da unidade e confirmar filtro por escola;
5. conferir feedback de carregamento e erro.

### 3. Avaliação mensal

Pela interface real:

- alterar entrega/bonificação;
- alterar análise técnica permitida;
- validar N/A e regras derivadas;
- consolidar quando elegível;
- consultar a linha no Supabase;
- recarregar a página;
- reencontrar o estado pela interface.

### 4. Notas fiscais e despesas

Executar cenários independentes para:

- consumo;
- serviço com Consulta Assessoria individualizada;
- permanente com criação e reflexo em Capital/Inventário;
- boleto de Internet em Educação Conectada;
- despesa `a_identificar`.

Para cada cenário conferir:

`UI após ação = projeção em memória = registro Supabase = UI após reload`.

### 5. Pendências e ciclo de reanálise

Cobrir pela interface:

- criação manual/documental;
- criação atômica a partir de análise Incorreta;
- novo envio;
- identificação de `a_identificar` preservando identidade;
- status `Aguardando reanálise`;
- reanálise que resolve;
- reanálise que mantém/reabre;
- tentativa vinculada;
- contato/cobrança;
- cancelamento e reabertura quando autorizados.

### 6. Retificações e permissões recentes

Validar especialmente:

- edição de dados cadastrais da NF com histórico preservado;
- bloqueio de tipo/contexto estrutural quando houver histórico;
- edição autorizada de Pendência manual;
- preservação de status, identidade, tentativas e histórico;
- mensagens claras de sucesso, erro, bloqueio e refresh corretivo.

## Frente 2 — Contrato de cache/projeção local

Criar testes que comprovem em modo Supabase:

- bootstrap remoto chama `applyCanonical(..., persistStorage:false)`;
- consultas contextuais e logs usam `applyEntities(..., persistStorage:false)`;
- escrita remota não usa `persistSnapshot` legado;
- resposta autoritativa remota atualiza apenas a projeção em memória;
- falha de persistência não deixa a UI afirmando sucesso;
- falha de aplicação local após commit remoto marca `refreshRequired` e exige reconciliação;
- reload sempre converge para o Supabase.

## Frente 3 — Crescimento e capacidade

Baseline real em 2026-09-13:

- banco PostgreSQL: aproximadamente 39 MB;
- 163 escolas;
- 430 vínculos escola-programa;
- `administrative_logs`: 3.563 linhas / ~1,7 MB;
- `verifications`: 339 linhas / ~352 kB;
- `registered_invoices`: 84 linhas / ~216 kB;
- `pendencies`: 94 linhas / ~424 kB;
- `assets`: 14 linhas / ~128 kB.

Criar monitor agregado e sem dados pessoais para registrar periodicamente:

- tamanho total do banco;
- tamanho e linhas das tabelas acumulativas;
- crescimento mensal e diário recente;
- dead tuples relevantes;
- Advisors do Supabase quando automatizável com segurança;
- regressões de consultas globais proibidas.

Os limites devem ser graduais e proporcionais. Não tratar crescimento esperado como incidente.

## Frente 4 — Regressão de consultas globais

`pg_stat_statements` contém histórico pré-refatoração, incluindo milhares de chamadas globais de `administrative_logs` e `verifications`.

Não resetar as estatísticas. Registrar um baseline pós-release com contador por fingerprint e monitorar apenas o delta futuro.

Alertar se, após o baseline:

- voltar a crescer a assinatura de paginação global de `administrative_logs`;
- voltar a crescer a assinatura global de `verifications`, `registered_invoices`, `pendencies`, `pendency_attempts` ou `assets` fora de jobs administrativos conhecidos;
- latência média/máxima de consultas contextuais ultrapassar limites sustentados.

## Frente 5 — Observabilidade existente e evolução

Preservar e integrar os mecanismos já existentes:

- smoke de Production a cada hora com abertura automática de incidente;
- integridade de Production a cada 6 horas;
- saúde semanal de dependências;
- Dependabot npm e GitHub Actions;
- Vercel deployments/runtime logs;
- Supabase Reports, Logs, Advisors e métricas disponíveis no plano.

Evitar workflows duplicados. Preferir um resumo agregado de saúde que consuma os sinais existentes e acrescente capacidade e regressão de consultas.

## Frente 6 — Dependências

Não misturar atualização de dependências com a homologação da arquitetura.

Após o baseline ficar verde, avaliar em branches isoladas:

- `@supabase/supabase-js`;
- Playwright;
- Supabase CLI somente em versão que passe integralmente pgTAP/RLS/local stack.

Cada atualização deve executar o mesmo UAT operacional antes de integração.

## Critério de conclusão

A arquitetura será considerada operacionalmente homologada quando:

1. jornadas críticas forem executadas pela interface real com Auth/RLS/Supabase descartável;
2. gravação, projeção imediata, reload e efeitos transversais convergirem;
3. login → dashboard não disparar coleções operacionais globais;
4. logs administrativos forem carregados apenas sob demanda e de forma limitada;
5. mensagens de sucesso/erro refletirem o estado remoto real;
6. o monitor de capacidade e regressão de consultas tiver baseline pós-release;
7. nenhum defeito conhecido for mascarado por cache local, teste local ou fallback silencioso;
8. eventuais correções forem feitas por teste RED → correção mínima → regressão completa.
