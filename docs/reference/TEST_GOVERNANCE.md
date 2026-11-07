# Governança de testes do RADAR PDDE

**Estado:** referência operacional vigente  
**Atualizado em:** 22 de outubro de 2026

## 1. Finalidade

Os testes existem para proteger o comportamento atual do produto. Eles não são uma fonte autônoma de regra de negócio e não podem obrigar o código a reproduzir uma lógica já substituída.

A meta é obter confiança proporcional ao risco, não maximizar a quantidade de execuções nem manter o projeto indefinidamente em estado de “quase concluído”.

## 2. Hierarquia de autoridade

Quando houver divergência, usar nesta ordem:

1. código-fonte atual do SHA analisado e comportamento efetivo do ambiente correspondente;
2. Auth, RLS, RPCs, Edge Functions e persistência efetivos do Supabase;
3. contrato funcional vigente e decisões atuais;
4. testes que representam esse contrato atual;
5. documentação histórica, testes antigos e evidências de SHAs anteriores.

Um teste antigo não prevalece sobre código e regra funcional posteriores.

## 3. Classificação obrigatória de falha

Toda falha relevante deve receber diagnóstico explícito antes de qualquer correção.
A classificação pode ser revista quando surgirem novas evidências:

- **Defeito de produto:** comportamento atual viola o contrato vigente ou prejudica o usuário. Corrigir o produto e manter regressão adequada.
- **Teste com contrato superado:** a expectativa representa uma regra substituída. Atualizar, remover ou retirar o teste da execução; nunca ���q�^