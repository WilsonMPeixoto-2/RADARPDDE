# RADAR PDDE 2026 — Contexto funcional e arquitetural

**Atualizado em:** 7 de agosto de 2026  
**Classe documental:** Canônico

## 1. Finalidade

O RADAR PDDE organiza o ciclo de entrega, análise, acompanhamento, regularização, consolidação, inventário, histórico e apoio à decisão dos programas do PDDE no âmbito da 4ª CRE/SME-Rio.

O sistema deve permitir que cada usuário compreenda:

1. o estado atual da unidade, competência e programa;
2. o que exige atenção;
3. quem deve agir;
4. qual é a próxima ação;
5. onde realizar essa ação;
6. como o histórico foi formado;
7. qual competência e programa sustentam a informação;
8. como a informação chega aos relatórios institucionais.

Dashboard, Carteira, Competências, Prontuário, Pendências, Inventário, Registros Internos, timeline e exportações representam o mesmo universo de dados. Nenhuma superfície cria fonte de verdade independente.

## 2. Baseline operacional

O baseline mutável corrente fica exclusivamente em [`CURRENT_STAGE.md`](CURRENT_STAGE.md). Este documento descreve contratos estáveis e não deve replicar SHA, deployment, contagem de migrations ou versão de Edge Function.

## 3. Regra de precedência

1. código-fonte remoto vigente;
2. Supabase efetivo, incluindo schema, migrations, Auth, RLS, funções e dados;
3. artefato implantado na Vercel e seu SHA;
4. testes/evidências reproduzíveis;
5. decisões funcionais vigentes;
6. documentação canônica;
7. documentos históricos.

Memória de chat, planos e auditorias anteriores não substituem verificação operacional.

## 4. Perfis funcionais

### Controlador

Possui carteira de responsabilidade principal e pode colaborar nas escolas da própria CRE. A atuação fora da carteira não transfere `schools.controller_id`, preserva autoria e não concede acesso a outra CRE.

Pode editar dados cadastrais autorizados, mas não redistribuir carteira nem alterar a identidade institucional da escola.

### Assistente de Verbas Federais

Lidera operacionalmente a GAD/CRE, acompanha escolas, administra Controladores e Inventário, distribui carteiras, executa ações transversais autorizadas e consolida relatórios.

### Gestão SME

Realiza acompanhamento gerencial. Consulta identificação e bonificação, não recebe análise técnica nas superfícies restritas nem mutações operacionais de Pendências. Em Registros Internos, consulta somente registros admitidos pelas políticas vigentes.

O contrato atualmente implementado permite à Gestão SME, além do calendário/exercícios, cadastrar, editar e desativar programas. Essa capacidade foi confirmada no código, serviço, RPC e permissões durante a auditoria funcional. Qualquer retirada ou expansão futura exige decisão funcional própria.

### Equipe de Inventário

Executa o fluxo patrimonial autorizado dentro do escopo da CRE.

### Administrador técnico

`technical_admin` atua em segurança, infraestrutura, perfis, escopos, importações e auditoria. A simulação visual não altera JWT nem substitui contas operacionais reais.

## 5. Superfícies

O produto contém, conforme o perfil:

- Dashboard;
- Carteira;
- Competências;
- Pendências;
- Prontuário e timeline;
- Gestão de Equipe;
- Capital e Inventário;
- Registros Internos;
- configurações SME;
- alertas, busca, modais e exportações.

Toda alteração deve considerar competência, exercício, Controlador, CRE, escola, programa, documento, situação, autoria e perfil efetivo.

## 6. Competência transversal

A competência canônica usa `YYYY-MM` e é única para Dashboard, Carteira, Competências, Prontuário, Pendências, alertas, timeline e exportações.

`RadarCompetenceContext` normaliza, valida, seleciona e sincroniza o contexto. Estado remoto restaurado deve atualizar também as estruturas globais usadas pelo primeiro render. O PR #160 fixou a regressão em que uma competência criada pela Gestão SME podia ser restaurada sem sincronização de `COMPETENCIAS`.

Competência existente, disponível e formalmente fechada são conceitos distintos.

