# ADR-041 — Confiabilidade funcional ponta a ponta

**Status:** Aprovada  
**Data:** 5 de agosto de 2026

## Contexto

As falhas recentes do Excel SME e da Gestão de Equipe mostraram que testes de uma camada isolada não garantem a atividade do usuário. Um controle pode existir sem que o recurso publicado esteja disponível; uma chamada pode estar correta e ser interrompida pelo CORS; uma operação server-side pode encontrar vínculo Auth histórico inconsistente; uma gravação pode não ser refletida pela interface.

## Decisão

Uma funcionalidade crítica somente é considerada concluída quando o percurso integral estiver comprovado:

```text
visibilidade por perfil
→ controle e evento no navegador
→ handler
→ serviço de aplicação
→ repositório
→ tabela, RPC ou Edge Function
→ Auth e RLS
→ consulta ou gravação
→ retorno ao frontend
→ estado em memória
→ renderização
→ releitura após recarregar
→ erro, reversão ou compensação
```

## Evidência mínima

Para cada ação crítica, comprovar:

1. o perfil autorizado consegue localizar e acionar;
2. o perfil não autorizado não consegue executar;
3. o payload contém escola, competência, programa e versões corretos;
4. o backend esperado é realmente alcançado;
5. o dado consultado ou gravado corresponde ao contrato;
6. a interface atualiza sem depender de recarga manual;
7. a recarga preserva o resultado;
8. conflito de `row_version` não sobrescreve silenciosamente;
9. falha parcial não deixa estado inconsistente;
10. a mensagem orienta o usuário;
11. a regressão roda no CI;
12. o fluxo publicado recebe smoke proporcional ao risco.

## Aplicação

A primeira entrega após a reconciliação documental deve ser uma matriz canônica por:

```text
perfil × tela × ação × serviço × backend × permissão × evidência
```

Em seguida:

- smoke autenticado somente leitura por perfil;
- provas controladas de escrita e releitura;
- testes de compensação;
- UAT com servidores reais.

## Limites

- operações sobre dados reais exigem plano reversível e autorização;
- preferir Supabase descartável equivalente ou registros técnicos identificados;
- não reduzir testes unitários, pgTAP ou regras de segurança;
- não declarar função pronta apenas pelo DOM ou pelo banco;
- a quantidade reduzida de usuários não justifica fluxo quebrado.

## Consequências

- testes devem refletir atividades reais, não somente unidades de código;
- mudanças que atravessam camadas exigem revisão conjunta dessas camadas;
- documentação deve indicar se a prova ocorreu em ambiente descartável, Preview ou Production;
- a prioridade imediata é confiabilidade operacional antes de novas capacidades amplas.
