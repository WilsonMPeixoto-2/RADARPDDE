# ADR-039 — evolução tecnológica proativa orientada ao melhor resultado

**Estado:** aceito  
**Data:** 3 de agosto de 2026

## Contexto

Atualizações e novas instalações não devem ocorrer apenas em rodadas periódicas de manutenção. Correções, melhorias de layout, mudanças de fluxo e novas funcionalidades também podem revelar que a tecnologia atual limita a qualidade possível da solução.

Sem uma regra explícita, existe o risco de corrigir sintomas dentro das limitações da pilha vigente, mesmo quando biblioteca, atualização ou capacidade moderna madura permitiria solução mais definitiva, acessível, segura, rápida, consistente e sustentável.

O risco oposto também existe: instalar pacote desnecessário, ampliar escopo silenciosamente ou adotar tecnologia apenas por novidade.

## Decisão

Toda tarefa deve incluir uma avaliação de adequação tecnológica proporcional ao seu escopo.

Quando houver ganho material, deve ser apresentada proposta de atualização, instalação ou ampliação arquitetural antes de aceitar uma solução limitada pela tecnologia existente.

A avaliação é especialmente obrigatória quando:

- a correção possível na pilha atual for paliativa;
- uma queixa recorrente indicar limitação estrutural;
- componente especializado confiável resolver melhor acessibilidade, posicionamento, formulários, tabelas, gráficos, cache, sincronização, validação ou outro problema comum;
- o recurso solicitado puder ser entregue com maior robustez por capacidade moderna;
- a tecnologia atual impuser limite perceptível de desempenho, segurança, consistência ou manutenção;
- insistir na implementação existente reduzir a qualidade final alcançável.

## Conteúdo mínimo da proposta

A proposta deve registrar:

1. problema ou limite observado;
2. tecnologia, atualização ou capacidade sugerida;
3. benefício concreto para usuários e projeto;
4. alternativa possível sem nova dependência;
5. custo, risco e manutenção adicional;
6. impacto em bundle, carregamento, dados, permissões, LGPD e ambientes;
7. gates, rollback e evidências necessários;
8. necessidade de Vercel, Supabase ou ambas.

## Relação com as decisões existentes

Esta decisão complementa:

- **ADR-020:** dependências fixadas e atualizações intencionais;
- **ADR-038:** atualizações devem produzir integração pertinente.

A ADR-020 controla governança, versões e validação. A ADR-038 impede atualização meramente nominal ou uso artificial de recursos. A ADR-039 obriga a reconhecer oportunidades tecnológicas durante qualquer tarefa, mesmo fora de uma rodada específica de dependências.

## Limites

A avaliação tecnológica não autoriza automaticamente:

- instalar pacote;
- modificar arquitetura;
- ampliar o escopo solicitado;
- alterar regra de negócio;
- acessar ou modificar Production;
- substituir solução simples por dependência sem ganho material;
- adotar tecnologia experimental sem isolamento e critérios de saída.

Propor é diferente de executar. A instalação ou atualização continua dependente de decisão, branch isolada, versão fixada, análise de segurança, testes, documentação, rollback e implantação controlada quando aplicável.

## Regra de escolha

- usar a solução existente quando ela produzir resultado equivalente com menor custo e risco;
- propor evolução quando ela elevar materialmente a qualidade possível;
- não esconder limitações tecnológicas do solicitante;
- distinguir correção incremental de solução estrutural;
- permitir que o objetivo do produto determine a tecnologia, e não o contrário.

## Consequências

- correções futuras devem informar quando a pilha atual limita a solução;
- melhorias visuais e funcionais podem originar proposta de pacote ou atualização pertinente;
- o roadmap deve registrar novas oportunidades identificadas;
- propostas tecnológicas devem ser avaliadas por benefício percebido, compatibilidade, risco, esforço e manutenção;
- o RADAR não fica preso a limitações históricas quando existe caminho moderno e seguro para resultado superior.
