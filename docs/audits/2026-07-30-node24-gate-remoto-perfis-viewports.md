# Auditoria — Node 24 e gate remoto por perfil e viewport

**Data:** 30 de julho de 2026  
**Escopo:** hardening operacional anterior ao release  
**PR de implementação:** #111

## 1. Objetivo

Esta auditoria registra as evidências da:

1. verificação de compatibilidade e fixação deliberada da major operacional do Node.js;
2. implantação do gate remoto por papel institucional e viewport;
3. correção do conflito móvel entre o seletor de perfil técnico e o botão de encerramento da sessão.

## 2. Compatibilidade e fixação do Node

Antes da mudança, o projeto aceitava a faixa aberta:

```text
>=24 <27
```

A análise encontrou uma baseline consistente em Node 24:

- Vercel configurada com `nodeVersion: 24.x`;
- workflows do GitHub Actions já executados em Node 24;
- dependências e lockfile compatíveis;
- readiness, Supabase local, Playwright e Lighthouse historicamente verdes nessa major;
- nenhuma referência ativa a Node 20, 22 ou 26 nos workflows com `actions/setup-node`.

A solução não promoveu o projeto para uma major nova. Ela consolidou como contrato explícito a major já utilizada e validada.

Contratos permanentes:

```text
package.json        engines.node = 24.x
package-lock.json   packages[""].engines.node = 24.x
.nvmrc              24
.node-version       24
GitHub Actions      node-version: 24
Vercel              nodeVersion: 24.x
```

O teste `tests/unit/release-hardening-contract.test.js` impede reabertura acidental da faixa e divergência dos workflows.

## 3. Gate remoto permanente

Workflow canônico:

```text
.github/workflows/gate-remoto-perfis-viewports.yml
```

O gate é executado em runner remoto do GitHub Actions e não depende de segredo de Production. Em cada execução aplicável, ele:

1. instala Node 24 e dependências reproduzíveis;
2. instala Chromium e WebKit;
3. inicia um Supabase descartável no runner;
4. aplica do zero as 25 migrations versionadas;
5. cria identidades Auth efêmeras com senha aleatória;
6. valida os contratos de autenticação e RLS no desktop;
7. serve o código do próprio PR em `127.0.0.1`;
8. executa a matriz de papéis e viewports;
9. publica evidências Playwright;
10. restaura a configuração e destrói o ambiente descartável.

O desenho evita:

- uso de Production para testes destrutivos;
- segredos administrativos persistentes no workflow;
- dependência de deployment antigo para validar código novo;
- repetição dos cenários mutáveis em cada viewport.

## 4. Matriz coberta

Papéis institucionais:

- Administrador técnico;
- Assistente de Verbas Federais;
- Controlador;
- Equipe de Inventário;
- Gestão SME.

Viewports:

- Desktop Chrome;
- Android — Pixel 7 / Chromium;
- iPhone 15 / WebKit.

A suíte responsiva possui 15 cenários de papel × viewport e verifica:

- autenticação;
- papel autorizado;
- repositório Supabase ativo;
- ausência de sessão no contexto público;
- visibilidade do seletor técnico apenas quando autorizada;
- ausência de overflow horizontal relevante;
- navegação pelas superfícies disponíveis;
- preservação da sessão após recarga;
- encerramento da sessão.

Os testes Auth/RLS de escrita permanecem em uma execução desktop separada para evitar colisões e duplicidade de efeitos.

## 5. Desenvolvimento orientado por regressão

O primeiro commit do PR continha somente o teste de contrato. Ele reprovou corretamente porque:

- `engines.node` ainda aceitava `>=24 <27`;
- `.nvmrc` e `.node-version` não existiam;
- o gate anterior não cobria o código do PR em três viewports.

Durante a implementação, o novo gate detectou dois problemas adicionais:

### 5.1 Validação do workflow

O GitHub recusou inicialmente o workflow porque `runner.temp` foi utilizado em contexto global, onde o objeto `runner` ainda não existe. O diagnóstico foi confirmado com `actionlint` e corrigido pela definição do caminho dentro de uma etapa já associada ao runner.

### 5.2 Sobreposição real no cabeçalho móvel

Em telas de até 520 px, `.auth-logout-button` e `.profile-switcher` compartilhavam `grid-area: session`. Para o Administrador técnico, ambos ficavam visíveis e o seletor interceptava o toque no botão **Sair**.

A correção criou áreas distintas:

```text
exercise | theme | alerts | session | profile
```

O teste de contrato protege essa separação, e a matriz comprovou logout funcional em Android e iPhone.

## 6. Evidência automatizada principal

Execução que aprovou integralmente a implementação antes da consolidação documental:

```text
GitHub Actions run: 30516532485
Job: Perfis × Desktop, Android e iPhone
Conclusão: success
```

Etapas aprovadas:

- Node 24;
- dependências;
- Chromium e WebKit;
- Supabase descartável;
- 25 migrations;
- identidades efêmeras;
- autenticação;
- contratos Auth/RLS;
- matriz de cinco papéis em três viewports;
- publicação das evidências;
- limpeza integral do ambiente.

## 7. Limites

O gate automatizado:

- não substitui UAT humano;
- não substitui homologação manual no Microsoft Excel desktop;
- não testa recuperação real de backup;
- não habilita a proteção contra senhas vazadas no Supabase Auth;
- não constitui decisão formal de release.

## 8. Conclusão

Os dois bloqueadores tratados neste ciclo foram superados:

- major operacional do Node fixada em `24.x`;
- gate remoto por papel institucional e viewport implementado.

A implementação também eliminou um defeito móvel real que impedia o Administrador técnico de encerrar a sessão em viewports estreitos. O runtime, o schema e os dados de Production não foram alterados por este ciclo.
