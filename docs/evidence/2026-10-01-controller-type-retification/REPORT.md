# Retificação de classificação — Fase 2

**Classe:** evidência da frente autorizada em 01/10/2026; checkpoint em elaboração.  
**Baseline:** main `92ddea14de25bfe644917900cac002a20094c57c`.  
**Estado:** implementação local e regressões direcionadas confirmadas; CI/Supabase descartável e Preview ainda pendentes. Não publicado em Production.

## Contrato aprovado

Controlador/Assistente pode corrigir tipo de gasto no mesmo lançamento quando todo histórico individual for de Nota Fiscal e todas essas Pendências estiverem Resolvidas ou Canceladas. Qualquer histórico de Consulta à Assessoria impede essa mudança. Pendência ativa continua permitindo descrição, número/referência e valor.

Escola, competência, programa, identificação e histórico permanecem. Exclusão com histórico e transformação direta de `a_identificar` continuam bloqueadas. Bem já Inventariada impede conversão que o removeria. Versão e estado histórico desconhecidos falham fechados.

## Autoridade e efeitos

- A política compartilhada pertence ao InvoiceService; o editor consulta a mesma regra.
- O salvamento passa pelo InvoiceService, invoice-effects, DataService e saveInvoiceWithEffects existentes.
- A política é conferida antes do plano e novamente antes de aplicar a mutação.
- A auditoria contém tipo anterior/novo e identidade/contexto.
- As versões esperadas da NF, verificação e bem acompanham a operação atômica.
- Não há schema, migration, RPC, RLS, perfil ou segunda via de persistência novos.

O trigger existente protege o tipo com histórico de Assessoria e mantém contexto/exclusão bloqueados. A elegibilidade da retificação comum é regra da aplicação, como já era antes desta mudança. A execução descartável com Auth/RLS real ainda precisa confirmar esta entrega.

## UX

Título Editar lançamento; NF/tipo/escola/competência/programa visíveis; orientações por estado; motivo específico do bloqueio; comparação Antes/Depois; efeitos administrativos antes de salvar; confirmação acessível com cancelamento/Escape; feedback específico de atualização e valor anterior/novo.

Foi corrigida a disputa com unidentified-expense-ux, que restaurava título e botão após a montagem da edição. A apresentação da retificação fica com auditable-retification; a extensão provisória continua cuidando do cadastro e da identificação.

As primeiras capturas revelaram confirmação no canto e seletor estreito. Isso impediu aprovação visual apesar dos testes funcionais verdes. A confirmação foi centralizada e recebeu fundo opaco; o seletor passou a usar a largura completa. As capturas finais de 1440×900 foram abertas e inspecionadas.

## Provas locais até este checkpoint

- RED real: oito transições inicialmente permitidas falharam no bloqueio genérico de tipo antes da implementação.
- Novo contrato: 22 testes, incluindo seis transições entre consumo/serviço/permanente com histórico Resolvida e Cancelada e contraprovas.
- Contrato + feedback: 30/30 aprovados.
- Readiness completo local: 1.209 testes unitários e oito de integração aprovados, com demais etapas do comando concluídas. Executado antes dos últimos ajustes apenas de composição/confirmacão; o CI do candidato final deverá reaplicar os gates.
- Cinco novos E2Es de classificação/UX aprovados sem retries; sete E2Es com descobribilidade aprovados no checkpoint anterior.
- Axe na confirmação sem violações.
- Evidência de reload desta rodada local usa repositório local; não é prova de Supabase Production.

## Pendências para encerramento

1. Provar Auth/RLS, row_version, histórico, patrimônio e reload em Supabase descartável real.
2. Conferir gates do SHA final e classificar eventuais falhas auxiliares com evidência.
3. Inspecionar Preview e composição nos viewports alvo.
4. Obter aceitação da entrega concreta antes de integração/publicação desta nova fase.

Production continua no #403. Não foram criados ou editados dados reais nesta frente. NAV-01/UX-04, PROD-UX-08, exclusão e transferência/anulação auditável não fazem parte desta entrega.

