# AGENTS.md — RADAR PDDE 2026

## 1. Finalidade destas instruções

Este arquivo estabelece as regras permanentes para agentes de desenvolvimento que atuem no repositório RADAR PDDE.

Antes de iniciar qualquer tarefa, leia também:

1. `docs/PROJECT_CONTEXT.md` — finalidade, domínio e arquitetura estável;
2. `docs/CURRENT_STAGE.md` — estágio principal e prioridades atuais;
3. `docs/DECISION_LOG.md` — decisões consolidadas que não devem ser reabertas sem evidência.

A última alteração cronológica no repositório não representa necessariamente a prioridade principal do projeto.

---

## 2. Identidade do produto

O RADAR PDDE é um sistema de gestão, controle, acompanhamento e apoio à decisão para os processos do Programa Dinheiro Direto na Escola no âmbito da 4ª Coordenadoria Regional de Educação da Secretaria Municipal de Educação do Rio de Janeiro.

O sistema não é um CRUD administrativo genérico. Sua razão de existir é transformar um processo documental, operacional e gerencial complexo em uma carteira de trabalho rastreável, inteligível e acionável para diferentes perfis de usuários.

Toda implementação deve ser avaliada simultaneamente sob quatro perspectivas:

1. correção técnica;
2. aderência às regras e ao fluxo operacional do PDDE;
3. usabilidade pelo usuário administrativo real;
4. integridade, rastreabilidade e coerência dos dados.

Uma funcionalidade tecnicamente funcional, mas difícil de localizar, compreender ou operar, não está concluída.

---

## 3. Perfis, telas e fluxos

Ao analisar ou alterar uma funcionalidade, considere sempre:

- todos os perfis afetados;
- todas as abas e telas relacionadas;
- comportamento em desktop e mobile;
- origem do dado;
- permissões e responsabilidades;
- histórico, pendências, prazos e próximas ações;
- reflexos em dashboard, carteira, listas, prontuário, relatórios e exportações.

Não avalie uma tela isoladamente quando o mesmo dado aparece em outras visões.

A conversão de tabelas para cartões no mobile não autoriza a remoção de informações ou ações essenciais.

---

## 4. Fontes de verdade

Para o estado atual do código e da infraestrutura, considere exclusivamente:

1. GitHub remoto;
2. implantação vigente na Vercel;
3. projetos e configurações efetivamente existentes no Supabase.

Não use clones locais antigos, arquivos locais não confirmados ou lembranças de branches anteriores como fonte de verdade.

Antes de modificar arquivos:

- confirme o HEAD remoto da branch de referência;
- examine PRs e commits recentes relevantes;
- confirme o deployment correspondente quando a tarefa envolver Vercel;
- confirme o projeto e o ambiente corretos quando a tarefa envolver Supabase;
- verifique se `docs/CURRENT_STAGE.md` ainda corresponde ao estado real.

---

## 5. Prioridade das instruções

Quando houver divergência entre fontes, use a seguinte ordem:

1. solicitação explícita mais recente do usuário;
2. estado efetivamente verificado no GitHub, Vercel ou Supabase;
3. `docs/CURRENT_STAGE.md`;
4. `docs/DECISION_LOG.md`;
5. `docs/PROJECT_CONTEXT.md`;
6. este `AGENTS.md`;
7. documentação antiga, comentários ou planos históricos.

Não substitua uma decisão vigente apenas porque outra abordagem tecnicamente possível parece mais moderna.

---

## 6. Separação entre desenvolvimento principal e trabalhos pontuais

Correções visuais, ajustes de texto, refinamentos de layout e pedidos pontuais podem ocorrer como parênteses dentro do projeto.

Esses trabalhos não redefinem automaticamente:

- o estágio principal do desenvolvimento;
- o próximo ciclo funcional;
- a arquitetura de dados;
- as prioridades previamente aprovadas.

Antes de concluir que a última tarefa representa o novo estágio do projeto, consulte `docs/CURRENT_STAGE.md`.

---

## 7. Arquitetura de dados

O sistema possui um contrato único de repositório e dois modos de persistência:

- `LocalStorageRepository`, atualmente operacional;
- `SupabaseRepository`, preparado para a conexão remota controlada.

A arquitetura já inclui, entre outros elementos:

- contrato de repositório;
- serviços de aplicação;
- unidade de trabalho;
- concorrência otimista por `row_version`;
- paginação e escrita em lotes;
- RPCs para operações compostas;
- contratos JSON e validação com Ajv;
- migrations SQL versionadas;
- importação reversível, reconciliação e rollback;
- auditoria;
- testes unitários, de integração, E2E e pgTAP.

Não introduza uma segunda arquitetura concorrente sem demonstrar, com evidência, que a existente não atende ao requisito.

Não consulte `localStorage` ou Supabase diretamente em funcionalidades novas quando o acesso deveria ocorrer pelo contrato de repositório e pelos serviços de aplicação.

---

## 8. Supabase

A conexão com o Supabase deve ocorrer de maneira progressiva, testável e reversível.

Princípios obrigatórios:

