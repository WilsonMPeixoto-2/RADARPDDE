# Rotas internas canônicas do RADAR PDDE — desenho técnico

## Objetivo

Permitir que o estado navegável do RADAR PDDE seja representado por URLs limpas, copiáveis e restauráveis, sem substituir a arquitetura atual nem introduzir um framework de roteamento.

## Escopo aprovado

Rotas desta primeira entrega:

| URL canônica | Estado interno |
|---|---|
| `/dashboard` | `view: dashboard` |
| `/carteira` | `view: escolas` |
| `/competencias` | `view: competencias` |
| `/pendencias` | `view: pendencias` |
| `/inventario` | `view: inventario` |
| `/auditoria` | `view: auditoria` |
| `/equipe` | `view: equipe` |
| `/gestao-sme` | `view: sme-config` |
| `/escolas/:schoolId` | `view: prontuario`, escola selecionada |
| `/escolas/:schoolId/pendencias` | `view: prontuario`, escola selecionada, aba Pendências |

A rota `/escolas/:schoolId/pendencias` deve abrir o Prontuário da unidade diretamente na aba de pendências e oferecer uma ação para abrir a tela geral filtrada em `/pendencias?escola=:schoolId`.

## Arquitetura

### 1. `src/integration/navigation-routes.js`

Módulo puro, sem acesso obrigatório ao DOM, responsável por:

- traduzir `pathname` e `search` em um estado de rota;
- gerar a URL canônica correspondente ao estado interno;
- normalizar identificadores de escola;
- rejeitar formatos desconhecidos;
- preservar apenas os parâmetros de busca suportados;
- expor funções testáveis em Node e no navegador.

Interface pública:

```js
parseRoute(pathname, search)
buildRoute(navigationState)
normalizeRoute(route)
```

Estado normalizado:

```js
{
  valid: true,
  view: 'prontuario',
  param: '04.31.026',
  section: 'pendencias',
  filters: { escola: '04.31.026' }
}
```

### 2. `src/integration/navigation-history.js`

Continuará responsável pela History API e será adaptado para:

- usar `navigation-routes.js` para gerar a URL em `pushState` e `replaceState`;
- interpretar a URL inicial;
- restaurar rotas no evento `popstate`;
- evitar entradas duplicadas;
- manter a rota solicitada até o término do bootstrap de autenticação e dados;
- aplicar a rota somente quando `switchView()` e os dados necessários estiverem disponíveis.

O módulo não deve duplicar regras de parsing nem conhecer detalhes de cada padrão textual de URL.

### 3. Integração com `app.js`

`switchView(view, param)` permanece como ponto central de renderização.

Será acrescentado um contrato opcional de seção e filtros por meio do estado de navegação, sem alterar todas as chamadas existentes. O adaptador de histórico deve:

- chamar `switchView('prontuario', schoolId)` para rotas de escola;
- ativar `tab-pendencias` após o Prontuário ser renderizado;
- aplicar `activePendencySchoolFilter` antes de renderizar `/pendencias?escola=...`;
- limpar esse filtro ao navegar para `/pendencias` sem parâmetro;
- impedir que uma escola inacessível seja exposta pela interface.

### 4. Links reais

A primeira entrega deve transformar os acessos principais a escolas em links reais sempre que a alteração for localizada e segura. Os links devem:

- possuir `href` canônico;
- permitir abrir em nova aba;
- manter o clique normal como navegação interna, sem recarga completa;
- preservar teclado e tecnologias assistivas.

Onde a conversão integral exigir alteração ampla no HTML legado, deve ser criado um helper reutilizável e aplicadas as ocorrências essenciais desta entrega: Carteira, Competências, Pendências e Prontuário.

## Fluxo de acesso direto

1. A Vercel entrega `index.html` para a URL profunda.
2. `navigation-routes.js` interpreta a rota antes da aplicação dos dados.
3. O Auth Gate conclui a restauração da sessão ou o login.
4. `initializeRadarData()` carrega apenas os dados autorizados.
5. A rota pendente é validada contra as escolas visíveis ao usuário.
6. A tela é aberta e a URL é mantida.
7. Caso a escola não exista ou não esteja no escopo autorizado, o sistema exibe uma mensagem segura e substitui a rota por `/carteira`.

