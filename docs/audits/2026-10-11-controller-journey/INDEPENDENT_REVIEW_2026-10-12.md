# Revisão pessoal da investigação independente — 12/10/2026

Contexto: PR438, checkpoint inicial53f2fe99, trabalho local preservado em06ab5d7f.
Fonte externa: PR441, HEAD7221811d7139c5234f59d30e559f99fca0be35d1,
produzido por OUTRO agente. Esta rodada foi conduzida somente pelo agente principal,
sem subagentes. Não é observação autenticada de Production.

## O que foi aproveitado e confrontado

Importados os dois arquivos unitários do PR441, mantendo proveniência e asserções.
Na árvore local com a correção de rota já iniciada:9/12 passaram; restaram três
REDs (página tardia e dois estados do seletor). Depois da correção:12/12 passaram.
Acrescentados controles para opção inexistente/duplicada e hidratação remota.
A hipótese de instalação tardia como explicação universal do seletor vazio foi
rejeitada: ausência de option é uma causa separada, confirmada no renderizador.
As timelines externas não foram produzidas por esta sessão. Não é preciso repetir
sua investigação integral: o teste Auth local confirmou escola autorizada sem
Pendências (ESC-OTHER), URL/rota/option coerentes e zero pageerrors. Captura inspecionada.

## Causas e correções coordenadas

1. FocusBridge lia a rota anteriormente confirmada durante aplicação da nova rota.
   Render deixa de decidir escola; comandos de filtro usam navigate existente.
2. Página instalada depois da aplicação da rota perdia o filtro. NavigationBootstrap
   reaplica seu filtro autorizado no evento já existente pendency-page-ready;
   não confia em parâmetro cru da URL nem publica rota antes de autorizar.
3. Opções escolares vinham só de registros de Pendência. Preserva opções atuais e
   acrescenta somente a escola selecionada encontrada no mesmo catálogo utilizado
   pelo modelo/política vigentes. Não inventa escola nem amplia autorização.
4. A regressão ampliada revelou contexto perdido antes de capturar o retorno:
   OperationalReadiness seleciona competência → GlobalCompetenceSelector atualiza
   via switchView → navegação registra nova rota sem filtros → retorno captura
   escola vazia. O refresh agora reaplica a rota canônica com replace:true;
   troca de competência continua hidratando primeiro pelo DataService existente.

Sem novo controller, timer, polling, dependência, regra de domínio ou mudança de
Auth/RLS nesta rodada. A migration61 pertence à proteção patrimonial anterior.

## Performance e fronteira de conclusão

Nenhuma destas provas demonstra solução da lentidão global. A medição normal
preservada em startup-navigation-comparison.json tem n=3 por fase/variante e alta
variância. Não inferir percentuais de ganho, p95 ou causalidade de Production.
startup-double-read-causal.json registra um desperdício concreto herdado:
prefetch do mês solicitado seguido de outro mês resolvido pelo catálogo local.
Isso requer caracterização com catálogo real antes de otimizar o bootstrap.

Outro risco sistêmico confirmado sob atraso11s: APIs CycleBDashboard,
CycleBCarteira, Task10Alerts e ModalAccessibility ausentes. Falta demonstrar efeitos
visíveis atuais de cada ausência. Não converter isso em correção cega de timers.

Após fechar regressões/CI da navegação, a performance pode seguir em PR separado:
mesma jornada sustentada, dados representativos, correlação gesto→RPC→parse→apply
→render→layout, distinguindo rede/SQL de trabalho síncrono e instalação. Reaproveitar
instrumentação existente antes de criar outra. A frente438 não pode ser anunciada
como solução principal da lentidão nem como auditoria A–N integralmente encerrada.

## Evidências

- evidence/independent-local-red.txt e independent-local-green.txt;
- evidence/auth-revised-navigation.txt:3/3 Auth/Supabase reais, incluindo atraso11s,
  filtros/reload e contatos/cancelar/reabrir;
- evidence/empty-school-visual.txt e task9-empty-school.png;
- evidence/navigation-focused-e2e.txt preserva a falha anterior de retorno;
- resultados finais ampliados e CI devem ser conferidos no handoff corrente.

PR441 não deve ser mergeado como segunda implementação. Seu material independente
foi incorporado seletivamente; a versão completa permanece rastreável naquele PR.
