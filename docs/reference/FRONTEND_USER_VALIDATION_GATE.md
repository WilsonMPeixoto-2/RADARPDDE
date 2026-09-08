# Gate permanente de validação pelo usuário no frontend

**Estado:** referência operacional canônica  
**Aplicação:** todas as futuras correções, implementações, refatorações, otimizações e alterações visuais ou funcionais do RADAR PDDE  
**Atualizado em:** 7 de setembro de 2026  
**Complementa:** `docs/reference/ENGINEERING_METHOD.md`

## 1. Regra central

Nenhuma alteração que possa afetar comportamento percebido pelo usuário pode ser considerada concluída apenas porque o código está correto, os testes internos passaram, o build foi gerado ou o banco aceitou a gravação.

A conclusão exige também validação do produto pela interface real, no frontend, reproduzindo a forma como o usuário efetivamente utiliza o RADAR PDDE.

A regra é:

> Código verde sem jornada real do usuário comprovada não encerra a tarefa.

O objetivo é evitar regressões em que serviços, handlers, módulos, migrations ou testes aparentem estar corretos, mas a funcionalidade falhe quando o usuário navega, clica, preenche, salva, atualiza a página ou retorna ao registro.

## 2. Escopo obrigatório

Este gate é permanente e se aplica a todas as frentes futuras na medida do impacto da mudança, incluindo:

- correções de bugs;
- novas funcionalidades;
- refatorações;
- alterações de bootstrap, readiness, carregamento ou performance;
- alterações de persistência e sincronização;
- mudanças de regra de negócio;
- alterações de perfil, autorização ou contexto;
- mudanças de layout, componentes, modais, drawers, botões, filtros, tabs e navegação;
- alterações que possam produzir efeitos indiretos em outras telas.

O grau de cobertura deve ser proporcional ao risco. Mudanças pequenas não exigem percorrer o sistema inteiro, mas toda superfície materialmente tocada deve ser validada pela interface real.

## 3. Três camadas de prova

Uma entrega relevante deve combinar três tipos de evidência.

### 3.1 Código, arquitetura e persistência

Validar, conforme aplicável:

- testes unitários e de integração;
- contratos e invariantes;
- serviços e handlers;
- migrations, RPCs, RLS e Auth;
- persistência e integridade do Supabase;
- build e demais gates técnicos proporcionais.

Essa camada é necessária, mas não suficiente.

### 3.2 Automação pelo navegador real

Usar Playwright ou ferramenta equivalente para executar a jornada pelo frontend, interagindo com os mesmos controles disponíveis ao usuário.

Sempre que materialmente possível, o teste deve:

1. autenticar pelo fluxo real;
2. navegar pela interface;
3. clicar nos controles reais;
4. preencher os campos pela UI;
5. executar a ação visível ao usuário;
6. conferir a resposta da interface;
7. verificar o estado persistido quando houver gravação;
8. atualizar/recarregar a página;
9. reencontrar o mesmo estado após a releitura;
10. verificar efeitos relacionados em outras telas quando a regra for transversal.

Não substituir essa prova por chamada direta ao serviço quando a finalidade do teste for afirmar que a funcionalidade está disponível e funciona para o usuário.

### 3.3 Homologação visual e navegada

Inspecionar a interface renderizada, por screenshots, traces, vídeo ou navegação interativa apropriada, para confirmar que o produto continua utilizável e visualmente íntegro.

Verificar conforme o impacto:

- botão, ação, aba, filtro ou link realmente presente;
- posicionamento e hierarquia visual coerentes;
- textos e estados visíveis corretos;
- modal/drawer abrindo e fechando;
- feedback de sucesso, erro, bloqueio e carregamento;
- ausência de sobreposição, corte ou componente invisível;
- navegação, voltar/avançar e mudança de contexto;
- atualização da tela após gravação;
- persistência após refresh;
- console e rede sem erro material relacionado à jornada.

## 4. Testar a jornada, não apenas a função

Sempre que uma alteração tocar uma funcionalidade real, formular ao menos uma prova no formato de jornada do usuário.

Exemplo inadequado como prova única:

```text
InvoiceService.save() retorna sucesso.
```

Exemplo adequado:

