# ADR-038 — atualizações devem produzir integração pertinente

**Estado:** aceito  
**Data:** 1º de agosto de 2026

## Contexto

Atualizar uma biblioteca, ferramenta ou GitHub Action apenas para alterar o número da versão pode aumentar custo, risco e volume de manutenção sem produzir benefício concreto. Por outro lado, forçar artificialmente o uso de todo recurso novo também cria complexidade desnecessária.

O RADAR PDDE precisa manter seus componentes atuais e, ao mesmo tempo, transformar atualizações em ganhos reais de qualidade, segurança, produtividade, observabilidade, desempenho ou experiência do usuário sempre que houver recurso pertinente ao produto e à arquitetura.

## Decisão

Toda instalação ou atualização técnica deve incluir uma análise explícita de integração pertinente.

Para cada componente, o PR deve registrar:

1. o motivo da instalação ou atualização;
2. os recursos novos ou capacidades relevantes para o RADAR PDDE;
3. quais capacidades foram incorporadas ao projeto;
4. quais capacidades foram deliberadamente adiadas, com a razão;
5. quais recursos não se aplicam ao projeto;
6. os testes e evidências que comprovam a integração.

Quando houver ganho concreto e compatível, a atualização deve ser conectada ao fluxo real do projeto, e não permanecer apenas declarada no manifesto de dependências.

Quando não houver recurso novo pertinente, a atualização poderá ser somente de versão, desde que o PR registre claramente o benefício obtido — por exemplo, correção de defeito, segurança, compatibilidade, suporte ou manutenção — e explique por que nenhuma integração adicional é necessária.

## Limites

Esta decisão não autoriza:

- adotar recursos apenas para justificar uma atualização;
- ampliar escopo sem relação com o componente atualizado;
- alterar regras de negócio sem aprovação;
- relaxar lint, testes ou controles para acomodar uma nova versão;
- incorporar recursos experimentais sem isolamento e critérios de saída;
- manter bibliotecas instaladas sem uso ou decisão documental.

Integrações de maior risco devem ser separadas da atualização básica quando isso melhorar rastreabilidade, revisão, rollback e validação.

## Aplicação inicial

Na Rodada 1:

- o ESLint passou a produzir relatório HTML navegável publicado como evidência da saúde das dependências;
- o Acorn passou a validar JavaScript inline com localização real no markup;
- o `actions/checkout` permanece fixado por SHA e é atualizado uniformemente em PR próprio, sem configuração adicional artificial.

## Consequências

- PRs de dependência passam a ter avaliação funcional e arquitetural, não apenas verificação de versão;
- capacidades úteis devem ser testadas e documentadas;
- oportunidades identificadas e adiadas devem permanecer registradas;
- pacotes sem uso pertinente não devem ser instalados;
- o custo de manutenção adicional precisa ser proporcional ao benefício efetivo.
