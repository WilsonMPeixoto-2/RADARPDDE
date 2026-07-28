# RADAR PDDE 2026 — Contexto funcional e arquitetural

## 1. Finalidade

O RADAR PDDE organiza o ciclo de análise, acompanhamento, regularização, prestação de contas, inventário e apoio à decisão dos programas do PDDE no âmbito da 4ª CRE/SME-Rio.

O sistema deve permitir que cada usuário compreenda:

1. o estado atual;
2. o que exige atenção;
3. quem deve agir;
4. qual é a próxima ação;
5. onde realizar essa ação;
6. como o histórico foi formado;
7. qual competência e programa sustentam a informação;
8. como a informação foi refletida nos relatórios oficiais.

Dashboards, carteiras, competências, prontuários, pendências, inventário, registros e exportações representam o mesmo universo de dados e não podem criar verdades independentes.

## 2. Perfis funcionais

### Controlador

Possui carteira de responsabilidade principal, usada como filtro inicial e organização do trabalho. Também pode consultar e executar ações operacionais nas demais escolas da própria CRE para colaboração, substituição e cobertura da equipe.

A atuação fora da carteira não transfere automaticamente a responsabilidade principal. `schools.controller_id` permanece como atribuição ordinária, enquanto a autoria real da ação é registrada pelo usuário autenticado.

### Assistente de Verbas Federais

Representa a liderança operacional da GAD da CRE. O perfil:

- acompanha transversalmente as escolas;
- apoia e coordena os Controladores;
- administra Controladores, integrantes de Inventário e carteiras;
- cadastra, edita, convida, desativa e redistribui conforme autorização;
- executa retificações e ações transversais autorizadas;
- consolida informações e relatórios operacionais.

### Gestão SME

Acompanha a situação das coordenadorias por visões consolidadas e parâmetros institucionais autorizados.

Nas visões mensal e do prontuário:

- consulta identificação da unidade e bonificação;
- não visualiza análise técnica;
- não executa ações operacionais.

Em Pendências:

- consulta listas e detalhes;
- não registra novo envio, substituição, reanálise, contato, cancelamento, reabertura ou nova pendência.

Em Registros Internos:

- consulta apenas ações cujo `actor_user_id` corresponde ao próprio UUID autenticado.

A restrição é aplicada em política de capacidades, guardas de interface/serviço e RLS.

### Equipe de Inventário

Executa o fluxo patrimonial, acompanha bens permanentes, encaminhamentos, inventariação, processos e registros dentro do escopo autorizado.

## 3. Papel técnico

`technical_admin` existe para segurança, infraestrutura, perfis, escopos, importações e auditoria. Não é perfil operacional e não herda menus, identidade ou funções da Assistente.

A simulação de perfil pelo Administrador técnico altera a política visual, mas não substitui o JWT nem concede comportamento contrário ao perfil simulado.

## 4. Superfícies principais

O produto contém, conforme o perfil:

- Dashboard;
- Carteira de Escolas;
- Competências Mensais;
- Pendências Operacionais;
- Prontuário;
- Gestão de Equipe;
- Capital e Inventário;
- Registros Internos;
- Configurações e visões gerenciais SME;
- alertas, modais e exportações.

Toda alteração deve considerar as superfícies em que o dado aparece e os recortes por:

- competência;
- exercício;
- Controlador;
- CRE e região administrativa;
- escola;
- programa;
- documento;
- situação;
- autoria.

## 5. Competência como contexto transversal

A competência canônica utiliza `YYYY-MM`.

O estado mensal deve ser único para toda a aplicação e orientar:

- Dashboard;
- Carteira;
- Competências;
- Prontuário;
- Pendências e alertas;
- timeline;
- exportações Excel.

A aplicação não deve manter seleções mensais independentes por tela. A competência ativa precisa ser visível, selecionável, persistida durante a sessão e preservada na navegação contextual.

Em 28/07/2026, as 12 competências de 2026 existem no Supabase, mas o frontend e a configuração ainda limitam a operação a maio. A correção é a próxima frente prioritária.

## 6. Avaliação mensal

Cada avaliação é identificada por:

```text
escola + competência + programa
```

O registro contém dimensões independentes:

- bonificação;
- análise técnica;
- resultado derivado;
- pendências correlatas;
- autoria, datas e versão.

A aplicação deve garantir que o mesmo registro produza resultado coerente em todas as telas e nos relatórios Excel.

## 7. Pendências e regularização

Estados canônicos:

- `Aberta`;
- `Aguardando reanálise`;
- `Resolvida`;
- `Cancelada`.

Resultados de tentativa incluem:

- aguardando;
- correto;
- incorreto;
- arquivo indisponível;
- substituída antes da análise.

O sistema preserva motivo, documento, escola, programa, responsável, tentativas, contatos, datas, resultado, histórico e próxima ação. Resolver ou cancelar não apaga o percurso.

Novo envio não resolve a pendência. A resolução exige reanálise positiva. Reanálise negativa devolve a providência ao fluxo aberto.

## 8. Histórico cronológico

O histórico profissional da unidade deve ser uma projeção das entidades canônicas, e não nova fonte de verdade.

Eventos mínimos:

