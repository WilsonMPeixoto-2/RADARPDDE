# RADAR PDDE 2026 — Endurecimento final e atualização controlada

Data: 17/08/2026
Base: `main` em `82eeabd204a5f4c7b86aaa99380d03a10e35b7a5`

## Objetivo

Concluir o saneamento técnico do RADAR PDDE sem alterar as regras funcionais já aprovadas para uso real, reduzindo legado do MVP, tornando Production fail-closed, estabilizando a inicialização de Pendências, atualizando testes e dependências e reforçando segurança, desempenho e governança do repositório.

## Escopo aprovado

### 1. Remover dados legados do artefato público

- Retirar do caminho de Production os blocos `INITIAL_ESCOLAS` e `INITIAL_CONTROLADORES` com dados reais/antigos.
- Manter fixtures apenas em arquivos de teste ou desenvolvimento explicitamente isolados.
- Preservar os oito programas canônicos e demais metadados públicos necessários, sem usar dados de escolas/controladores como fallback operacional.
- Garantir que Production leia escolas, controladores e vínculos exclusivamente do Supabase.

### 2. Production fail-closed

- Em ambiente `production`, configuração Supabase inválida, ausente ou não autorizada deve bloquear a inicialização da aplicação operacional.
- Não permitir fallback silencioso para repositório local em Production.
- Exibir estado de indisponibilidade claro, sem expor detalhes de infraestrutura ao usuário.
- Preservar modo local para testes/desenvolvimento.

### 3. Pendências Operacionais

- Tornar `todas as competências` o estado inicial canônico da página, sem depender de bridge assíncrono.
- Preservar filtros explícitos trazidos por navegação contextual.
- Eliminar a corrida observada nos testes e garantir comportamento determinístico.

### 4. Atualizar testes para as regras atuais

- Corrigir seletores e expectativas antigas sem enfraquecer as regras de negócio.
- Gestão de Equipe: manter sequência transferir carteira → zerar escolas → permitir desativação/remoção.
- Reanálise: testar a interface atual.
- `A identificar`: testar o valor no controle correto.
- Normalização de IDs legados: aceitar representação canônica em string quando esse é o contrato atual.
- Adicionar testes de fail-closed e ausência de seed real no bundle Production.

### 5. Segurança de frontend e HTTP

- Reduzir usos evitáveis de `innerHTML` nos trechos tocados nesta intervenção, preferindo `textContent`/DOM seguro.
- Não aumentar artificialmente o teto de warnings de segurança.
- Adicionar headers de baixo risco no Vercel: `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` e proteção contra framing compatível com o sistema.
- Não ativar CSP rígida nesta etapa enquanto existirem handlers inline que possam quebrar a aplicação.

### 6. Desempenho

- Usar o `esbuild` já presente; não introduzir novo framework/bundler.
- Remover dados legados do `app.js`, reduzindo seu peso.
- Adiar recursos pesados não críticos, especialmente exportação Excel e módulos que só são necessários após interação específica, desde que não haja regressão funcional.
- Manter comportamento atual quando o ganho exigir refatoração ampla demais para esta entrega.

### 7. Dependências

Atualizações alvo, sempre condicionadas aos testes:

- `@supabase/supabase-js`: 2.110.9 → 2.112.3.
- `supabase`: 2.110.0 → 2.114.0 estável.
- `@playwright/test`: 1.62.0 → 1.62.1.
- `@axe-core/playwright`: 4.12.1 → 4.13.0.

Não atualizar indiscriminadamente outros pacotes nem forçar overrides transitivos sem comprovação de compatibilidade.

## Recursos de engenharia

### CodeQL

Adicionar workflow de CodeQL para JavaScript/TypeScript e GitHub Actions, com execução em PR, push da `main` e agenda periódica.

### Scripts de instalação npm

Avaliar e, se compatível com a versão do npm usada no CI, adotar allowlist explícita para scripts de instalação necessários. Não aplicar configuração experimental que possa quebrar `npm ci` sem cobertura nos runners atuais.

### Proteção da main

A proteção da `main` será configurada somente depois de os checks relevantes estarem estáveis e verdes. A política desejada é exigir PR e checks de prontidão confiáveis, evitando transformar falsos negativos em bloqueios administrativos.

## Fluxo de dados

Em Production:

1. `config.runtime.js` fornece ambiente e credenciais publicáveis.
2. `config.js` valida o ambiente.
3. Falha de configuração → estado indisponível, sem fallback local.
4. Configuração válida → autenticação Supabase obrigatória.
5. Após autenticação, serviços carregam escolas, controladores, programas, competências, análises, pendências, NFs e inventário do repositório Supabase.

Em desenvolvimento/testes:

- O repositório local e fixtures continuam disponíveis quando explicitamente selecionados pelo ambiente.

## Tratamento de erros

- Erros de configuração de Production devem ser visíveis como indisponibilidade operacional e registrados nos diagnósticos internos.
- Nenhuma mensagem ao usuário deve expor chave, URL sensível, stack trace ou implementação interna.
- Operações de banco continuam usando os mecanismos existentes de erro, RLS e transações/RPCs.

## Estratégia de testes

Antes do merge:

1. `npm ci`.
2. `npm run check`.
3. `npm run lint`.
4. `npm run test:unit`.
5. `npm run test:integration`.
6. testes direcionados das áreas alteradas.
7. `npm run test:e2e` ou suíte equivalente do CI.
8. gates Supabase, banco e Excel existentes.
9. build Vercel.
10. inspeção dos workflows GitHub Actions.

O merge só deve ocorrer se falhas remanescentes forem demonstravelmente preexistentes e não relacionadas às mudanças; para os fluxos alterados, o objetivo é zero falhas.

## Critérios de aceite

- Nenhum controlador ou escola real/antigo embutido como fallback no bundle Production.
- Production não funciona em modo local por falha de configuração.
- Pendências abre em todas as competências de forma determinística quando não há contexto explícito.
- Testes refletem as regras funcionais atuais.
- Dependências alvo atualizadas sem regressões.
- Headers de segurança aplicados sem quebrar navegação.
- CodeQL configurado.
- Build e fluxos centrais permanecem funcionais.
- Dados atuais do Supabase Production não são resetados, sobrescritos ou recriados durante esta intervenção.

## Fora de escopo

- Reescrita do frontend em framework.
- Migração integral para TypeScript.
- CSP rígida antes da remoção de handlers inline.
- Alterações de regra de negócio não relacionadas aos achados da auditoria.
- Limpeza ou recriação dos dados reais de Production.