```text
login
→ abrir Carteira
→ escolher escola
→ abrir Prontuário
→ selecionar competência/programa
→ abrir Nota Fiscal
→ editar/preencher
→ clicar em Salvar
→ observar atualização da tela
→ verificar persistência
→ atualizar o navegador
→ reabrir a Nota Fiscal
→ confirmar que o estado permanece correto
→ conferir reflexos relacionados, quando houver
```

O mesmo princípio vale para Pendências, patrimônio/inventário, retificações, equipe, competências, filtros, exportações e demais fluxos do produto.

## 5. Primeira navegação e ordens alternativas

Alterações de bootstrap, readiness, carregamento, lazy loading, instalação de módulos ou navegação exigem atenção adicional.

Não basta provar uma jornada depois que outras telas já inicializaram dependências.

Quando relevante, testar também:

- funcionalidade como primeira superfície acessada após o login;
- acesso direto por rota;
- troca de perfil/contexto antes da primeira abertura da tela;
- navegação em ordem diferente da jornada principal;
- refresh dentro da própria tela;
- retorno à tela após visitar outra superfície.

Uma função que só funciona porque outra página inicializou silenciosamente uma dependência é regressão funcional.

## 6. Escrita e persistência

Para qualquer operação de escrita relevante, a prova de conclusão deve buscar a convergência:

```text
estado persistido remoto
=
estado local da aplicação
=
estado apresentado ao usuário
=
estado reencontrado após reload
```

Quando houver efeitos transversais, verificar também as projeções relacionadas.

Exemplos:

- Nota Fiscal permanente e seu reflexo em Capital/Inventário;
- análise individual e Pendência correspondente;
- reanálise e estado da tentativa;
- competência ativa e filtros dependentes;
- alterações de equipe e carteira;
- retificações e histórico/auditoria.

## 7. Layout é parte da funcionalidade

Uma funcionalidade tecnicamente existente, mas inacessível, invisível, deslocada, encoberta ou sem feedback adequado não está concluída.

Alterações que afetem UI devem incluir inspeção visual real da superfície impactada. Testes que apenas verificam presença de seletor no DOM podem ser usados como apoio, mas não substituem evidência de renderização e usabilidade quando houver risco visual.

## 8. Performance não pode comprar regressão

Otimização de carregamento, bootstrap ou tempo de resposta só pode ser aprovada se preservar a equivalência funcional das jornadas afetadas.

A ordem de prioridade é:

```text
integridade funcional
→ integridade dos dados
→ regras de negócio e autorização
→ disponibilidade visual e usabilidade
→ performance
```

Uma melhoria de tempo que introduz corrida, botão ausente, módulo não instalado, rota incompleta, estado não persistido ou dependência da ordem de navegação é reprovada, mesmo que o benchmark melhore.

Toda medição de performance deve ser comparada com uma baseline funcional válida. Métrica de velocidade não é prova de equivalência.

## 9. Critério de conclusão

Uma tarefa relevante só pode ser declarada concluída quando, conforme o impacto:

- os gates técnicos proporcionais estiverem verdes;
- as jornadas reais afetadas tiverem sido executadas pelo frontend;
- as ações críticas tiverem sido exercidas por controles visíveis ao usuário;
- persistência e releitura tiverem sido comprovadas quando houver escrita;
- o layout/superfície afetada tiver sido inspecionado visualmente;
- não houver regressão material conhecida nas jornadas vizinhas;
- o SHA efetivamente homologado for o mesmo candidato à integração/publicação.

Se alguma dessas provas não puder ser executada por limitação do ambiente, registrar explicitamente a lacuna. Não converter ausência de teste em aprovação presumida.

## 10. Relação com o método de engenharia

Este documento especializa, para a perspectiva do usuário, a regra já estabelecida em `ENGINEERING_METHOD.md` de testar invariantes, composição, estado final e código real com fronteiras controladas.

Em caso de dúvida, aplicar os dois documentos em conjunto:

```text
causa real no código
+ prova técnica
+ jornada real pelo frontend
+ persistência/releitura
+ inspeção visual
+ revisão adversarial
= evidência suficiente para conclusão
```

Este gate não é específico de um PR ou do problema de carregamento de setembro de 2026. Ele é regra permanente do projeto até decisão canônica posterior que o substitua explicitamente.