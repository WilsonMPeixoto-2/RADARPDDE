# RADAR PDDE — Registro de decisões

Este documento registra decisões duradouras do produto e da arquitetura.

Ele não substitui o histórico do GitHub nem deve registrar cada implementação. Seu objetivo é impedir que decisões consolidadas sejam reabertas ou contraditas sem evidência, impacto analisado e autorização adequada.

## Convenções

- **Proposta:** ainda depende de decisão.
- **Aprovada:** decisão vigente.
- **Substituída:** outra decisão posterior passou a prevalecer.
- **Revogada:** deixou de valer sem substituição direta.

Ao alterar uma decisão, não apague seu registro. Acrescente a nova decisão e atualize o status da anterior.

---

## ADR-001 — Contrato único de repositório

**Data:** julho de 2026  
**Status:** Aprovada

### Decisão

Manter `LocalStorageRepository` e `SupabaseRepository` sob o mesmo contrato de repositório e fazer com que funcionalidades e serviços de aplicação dependam desse contrato, não do mecanismo concreto de persistência.

### Razão

A abstração permite:

- preservar o modo local enquanto a conexão remota é homologada;
- comparar equivalência funcional entre adaptadores;
- testar regras de negócio sem dependência do backend;
- reduzir acoplamento do frontend ao Supabase;
- realizar transição progressiva e reversível.

### Consequências

- funcionalidades novas não devem consultar Supabase ou `localStorage` diretamente quando o contrato cobre a operação;
- diferenças entre adaptadores devem ser tratadas no repositório, nos serviços ou em operações compostas explícitas;
- qualquer substituição desta arquitetura exige análise de migração e regressão de todos os fluxos.

### Critério para reconsideração

Somente requisito funcional ou de desempenho comprovadamente não atendido pelo contrato atual.

---

## ADR-002 — Production permanece em modo local

**Data:** julho de 2026  
**Status:** Aprovada

### Decisão

Manter a implantação de Production da Vercel em modo local até autorização expressa e homologação completa da persistência remota.

### Razão

A arquitetura Supabase está preparada, mas ainda não foi validada em projeto remoto exclusivo do RADAR com migrations, dados, RPCs, grants, tipos e fluxos reais.

### Consequências

Production deve permanecer com:

- `dataMode: local`;
- repositório Supabase desabilitado;
- URL e chave vazias;
- ativação de produção não aprovada.

Nenhuma tarefa de preparação ou Preview autoriza implicitamente a ativação em Production.

### Critério para reconsideração

Homologação formal do ambiente remoto, migração controlada, rollback testado e autorização específica.

---

## ADR-003 — Primeira conexão em ambiente de Preview

**Data:** julho de 2026  
**Status:** Aprovada

### Decisão

Realizar a primeira conexão real do RADAR com o Supabase exclusivamente em ambiente de Preview, usando projeto remoto dedicado ou branch de banco isolada e compatível.

### Razão

A separação permite validar schema, permissões, RPCs, migração, tipos e comportamento do frontend sem alterar o serviço operacional de Production.

### Consequências

- variáveis e chave publicável do projeto remoto devem ser configuradas somente no Preview;
- o build deve gerar `config.runtime.js` específico por ambiente;
- o projeto Supabase deve ser exclusivo e claramente identificado;
- projetos existentes de outras aplicações não devem ser reutilizados por conveniência.

### Critério para reconsideração

Não há conexão direta em Production sem cumprir primeiro esta etapa, salvo decisão expressa e documentada que assuma os riscos correspondentes.

---

## ADR-004 — Migração de dados progressiva e reversível

**Data:** julho de 2026  
**Status:** Aprovada

### Decisão

Migrar dados por processo controlado de snapshot, validação, dry-run, staging, reconciliação, promoção e rollback.

### Razão

Os dados do RADAR possuem relações operacionais e históricas que não podem ser tratados como simples cópia de registros.

### Consequências

- não importar diretamente para tabelas finais sem validação;
- não confundir fixtures ou seed local com dados institucionais;
- manter relatórios de reconciliação;
- testar rollback antes de considerar a promoção segura;
- preservar auditoria das execuções de importação.

### Critério para reconsideração

Somente se o projeto ainda não possuir dados relevantes e houver comprovação de que uma carga inicial simplificada preserva integralmente os contratos e a rastreabilidade.

---

## ADR-005 — Operações compostas devem ser atômicas

**Data:** julho de 2026  
**Status:** Aprovada

### Decisão

Operações que alterem múltiplas tabelas ou registros interdependentes devem utilizar transações ou RPCs apropriadas, em vez de sequências independentes de gravação no navegador.

### Exemplos

- exercício e competências;
- escola e programas;
- reanálise de pendência e verificação;
- efeitos de nota fiscal;
- promoção e rollback de importação.

### Razão

Evitar estados intermediários inválidos, gravações parciais e divergência entre telas.

### Consequências

