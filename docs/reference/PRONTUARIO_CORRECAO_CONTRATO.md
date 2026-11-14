# Prontuário e correção — contrato de evolução aprovado

**Classe:** decisão de destino em implementação, leitura obrigatória temporária. **Data:** 14/11/2026.
**Autorização:** proprietário aprovou análise e plano e solicitou execução, preservação global e checkpoints remotos. Não equivale a declarar migrations/deploy concluídos.

## Fontes e precedência

- [Plano aprovado](../superpowers/plans/2026-11-14-prontuario-visual-correcao-integrada.md).
- [Flexibilização detalhada](../superpowers/specs/2026-11-14-flexibilizacao-correcao-exclusao-lancamentos.md).
- [Direção visual](../superpowers/specs/2026-11-13-prontuario-exploracao-visual.md), com regras antigas substituídas pela flexibilização.
- [Handoff único](../handoff/2026-11-14-prontuario-correcao-integrada.md), sempre confrontado com o HEAD remoto.

## Decisões aprovadas

1. Edição e exclusão operacionais não ficam impedidas só por histórico, Pendência, consolidação ou inventariação. Efeitos devem ser coordenados e autorizados.
2. Observações/justificativas são opcionais. Não exigir envio ou reanálise fictícios para corrigir erro de cadastro.
3. Limpar análise atual, excluir histórico completo de item, excluir despesa e excluir pacote mensal têm alcances distintos. Usar IDs e dependência comprovada, nunca semelhança de texto.
4. Excluir despesa remove seus dependentes corretos e bem exclusivo. Contatos gerais, NF vizinha e dimensões independentes permanecem.
5. Escola/mês/programa continuam identidade; erro de contexto é resolvido inicialmente por exclusão e novo cadastro, não transferência implícita.
6. ADR-055/056 permanecem: operações fiscais não reabrem bonificação; equipe colabora sem bloqueio por carteira/autor. Corrigir a própria bonificação pode reabrir seu resultado.
7. `a_identificar` e provisória Qualidade continuam entidades/fluxos distintos. A inversão da identificação deve tratar a origem explicitamente.
8. Matriz por programa, contexto persistente e formulários refinados evoluem junto às regras; nenhuma função é retirada para simplificar o desenho.
9. Autorização, atomicidade, versões, idempotência e convergência permanecem obrigatórias; novo comando não é DELETE irrestrito.

## Estado de aplicação

Baseline de produto `190e4494`: regras novas ainda não implementadas. Os 45 testes da análise e os 28 testes de início de execução descrevem o contrato antigo. Somente marcar uma capacidade como implementada após código/SQL e prova real correspondente; marcar publicada após integração e verificação de ambiente. O handoff registra o progresso, evitando múltiplos contadores divergentes.
