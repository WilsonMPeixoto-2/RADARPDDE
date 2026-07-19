# RADAR PDDE 2026 — Contexto funcional e arquitetural

## 1. Finalidade

O RADAR PDDE organiza o ciclo de análise, acompanhamento, regularização, prestação de contas e apoio à decisão do Programa Dinheiro Direto na Escola no âmbito da 4ª CRE/SME-Rio.

O sistema deve permitir que cada usuário compreenda:

1. o estado atual;
2. o que exige atenção;
3. quem deve agir;
4. qual é a próxima ação;
5. onde realizar essa ação;
6. como o histórico foi formado.

Dashboards, carteiras, pendências, competências, prontuários, inventário, registros e exportações representam o mesmo universo de dados e não podem criar verdades independentes.

## 2. Perfis funcionais

### Controlador

Opera a carteira de escolas que lhe foi atribuída, acompanha documentos, análises, bonificação, pendências, tentativas, contatos e próximas ações.

### Assistente de Verbas Federais

Luísa Ferreira representa a liderança operacional da GAD da 4ª CRE. O perfil:

- acompanha transversalmente as escolas;
- apoia e coordena os controladores;
- administra plenamente controladores e carteiras;
- cadastra, edita, convida e desativa controladores;
- redistribui escolas;
- administra integrantes da Equipe de Inventário;
- executa retificações e demais ações transversais autorizadas.

### SME (Gestão)

Acompanha a situação operacional das coordenadorias por visões consolidadas, administra parâmetros institucionais autorizados e realiza leitura gerencial ampla. Não substitui a Assistente na gestão cotidiana da equipe da CRE.

### Equipe de Inventário

Executa o fluxo patrimonial, acompanha bens permanentes, encaminhamentos, inventariação, processos e registros dentro do escopo autorizado.

## 3. Papel técnico

`technical_admin` existe para segurança, infraestrutura, perfis, escopos, importações e auditoria. Não é um quinto perfil operacional visível e não herda menus, identidade ou funções da Assistente.

## 4. Superfícies principais

O produto contém, conforme o perfil:

- Dashboard;
- Carteira de Escolas;
- Competências Mensais;
- Pendências Operacionais;
- Gestão de Equipe;
- Capital e Inventário;
- Registros Internos;
- Configurações e visões gerenciais da SME;
- prontuário e modais operacionais.

Toda alteração deve considerar todas as superfícies em que o dado aparece e os recortes por competência, controlador, região administrativa, programa e situação.

## 5. Pendências e regularização

Estados relevantes:

- Aberta;
- Aguardando reanálise;
- Resolvida;
- Cancelada.

Resultados de tentativa incluem:

- aguardando;
- correto;
- incorreto;
- arquivo indisponível;
- substituída antes da análise.

O sistema preserva motivo, documento, escola, programa, responsável, tentativas, contatos, datas, resultado, histórico e próxima ação. Resolver ou cancelar não apaga o percurso da regularização.

## 6. Entidades canônicas

O contrato de repositório inclui:

- configuração;
- programas;
- perfis e perfis de usuário;
- escopos escolares;
- controladores;
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

## 7. Persistência

O frontend consome serviços de aplicação e um contrato único:

```text
Frontend
   ↓
Serviços e unidade de trabalho
   ↓
Contrato de repositório
   ├── LocalStorageRepository
   └── SupabaseRepository
```

Production permanece local até homologação e autorização. O adaptador remoto utiliza paginação, lotes, tratamento padronizado de erros, concorrência otimista, snapshots e operações RPC compostas.

## 8. Gestão de contas da equipe

O cadastro de controlador ou integrante de Inventário produz efeitos organizacionais e de acesso:

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

A credencial administrativa nunca chega ao navegador. Falhas compensam convite, edição ou bloqueio para evitar conta e registro divergentes.

## 9. Autorização

- anônimo: sem acesso institucional;
- Controlador: carteira própria e exceções;
- Assistente: operação transversal e Gestão de Equipe plena;
- Inventário: operação patrimonial autorizada;
- SME: leitura gerencial e parâmetros institucionais;
- Administrador técnico: infraestrutura, perfis, escopos e auditoria.

Exclusão física é excepcional. A remoção funcional de integrante é desativação lógica e auditada.

## 10. Migração

Fluxo obrigatório:

```text
snapshot → validação → plano → dry-run → staging
         → retomada → reconciliação → promoção atômica
         → reconciliação do destino → rollback comprovado
```

Seed local não é dado institucional. Importação administrativa não ocorre no navegador.

## 11. Ambientes

- `local`: Production vigente e desenvolvimento local padrão;
- `supabase-preview`: primeira conexão real, isolada;
- `supabase-production`: futuro, bloqueado até autorização.

O build gera configuração pública específica por ambiente e deve falhar de forma segura. Preview é publicado como artefato prebuilt verificado; Production continua local.

## 12. Qualidade de produto

Uma implementação está concluída quando:

- representa corretamente os dados;
- permite localizar e executar a próxima ação;
- mantém coerência entre visões;
- funciona para todos os perfis afetados;
- preserva desktop e mobile;
- mantém acessibilidade, histórico e rastreabilidade;
- possui autorização e persistência compatíveis com o frontend;
- passa pelos testes e gates aplicáveis.
