# ADR-045 — Production é fail-closed e não publica seed institucional

**Data:** 18 de agosto de 2026  
**Status:** Aprovada e implementada

## Contexto

O RADAR mantém abstrações locais para desenvolvimento e testes. Durante a evolução do produto, o frontend também carregou dados iniciais de escolas/controladores usados no desenvolvimento.

Depois da ativação oficial do Supabase Production, esse comportamento deixou de ser aceitável como contingência automática: uma falha de configuração não pode fazer Production cair silenciosamente para estado local, e o artefato público não deve carregar seed institucional legado.

## Decisão

Production opera em modo **fail-closed**.

Se a configuração real de Supabase estiver ausente, inválida, inconsistente ou não autorizada, a aplicação deve permanecer indisponível/bloqueada até a configuração correta ser restabelecida.

Production não pode:

- ativar automaticamente `LocalStorageRepository` como substituto;
- carregar seed legado de escolas/controladores como se fosse estado institucional;
- transformar erro de configuração remota em sessão local aparentemente funcional.

O build de Production deve sanitizar o bundle público para remover os dados iniciais institucionais usados no desenvolvimento.

## Desenvolvimento e testes

`LocalStorageRepository`, fixtures e seeds descartáveis continuam permitidos em ambientes de desenvolvimento/teste explicitamente configurados.

A existência dessas ferramentas não constitui mecanismo de contingência automática de Production.

## Consequências

- falhas de configuração ficam visíveis em vez de gerar estado divergente;
- o usuário nunca trabalha inadvertidamente em uma base local acreditando estar em Production;
- dados legados de desenvolvimento deixam de ser enviados como parte do bundle público de Production;
- recuperação de indisponibilidade exige restabelecer a configuração/camada remota correta, e não criar uma fonte paralela de verdade.

## Relação com decisões anteriores

Esta ADR **substitui parcialmente a ADR-001 e a ADR-023** onde aquelas decisões descreviam LocalStorage como contingência possível para Production.

O contrato de repositório permanece válido, mas o fallback local passa a ser exclusivamente de desenvolvimento/teste por configuração explícita, nunca fallback silencioso do ambiente oficial.
