# Hierarquia visual desktop do RADAR PDDE — Design

## Objetivo

Corrigir os pontos de leitura e hierarquia identificados no RADAR PDDE sem alterar regras de negócio, dados, permissões, rotas ou fluxos operacionais. A frente é deliberadamente desktop-first porque o produto é operado em PC; nenhuma otimização mobile será feita.

## Fonte e baseline

- Fonte de verdade: branch `main` remota do repositório `WilsonMPeixoto-2/RADARPDDE`.
- Baseline aprovado: `4542bbfdba7b4a6073445c8f3ea6ceafbb660dba`.
- As seis imagens anexadas à tarefa são evidências dos problemas observados, não uma especificação para reproduzir o layout atual.
- A paleta, a tipografia, os ícones, a nomenclatura e a arquitetura presentes no baseline remoto serão preservados.

## Escopo aprovado

### 1. Competência como contexto operacional

O seletor global continuará sendo a única origem visual e funcional da competência ativa. Sua apresentação no cabeçalho ganhará contraste, espaço e tipografia suficientes para deixar explícito que o mês governa dashboards, carteira, prontuários e análises.

Nas telas `Painel do Controlador` e `Visão por Competência`, um bloco contextual reutilizável exibirá a competência ativa junto ao título da página. O bloco não criará estado local, seletor duplicado nem nova regra de sincronização; ele apenas refletirá `RadarCompetenceContext`.

### 2. Prontuário como dossiê institucional

O cartão linear de informações será substituído por um dossiê de largura integral, organizado semanticamente em:

1. Identificação;
2. Gestão escolar;
3. Contatos;
4. Vinculação administrativa;
5. Programas vinculados.

Os mesmos valores existentes serão exibidos, sem alterar campos, origem de dados ou autorização. No desktop, cada seção usará uma grade de duas ou três colunas conforme o conteúdo; o espaço de acompanhamento e as abas permanecerão abaixo do dossiê.

### 3. Mensagem de cobrança

O modal `Gerar Mensagem de Cobrança` será organizado em duas áreas simultâneas no desktop:

- seleção das pendências incluídas;
- pré-visualização integral da mensagem.

Cada pendência será um item legível com competência/item e motivo/observação separados visualmente. O rodapé de ações ficará fora da região rolável. O texto gerado, a seleção inicial, a cópia, o registro de contato, o fechamento por `Escape` e a restauração de foco permanecerão idênticos funcionalmente.

### 4. Gramática visual reutilizável

Serão introduzidas classes opt-in para:

- bloco de contexto;
- seção informativa;
- grade de campos;
- rótulo;
- valor principal;
- informação secundária;
- estado.

As classes serão aplicadas apenas a ocorrências semanticamente equivalentes encontradas nas superfícies desta frente. Não haverá seletor CSS global que mude indiscriminadamente cartões, formulários, tabelas ou abas.

## Direção visual

- Fundo e superfícies permanecem brancos ou nos tons lavanda já usados pelo produto.
- Roxo institucional permanece como cor de ação e contexto.
- Rótulos usam peso, caixa e contraste secundários consistentes.
- Valores recebem contraste e ritmo vertical superiores aos rótulos.
- Bordas e sombras permanecem discretas; não serão adicionados gradientes, ilustrações, ícones decorativos ou novos componentes de navegação.
- O layout desktop de referência para homologação é `1440 × 900`, com verificação adicional em `1280 × 800`.

## Autenticação e carregamento inicial

A lentidão percebida no startup não é um problema estético e não pertence ao patch visual. Ela será investigada separadamente por medição das fases reais de sessão, perfil, escopos e carga autorizada.

Nenhum spinner, barra de progresso, porcentagem fictícia ou texto cosmético será adicionado nesta branch. Uma futura correção só será proposta em frente separada se houver um gargalo reproduzível e uma mudança segura, mensurável e compatível com os contratos de autenticação.

## Fora de escopo

- qualquer trabalho mobile ou alteração dos cartões mobile da Carteira;
- mudanças de autenticação nesta branch;
- migrations, schema, RLS, Supabase ou dados;
- dependências, framework, lockfile ou pipeline;
- mudança de regras de negócio, filtros, cálculos, textos gerados ou capacidades por perfil;
- criação de baseline visual definitivo antes da aprovação humana das capturas do Preview;
- merge ou alteração de Production.

## Critérios de aceite

1. O seletor global é claramente identificável e utilizável no cabeçalho desktop, sem duplicar estado de competência.
2. Dashboard do Controlador e Visão por Competência exibem o mesmo contexto ativo refletido pelo seletor global.
3. A troca de competência continua atualizando dados, títulos e contexto sem recarga ou divergência.
4. O Prontuário apresenta todos os campos atuais dentro dos cinco grupos aprovados.
5. O dossiê ocupa a largura útil e o workspace permanece abaixo dele, sem overflow horizontal em `1280 × 800` e `1440 × 900`.
6. O modal de cobrança apresenta seleção e prévia lado a lado no desktop, mantém ações visíveis e preserva exatamente o conteúdo funcional da mensagem.
7. Foco, teclado, `Escape`, `aria-*` e ausência de violações sérias/críticas permanecem protegidos.
8. Testes unitários, integração/readiness e Playwright desktop ficam verdes.
9. Capturas do Preview são revisadas visualmente antes de qualquer baseline definitivo.
10. A branch não contém mudanças mobile, Auth, banco, dependências ou Production.

