# Consumo da fatia escolar — checkpoint de implementação

Base inicial: `1c03ff2d58e459eb8a0a874f2292310c1c575d20`; runtime SQL certificado
em `c29b1d55888ad36eab6f4c4f3ccb1d027df8e0a8`. Esta etapa não ativa Realtime
dirigido, flag, observers ou remoção de mecanismos do #408.

## Repository

Novo `querySchoolOperationalContext` e capability explícita no adaptador
operacional existente. Uma RPC, AbortSignal, parâmetros e envelope v1 validados
no contrato compartilhado. Mantém escola, competência, históricos e cobertura.
Resultado incompleto ou fallback nunca oferece entidades aplicáveis; Repository
não abre leitura global escondida. Coleções ausentes, IDs duplicados, escola
estrangeira e filhos sem pai selecionado são rejeitados. A validação não inventa
fechamento por FK além daquele declarado/provado na SQL.

RED: cinco testes falharam por API/capability ausentes. GREEN: cinco novos e cinco
controles da leitura global passaram. Testes: `school-operational-context-query`
e `remote-operational-context-query`, via Node 24 com dependências do mesmo lock.
Não é ainda certificação CI ou jornada integrada deste novo código.

## Fronteira seguinte

StatePort deve receber a cobertura **anterior aceita** para remover identidades
que saíram dela, sem inferir DELETE a partir de uma consulta parcial. A escola não
é toda a história. Tentativas compartilham o pai no legado; contatos gerais são
independentes. Preparar todas as coleções antes de um patch síncrono, verificar
obsolescência na aplicação efetiva e usar a autoridade DataService existente.

Proposta conservadora desta etapa: registrar identidades da cobertura global/
escolar aceita e invalidar essa cobertura em intenção de escrita local. Sem uma
cobertura confiável, usar leitura global. Isso mantém segurança sem modificar
agora writers ou mecanismos do #408; o custo desse fallback precisa continuar
explícito antes de ativar a sincronização dirigida.