- produção permanece em modo local até autorização expressa;
- a primeira conexão deve ocorrer em ambiente de Preview;
- use apenas chave publicável no navegador;
- nunca exponha `service_role`, secret key, senha ou token administrativo;
- migrations devem ser aplicadas em ordem e verificadas contra o histórico remoto;
- dados locais não devem ser promovidos diretamente sem staging, validação e reconciliação;
- toda promoção de dados deve possuir rollback comprovado;
- o schema remoto deve corresponder às migrations versionadas no GitHub;
- tipos gerados devem ser comparados com o schema remoto;
- tabelas, grants, RLS, funções e RPCs devem ser testados após aplicação;
- não habilite GraphQL sem requisito funcional explícito.

Não crie, conecte, altere ou exclua projeto Supabase sem autorização expressa do usuário.

Não insira credenciais reais em commits, PRs, logs, fixtures, screenshots ou documentação.

---

## 9. Vercel

A Vercel deve manter separação explícita entre:

- Production;
- Preview;
- Development/local.

A configuração pública do navegador deve ser gerada durante o build e deve falhar de forma segura.

Até autorização expressa, Production deve permanecer com:

- `dataMode: local`;
- repositório Supabase desabilitado;
- URL e chave vazias;
- ativação de produção não aprovada.

Não altere Production para Supabase sem homologação completa no Preview e autorização específica.

Sempre confirme que o deployment validado corresponde ao mesmo commit analisado.

---

## 10. Git e GitHub

Não trabalhe diretamente na `main`.

Fluxo padrão:

1. confirmar o HEAD remoto;
2. criar branch específica;
3. implementar em mudanças pequenas e coerentes;
4. executar verificações aplicáveis;
5. abrir Pull Request;
6. registrar resumo, riscos, arquivos alterados e evidências;
7. aguardar aprovação quando houver decisão humana ou ativação de infraestrutura.

Não misture no mesmo PR, salvo necessidade demonstrada:

- alteração arquitetural;
- atualização de dependências;
- correções visuais não relacionadas;
- migração de dados;
- ativação de infraestrutura.

Prefira commits que representem unidades claras de mudança.

---

## 11. Dependências

As versões devem permanecer fixadas no `package.json` e no lockfile.

Antes de instalar ou atualizar qualquer pacote:

1. demonstre a necessidade;
2. verifique documentação e changelog oficiais;
3. compare com recursos já existentes;
4. avalie impacto em navegador, build, testes e bundle;
5. explique por que as dependências atuais não resolvem o problema;
6. avalie risco de supply chain e manutenção;
7. execute todos os gates relevantes.

Não execute atualizações gerais indiscriminadas.

Não use versões alpha, beta, `next` ou release candidate sem autorização específica.

Não introduza ORM, segunda biblioteca de validação, novo cache ou novo gerenciador de estado apenas por preferência tecnológica.

---

## 12. Testes e verificação

Uma tarefa somente está concluída quando houver evidência verificável de:

- código correto;
- testes aplicáveis aprovados;
- ausência de regressões relevantes;
- coerência entre telas e perfis;
- comportamento mobile verificado quando aplicável;
- acessibilidade básica preservada;
- documentação atualizada;
- rastreabilidade no GitHub;
- deployment correto quando solicitado;
- correspondência entre o commit validado e o commit implantado.

Não declare sucesso apenas porque o código foi escrito ou porque um comando isolado terminou sem erro.

Ao alterar o domínio, persistência, contratos ou migrations, execute os gates específicos de readiness do Supabase.

---

## 13. Conduta de análise

Antes de implementar:

1. reconstrua o estado atual;
2. identifique o problema real;
3. verifique decisões anteriores;
4. mapeie arquivos, fluxos, perfis e telas afetados;
5. defina critérios objetivos de aceite;
6. registre um plano proporcional à complexidade.

Durante a implementação:

- prefira alterações pequenas e reversíveis;
- reutilize contratos e componentes existentes;
- evite soluções paralelas;
- preserve comportamento já aprovado;
- registre suposições e riscos;
- pare a parte afetada quando encontrar divergência material entre código, documentação e infraestrutura.

---

## 14. Qualidade de produto

O agente deve atuar como engenheiro e como analista de produto.

Para cada mudança relevante, responda internamente:

- Qual problema real do usuário esta mudança resolve?
- O usuário encontrará a funcionalidade?
- O texto, os controles e o estado são compreensíveis?
- O dado correto aparece no momento correto?
- A ação produz efeitos coerentes nas demais telas?
- Há informação suficiente para decidir a próxima ação?
- O fluxo funciona para todos os perfis afetados?
- O comportamento mobile preserva as informações e ações essenciais?

O sucesso técnico é necessário, mas não suficiente.

---

## 15. Atualização da memória do projeto

Ao concluir um PR relevante:

- atualize `docs/CURRENT_STAGE.md` quando o estágio, as pendências ou a próxima entrega mudarem;
- registre em `docs/DECISION_LOG.md` decisões arquiteturais ou operacionais duradouras;
- atualize `docs/PROJECT_CONTEXT.md` apenas quando houver mudança estável no domínio ou na arquitetura;
- evite transformar esses documentos em diário detalhado de commits.
