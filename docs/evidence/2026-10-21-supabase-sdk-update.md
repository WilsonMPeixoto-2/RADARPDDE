# Supabase JS 2.118.0 — atualização coordenada, 21/10/2026

**Classe:** evidência datada / continuidade. Candidato do PR #457, não publicação.
**Base:** `main@d1f1dad60778c1b8f67bb660e8ad06736b9ab219`.

## Escopo e motivo

Aproveitado o PR Dependabot #457, antes limitado a package.json/package-lock.json.
Reconciliada a branch com a main atual e alinhados os três consumidores:

1. Pacote e dependências @supabase/* em 2.118.0, exatamente fixados no lockfile.
2. `vendor/supabase-client.js`, produzido pelo builder canônico e esbuild 0.28.2.
3. Import npm da Edge Function `team-account-management` em 2.118.0.

Nenhuma mudança de lógica da Edge Function, serviços, handlers, políticas de
retry, migrations, RLS, grants ou dados. CLI 2.114.0, Playwright 1.64.0, Axe
4.13.0, Node 24, Ubuntu 26.04 e demais pacotes preservados nesta branch.
Não incorporar #444/#461/#462 como parte desta atualização.

O [release oficial](https://github.com/supabase/supabase-js/releases/tag/v2.118.0)
registra tratamento de campos computados/overloads sem argumentos no PostgREST
typegen e content-encoding em uploads Storage. As correções Next/sharp da CI do
upstream não demonstram uma vulnerabilidade equivalente no RADAR. Esta entrega
não é uma otimização comprovada de fluidez ou correção da issue #460.

## RED e classificação

Instalação limpa `npm ci --no-audit --no-fund`, Node 24.19.0/npm 11.9.0.

- Candidato original, três arquivos de teste dirigidos: **18/21 aprovados,
  três falhas**. Duas exigiam literalmente 2.117.3 no pacote; uma identificava
  corretamente que a Edge Function ainda importava a versão anterior.
  As duas classes não representam o mesmo problema.
- Reconciliados os literais de versão e o import, o teste de coerência continuou
  **RED** porque o bundle ainda declarava 2.117.3. Isso demonstra que atualizar
  o contrato não faz passar uma distribuição incompleta.
- Bundle regenerado pelo comando vigente, sem alterações manuais: **21/21
  aprovados**, zero ignorados. Os dois testes de retry mantiveram integralmente
  suas asserções; apenas o nome passou a identificar a versão realmente usada.

## Evidência local após a correção

- Unitários completos em JUnit: **1.368 aprovados / 0 falhas / 0 ignorados**, exit 0.
- Integração: **8/8**, incluindo travessia do SupabaseRepository, paginação,
  reconciliação e detecção de conflito sem sobrescrita.
- `test:network-failures`: **4/4** (subconjunto dos unitários, não somar como
  cobertura distinta): 500, timeout, conflito e retorno autoritativo incompleto.
- SDK real com fetch controlado: GET PostgREST recebe 503 seguido de sucesso e
  executa duas tentativas; POST com 503 executa exatamente uma tentativa.
- `npm run check`, `npm run typecheck:database` e `npm run check:generated` aprovados.
- `npm audit --omit=dev --json --ignore-scripts`: exit 0, zero vulnerabilidades
  reportadas. Não equivale a afirmar que toda a árvore de desenvolvimento está
  livre do advisory histórico de braces/Stylelint.
- Duas gerações do bundle produziram bytes idênticos:
  SHA-256 `33b09b0db467df88254207a45a76fa6ab293ab1539f76c63683a78d75a7a86eb`.
  Tamanho: **265.225 → 265.570 bytes** (+345 bytes). Isso mede tamanho do arquivo,
  não latência de rede, CPU ou desempenho do usuário.

### Ressalva de whitespace do arquivo gerado

`git diff --check` integral sinaliza a linha 13 do bundle minificado. A linha
termina dentro do literal de whitespace do codec Base64, com espaço e tab antes
de newline. Consulta binária à main e ao candidato confirmou o **mesmo sufixo e
o mesmo literal** nas duas versões. Não remover whitespace de uma string nem
modificar builder/gates para ocultar o aviso. A checagem dos demais arquivos
(`git diff --check -- . ':!vendor/supabase-client.js'`) passa; a reprodução exata
do bundle e o literal preservado são a evidência apropriada para este arquivo.

## Prova ainda necessária no HEAD remoto

O código é candidato, não liberação: aguardar e inspecionar CI de instalação
limpa, geração reproduzível, tipos, Supabase/Auth/RLS/pgTAP, Edge Function,
convergência Realtime, fluxos funcionais, E2E e gates aplicáveis. Os unitários
locais não substituem essas fronteiras. Falhas conhecidas de geometria/prontidão
devem ser classificadas com os logs e a #460, sem afrouxar asserções.

A Edge Function hospedada não é automaticamente atualizada pela mudança no Git.
Antes de eventual publicação, definir e verificar explicitamente sua implantação,
preflight e identidade de versão. Este checkpoint não executa deployment de Edge
Function nem qualquer escrita/configuração em Production.

Manter o PR separado e em Draft enquanto a prova remota estiver pendente. Registrar
runs e conclusão posterior na descrição do PR, sem repetir suites completas por
alteração exclusivamente documental. CLI e manutenção PostgreSQL têm decisões e
ciclos próprios; não usar este SDK como justificativa para avançá-los.
