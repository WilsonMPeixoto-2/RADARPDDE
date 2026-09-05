# Governança de testes do RADAR PDDE

**Estado:** referência operacional vigente  
**Atualizado em:** 5 de setembro de 2026

## 1. Finalidade

Testes protegem comportamento conhecido. Eles **não são fonte autônoma de regra de negócio nem prova de ausência de defeitos desconhecidos**.

A experiência de 05/09/2026 mostrou que uma suíte amplamente verde pode coexistir com bugs escondidos em:

- combinação de fluxos;
- caminhos paralelos;
- estados avançados;
- closures/wrappers que contornam a autoridade correta;
- projeções concorrentes.

Portanto existem duas funções diferentes:

1. certificar regressões conhecidas;
2. ajudar a descobrir defeitos desconhecidos por investigação adversarial.

Método: [`../architecture/adversarial-analysis-and-implementation-method.md`](../architecture/adversarial-analysis-and-implementation-method.md)  
Playbook: [`../architecture/adversarial-analysis-replication-playbook.md`](../architecture/adversarial-analysis-replication-playbook.md)

## 2. Hierarquia de autoridade

Quando houver divergência:

1. comportamento efetivo do SHA/ambiente;
2. cadeia real de código executada;
3. Supabase efetivo: Auth/RLS/RPC/Edge/persistência;
4. contrato/decisão funcional vigente;
5. testes atuais;
6. documentação corrente;
7. histórico.

Código atual pode estar errado. Teste verde pode estar incompleto. Documento histórico pode estar superado.

## 3. Classificação obrigatória

Toda falha/achado deve ser classificado antes de correção:

- **B — bug funcional reproduzido**;
- **C — inconsistência de composição**;
- **D — teste/documento obsoleto perigoso**;
- **E — duplicação arquitetural com risco**;
- **F — ambiguidade que exige decisão**;
- **G — histórico legítimo isolado**;
- **H — hipótese ainda não reproduzida**;
- infraestrutura/ambiente;
- flaky não reproduzível.

Não transformar E/F/H em bug só para aumentar a lista. Também não omitir F porque “não é bug”.

## 4. Ambiente reproduzível antes da suíte

Não confiar automaticamente no `node_modules` já existente.

Antes de interpretar falhas:

1. comparar versões declaradas com o ambiente reutilizado;
2. quando houver divergência material, normalizar por instalação reproduzível (`npm ci` quando aplicável);
3. registrar warnings de depreciação separadamente;
4. rastrear cadeia antes de chamar warning transitivo de vulnerabilidade do produto;
5. distinguir falha de artefato/line-ending/hash do checkout de falha funcional.

Na coleta Astra, o workspace reaproveitado tinha várias versões divergentes/ausentes; após isso foi feito `npm ci`. Essa etapa passa a ser parte da higiene de auditoria, não detalhe incidental.

## 5. Teste de sequência

Para entidade com lifecycle:

```text
criar
→ avançar em outro domínio
→ voltar à origem
→ editar/salvar
→ persistir
→ reload
→ confirmar estado avançado
```

Exemplos:

- NF → Inventário → voltar à NF;
- Pendência → envio → reanálise → voltar à fila;
- consolidação → retificação → voltar à avaliação;
- equipe → redistribuição/desativação → voltar ao cadastro.

## 6. Teste pelo ponto de entrada real

Se regra depende de autoridade intermediária, iniciar pelo mesmo ponto usado pelo usuário.

Exemplo:

```text
regra: auditoria antes do download

insuficiente:
testar auditExport isoladamente

necessário:
clicar botão real
→ falhar auditoria inicial
→ provar zero download
```

Aplicar a modal, atalho, callback, API em `window`, wrapper, closure e extensão dinâmica.

## 7. Comparação diferencial

Quando múltiplas superfícies mostram o mesmo conceito, usar o **mesmo registro** e comparar:

- status;
- ator;
- data-base;
- idade;
- ação;
- identidade;
- estado após reload.

Diferença editorial pode ser legítima. Diferença semântica precisa ser intencional ou classificada.

## 8. Fixtures e mocks

Toda fixture relevante deve deixar claro se representa:

- contrato atual;
- legado/migração;
- estado adversarial deliberadamente inválido;
- cenário sintético de camada isolada.

Não remover estado antigo só porque hoje não pode mais ser criado. Primeiro verificar compatibilidade/normalização.

Mock deve ser avaliado pelo que **retira** da cadeia. Se remove justamente persistence/handler/composição onde o bug pode existir, o teste não certifica aquela camada.

## 9. Títulos e testes superados

Quando regra mudar:

```text
regra anterior
→ regra vigente
→ código afetado
→ teste afetado
```

Títulos ativos devem descrever a regra atual.

Casos já conhecidos:

- reanálise não é exclusiva do Controlador;
- Pendência pode reabrir de `Resolvida` **ou `Cancelada`**;
- desativação de Controlador exige carteira vazia, não “desativar + transferir 13 escolas”;
- `activeCompetenciaKey` não deve ser escrita diretamente para simular troca global real.

## 10. SQL/RPC

Ao associar teste a RPC:

1. localizar todas as definições da assinatura;
2. ordenar migrations;
3. identificar a última efetiva;
4. conferir grants/RLS/callers;
5. associar teste sucessor;
6. não deixar matriz apontar apenas para migration superada.

## 11. Quantidade e ordem dos testes

Ordem preferida:

1. probe/RED focal que responde à hipótese;
2. teste da composição real;
3. testes relacionados;
4. persistência/reload;
5. suíte mais ampla;
6. gates especializados conforme risco.

Não começar com a suíte inteira quando um probe barato pode primeiro dizer se a hipótese é real.

Em auditoria longa, salvar inventário, hits, mapa estático, probes e logs progressivamente para não repetir trabalho após perda de cota/contexto.

## 12. Casos Astra que demonstram a regra

### Patrimônio

Testes de NF e Inventário isolados estavam verdes, mas faltava:

```text
inventariar
→ salvar novamente a NF
```

Esse cruzamento revelou `Inventariada → Encaminhada`.

### Excel SME

Teste feliz do botão real baixava workbook correto, e teste da auditoria isolada bloqueava falha corretamente. Faltava:

```text
botão real
→ auditoria inicial falha
→ zero download
```

A composição revelou o bypass.

### Pendências

Duas projeções passavam seus próprios testes, mas o mesmo registro após reanálise incorreta produziu 35 dias em uma e 1 dia em outra. Isso exige decisão, não escolha automática.

## 13. Evidência ampla não substitui contraexemplo

Na coleta Astra:

- integração 7/7;
- E2E desktop 141 aprovados / 37 ignorados / 0 falhas entre 178;
- Production integrity saudável no snapshot.

Mesmo assim foram encontrados defeitos/composições incorretas.

Logo:

```text
suíte verde + integridade saudável
≠ prova de ausência de caminho defeituoso
```

## 14. Critério de encerramento

Antes de “fechamento confirmado”, registrar:

> **O que foi tentado para provar que ainda estava errado?**

Incluir, conforme risco:

- contraexemplos;
- combinação de fluxos verdes;
- retorno à origem após estado avançado;
- paths paralelos;
- falhas intermediárias;
- cross-view;
- reload;
- migrations sucessoras;
- classificação de fixtures/testes.

Sem isso, concluir apenas:

> **os gates conhecidos passaram**.
