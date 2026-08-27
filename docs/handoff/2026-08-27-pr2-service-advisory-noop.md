# RADAR PDDE — Encerramento operacional do PR2 / PR #206

**Atualizado em:** 27 de agosto de 2026

**Classe documental:** Evidência publicada — encerramento operacional do PR2

**PR:** #206 — `refactor: canonizar Consulta Assessoria e no-op de invoice`

## 1. Resultado

PR2 foi integrado à `main` e publicado em Production.

- head funcional auditado do PR: `a5029b3665bc4fd37d507e5d79ee6740964dbe00`;
- merge commit: `2ec822820dd6e3d7415edf7de9c7913562b0981f`;
- Vercel Production: `dpl_41bzBJnL9baQX7N8sJe8mpY1ZD7H`;
- estado Vercel: `READY`;
- Supabase Production: `ACTIVE_HEALTHY`;
- nenhuma migration, backfill ou reparo de dados.

## 2. Autoridade canônica de Consulta Assessoria

`src/domain/service-advisory.js` passou a ser a única autoridade da matriz:

- zero NF de serviço → `Não se aplica / false / Correto`;
- alguma consulta não enviada → `Não`;
- todas enviadas → `Sim`;
- precedência: `Incorreto > Não analisado > Correto (Atrasado) > Correto`;
- `Correto após o prazo` normaliza para `Correto (Atrasado)`;
- `a_identificar` não participa.

InvoiceService, VerificationService, UI e integrações deixaram de manter matriz concorrente.

## 3. Planner e no-op

`src/domain/invoice-effects.js` planeja inclusão, edição e remoção de Nota Fiscal, incluindo:

- efeitos patrimoniais;
- recomposição da Assessoria;
- reabertura de consolidação;
- warnings;
- entidades afetadas;
- auditoria semântica.

No-op real:

- NF semanticamente idêntica + derivados canônicos → retorno antes de `DataService.execute()`;
- zero RPC;
- zero log;
- zero reabertura;
- `unchanged=true`.

Estado derivado incoerente não é no-op: o plano corrige e persiste.

Inclusão nova de conteúdo igual continua permitida.

## 4. Remoção e patrimônio

A remoção usa o mesmo planner.

- remoção da última NF de serviço reconverge Assessoria para `Não se aplica / false / Correto`;
- permanente → serviço/consumo preserva o contrato de integridade patrimonial.

A auditoria em Supabase Production confirmou:

- RPC valida `row_version` da NF e do bem;
- trigger `registered_invoices_delete_unlinked_asset` remove o bem quando `linked_asset_id` é retirado;
- a RPC confirma a remoção e aborta com conflito caso o bem permaneça.

## 5. Portas laterais eliminadas

Foram bloqueadas as rotas genéricas que podiam escrever derivados de Assessoria fora da NF individual:

- `setBonification(consEnviada)`;
- `setBonification(consAssessoria)`;
- `setTechnicalAnalysis(consAssessoria)`;
- `PendencyService.open(consAssessoria)` sem identidade da NF;
- retificação genérica de `consAssessoria`;
- retificação genérica de `consEnviada`.

A compatibilidade legada `toggleConsEnviada()` só delega quando existe exatamente uma NF de serviço.

O modal de retificação usa derivados apenas como contexto de cálculo e não os expõe como controles editáveis.

## 6. Reabertura e auditoria

Callbacks laterais de reabertura foram removidos do fluxo de Invoice.

Mudanças reais por Assistente:

- limpam `resultadoBonif` dentro da mesma unidade de trabalho;
- produzem um único log semântico.

Também foi corrigido o fluxo atômico de Pendência da Assessoria para impedir log de reabertura apenas em memória.

## 7. Integração

Dois escapes literais `\\n` em `index.html` foram substituídos por quebras de linha reais entre os scripts dos novos domínios.

## 8. Evidências do head final

- domínio: 139 aprovados, 0 falhas;
- integração: 7 aprovados, 0 falhas;
- unitários: 761 aprovados, 0 falhas;
- Playwright completo: 152 aprovados, 39 ignorados, 0 falhas;
- CodeQL: aprovado;
- Supabase readiness: aprovado;
- snapshot canônico: aprovado;
- perfis e viewports: aprovado;
- Excel SME: aprovado;
- homologação integral pré-production: aprovada;
- Preview Vercel do head funcional: `dpl_3ULiXBgdKCF5sU4VqYN6oBA5L6kb`, `READY`.

## 9. Lighthouse

O workflow Lighthouse dedicado apresentou somente a exceção mobile:

- mobile LCP: 15,23 s;
- teto: 15,00 s;
- desktop LCP: 3,44 s.

A homologação integral passou no mesmo SHA, incluindo seu próprio gate Lighthouse.

A diferença mobile foi classificada como variação marginal conhecida e não bloqueante para esta entrega. Nenhum threshold foi alterado e não houve rerun oportunístico.

## 10. Smoke autenticado em Production

Smoke autenticado executado após publicação, sem persistir dados.

### No-op de NF real

Foi escolhida uma NF existente e não consolidada cujo planner devolveu `unchanged=true`.

`DataService.execute()` foi substituído temporariamente, somente na sessão do navegador, por um contador que falharia se fosse alcançado.

Resultado:

- `InvoiceService.save()` retornou `unchanged=true`;
- `executeCalls=0`;
- `auditLog=null`;
- nenhuma RPC ou escrita remota ocorreu.

### Portas agregadas

Também foram testadas diretamente em Production, com DataService instrumentado apenas na sessão:

- `setBonification(consAssessoria)` → `DOCUMENT_NOT_APPLICABLE`;
- `setTechnicalAnalysis(consAssessoria)` → `DOCUMENT_NOT_APPLICABLE`;
- `PendencyService.open(consAssessoria)` genérico → `DOCUMENT_NOT_APPLICABLE`;
- chamadas de persistência observadas: zero.

## 11. Estado operacional

- Production deployment: `dpl_41bzBJnL9baQX7N8sJe8mpY1ZD7H`, `READY`;
- Production commit: `2ec822820dd6e3d7415edf7de9c7913562b0981f`;
- erros de runtime no período de validação: nenhum;
- Supabase Production permaneceu saudável;
- migration mais recente continua `20260823050000 delete_invoice_bonus_result_clear_semantics`.

## 12. Próxima entrega

PR2 está encerrado.

A próxima frente obrigatória é **PR3.1 — Registry e loader**, primeira unidade do programa de readiness sistêmico.

PR3.1 não deve migrar oportunisticamente todos os instaladores. Seu objetivo é introduzir o registry, separar transporte de instalação e provar isolamento de falhas, mantendo consumidores antigos compatíveis.