- a atomicidade deve ser testada;
- erros devem desfazer a operação completa;
- o frontend deve receber resposta consolidada da operação.

---

## ADR-006 — Concorrência otimista com conflito explícito

**Data:** julho de 2026  
**Status:** Aprovada

### Decisão

Utilizar `row_version` para registros mutáveis relevantes e tratar conflito sem sobrescrita silenciosa.

### Razão

O RADAR será utilizado por múltiplos usuários e sessões. A última gravação não deve apagar alterações anteriores sem ciência do usuário.

### Consequências

Quando houver conflito:

- informar que outra sessão alterou o registro;
- preservar o trabalho do usuário quando possível;
- recarregar a versão confirmada;
- permitir nova avaliação antes de salvar.

---

## ADR-007 — GitHub, Vercel e Supabase são as fontes operacionais de verdade

**Data:** julho de 2026  
**Status:** Aprovada

### Decisão

Usar exclusivamente o GitHub remoto, a implantação vigente na Vercel e o estado efetivo do Supabase para determinar o estado atual do projeto.

### Razão

Clones locais, documentos exportados e contextos antigos podem estar desatualizados e levar a implementações baseadas em código que já não corresponde à aplicação publicada.

### Consequências

- confirmar o HEAD remoto antes de agir;
- verificar o commit implantado;
- confirmar o projeto Supabase correto;
- não usar fonte local antiga como base autoritativa.

---

## ADR-008 — Correções pontuais não redefinem o estágio principal

**Data:** julho de 2026  
**Status:** Aprovada

### Decisão

Tratar ajustes visuais, textuais ou correções pequenas como trabalhos pontuais, salvo decisão explícita de alterar o roadmap.

### Razão

A cronologia do último commit pode ocultar a prioridade estrutural real e induzir agentes a abandonar a sequência principal do desenvolvimento.

### Consequências

- consultar `docs/CURRENT_STAGE.md` antes de inferir a próxima etapa;
- não transformar o último pedido em nova arquitetura ou novo ciclo;
- atualizar o estágio somente quando houver mudança real de prioridade.

---

## ADR-009 — Mobile preserva conteúdo e capacidade operacional

**Data:** julho de 2026  
**Status:** Aprovada

### Decisão

Quando tabelas forem convertidas em cartões ou outras estruturas responsivas, preservar integralmente as informações e ações essenciais do fluxo aprovado.

### Razão

Responsividade não pode reduzir o RADAR a uma versão meramente consultiva ou incompleta no celular.

### Consequências

Devem permanecer acessíveis, conforme o contexto:

- unidade e programa;
- estado e prioridade;
- responsável;
- última movimentação;
- próxima ação;
- prazo;
- pendências;
- links e botões operacionais.

---

## ADR-010 — Não introduzir ORM ou arquitetura paralela sem necessidade comprovada

**Data:** julho de 2026  
**Status:** Aprovada

### Decisão

Manter a combinação atual de migrations SQL, Data API, RPCs, contratos, tipos gerados e repositório, sem adicionar ORM ou segunda pilha de persistência apenas por preferência tecnológica.

### Razão

A arquitetura existente já cobre o modelo relacional, operações compostas, validação, tipagem, importação e testes. Uma segunda camada aumentaria acoplamento e manutenção antes da primeira conexão remota.

### Consequências

Não instalar, sem requisito demonstrado:

- Prisma ou Drizzle;
- driver PostgreSQL direto para o frontend;
- segunda biblioteca de schemas concorrente;
- nova camada de cache ou sincronização que substitua o contrato atual.

### Critério para reconsideração

Limitação comprovada da arquitetura existente, acompanhada de análise de custo, migração, segurança e manutenção.

---

## ADR-011 — Dependências fixadas e atualizações intencionais

**Data:** julho de 2026  
**Status:** Aprovada

### Decisão

Manter versões fixadas e lockfile versionado. Atualizações devem ser específicas, justificadas e validadas pelos gates do projeto.

### Razão

Atualizações gerais imediatamente antes da conexão remota podem introduzir regressões transitivas e dificultar a identificação da causa de falhas.

### Consequências

- não executar atualização indiscriminada;
- não adotar versões alpha, beta, `next` ou release candidate sem autorização;
- revisar changelogs oficiais;
- executar testes de readiness após mudanças na pilha Supabase, TypeScript, build ou testes.

---

## ADR-012 — Sucesso técnico não basta para concluir uma funcionalidade

**Data:** julho de 2026  
**Status:** Aprovada

### Decisão

Avaliar toda entrega também pela capacidade de apoiar o trabalho real dos usuários e pelos efeitos em todos os perfis e telas relacionados.

### Razão

Uma implementação pode passar nos testes técnicos e ainda ser difícil de encontrar, interpretar ou operar.

### Consequências

A conclusão deve verificar:

- clareza de estado e próxima ação;
- coerência entre visões;
- comportamento por perfil;
- desktop e mobile;
- acessibilidade básica;
- rastreabilidade e integridade dos dados.
