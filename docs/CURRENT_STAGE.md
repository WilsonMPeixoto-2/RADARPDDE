# RADAR PDDE — Estado atual do projeto

**Atualizado em:** 19 de julho de 2026  
**Natureza:** documento operacional e transitório

## 1. Regra de leitura

Antes de iniciar tarefa:

1. confirme o HEAD remoto da `main`;
2. verifique PRs posteriores;
3. confirme o deployment correspondente quando aplicável;
4. confirme projetos Supabase efetivamente existentes;
5. atualize este documento quando o estado real mudar.

A última conversa, o último commit ou um relatório antigo não redefine sozinho a prioridade do projeto.

## 2. Estado consolidado

O RADAR possui:

- frontend funcional em modo local;
- quatro perfis funcionais visíveis;
- papel `technical_admin` separado da operação;
- dashboard, carteira, competências, pendências, prontuário, Gestão de Equipe, Inventário e registros;
- contrato único de repositório;
- `LocalStorageRepository` operacional;
- `SupabaseRepository` preparado;
- serviços de aplicação e unidade de trabalho;
- concorrência otimista por `row_version`;
- 13 migrations SQL versionadas;
- RLS alinhada à liderança da Assistente;
- Edge Function protegida para convite, edição e desativação de contas da equipe;
- RPCs administrativas transacionais restritas ao `service_role`;
- importação reversível, reconciliação e rollback;
- testes unitários, integração, E2E e pgTAP;
- build Vercel versionado e workflow de Preview prebuilt;
- Production preservada em modo local e fail-closed.

## 3. Decisões funcionais vigentes

- Controlador, Assistente, SME e Inventário são os quatro perfis funcionais do frontend;
- `technical_admin` não aparece no seletor e não herda a interface da Assistente;
- Luísa Ferreira, Assistente de Verbas Federais, lidera os controladores da GAD da 4ª CRE;
- a Assistente possui gestão plena de controladores, carteiras e Equipe de Inventário;
- cadastrar integrante gera convite, conta Auth, perfil e vínculo;
- desativar integrante desativa acesso, redistribui carteira quando necessário e preserva histórico;
- SME acompanha o trabalho por visões gerenciais e não mantém a equipe cotidiana da CRE;
- exclusão física permanece técnica e excepcional.

Esses pontos não são decisões pendentes.

## 4. Estado da persistência

### Production

- `dataMode: local`;
- repositório Supabase desabilitado;
- URL e chave vazias;
- ativação Supabase não aprovada.

### Supabase remoto

No estado verificado antes deste fechamento:

- não existe projeto exclusivo `radar-pdde-preview`;
- migrations do RADAR não foram aplicadas remotamente;
- Edge Function não foi implantada remotamente;
- nenhum dado institucional foi migrado;
- Preview conectado não foi criado.

Projetos Supabase de outras aplicações não devem ser reutilizados.

## 5. Fechamento pré-Supabase

O pacote final de preparação corrige:

- RLS de controladores e Inventário;
- convite e ciclo de acesso da equipe;
- separação do Administrador técnico;
- workflow Vercel que executa build e deploy prebuilt;
- documentação e gates contra regressão de decisões.

Após merge e checks verdes, a etapa de preparação pré-Supabase estará concluída. Não há outro pacote funcional intermediário a iniciar.

## 6. Próxima tarefa única

Mediante autorização específica:

1. criar projeto Supabase exclusivo `radar-pdde-preview`, preferencialmente em `sa-east-1`;
2. executar apenas o preflight remoto não destrutivo;
3. analisar o plano e capacidades encontradas;
4. solicitar autorização separada antes de aplicar migrations.

Não iniciar simultaneamente correção visual, nova funcionalidade ou ativação de Production dentro dessa tarefa.

## 7. Etapas posteriores, ainda não autorizadas

- aplicar as 13 migrations no alvo experimental;
- implantar a Edge Function;
- criar identidades reais de homologação;
- configurar Preview Vercel conectado;
- homologar Auth/RLS e Gestão de Equipe;
- importar e reconciliar cópia controlada;
- testar rollback, Advisors, backup e restauração;
- definir MFA e segurança de produção;
- decidir eventual ativação de Production.

## 8. Backlog visual separado

As regressões visuais já identificadas permanecem registradas para pacote próprio, depois do gate atual:

- quebra do logotipo RADAR PDDE;
- terminologia de pendências persistentes;
- qualidade de ícones do painel da Assistente;
- sobreposição e corte de filtros.

Esses itens não alteram o status técnico pré-Supabase e não devem ser misturados ao pacote de Auth/RLS.

## 9. Critério de atualização

Atualize este documento quando ocorrer qualquer um destes eventos:

- merge que altere estágio ou prioridade;
- criação ou conexão de projeto Supabase;
- aplicação de migration remota;
- ativação de Preview conectado;
- importação de dados;
- alteração de Production;
- decisão funcional que substitua uma decisão registrada.
