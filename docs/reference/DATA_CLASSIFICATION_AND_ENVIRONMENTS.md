# Classificação de dados e ambientes do RADAR PDDE

## Objetivo

Definir onde cada classe de dado pode existir e separar três situações que não devem ser confundidas:

1. exposição existente no repositório ou bundle atual;
2. proteção que já existe no modo local;
3. proteção que depende da implantação remota do Supabase, Auth e RLS.

## Classes

| Código | Classe | Exemplos | Git | Bundle | Preview | Produção | Logs |
|---|---|---|---|---|---|---|---|
| D0 | público institucional | nome público da escola, designação, INEP público | permitido | permitido se necessário | permitido | permitido | mínimo |
| D1 | interno institucional | status, atribuição, observação operacional | somente fixture fictícia | somente quando indispensável | protegido | protegido | sem conteúdo integral |
| D2 | pessoal/contato | nome de diretor, e-mail, telefone | não versionar sem necessidade e base | evitar | protegido e minimizado | protegido e minimizado | proibido salvo identificador técnico |
| D3 | credencial/segredo | senha, service role, token administrativo | proibido | proibido | secret store | secret store | proibido |
| D4 | configuração pública | modo, URL pública, chave publicável | exemplo vazio permitido | permitido quando autorizado | permitido | permitido | diagnóstico sem segredo |
| D5 | fixture/demonstração | escola e usuário fictícios | permitido | permitido | permitido | não usar como dado real | permitido sem dado pessoal |
| D6 | log/auditoria | ator, ação, data, versão | schema permitido | por permissão | protegido | protegido | retenção definida |
| D7 | snapshot/migração | estado canônico e staging | não versionar com dados reais | proibido | armazenamento controlado | armazenamento controlado | somente contagens e hash |

## Princípios

- **Finalidade:** coletar e exibir somente o necessário para a tarefa institucional.
- **Minimização:** preferir identificadores técnicos e evitar replicar contato pessoal em telas, logs e artefatos.
- **Fonte oficial:** cada dado deve ter origem, responsável por atualização e regra de vigência.
- **Menor privilégio:** acesso remoto será determinado por perfil, escola, carteira e área funcional.
- **Separação de ambientes:** fixtures e dados de demonstração não podem ser promovidos como dados reais.
- **Rastreabilidade:** logs registram ator, ação, instante, entidade e versão, sem reproduzir conteúdo integral desnecessário.
- **Mascaramento:** screenshots, traces, relatórios de CI e exemplos devem substituir nome de usuário e dados de contato.
- **Retenção:** snapshots e artefatos de migração devem possuir prazo, acesso e descarte definidos.

## Matriz por ambiente

| Ambiente | Finalidade | Classes permitidas | Restrições |
|---|---|---|---|
| repositório público | código, schemas, fixtures fictícias e documentação | D0, D4 vazio, D5, estrutura D6 | D1/D2 reais e D3/D7 reais proibidos |
| bundle do navegador local | operação atual no dispositivo | D0; D1/D2 somente se indispensáveis e autorizados; D4 | qualquer conteúdo é inspecionável pelo usuário do navegador |
| `localStorage` | persistência oficial atual | D0–D2/D6 conforme operação local autorizada | sem isolamento por RLS; depende do dispositivo e perfil de uso |
| teste local | validação determinística | D5 e dados sintéticos | não copiar base real por conveniência |
| CI | validação automatizada | D5, D4 de teste, logs minimizados | segredos somente no secret store; artefatos com retenção curta |
| Preview | homologação | D0, D1/D2 minimizados e autorizados, D4, D5, D6 | autenticação, RLS, controle de acesso e política de dados |
| Supabase de homologação | validar migrations, Auth/RLS e migração | D0–D2/D4/D6/D7 controlados | projeto autorizado, usuários reais limitados e reconciliação |
| produção | operação institucional | D0–D2/D4/D6; D7 em processo controlado | menor privilégio, backup, restauração, logs e incidentes |

## Configuração pública e segredos

- URL Supabase e chave publicável podem existir no frontend apenas no ambiente autorizado.
- `service_role`, `sb_secret_*`, senha de banco, token administrativo e chave de bootstrap nunca entram no bundle, Git ou logs.
- `config.js` bloqueia chave proibida, ambiente inválido, modo de produção sem autorização e Preview em produção.
- `.env.example` permanece vazio e declarativo.

## Estado local e Supabase

A persistência local não oferece isolamento remoto por usuário; ela é o backend deliberadamente vigente. RLS não é uma “proteção faltante” do modo local: é parte do backend remoto preparado e será aplicada quando o Ciclo F criar o projeto, usuários e ambientes.

Essa distinção não elimina riscos independentes do Supabase. Dados reais versionados em repositório público ou embutidos no bundle permanecem acessíveis mesmo depois de um banco protegido ser conectado, até serem removidos da árvore ativa e, conforme decisão, do histórico.

## Evidências e artefatos

- capturas do Ciclo A usam `Usuário de teste`;
- `mailto:` e `tel:` são neutralizados antes da screenshot;
- campos de e-mail e telefone são esvaziados;
- manifesto registra metadados técnicos, não conteúdo pessoal;
- traces e vídeos não são produzidos pela configuração de baseline;
- artefatos temporários de workspace têm retenção de um dia.

## Histórico Git

Remover um dado da versão atual não o remove de commits anteriores. Qualquer saneamento de histórico deve avaliar impacto sobre clones, PRs, tags, links, Vercel e rastreabilidade. A ação exige plano autônomo, backup e autorização expressa.

## Incidentes

Ao identificar segredo real ou dado pessoal indevido:

1. interromper divulgação e novas cópias;
2. registrar apenas metadados mínimos do incidente;
3. revogar ou rotacionar credencial, quando aplicável;
4. remover da árvore ativa;
5. decidir sobre histórico Git;
6. revisar logs e artefatos;
7. documentar causa e prevenção.
