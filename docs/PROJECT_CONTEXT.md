# RADAR PDDE 2026 — Contexto funcional e arquitetural

## 1. Finalidade

O RADAR PDDE organiza e acompanha o ciclo de trabalho relacionado aos documentos, pendências, verificações, unidades escolares, programas, competências, bens, notas fiscais, responsáveis e atividades administrativas do Programa Dinheiro Direto na Escola na 4ª CRE.

O sistema deve apoiar:

- análise documental;
- controle das unidades escolares;
- distribuição e acompanhamento da carteira de trabalho;
- identificação de pendências;
- registro de tentativas, contatos e reanálises;
- acompanhamento de prazos;
- visão gerencial;
- auditoria;
- exportação;
- migração controlada para persistência remota.

---

## 2. Princípio do produto

A estrutura visual não é meramente estética. Ela deve comunicar, conforme o contexto:

- estado atual;
- gravidade;
- prioridade;
- responsável;
- última movimentação;
- próxima ação;
- prazo;
- origem da informação;
- possibilidade de atuação.

Dashboards, listas, cartões, tabelas e prontuários devem representar o mesmo universo de dados, respeitando filtros e recortes de forma consistente.

O sistema deve reduzir ambiguidades operacionais e permitir que o usuário compreenda rapidamente:

1. o que aconteceu;
2. o que exige atenção;
3. quem deve agir;
4. qual é a próxima ação;
5. onde essa ação deve ser realizada.

---

## 3. Usuários e perfis

O RADAR atende diferentes perfis administrativos, com responsabilidades, escopos e necessidades informacionais distintas.

Toda funcionalidade deve considerar:

- visibilidade por perfil;
- ações permitidas;
- unidades escolares vinculadas ao usuário;
- necessidade de visão individual, operacional e gerencial;
- consistência entre a tela principal e as demais visões que utilizam o mesmo dado.

Uma alteração não deve ser considerada completa sem verificar todas as telas e perfis afetados.

---

## 4. Entidades principais

O contrato atual contempla entidades como:

- configuração da aplicação;
- programas;
- perfis;
- perfis de usuários;
- escopos escolares;
- controladores;
- equipe de patrimônio;
- escolas;
- programas por escola;
- competências;
- verificações;
- pendências;
- tentativas de pendência;
- contatos;
- bens;
- notas fiscais registradas;
- registros administrativos;
- execuções de importação;
- eventos de auditoria.

Alterações em uma entidade devem considerar todas as telas, projeções, serviços, relatórios e exportações que dela dependem.

---

## 5. Pendências e reanálise

As pendências possuem estados operacionais e histórico.

Estados relevantes incluem:

- Aberta;
- Aguardando reanálise;
- Resolvida;
- Cancelada.

Tentativas e resultados podem incluir:

- aguardando;
- correto;
- incorreto;
- arquivo indisponível;
- substituída antes da análise.

O sistema deve preservar, conforme aplicável:

- motivo;
- documento ou objeto afetado;
- unidade escolar;
- programa;
- responsável;
- tentativas;
- contatos;
- datas;
- resultado;
- histórico;
- próxima ação.

A resolução de uma pendência não deve apagar o histórico que explica como ela foi tratada.

---

## 6. Visões complementares

O mesmo conjunto de dados pode ser apresentado em:

- dashboard;
- carteira;
- lista de pendências;
- prontuário;
- verificações;
- relatórios;
- exportações;
- administração;
- configurações.

Essas visões não devem criar verdades independentes.

Filtros, contagens, estados e ações devem partir do mesmo contrato e do mesmo recorte lógico.

Quando um cartão do dashboard representa um subconjunto da operação, sua ação deve levar o usuário à visão correspondente com o mesmo recorte preservado sempre que isso fizer sentido funcional.

---

## 7. Responsividade e mobile

No mobile, a solução aprovada privilegia cartões quando uma tabela perde legibilidade.

A conversão para cartões não autoriza remover dados essenciais da tabela original.

Devem ser preservados, quando aplicáveis:

- unidade;
- programa;
- situação;
- responsável;
- última movimentação;
- próxima ação;
- prazos;
- pendências;
- botões, links e demais ações operacionais.

O comportamento mobile deve ser validado como experiência completa, e não apenas como ajuste visual de largura.

---

## 8. Persistência e contrato de repositório

O modo local permanece funcional e é a referência operacional até a homologação remota.

A transição para o Supabase deve manter equivalência funcional entre os dois adaptadores:

- `LocalStorageRepository`;
- `SupabaseRepository`.

O frontend não deve conhecer detalhes desnecessários do mecanismo de persistência. Deve consumir o contrato de repositório e os serviços de aplicação.

A arquitetura deve preservar:

- paginação;
- escrita em lotes;
- tratamento padronizado de erros;
- concorrência otimista;
- snapshots;
- importação e reconciliação;
- rastreabilidade.

---

## 9. Operações compostas

Operações que afetam múltiplas tabelas ou registros devem utilizar transações ou RPCs apropriadas.

Exemplos já previstos na arquitetura:

- exercício e competências;
- escola e programas;
- reanálise de pendência e verificação;
- efeitos de nota fiscal;
- importação, promoção, reconciliação e rollback.

Não decompor operações que precisam ser atômicas em várias gravações independentes no navegador.

---

## 10. Concorrência

Registros mutáveis relevantes utilizam `row_version`.

Quando houver conflito:

- não sobrescrever silenciosamente;
- informar que outra sessão alterou o registro;
- preservar o trabalho ainda não confirmado do usuário quando possível;
- recarregar os dados;
- permitir comparação e nova decisão.

A estratégia de concorrência deve favorecer integridade e clareza operacional.

---

## 11. Contratos e validação

O projeto utiliza contratos JSON e validação em mais de uma camada coerente:

- Ajv no código da aplicação;
- constraints e tipos relacionais no PostgreSQL;
- `pg_jsonschema` quando aplicável aos contratos persistidos;
- testes de contrato e integração.

Não criar uma terceira fonte de verdade de schemas sem necessidade comprovada.

Os tipos gerados do banco devem ser usados para detectar divergências entre o schema remoto e as consultas da aplicação.

---

## 12. Migração de dados

A migração deve seguir, no mínimo:

1. geração do snapshot;
2. validação estrutural;
3. planejamento;
4. dry-run;
5. staging;
6. reconciliação;
7. promoção;
8. verificação;
9. rollback testado.

Dados fictícios locais não devem ser confundidos com dados institucionais reais.

Nenhum seed local deve ser aplicado implicitamente em ambiente remoto institucional.

---

## 13. Supabase e ambientes

A arquitetura prevê três modos de dados:

- `local`;
- `supabase-preview`;
- `supabase-production`.

A ativação deve ser explícita e protegida por configuração de ambiente.

Até homologação posterior:

- Production permanece local;
- Preview é o único ambiente autorizado para a primeira conexão real;
- credenciais administrativas ficam fora do frontend;
- apenas chave publicável pode chegar ao navegador;
- migrations e tipos devem ser verificados contra o projeto remoto correto.

---

## 14. Qualidade funcional

O projeto deve ser avaliado pela capacidade de apoiar o trabalho real da 4ª CRE, e não apenas pela existência dos componentes na tela.

Uma implementação deve ser considerada satisfatória quando:

- representa corretamente o estado dos dados;
- permite localizar o que exige ação;
- conduz o usuário ao próximo passo;
- mantém coerência entre visões;
- preserva histórico e rastreabilidade;
- funciona para os perfis afetados;
- permanece íntegra em desktop e mobile;
- não cria dependência desnecessária de conhecimento técnico do usuário.
