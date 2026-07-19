# Alinhamento funcional final pré-Supabase — especificação

**Data:** 19 de julho de 2026  
**Status:** aprovado para execução  
**Escopo:** fechar as divergências funcionais, de autorização e de implantação que impedem considerar concluída a preparação pré-Supabase.

## 1. Objetivo

Consolidar em um único pacote coerente o contrato já decidido do RADAR PDDE antes da criação do projeto Supabase remoto, sem ativar o Supabase em Production e sem misturar regressões visuais não relacionadas.

Ao término:

- os quatro perfis funcionais visíveis permanecem inalterados;
- `technical_admin` permanece um papel técnico separado e não herda a interface da Assistente;
- a Assistente de Verbas Federais possui gestão plena de controladores e da Equipe de Inventário;
- cadastrar integrante produz também convite e conta de acesso no Supabase Auth;
- desativar integrante desativa seu acesso sem excluir histórico;
- frontend, serviços, Auth, RLS, migrations, testes e documentação representam a mesma decisão;
- o caminho de deployment de Preview comprova a execução do build versionado;
- Production permanece em modo local e fail-closed.

## 2. Contrato de perfis

### 2.1 Perfis funcionais visíveis

O seletor operacional contém exatamente:

1. Controlador;
2. Assistente de Verbas Federais;
3. SME (Gestão);
4. Equipe de Inventário.

### 2.2 Papel técnico

`technical_admin` não é um quinto perfil operacional. Ele:

- não aparece no seletor comum;
- não é convertido em `assistente`;
- não recebe menus, identidade ou funções de Luísa Ferreira;
- recebe uma tela técnica neutra informando que não há superfície operacional atribuída;
- mantém permissões técnicas de infraestrutura, perfis, escopos e auditoria.

## 3. Gestão de equipe pela Assistente

A Assistente de Verbas Federais é a liderança direta dos controladores da GAD da 4ª CRE. Ela pode:

- cadastrar, editar e desativar controladores;
- distribuir e redistribuir escolas;
- cadastrar, editar e desativar integrantes da Equipe de Inventário;
- produzir registros administrativos de todas essas ações;
- criar convite e conta de acesso para novos integrantes;
- atualizar os dados de acesso quando o e-mail institucional mudar;
- desativar o acesso quando um integrante for desativado.

A SME possui leitura gerencial e não realiza a manutenção cotidiana da equipe da CRE.

Exclusões físicas permanecem restritas ao `technical_admin`. A ação de remoção da interface é desativação lógica e auditada.

## 4. Arquitetura do provisionamento de contas

### 4.1 Fluxo

```text
Assistente autenticada
        ↓
TeamAccountGateway no navegador
        ↓
Edge Function autenticada
        ↓
validação de papel e escopo da Assistente
        ↓
Supabase Auth Admin — convite/edição/bloqueio
        ↓
RPC transacional PostgreSQL
        ↓
controllers ou inventory_team_members
+ user_profiles
+ schools, quando houver redistribuição
+ administrative_logs
```

### 4.2 Segurança

- a chave secreta ou `service_role` nunca chega ao navegador;
- a Edge Function exige usuário autenticado;
- somente `federal_assistant` e `technical_admin` podem chamar operações de gestão;
- `sme_management` não recebe escrita de equipe;
- a RPC de provisionamento é executável apenas por `service_role`;
- as operações recebem identificador idempotente derivado do registro administrativo;
- falhas após convite executam compensação com exclusão da conta recém-criada;
- falhas após bloqueio executam compensação com desbloqueio;
- operações repetidas sobre o mesmo integrante não criam uma segunda conta.

### 4.3 Integração com o contrato existente

`DirectoryService` continua sendo a porta funcional usada pelo frontend.

- em modo local, mantém a persistência atual pelo contrato de repositório;
- em modo Supabase, usa `command.persist` para encaminhar a operação composta ao `TeamAccountGateway`;
- a mutação de memória e o rollback continuam sob `DataService` e `UnitOfWork`;
- não é criada uma segunda arquitetura de estado ou persistência.

## 5. Banco e RLS

Uma nova migration deve:

- permitir `INSERT` e `UPDATE` em `controllers` para `federal_assistant` e `technical_admin`;
- permitir `INSERT` e `UPDATE` em `inventory_team_members` para `federal_assistant` e `technical_admin`;
- retirar escrita de `sme_management` nessas tabelas;
- preservar leitura autenticada e exclusão física somente técnica;
- criar RPCs transacionais para provisionar e desativar controladores e integrantes de Inventário;
- restringir as RPCs ao `service_role`;
- preservar `row_version`, auditoria e integridade referencial.

O conjunto passa de 12 para 13 migrations.

## 6. Vercel

O repositório deve conter um workflow manual exclusivo de Preview que:

1. obtenha a configuração do projeto Vercel;
2. execute `vercel build` a partir do commit analisado;
3. confirme a existência de `dist/radar-build-manifest.json`;
4. faça deploy com `vercel deploy --prebuilt`;
5. rejeite qualquer alvo Production;
6. não publique segredo no artefato ou nos logs.

Deployments automáticos permanecem desabilitados. Production continua local.

## 7. Testes obrigatórios

### Unidade

- quatro mapeamentos operacionais e tratamento separado de `technical_admin`;
- payloads e erros do `TeamAccountGateway`;
- `DirectoryService` usa gateway remoto para cadastro, edição e desativação;
- modo local continua usando persistência padrão;
- validação e idempotência do domínio da Edge Function;
- contrato do workflow Vercel exige build e deploy prebuilt.

### Banco/pgTAP

- Assistente pode inserir e atualizar controladores e Inventário;
- SME pode ler, mas não inserir ou atualizar;
- apenas `service_role` executa RPCs administrativas;
- RPCs provisionam perfil e vínculo de usuário;
- desativação redistribui escolas, desativa perfil e preserva histórico;
- exclusão física continua restrita.

### E2E e readiness

- perfil Assistente mantém Gestão de Equipe;
- `technical_admin` não recebe a interface da Assistente;
- build, migrations, tipos, lint, pgTAP e suíte existente permanecem aprovados.

## 8. Documentação e governança

O pacote deve incorporar uma memória versionada correta:

- `AGENTS.md`;
- `docs/PROJECT_CONTEXT.md`;
- `docs/CURRENT_STAGE.md`;
- `docs/DECISION_LOG.md`.

Esses documentos devem registrar:

- quatro perfis funcionais e um papel técnico;
- Gestão de Equipe plena pela Assistente;
- convite e conta como efeito obrigatório do cadastro;
- PR 31 concluído;
- 13 migrations após esta implementação;
- próxima etapa: criar projeto exclusivo e executar somente o preflight não destrutivo.

PRs documentais antigos que contradigam este contrato devem ser encerrados como substituídos após a incorporação do novo pacote.

## 9. Limites

Este pacote não:

- cria projeto Supabase remoto;
- aplica migrations remotamente;
- adiciona credenciais;
- ativa Supabase em Production;
- migra dados institucionais;
- corrige o pacote visual separado já identificado;
- cria uma área administrativa completa para `technical_admin`.

## 10. Critério de conclusão

A preparação pré-Supabase será considerada concluída quando o PR desta implementação estiver incorporado à `main`, os gates aplicáveis estiverem verdes e os PRs contraditórios estiverem encerrados como substituídos. A tarefa seguinte será exclusivamente a criação do projeto `radar-pdde-preview` e a execução do preflight não destrutivo, mediante autorização específica.