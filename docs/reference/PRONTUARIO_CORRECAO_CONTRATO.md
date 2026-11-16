# Prontuário e correção — contrato de evolução aprovado

**Classe:** decisão de destino em implementação, leitura obrigatória temporária. **Data:** 14/11/2026.
**Autorização:** proprietário aprovou análise e plano e solicitou execução, preservação global e checkpoints remotos. Não equivale a declarar migrations/deploy concluídos.

## Fontes e precedência

- [Plano aprovado](../superpowers/plans/2026-11-14-prontuario-visual-correcao-integrada.md).
- [Flexibilização detalhada](../superpowers/specs/2026-11-14-flexibilizacao-correcao-exclusao-lancamentos.md).
- [Direção visual](../superpowers/specs/2026-11-13-prontuario-exploracao-visual.md), com regras antigas substituídas pela flexibilização.
- [Checkpoint de integração atual](../handoff/2026-11-15-prontuario-integracao-verificada.md), obrigatório para retomar sem repetir trabalho.
- [Handoff original](../handoff/2026-11-14-prontuario-correcao-integrada.md), histórico das decisões iniciais.

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

## Diretriz transversal — correção assistida sem bloqueios desnecessários (15/11/2026)

**Intenção do usuário como ponto de partida.** Em toda alteração, identificar o resultado que o operador pretende atingir e o fundamento da restrição atual. Não copiar automaticamente proibições antigas para comandos novos. **Preferir edição direta e segura**, com recomposição transacional das consequências reais e atualização das superfícies relacionadas. A responsabilidade pela exatidão do conteúdo declarado é do usuário autorizado; a aplicação continua responsável por autorizações, integridade, coerência, persistência e apresentação fiel dos estados.

**Ordem de solução, aplicável a todos os domínios, não apenas aos exemplos:**
1. **Correção direta:** autorizar edição/exclusão quando a aplicação conseguir recompor todos os vínculos pertinentes com segurança, sem exigir justificativa, envio ou reanálise fictícios.
2. **Correção com próximo passo visível:** quando o ato for permitido, mas demandar posterior fechamento, recálculo, publicação de resultado ou outra providência, gravar a mudança e mostrar o estado **pendente** e um botão contextual para a etapa necessária. Não deixar resultados derivados com aparência de definitivos quando se tornaram desatualizados.
3. **Procedimento orientado:** se a dependência não permitir uma operação atômica segura, informar em linguagem natural a razão específica e oferecer ação ou navegação direta para resolver primeiro a dependência, retornando à intenção original depois. Evitar bloqueio genérico sem caminho de saída.
4. **Restrição excepcional:** bloquear apenas diante de risco concreto de perda/inconsistência, ambiguidade irredutível, impossibilidade técnica, ação externa não controlável ou ausência de autorização; indicar o motivo e o próximo passo possível. Não retirar controles de segurança/RLS nem exigir ação manual quando o próprio sistema pode resolver a dependência de forma comprovada.

**Exemplo de desenho de T4 — bonificação após consolidação:** permitir que o operador com capacidade de correção altere marcações consolidadas sem justificativa obrigatória. A mudança permanece registrada; enquanto o resultado consolidado não corresponder aos dados atuais, indicar **“Alterações pendentes de consolidação”** e oferecer **“Consolidar alterações”** no contexto de escola/competência/programa. A consolidação posterior reutiliza a autoridade existente e suas validações materiais; não gerar resultado consolidado incompleto nem perpetuar indicador antigo como atual. Distinguir o resultado histórico anterior da situação vigente e assegurar que novas exportações representem os dados consolidados atualizados. **Arquivo XLSX já baixado não é regravado remotamente**: permitir nova exportação após reconsolidar; sinalizar o estado pendente em consultas/exportação quando pertinente. Validar o modo exato de representar o resultado anterior e a elegibilidade para exportação por código/testes/experiência navegada, sem inventar uma planilha persistente no servidor.

**Exemplo de dependência patrimonial:** preferir exclusão composta autorizada de NF e bem exclusivo quando a operação for íntegra. Se não for possível tratar um caso com segurança, orientar a corrigir/excluir primeiro o registro patrimonial pelo caminho específico, em vez de impedir indefinidamente a correção fiscal. Isso **não** autoriza baixa automática no sistema patrimonial externo.

**Critérios UX obrigatórios:** explicar **o que impediu**, **por que** e **como avançar**, com botão de ação claro no contexto; evitar pop-ups desnecessários em fluxos que podem ser concluídos normalmente; manter confirmação explícita de ações destrutivas com alcance previamente mostrado. O proprietário deve experimentar os casos relevantes no frontend local com Docker antes do fechamento da jornada. Este contrato define direção, não implementação já existente.

## Estado de aplicação

Baseline de produto `190e4494`: regras novas ainda não implementadas. Os 45 testes da análise e os 28 testes de início de execução descrevem o contrato antigo. Somente marcar uma capacidade como implementada após código/SQL e prova real correspondente; marcar publicada após integração e verificação de ambiente. O handoff registra o progresso, evitando múltiplos contadores divergentes.
