# RADAR PDDE — Pós-login, Prontuário e Competência Padrão

## Objetivo

Melhorar a entrada no RADAR após autenticação sem reduzir garantias de autorização, RLS, integridade ou consistência; reorganizar o cabeçalho do Prontuário para priorizar a avaliação; e alterar a competência operacional padrão para o mês imediatamente anterior ao calendário corrente.

## Escopo aprovado

### 1. Pós-login

- Medir separadamente os tempos de autenticação, autorização, bootstrap estrutural, contexto operacional, aplicação do estado e liberação visual.
- Preservar a validação de sessão, perfil, escopos, RLS e os contratos atuais do Supabase.
- Reduzir apenas esperas seriais comprovadamente desnecessárias.
- Primeira estratégia: quando houver competência inicial explícita e válida, iniciar em paralelo o carregamento estrutural e o contexto operacional dessa competência; se o calendário estrutural mostrar que a competência solicitada não existe, descartar esse contexto e usar o fallback canônico existente.
- Também reduzir serialização interna do contexto operacional apenas onde consultas forem logicamente independentes.
- Não introduzir cache persistente de dados operacionais nem servir estado possivelmente obsoleto para acelerar a abertura.
- Não fazer lazy-loading amplo, nova arquitetura de bundles ou redução de entidades obrigatórias nesta etapa.
- Registrar métricas em memória para diagnóstico, sem telemetria externa nem persistência de credenciais/dados pessoais.

### 2. Prontuário

O Prontuário passa a começar por um cabeçalho operacional compacto contendo:

- nome da escola;
- identificação curta da unidade;
- ações autorizadas já existentes: `Registrar Contato`, `Gerar Cobrança`, `Editar Dados`;
- nova ação `Exibir dados da unidade`.

O cabeçalho deve permanecer visível durante a rolagem da área de conteúdo (`sticky`) sem cobrir abas ou conteúdo.

Os dados cadastrais que hoje ocupam permanentemente a sidebar passam para um painel expansível, fechado por padrão, imediatamente abaixo do cabeçalho. O painel inclui os dados cadastrais atuais e Programas vinculados. A ação alterna entre `Exibir dados da unidade` e `Ocultar dados da unidade`, com `aria-expanded` e vínculo por `aria-controls`.

Perfis sem ações mutáveis continuam vendo o nome da escola e podem consultar os dados da unidade, sem ganhar permissões novas.

Nenhuma regra de avaliação, bonificação, Pendência, reanálise, inventário ou persistência é alterada por esta reorganização.

### 3. Competência padrão

- A competência inicial padrão passa a ser o mês imediatamente anterior à data corrente.
- Em 14/09/2026, o padrão é `2026-08`.
- Em janeiro, deve tentar dezembro do ano anterior.
- Se a competência anterior não existir no calendário configurado, usar o fallback válido já previsto pela aplicação.
- Navegação durante a mesma sessão não deve redefinir a competência escolhida manualmente.
- Rotas ou chamadas que solicitem competência explicitamente continuam prevalecendo.
- O comportamento de abertura deve ser derivado da data, nunca fixado em `2026-08`.

## Segurança e integridade

- Nenhuma migration de banco é prevista.
- Nenhuma política RLS será relaxada.
- Nenhum campo cadastral ou regra de negócio será removido.
- Nenhuma gravação em Production será feita durante desenvolvimento ou testes.
- O estado remoto continua sendo a fonte de verdade.

## Testes obrigatórios

- unidade para competência anterior, inclusive setembro → agosto e janeiro → dezembro;
- unidade para bootstrap paralelo com competência explícita e fallback quando indisponível;
- unidade para sequência de consultas do contexto operacional sem alterar o conjunto retornado;
- E2E do Prontuário com painel cadastral fechado por padrão, expansão/recolhimento, acessibilidade e ações por perfil;
- E2E confirmando cabeçalho sticky durante rolagem;
- E2E confirmando que seleção manual de competência permanece ao navegar entre escolas;
- jornada pós-login com Supabase real e medição comparativa antes/depois;
- suíte unitária completa, Playwright desktop, ciclos funcionais reais com Supabase, readiness/RLS e perfis/viewports.

## Critério de sucesso

A entrega é aceita quando:

1. não houver regressão funcional ou de banco;
2. a competência inicial usar o mês anterior de forma dinâmica;
3. os dados cadastrais não competirem visualmente com a avaliação;
4. o nome da escola permanecer visível durante a rolagem do Prontuário;
5. o tempo pós-login diminuir de forma mensurável ou, caso o ganho seja pequeno, as métricas identifiquem com precisão o próximo gargalo sem mascarar o resultado.