## 7. Avaliação mensal

Identidade:

```text
escola + competência + programa
```

A projeção canônica reúne consolidação, resultado, campos ausentes, bonificação, análise técnica, conclusão e pendências. Consulta, telas e certificação Excel devem usar a mesma regra.

## 8. Pendências

Estados:

- Aberta;
- Aguardando reanálise;
- Resolvida;
- Cancelada.

Novo envio não resolve automaticamente. Reanálise positiva resolve; negativa reabre; cancelamento preserva motivo e autoria; regularização não apaga percurso.

A tabela `pendency_attempts` deve permanecer sincronizada com o estado agregado das tentativas da pendência. A migration de remediação de integridade adicionou trigger e reconciliação idempotente para esse contrato.

## 9. Timeline

`RadarSchoolTimeline` projeta avaliações, pendências, tentativas, contatos, despesas, bens e registros administrativos. Preserva ordem, autoria, competência, programa, origem e visibilidade por perfil.

## 10. Navegação contextual

`RadarNavigationContext` preserva competência, rota, filtros, rolagem e foco entre origem operacional e Prontuário/Pendências. Usa `sessionStorage`, pilha limitada e fallback seguro.

## 11. Persistência

```text
Frontend
→ serviços de aplicação e UnitOfWork
→ RepositoryContract
   ├── SupabaseRepository — Preview e Production
   └── LocalStorageRepository — desenvolvimento e contingência por novo build
→ PostgREST / RPC / Edge Function
→ Auth / RLS / PostgreSQL
```

O adaptador remoto usa paginação, lotes, erros padronizados, `row_version`, snapshots, RPCs, reconciliação e rollback.

Production somente é liberada após autenticação, autorização e leitura do Supabase. O estado institucional canônico é remoto.

## 12. Auth e sessão

O cliente Supabase usa sessão persistente e renovação automática. O bootstrap:

1. restaura ou cria a sessão;
2. valida perfil, papel efetivo e escopos;
3. cria cliente autenticado;
4. carrega entidades autorizadas;
5. aplica o perfil à interface;
6. mantém a aplicação inerte enquanto a autorização não termina.

## 13. Gestão de contas

```text
DirectoryService
→ TeamAccountGateway
→ team-account-management
   ├── Supabase Auth Admin
   └── RPC PostgreSQL transacional
```

Contratos vigentes:

- CORS fail-closed;
- JWT e papel autorizados;
- credencial administrativa somente server-side;
- lookup exato de conta por e-mail pela RPC `resolve_team_auth_user_id_by_email`, executável apenas por `service_role`;
- recuperação de vínculo histórico quando inequívoca;
- reutilização segura de conta em transição autorizada de perfil;
- um único perfil institucional ativo por usuário;
- desativação lógica e preservação de histórico;
- compensação quando Auth e banco participam de etapas distintas.

Os PRs #150 e #161 complementaram o conserto inicial do PR #138. Não descrever Gestão de Equipe como resolvida apenas pelo CORS do PR #138.

## 14. Escolas e carteira

A carteira organiza responsabilidade, não fronteira entre Controladores da mesma CRE.

Novas escolas exigem identidade institucional informada:

- código institucional;
- designação;
- denominação;
- INEP;
- CNPJ;
- SICI.

Valores artificiais não podem ser gerados para preencher identidade definitiva. O banco exige campos institucionais não vazios e unicidade normalizada de INEP, CNPJ e SICI.

A redistribuição de `controller_id` é exclusiva da Assistente e do administrador técnico/rotina administrativa autorizada, com proteção também no banco.

## 15. Financeiro e patrimônio

Notas fiscais e bens permanentes participam de operações compostas.

- nota permanente e bem derivado devem preservar contexto coerente;
- quando uma nota perde ou troca o vínculo com bem derivado, o vínculo anterior é removido na mesma transação protegida;
- edição rápida de bem é restrita ao campo permitido e usa `saveAssetWithLog`, versão esperada e log administrativo;
- encaminhamento e inventariação usam fluxo patrimonial próprio.

## 16. Auditoria e exportações

