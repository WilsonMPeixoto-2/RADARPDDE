# D022 — inteligência operacional, documentos reais e desempenho

**Origem:** instrução do proprietário na conversa do projeto em 25/11/2026, durante a implementação do PR #565. Não há permalink verificável da conversa neste repositório. Este documento preserva a formulação e seu alcance.

> Inteligência operacional: transformação dos dados existentes em funcionalidades gerenciais efetivamente disponíveis na interface.
> Automação contextual: sugestões de próximas ações conforme a situação de cada escola.
> Integração documental: experimentação autorizada com uma pequena amostra real de documentos, em vez de trabalhar exclusivamente com dados sintéticos.
> Desempenho: identificação quantitativa dos gargalos atuais do sistema e implementação de otimizações comprováveis. Inclua mais atenção a estes quesitos e continue.

## Consequências para a entrega em andamento

1. **Inteligência operacional:** implementar nas superfícies existentes do Dashboard e Prontuário orientações derivadas dos registros carregados, com universo, contexto e navegação para os itens que compõem cada indicação. Um estudo ou total sem acesso operacional não encerra esta obrigação.
2. **Automação contextual:** explicar o motivo e o próximo passo conforme o estado real da escola. Reutilizar autoridades de competência, análise individual, Pendências e capacidades. Preservar a distinção entre espera da etapa e antiguidade histórica; não inventar prazo institucional, obrigação documental, avaliação fiscal ou ranking de pessoas.
3. **Integração documental:** executar pequena experiência com documentos reais acessíveis e comparar sua identidade, período e campos com o cadastro existente em modo somente leitura. Conservar página/âncora, hash e limites da extração. As fontes e resultados identificáveis ficam em entrega privada; somente código reutilizável, método e fixtures sintéticas entram no repositório público. A autorização de experimentar não é autorização de criar bens, lançar despesas, resolver Pendências ou aplicar decisões administrativas automaticamente.
4. **Desempenho:** medir uma linha de base, identificar causa, implementar e comparar o mesmo trabalho, incluindo equivalência de resultado e limites do ensaio. CPU sintética em Node não é latência de Production, rede ou navegador.

## Relação com T5 e com as publicações anteriores

Esta prioridade amplia o incremento em execução, preservando o histórico granular e as decisões D002, D007, D011, D020 e D021. A POC documental sintética publicada no #564 continua identificada como demonstração; o novo piloto real não altera retroativamente o significado de seus testes.

A autorização já executada para publicar o #564 não se transforma em ativação automática da migration 69 e da T5. O PR #565 reúne a candidata e suas provas; a publicação conserva seu ato próprio. Nenhuma rotina de auditoria documental em curso deve ser interrompida ou ter seus registros usados como massa de testes de mutação.
