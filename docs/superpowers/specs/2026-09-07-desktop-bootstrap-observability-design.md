# Design final — bootstrap, readiness e pós-login desktop

**Data:** 2026-09-07  
**Base inicial:** `b37df653676a0aa10dc286aad33e69ff13cccbf5`  
**Escopo:** desktop; correção estrutural mínima guiada por evidência autenticada.

## Problema confirmado

A investigação mostrou que a demora e a fragilidade do pós-login não pertenciam a um único componente. O frontend combinava carregadores estáticos e dinâmicos, instaladores que sondavam dependências por `setInterval`, mais de uma autoridade para carregar `navigation-history.js` e um bootstrap remoto que aguardava também `administrativeLogs` antes de liberar o Dashboard.

O risco principal não era apenas tempo. A instalação de partes do frontend dependia de coincidência temporal: um módulo tentava repetidamente descobrir se outro já existia. Isso funcionava na maioria das execuções, mas tornava a ordem implícita e mais difícil de verificar.

## Contrato adotado

A correção preserva as autoridades já vigentes e adiciona um coordenador único de prontidão, `RadarApplicationReadiness`, sem criar um novo dono de regras de negócio.

O coordenador representa capacidades, não componentes visuais. As capacidades centrais são:

- `authentication`;
- `data`;
- `application-services`;
- `ui-runtime`;
- `competence`;
- `navigation`.

Capacidades restritas de uma superfície podem depender delas sem bloquear toda a aplicação. `audit-data`, por exemplo, depende de `data`, mas não pertence ao conjunto necessário para liberar o Dashboard.

As autoridades permanecem separadas:

- autenticação: `SessionService` / `auth-bootstrap`;
- dados: `DataService` / repositório / `StatePort`;
- competência: `RadarCompetenceContext`;
- navegação: módulos canônicos de navegação;
- extensões de produto: `RadarProductExtensionsReady` e seu bootstrap sequencial;
- prontidão: `RadarApplicationReadiness`, que apenas registra/aguarda estados.

## Correções executadas

### 1. Readiness determinístico

Foram removidos do caminho normal os pollings de prontidão que aguardavam autenticação/dados, competência, navegação, ponte operacional e instaladores finais do Prontuário.

Os componentes agora tentam instalar imediatamente quando já possuem dependências e, quando necessário, aguardam um evento ou capacidade determinística. Não há timeout usado como substituto de contrato de instalação no caminho corrigido.

### 2. Autoridade única de navegação

`painel-controlador-expressiva.js` deixou de carregar `navigation-history.js`. A navegação passa pela cadeia canônica do `auth-gate`, eliminando a segunda autoridade de carregamento detectada na auditoria.

### 3. Pós-login sem esperar histórico administrativo

`administrativeLogs` saiu de `REMOTE_BOOTSTRAP_ENTITIES`. O Dashboard não precisa do histórico interno para funcionar e, portanto, não deve aguardar essa leitura.

A hidratação tardia foi limitada explicitamente a entidades que possuem aplicação incremental segura. Nesta mudança, apenas `administrativeLogs` foi autorizado. Tentativas de hidratar arbitrariamente entidades como `schools` são rejeitadas.

A hidratação usa a mesma fila serial das escritas remotas para impedir que uma leitura atrasada sobrescreva um log recém-gravado.

### 4. Registros Internos com dependência explícita

`audit-data-gate.js` controla somente a superfície Registros Internos. Enquanto os logs não estiverem disponíveis, a tela mostra estado de carregamento. Em falha, mostra indisponibilidade e permite nova tentativa. O restante da aplicação continua utilizável.

Isso evita o extremo oposto: nenhum dado necessário a uma tela é simplesmente omitido para acelerar o login.

## Regra para carregamento tardio de dados

Nenhuma entidade pode ser retirada do bootstrap inicial apenas por parecer pesada ou pouco usada. Antes de qualquer nova postergação são obrigatórios:

1. consumidor/superfície identificados;
2. prova de que a entidade não é necessária antes daquela superfície;
3. aplicação incremental segura no `StatePort`;
4. estado de loading/falha da superfície dependente;
5. regressão autenticada.

Essa regra preserva o funcionamento completo das páginas e impede otimização por exclusão acidental de dependências.

## Evidência de execução

O gate autenticado desktop usa Chromium com Supabase real descartável e separa medição de tempo de coverage.

Na execução final da branch:

- mediana de login enviado até Dashboard utilizável: **492,1 ms** em três execuções no ambiente local descartável com Supabase real;
- `auth-resolved`: mediana 330,3 ms;
- `application-services-ready`: 418,1 ms;
- competência: aproximadamente 428–492 ms conforme o marco observado;
- `product-extensions-ready`: 445,9 ms;
- Dashboard utilizável: 492,1 ms;
- 23 combinações perfil/superfície percorridas no mapa de carga;
- nenhum polling de readiness de 10/20/25/50 ms permaneceu em execução;
- foi observado um único intervalo de 30 s, compatível com o `autoRefreshToken` deliberadamente ativado pelo cliente Supabase Auth e não usado como contrato de readiness.

Esses números são diagnóstico controlado do ambiente local autenticado, não telemetria de campo de Production.

## Critérios de segurança

- nenhum payload, credencial, e-mail, escola, NF ou identificador de fixture é publicado no artefato;
- coverage não autoriza sozinho remoção ou postergação;
- módulos críticos continuam fail-closed;
- falha de dados de Auditoria restringe somente Auditoria;
- nenhuma migration foi necessária;
- regras de bonificação, Pendências, NF, inventário e perfis não foram redefinidas por esta frente.

## Critério de conclusão

A frente está pronta para encerramento quando a branch final passar pelos testes unitários/integrados, E2E, perfis/viewports, Supabase real, CodeQL, Lighthouse, observabilidade autenticada e homologação pré-Production; depois disso deve ser integrada e verificada em Production pelo SHA efetivamente servido.