`administrative_logs` registra eventos funcionais e `audit_events` serve à trilha técnica correspondente ao schema.

Exportações institucional e SME passam por `RadarExcelExportAudit`: o início precisa ser confirmado via `AuditService.record` antes do download; após geração, registra-se a conclusão. O filtro de compatibilidade impede duplicação do evento legado de exportação.

## 17. Ambientes

### Desenvolvimento/local

Supabase local e fixtures descartáveis. Não representa Production.

### Preview

Supabase autorizado de Preview/ambiente descartável e artefato candidato. Preview não é publicação oficial.

### Production

Supabase Production canônico e frontend publicado na Vercel. Consultar `CURRENT_STAGE.md` para o baseline mutável efetivo.

## 18. Excel SME

Contrato estável:

- uma competência por arquivo;
- uma aba;
- 27 colunas A:AA;
- template-fonte com 30 colunas usado somente como base visual;
- remoção de K, R e Y na projeção pública;
- designação como texto;
- bordas, alinhamentos, filtro, impressão e congelamento preservados;
- ausência deliberada de `dataValidations` incompatíveis;
- certificação OOXML, reabertura e homologação desktop.

## 19. Garantia operacional

O sistema possui camadas permanentes de:

- smoke geral de Production;
- incidentes automáticos;
- auditoria agregada de vinte invariantes;
- backup/restauração descartáveis;
- gate por perfil e viewport;
- matriz funcional executável;
- infraestrutura de leitura autenticada protegida.

A última permanece desativada até provisionamento específico de identidades técnicas.

## 20. Confiabilidade funcional ponta a ponta

Uma função crítica deve ser rastreada por:

```text
superfície
→ controle
→ handler
→ serviço
→ repositório
→ tabela/RPC/Edge Function
→ Auth/RLS
→ resposta
→ estado em memória
→ renderização
→ releitura após refresh
→ erro, conflito e compensação
```

A matriz executável registra 41 operações e distingue `covered` de `partial`. Correção de uma lacuna não promove automaticamente a operação a coberta sem a evidência exigida.

## 21. Auditoria histórica PR #156

A branch do PR #156 contém evidências úteis, porém divergiu da `main`. Não é fonte atual de arquitetura nem deve ser mesclada cegamente. A continuidade das provas deve partir da `main` reconciliada e reutilizar somente evidências compatíveis com o código atual.

## 22. Restrições permanentes

Não é permitido:

- alterar código para coincidir com documento histórico;
- criar fonte paralela de competência, avaliação, timeline ou exportação;
- enfraquecer Auth, RLS ou autoria;
- transformar carteira em fronteira de segurança entre Controladores da mesma CRE;
- ocultar capacidade essencial no mobile;
- introduzir segredo no frontend;
- aplicar migration sem histórico, testes, backup, dry-run e reversão;
- editar diretamente a tabela de migrations;
- inventar identidade institucional de escola;
- reintroduzir persistência patrimonial genérica em `ASSET-02`;
- reintroduzir `listUsers` como lookup global da Gestão de Equipe;
- liberar exportação antes da auditoria inicial;
- tratar PR aberto ou Preview como funcionalidade publicada;
- declarar função pronta apenas pela presença visual.

## 23. Referências

- [`CURRENT_STAGE.md`](CURRENT_STAGE.md);
- [`ROADMAP_ATUALIZACOES_2026.md`](ROADMAP_ATUALIZACOES_2026.md);
- [`DECISION_LOG.md`](DECISION_LOG.md);
- [`reference/FUNCTIONAL_CONTRACT_MATRIX.md`](reference/FUNCTIONAL_CONTRACT_MATRIX.md);
- [`architecture/testing.md`](architecture/testing.md);
- [`architecture/supabase-readiness.md`](architecture/supabase-readiness.md);
- [`runbooks/SUPABASE_CONNECTION.md`](runbooks/SUPABASE_CONNECTION.md);
- [`audits/2026-08-07-reconciliacao-documental-integral-pos-pr162.md`](audits/2026-08-07-reconciliacao-documental-integral-pos-pr162.md).
