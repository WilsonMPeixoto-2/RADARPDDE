# RADAR PDDE

O **RADAR PDDE** é uma aplicação web para acompanhar o ciclo de entrega, análise, regularização e consolidação dos programas do PDDE por unidade escolar, competência, programa e documento.

O sistema apoia o trabalho cotidiano de Controladores, Assistentes, equipe de Inventário e gestão da SME, transformando registros documentais em filas de trabalho, históricos auditáveis e informações gerenciais navegáveis.

## Estado atual — 12 de julho de 2026

O pacote integrado do **PR 18** foi concluído e incorporado à `main`. Ele reúne as Tasks 10–13 do Ciclo A, o Dashboard operacional e a integração da Carteira de Escolas ao mesmo modelo de acompanhamento.

O **PR 19** corrigiu uma regressão visual e funcional na Carteira de Escolas: a tabela aprovada foi restaurada com os programas em destaque, os dados da direção e os botões **Ver Unidade** e **Editar**, preservando os novos filtros e indicadores operacionais.

| Ambiente | Situação atual |
|---|---|
| `main` | Contém o pacote completo do PR 18 e a correção do PR 19. |
| Preview corrigido | Pronto para validação e promoção; reúne o Dashboard aprovado e a Carteira restaurada. |
| Produção | Ainda apresenta a versão anterior à correção da Carteira. A promoção do Preview ficou pendente porque o limite diário de implantações do plano gratuito da Vercel foi atingido. |

**Próxima ação operacional:** promover o Preview corrigido para produção quando o limite da Vercel for restabelecido e realizar uma conferência rápida das telas principais. Não há indicação de rollback.

O relatório completo da sessão está em [`docs/reports/RELATORIO_ESTADO_ATUAL_2026-07-12.md`](docs/reports/RELATORIO_ESTADO_ATUAL_2026-07-12.md).

## Progressão das últimas sessões

### Ciclo A até a Task 9

- criação do modelo de pendências documentais;
- registro de novo envio e reanálise;
- separação entre bonificação, análise técnica e pendência;
- página de Pendências com quatro filas, busca, filtros, detalhes e histórico;
- navegação contextual entre Pendências, Competências e Prontuário;
- geração do relatório Excel `.xlsx`.

### Tasks 10 e 11

- registro de contatos relacionados a uma pendência, sem alterar sua situação;
- cancelamento justificado de pendência lançada indevidamente;
- reabertura de pendência resolvida, preservando o histórico anterior;
- alertas diferenciando providência da escola e reanálise do Controlador.

### Tasks 12 e 13

- retificação administrativa pelo perfil Assistente;
- comparação clara entre informação anterior e informação corrigida;
- justificativa obrigatória e histórico da retificação;
- preservação das pendências e da análise técnica durante a retificação.

### Dashboard e Carteira

- indicadores separados para pendências abertas e itens aguardando reanálise;
- quadro de próximas ações priorizado pelo tempo de espera;
- tarefa regular consolidada para escolas que aguardam lançamento de bonificação;
- transporte de filtros do Dashboard para a Carteira;
- busca da Carteira por nome, designação e INEP;
- filtros por situação documental;
- preservação da tabela aprovada, dos programas e das ações **Ver Unidade** e **Editar**.

### Qualidade e validação

- refinamentos de foco, teclado, leitura por tecnologias assistivas e adaptação móvel;
- verificação de ausência de rolagem indevida nas telas principais;
- 136 testes de regras e dados aprovados;
- 61 testes completos de uso aprovados;
- 2 cenários ignorados por configuração e nenhuma falha.

## Regra de preservação visual e funcional

Melhorias de qualidade visual são permitidas quando aperfeiçoam os elementos existentes, por exemplo:

- espaçamento, alinhamento e hierarquia;
- tipografia, contraste e legibilidade;
- responsividade e adaptação móvel;
- consistência e acabamento visual.

Exigem **aprovação expressa prévia** do responsável pelo projeto:

- remover ou acrescentar caminhos de navegação;
- retirar, trocar ou mudar a finalidade de botões;
- substituir componentes ou tabelas já aprovados;
- alterar colunas, permissões, fluxos ou funcionalidades;
- modificar o conceito estético definido.

Uma apresentação aparentemente mais organizada não autoriza alteração funcional. Toda evolução visual deve preservar integralmente as ações e os caminhos existentes, salvo decisão expressa em contrário.

## Modelo funcional

O RADAR PDDE mantém três dimensões relacionadas, porém independentes.

### Bonificação

