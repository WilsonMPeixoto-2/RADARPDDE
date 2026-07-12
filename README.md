# RADAR PDDE

O **RADAR PDDE** é uma aplicação web para monitoramento do ciclo de entrega, análise, regularização e consolidação dos programas do PDDE por unidade escolar, competência, programa e documento.

O sistema foi concebido para apoiar o trabalho cotidiano de Controladores, Assistentes, equipe de Inventário e gestão da SME, transformando registros documentais em filas operacionais, históricos auditáveis e informações gerenciais navegáveis.

## Situação do projeto

A versão publicada em produção contém o **Ciclo A até a Task 9**, incluindo:

- modelo canônico de pendências documentais;
- registro de novo envio e reanálise;
- separação entre bonificação, análise técnica e pendência;
- página de Pendências com quatro filas, busca, filtros, drawer e timeline;
- navegação contextual entre Pendências, Competências e Prontuário;
- geração do relatório Excel `.xlsx`.

O **PR 18** reúne o pacote integrado em desenvolvimento:

- Tasks 10–13 do Ciclo A;
- contatos vinculados, cancelamento e reabertura;
- retificação administrativa auditável pelo perfil Assistente;
- Dashboard operacional do Controlador;
- Carteira de Escolas integrada ao mesmo modelo operacional;
- alinhamento de alertas, indicadores e documentação.

Nenhum conteúdo desse pacote deve ser incorporado à `main` ou publicado em produção sem autorização expressa.

## Modelo funcional

O RADAR PDDE mantém três dimensões relacionadas, porém independentes:

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

## Principais superfícies

- **Dashboard:** visão gerencial e fila priorizada de próximas ações;
- **Carteira de Escolas:** pesquisa, filtros e comparação operacional das unidades;
- **Visão por Competência:** acompanhamento mensal de bonificação, análise e pendências;
- **Prontuário:** contexto completo da escola, programa e documento;
- **Pendências:** quatro filas canônicas, busca global, filtros, detalhes e histórico;
- **Excel:** relatório estruturado com bonificações, síntese, qualidade dos dados e metadados.

## Documentação oficial

O índice completo está em [`docs/README.md`](docs/README.md). A matriz de precedência, disponibilidade e integridade está em [`docs/reference/STATUS_DOCUMENTOS.md`](docs/reference/STATUS_DOCUMENTOS.md).

Documentos produzidos e verificados para inclusão na biblioteca do projeto:

| Documento | Finalidade | Situação no repositório |
|---|---|---|
| Dossiê Consolidado v1.0 | Contexto, regras de negócio e decisões consolidadas | Binário verificado; inclusão pendente |
| Plano do Lote 2 — Revisão Consolidada v2.0 | Contrato funcional, visual e de navegação | Binário verificado; inclusão pendente |
| Protótipo de exportação Excel v2.1 | Referência congelada da estrutura da planilha | Binário verificado; inclusão pendente |
| Relatório e Guia do Ciclo A v1.0 | Explicação funcional para usuários e gestores | Binário verificado; inclusão pendente |

Documentação arquitetural já versionada:

- [`Modelo operacional compartilhado`](docs/architecture/modelo-operacional.md);
- [`Retificações administrativas`](docs/architecture/retificacoes.md);
- [`Competências`](docs/architecture/competencias.md);
- [`Pendências e reanálise`](docs/architecture/pendencias-reanalise.md);
- [`Status e precedência dos documentos`](docs/reference/STATUS_DOCUMENTOS.md).

## Precedência das decisões

Quando houver divergência entre fontes, deve ser aplicada a seguinte ordem:

1. orientação expressa mais recente do responsável pelo projeto;
2. Dossiê consolidado;
3. Plano aprovado do Lote 2;
4. plano técnico da implementação;
5. código vigente.

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

- `main` — versão autorizada para produção;
- branches `feature/*` e `fix/*` — trabalho isolado;
- PRs permanecem em rascunho durante a implementação;
- merge e produção exigem autorização expressa;
- testes e Preview do Vercel devem estar aprovados antes do encerramento.

## Roadmap consolidado

1. **Pacote operacional integrado:** Tasks 10–13 + Dashboard e Carteira do Ciclo B;
2. **Qualidade e encerramento:** acessibilidade, mobile, documentação final e regressão completa;
3. **Prontuário ampliado:** evolução estrutural prevista para o Ciclo C;
4. **Infraestrutura futura:** Supabase, autenticação e permissões institucionais.
