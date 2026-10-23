# A9 — retomada da prioridade 1: jornadas autenticadas

**Estado inicial:** protocolo de experimento, ainda sem resultado. Não altera o produto.
**Baseline:** `ea00ca5409e24158a904d2a754803f953eeed2a0`, após #479/#480/#478.
**Roteiro:** [issue #481](https://github.com/WilsonMPeixoto-2/RADARPDDE/issues/481).

## Reconciliação antes de executar

Os três PRs estão efetivamente integrados. O diff do #479 mantém a AST executável
e acrescenta a compilação delimitada ao workflow. O #480 modifica somente o teste
de captura e seu relatório: ambos os botões continuam sujeitos a interseção 1,
sem scroll individual que pudesse esconder o corte. Não certifica todo o layout.
O #478 tem cinco workflows aprovados no HEAD `36a03088`; a homologação
pré-production `39985334289` registra tentativa 2, preservando a falha inicial.
O domínio Production responde pelo deployment `dpl_6eEZuQvC4ppdevK1ehyZUStA1mR3`,
READY no SHA da baseline. Não houve sessão humana autenticada em Production.

O piloto A8, run `39990335333`, job `120540152681`, aprovou nove testes e
registrou medianas de 122,333/96,774 ms para oito consultas sintéticas em Node.
Seu controle de invalidação e a paridade são reutilizáveis; esses tempos não
autorizam cache no produto nem representam digitação de um Controlador.

## Pergunta delimitada

Lighthouse user flows, Playwright e Axe já instalados conseguem acrescentar
evidência útil à abertura/reload do Prontuário e à gravação de NF, incluindo a
convergência em outra sessão, sem criar outra autoridade de sincronização?

## Protocolo e critério de parada

1. Usar o frontend exato da baseline e Supabase local descartável com Auth/RLS,
   RPC e Realtime reais. Preparar identidades e escola sintéticas exclusivas.
   Apenas configuração pública local chega ao navegador.
2. Confirmar login, papel real e assinatura Realtime antes da janela medida.
   Navegar pelos controles existentes e preservar a competência.
3. Três amostras de navegação e criação de NF de consumo; observar requisições,
   resposta da escrita, UI do autor, UI do observador, long tasks e renders.
   Reencontrar os registros após reload e confrontar o banco autenticado.
4. Em passagem separada, usar Lighthouse timespan/snapshot no estado autenticado
   e Axe WCAG 2.2 no modal. Não misturar tempos com e sem instrumentação pesada.
5. A medição termina após a série predefinida. Falha de preparação/harness é
   registrada como tal; não modificar o produto para obter uma medição.

## Limites definidos antes da medição

- Pilha já disponível: PostgreSQL local **17.6**, 61 migrations, última
  `20261011193500`; não representa um benchmark do PostgreSQL hospedado 17.11.
- Massa pequena e sintética, localhost, Chromium headless: não estima experiência
  de Production, volume institucional nem o efeito histórico dos upgrades.
- Tempo de RPC no navegador inclui transporte/decodificação; não equivale a SQL.
- Commit no servidor, recebimento da resposta e atualização visual são fronteiras
  distintas. Métricas sobrepostas não serão somadas como parcelas exclusivas.
- O runtime do produto permanece intacto. Instrumentação pertence ao processo
  descartável do teste; não vira gate ou budget sem validação posterior.
- A9 não substitui nem encerra #446/#447/#460; orienta qual prova falta antes de
  escolher uma intervenção de desempenho.