Avalia a entrega tempestiva dos documentos exigidos e produz o resultado **APTA** ou **INAPTA** para fins de consolidação e encaminhamento à SME.

### Análise técnica

Registra a qualidade e a correção de cada documento: não analisado, em análise, incorreto, correto ou correto após o prazo.

### Pendência documental

Controla o saneamento de documento ausente ou incorreto. Uma pendência somente é encerrada quando o documento é apresentado e a reanálise confirma sua correção.

Consequentemente, combinações como **APTA + documento incorreto + pendência ativa** são válidas. A regularização posterior não altera automaticamente a bonificação histórica.

## Ciclo das pendências

```text
Aberta
  ↓ novo envio
Aguardando reanálise
  ├─ reanálise correta → Resolvida
  └─ reanálise incorreta → Aberta
```

Estados canônicos:

- `Aberta` — depende de providência da escola;
- `Aguardando reanálise` — depende de conferência do Controlador;
- `Resolvida` — reanálise positiva concluída;
- `Cancelada` — lançamento indevido cancelado com justificativa.

`Aberta` e `Aguardando reanálise` são pendências ativas. Não existe estado `Vencida`; a antiguidade é utilizada para priorização.

## Principais áreas do sistema

- **Dashboard:** visão da carteira, indicadores separados e próximas ações;
- **Carteira de Escolas:** pesquisa, filtros, comparação das unidades, consulta e edição;
- **Visão por Competência:** acompanhamento mensal de bonificação, análise e pendências;
- **Prontuário:** contexto completo da escola, programa e documento;
- **Pendências:** quatro filas, busca global, filtros, detalhes, contatos e histórico;
- **Excel:** relatório estruturado com bonificações, síntese, qualidade dos dados e metadados.

## Documentação oficial

O índice completo está em [`docs/README.md`](docs/README.md). A matriz de precedência, disponibilidade e integridade está em [`docs/reference/STATUS_DOCUMENTOS.md`](docs/reference/STATUS_DOCUMENTOS.md).

Documentação arquitetural já versionada:

- [`Modelo operacional compartilhado`](docs/architecture/modelo-operacional.md);
- [`Retificações administrativas`](docs/architecture/retificacoes.md);
- [`Competências`](docs/architecture/competencias.md);
- [`Testes e validação`](docs/architecture/testing.md);
- [`Status e precedência dos documentos`](docs/reference/STATUS_DOCUMENTOS.md).

## Precedência das decisões

Quando houver divergência entre fontes, deve ser aplicada a seguinte ordem:

1. orientação expressa mais recente do responsável pelo projeto;
2. relatório atual de execução, quanto ao estado da implementação;
3. Dossiê consolidado;
4. Plano aprovado do Lote 2;
5. plano técnico da implementação;
6. código vigente.

Decisões consolidadas não devem ser reabertas sem nova regra institucional, defeito comprovado ou determinação expressa.

## Dados e persistência

Nesta fase, a aplicação utiliza:

- dados iniciais versionados no frontend;
- persistência no `localStorage` do navegador;
- Supabase deliberadamente desabilitado em `config.js`.

Limitações atuais:

- não há autenticação real;
- não há sincronização automática entre dispositivos;
- permissões definitivas serão estabelecidas na futura integração com Supabase;
- a retificação está provisoriamente autorizada ao perfil Assistente por regra centralizada;
- não há conferência automática de arquivos no Google Drive.

Nunca utilize uma chave `service_role` no frontend.

## Executar localmente

Requisitos: Node.js compatível com o projeto e npm.

```bash
npm install
npm start
```

A aplicação será disponibilizada em:

```text
http://127.0.0.1:4175
```

## Testes

Validação de sintaxe e domínio:

```bash
npm run check
```

Playwright completo:

```bash
npm run test:e2e
```

Projetos cobertos:

- Chromium desktop;
- Android/Chromium;
- iPhone/WebKit.

## Organização do desenvolvimento

- `main` — base aprovada para publicação;
- branches `feature/*` e `fix/*` — trabalho isolado;
- alterações relevantes são revisadas por Pull Request;
- mudanças funcionais, merge e produção exigem autorização expressa;
- testes e Preview da Vercel devem ser aprovados antes do encerramento.

## Roadmap consolidado

1. **Publicação da correção:** promover o Preview corrigido após a renovação do limite da Vercel;
2. **Conferência pós-publicação:** validar Dashboard, Carteira, Pendências, Competências e Prontuário;
3. **Prontuário ampliado:** evolução estrutural prevista para o Ciclo C;
4. **Infraestrutura futura:** Supabase, autenticação e permissões institucionais.
