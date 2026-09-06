# Pacote de reprodução e continuidade

Este pacote acompanha a [revisão independente](../../audits/2026-09-06-pr272-inventory-auth-review.md). Não modifica runtime, Supabase, Auth ou dados institucionais. Resultados representam os SHAs abaixo, não um branch futuro.

## Checkpoints

- Main: `3135d4c66bb5020507bd54d2fe202a79884680c7`.
- #272: `32055e2bec7242433d79a41e359244de4e39692c`.
- #271: `309abfdfc3717a6b78a3d01ff2bc3e18814960a3`.
- #263 documental continua candidato; #262 abortado.
- Node local: 24.19.0. Dependências correspondentes ao package-lock; nenhuma atualização de pacote.

## O que já está concluído

Revisão source-first dos dois candidatos, confirmação das proteções terminais de Inventário, leitura dos gates e atualização de AGENTS/documentação canônica. Nenhuma nova proteção patrimonial foi implementada porque o #265 já contém as duas camadas. Nenhum defeito do #272/#271 foi corrigido nesta revisão.

## Como reproduzir

Os argumentos são diretórios de checkouts nos SHAs acima. Instalar dependências pelo lockfile (`npm ci`) conforme o ambiente. Os scripts terminam com código 0 ao reproduzir o achado esperado; isso NÃO significa que o produto passou uma regressão. A contraprova contra a main termina com código 1 esperado. Não copiar esses oráculos para CI como expectativa permanente de comportamento incorreto.

```powershell
node pr272-composition.cjs <checkout-272>
node pr272-refresh-race.cjs <checkout-272>
node pr272-red-main.cjs <checkout-272> <checkout-main>
node inventory-current.cjs <checkout-main>
node pr271-db-ack-loss.cjs <checkout-271> <checkout-com-dependencias>
```

`pr272-composition.cjs`: módulos de performance/feedback e DataService reais; prova aviso contornado, timer compartilhado e perda de classificação da segunda aplicação. Fronteiras de estado, repositório, DOM e timers controladas.

`pr272-refresh-race.cjs`: DataService/UnitOfWork reais; resposta de leitura atrasada por Promise explícita, sem sleeps; duas intenções, duas escritas, memória final divergente e ambos resultados applied.

`pr271-db-ack-loss.cjs`: transpila e executa a Edge Function real do candidato; simula convite confirmado e perda da resposta após commit. Simula os efeitos de FKs declarados nas migrations. Não faz chamadas a Auth ou Supabase reais.

`inventory-current.cjs`: reutiliza o harness de teste oficial com o serviço real; cobre Não encaminhada → Encaminhada → Encaminhada e recusa terminal sem persistência/log.

Para a composição no navegador, iniciar o servidor no checkout #272:

```powershell
node node_modules/http-server/bin/http-server . -a 127.0.0.1 -p 4177 -c-1
node <caminho-do-pacote>/pr272-browser.cjs <checkout-272>
```

Chromium/Playwright precisam estar instalados. O script só aceita runtime local/demo, bloqueia requisições externas e executa um comando sintético com persistência controlada. O bootstrap, instâncias e região visual são reais; esse teste não prova persistência remota nem é aceite visual humano.

## Resultados preservados

- `current-composition-result.json`, `current-browser-result.json`, `current-refresh-race-result.json`.
- `current-team271-result.json` e `current-inventory-result.json`.
- `current-red-main.log`: duas falhas esperadas dos testes originais do candidato contra a main.
- `current-pr-272.json`: metadados e checks no head fixado; revalidar no GitHub para estado posterior.
- `current-open-prs.json`: inventário dos PRs abertos no checkpoint.
- `terminal-catalog.json`: apenas definições de trigger/migration/versionamento consultadas no Supabase; nenhuma linha de negócio.
- `gate-excerpts.txt`: trechos dos logs remotos, incluindo pgTAP, registry e Lighthouse; URLs integrais no relatório.
- `validation.json`: comandos, contagens, resultados e limites desta revisão.

## Próxima ação para um novo chat

1. Ler AGENTS.md e CURRENT_STAGE.md, revalidando os SHAs no GitHub.
2. Consultar a revisão R272-01 a R272-05 e R271-01; não presumir aprovação por testes isolados verdes.
3. Se houver autorização para corrigir os candidatos, começar pela composição do feedback e pelo isolamento da finalização local, com regressões que invertam os oráculos dos probes. Depois tratar o resultado ambíguo do commit Auth + banco no escopo próprio.
4. Conciliar a documentação com o #263 quando ele for integrado; preservar evidências por SHA e a regra de não promover branch aberto a baseline.
5. Manter a proteção de Inventário já integrada; não criar trigger/RPC/migration duplicados.

A revisão não autoriza merge, deploy nem ensaio destrutivo de Production. O acesso a arquivos locais do Codex não é herdado por ChatGPT normal: anexar este pacote/relatório ou fornecer acesso ao PR documental que os contém.