- avaliação mensal;
- abertura de pendência;
- contato/atendimento;
- novo envio;
- reanálise;
- resolução, cancelamento e reabertura;
- nota fiscal/despesa;
- encaminhamento e inventariação;
- alteração administrativa permitida.

A linha do tempo deve preservar ordem, autoria, competência, programa, vínculo com pendência e visibilidade por perfil.

## 9. Entidades canônicas

O contrato de repositório inclui:

- configuração;
- programas;
- perfis e perfis de usuário;
- escopos escolares;
- Controladores;
- equipe de Inventário;
- escolas e programas por escola;
- competências;
- verificações;
- pendências, tentativas e contatos;
- bens;
- notas registradas;
- logs administrativos;
- execuções de importação;
- eventos de auditoria.

Nenhuma superfície deve persistir cópia paralela que possa divergir dessas entidades.

## 10. Persistência

```text
Frontend
   ↓
Serviços de aplicação e unidade de trabalho
   ↓
Contrato de repositório
   ├── SupabaseRepository — Preview e Production
   └── LocalStorageRepository — rollback emergencial
```

O adaptador remoto utiliza:

- paginação e lotes;
- tratamento padronizado de erros;
- concorrência otimista por `row_version`;
- snapshots;
- operações RPC compostas;
- reconciliação e rollback.

Production e Preview usam o Supabase. O modo local não é a fonte normal de dados institucionais.

## 11. Gestão de contas da equipe

```text
DirectoryService
   ↓
TeamAccountGateway
   ↓
Edge Function autenticada
   ├── Supabase Auth Admin
   └── RPC PostgreSQL transacional
        ├── diretório organizacional
        ├── user_profiles
        ├── redistribuição, quando aplicável
        └── administrative_logs
```

A credencial administrativa nunca chega ao navegador. Falhas compensam convite, edição ou bloqueio para evitar divergência entre conta e diretório.

## 12. Autorização

- anônimo: sem acesso institucional;
- Controlador: operação nas escolas da própria `cre_scope`, com carteira como recorte padrão;
- Assistente: operação transversal e Gestão de Equipe plena;
- Inventário: operação patrimonial autorizada;
- SME: leitura gerencial conforme governança restritiva;
- Administrador técnico: infraestrutura, perfis, escopos e auditoria.

Controlador sem `cre_scope` não recebe acesso transversal automático. Escola de outra CRE permanece bloqueada, salvo exceção explícita em `user_school_scopes`.

Exclusão física é excepcional. A remoção funcional de integrante é desativação lógica e auditada.

## 13. Migração e restauração

Fluxo obrigatório:

```text
snapshot → validação → plano → dry-run → staging
         → retomada → reconciliação → promoção atômica
         → reconciliação do destino → rollback comprovado
```

Seed local não é dado institucional. Importação administrativa não ocorre no navegador.

Backup e restauração devem ser periodicamente testados em ambiente descartável, não apenas documentados.

## 14. Ambientes

### Desenvolvimento local

Pode usar Supabase local e fixtures descartáveis. Não representa Production.

### Preview

```text
environment: preview
dataMode: supabase-preview
supabaseRepositoryEnabled: true
productionActivationApproved: false
```

Usado para homologação remota, identidades temporárias e testes antes de Production.

### Production

```text
environment: production
dataMode: supabase-production
supabaseRepositoryEnabled: true
productionActivationApproved: true
```

O projeto autorizado é `scnryinorqeucbfkioxo`. O build público contém apenas configuração publicável.

### Rollback emergencial

`RADAR_PRODUCTION_FORCE_LOCAL=true` força novo build local sem apagar o banco. Esse modo é contingência excepcional e deve possuir decisão, evidência e plano de retorno.

## 15. Excel como produto final

Os relatórios Excel são produtos institucionais do sistema. A informação exportada deve corresponder integralmente aos lançamentos canônicos.

A certificação deve comparar:

```text
Supabase → estado carregado → modelo de exportação → célula XLSX
```

São exigidos:

- isolamento por competência;
- mapeamento por escola/programa/documento;
- zero divergências;
- abertura sem reparo no Microsoft Excel desktop;
- manifesto, hash e evidência de homologação;
- certificação do modelo SME e do modelo editorial RADAR.

## 16. Qualidade de produto

Uma implementação está concluída quando:

- representa corretamente os dados;
- permite localizar e executar a próxima ação;
- mantém coerência entre visões e exportações;
- funciona para todos os perfis afetados;
- preserva desktop e mobile;
- mantém acessibilidade, histórico e rastreabilidade;
- possui autorização e persistência compatíveis com o frontend;
- possui feedback de erro/sucesso sem expor infraestrutura;
- passa pelos testes e gates aplicáveis;
- atualiza documentação canônica e evidências.

## 17. Direção de desenvolvimento vigente

Ordem:

1. contexto global de competência;
2. junho a dezembro de 2026;
3. avaliação mensal certificada;
4. histórico cronológico;
5. reconciliação Excel;
6. navegação contextual;
7. polimento editorial;
8. segurança, UAT e release oficial.

Plano: [`superpowers/plans/2026-07-28-oficializacao-operacional-radar-pdde.md`](superpowers/plans/2026-07-28-oficializacao-operacional-radar-pdde.md).