Nenhum dado de escola deve ser exibido antes da autorização.

## Regras de autorização e fallback

- Rotas incompatíveis com o perfil atual devem cair em `/dashboard` com mensagem informativa.
- `/gestao-sme` só pode permanecer ativa para o perfil SME ou administrador técnico em simulação SME.
- `/equipe` só pode permanecer ativa para o perfil Assistente ou administrador técnico em simulação Assistente.
- `/competencias`, `/pendencias` e `/auditoria` não podem permanecer ativas para Inventário.
- Uma escola inexistente ou fora do escopo autorizado deve resultar em fallback para `/carteira`.
- Uma URL estruturalmente inválida deve ser canonicalizada para `/dashboard` por `replaceState`, sem criar entrada adicional no histórico.

## Pendências filtradas por escola

A tela geral deve aceitar:

```text
/pendencias?escola=04.31.026
```

O filtro deve:

- restringir pendências ativas e resolvidas à unidade;
- mostrar um resumo visual do filtro aplicado;
- oferecer botão para limpar o filtro e voltar a `/pendencias`;
- manter o filtro após atualização da página;
- não preservar o filtro ao sair da tela de Pendências.

No Prontuário, a aba Pendências terá uma ação "Ver todas as pendências desta escola", apontando para a URL filtrada.

## Configuração Vercel

`vercel.json` deve incluir rewrites explícitos para as rotas aprovadas, enviando-as para `/index.html` sem interferir nos arquivos estáticos. Não será usado um wildcard global que capture todos os recursos.

Padrões necessários:

```json
{
  "source": "/dashboard",
  "destination": "/index.html"
}
```

Além das rotas estáticas, será incluído:

```json
{
  "source": "/escolas/:path*",
  "destination": "/index.html"
}
```

## Erros e estados transitórios

- A rota inicial deve ser armazenada antes do login e aplicada somente após `RadarDataContext.ready === true`.
- Não deve haver oscilação entre `/dashboard` e a rota profunda durante o bootstrap.
- A falha de parsing não deve bloquear o login.
- O redirecionamento de fallback deve usar `replaceState`.
- O botão Voltar não deve alternar entre estados inválidos ou duplicados.

## Testes obrigatórios

### Unitários

- parsing das dez rotas;
- geração das dez rotas;
- query `escola` em `/pendencias`;
- codificação e decodificação de `schoolId`;
- rejeição de segmentos extras;
- canonicalização de barra final;
- histórico sem duplicação;
- restauração por `popstate`;
- preservação da rota durante bootstrap.

### Contrato do frontend

- ordem dos scripts: `navigation-routes.js` antes de `navigation-history.js`, ambos depois de `app.js` ou com instalação diferida segura;
- presença das rewrites no `vercel.json`;
- links de escola com `href` canônico nos pontos essenciais.

### E2E

- login direto em `/escolas/:schoolId`;
- atualização da página no Prontuário;
- acesso direto à aba Pendências;
- link para `/pendencias?escola=...`;
- abrir link em nova aba;
- Voltar e Avançar entre Carteira, escola e Pendências;
- rota inválida;
- escola inexistente;
- restrição por perfil;
- desktop, Android e iPhone.

## Fora de escopo

- rotas para modais;
- rotas para uma pendência individual;
- persistência de todos os filtros da aplicação;
- migração para React Router ou outro framework;
- alteração do modelo de autorização do Supabase;
- reformulação visual das telas.

## Critério de aceite

A entrega será aceita quando todas as rotas aprovadas:

1. atualizarem a barra de endereço durante a navegação;
2. abrirem diretamente em nova aba;
3. sobreviverem à atualização da página;
4. preservarem autenticação e autorização;
5. funcionarem com Voltar e Avançar;
6. não criarem estados duplicados no histórico;
7. passarem nos testes unitários, de contrato, E2E e readiness existentes.
