# ADR-051 — adiamento deliberado do hardening de escrita direta em registered_invoices

**Status:** Aprovada — implementação deliberadamente adiada  
**Data:** 30 de agosto de 2026  
**Escopo:** sequência entre correções funcionais e hardening de segurança/integridade  
**Relaciona-se a:** ADR-050, plano histórico pós-PR #200 e plano source-first de 03/09

## Contexto

Após a publicação do PR #211, uma auditoria independente revalidou código, RPCs, RLS, triggers e dados atuais de Production.

O caminho normal do RADAR está coerente com o contrato do hotfix: análise e Pendência usam `registered_invoice_id`, as operações críticas são atômicas, reanálise valida tentativa/contexto/versão e o serviço bloqueia alterações comuns incompatíveis com Pendência ativa.

A mesma auditoria identificou uma lacuna residual no limite do banco. A tabela `registered_invoices` ainda admite, para um cliente autenticado que já possua permissão de escrita da escola, tentativa de atualização direta de campos que deveriam receber proteção estrutural adicional no próprio PostgreSQL:

- `id`;
- `verification_id`;
- `source_context_key`.

O trigger histórico de proteção não cobre isoladamente esses três campos. A inspeção dos dados de Production não encontrou divergência atual de contexto, vínculo ou identidade causada por essa lacuna.

## Decisão

O responsável pelo produto decidiu **adiar conscientemente a implementação desse hardening** até que **todas as implementações previstas nos planos de correção de funcionalidades estejam completamente concluídas e validadas**.

Consequências imediatas:

1. o tema não reabre o PR #211;
2. não é gate para a reconciliação documental pós-hotfix;
3. não bloqueia R1–R9 do plano funcional source-first;
4. não deve ser antecipado por executor futuro sem nova decisão explícita;
5. não pode ser classificado como resolvido: o estado correto é **risco conhecido, aceito temporariamente e adiado**.

A razão da sequência é evitar misturar uma frente nova de hardening estrutural com a conclusão das correções funcionais ainda em andamento, preservando foco, rastreabilidade e capacidade de atribuir regressões à mudança correta.

## Gatilho de retomada

A frente somente volta a ser executável depois do fechamento e rebaseline de **R9** do plano source-first, quando R1–R8 estiverem concluídos ou formalmente encerrados como no-op por ausência comprovada de dívida.

Nesse momento, abrir trabalho específico de segurança/integridade para, no mínimo:

- tornar `registered_invoices.id` imutável após criação;
- validar no banco que `verification_id` pertence ao mesmo contexto de escola + competência + programa da NF;
- proteger ou canonicalizar `source_context_key`;
- ampliar a proteção estrutural para cobrir atualizações isoladas desses campos;
- adicionar testes negativos pgTAP de escrita direta, coluna a coluna;
- inventariar caminhos legítimos de escrita antes de qualquer eventual redução de grants;
- revalidar histórico, Pendências, patrimônio, Consulta Assessoria e fluxos de NF após a mudança.

## Risco aceito temporariamente

O risco conhecido é de **integridade por contorno direto da camada de aplicação**, não de defeito comprovado no uso normal do RADAR.

Não há evidência atual de corrupção em Production. A aceitação temporária não transforma a lacuna em comportamento permitido e não elimina a obrigação de retomá-la após o gatilho acima.

## Regra para futuras sessões

Enquanto R1–R9 do plano source-first não estiverem integralmente concluídos:

- não abrir migration para esse hardening;
- não transformar o tema em gate oculto;
- não revogar grants de forma oportunista;
- não alterar o fluxo funcional do PR #211 para compensar essa lacuna;
- preservar este registro e reavaliar apenas se surgir exploração concreta, corrupção real ou nova decisão explícita do responsável pelo produto.
