# Documentação do RADAR PDDE

Este diretório organiza as fontes funcionais, arquiteturais, históricas e de acompanhamento do projeto.

## Estado de referência

O registro mais recente da implementação está em:

- [`reports/RELATORIO_ESTADO_ATUAL_2026-07-12.md`](reports/RELATORIO_ESTADO_ATUAL_2026-07-12.md) — progressão das últimas sessões, situação dos ambientes, validações e próximos passos.

Esse relatório prevalece sobre os planos técnicos quanto ao que já foi executado. As Tasks 10–13, o Dashboard operacional e a integração da Carteira foram concluídos no PR 18; a Carteira aprovada foi restaurada pelo PR 19.

## Regra de precedência

1. orientação expressa mais recente do responsável pelo projeto;
2. relatório atual de execução, quanto ao estado da implementação;
3. Dossiê Consolidado;
4. Plano aprovado do Lote 2;
5. planos técnicos e especificações;
6. implementação vigente.

Documentos antigos permanecem disponíveis para rastreabilidade, mas não prevalecem sobre decisões posteriores consolidadas.

## Referências canônicas

| Documento | Finalidade | Status |
|---|---|---|
| Dossiê Consolidado v1.0 | Contexto, regras de negócio e decisões consolidadas | Canônico; binário verificado e aguardando inclusão |
| Plano do Lote 2 — Revisão Consolidada v2.0 | Contrato funcional, visual e de navegação | Aprovado; binário verificado e aguardando inclusão |
| Protótipo de exportação Excel v2.1 | Estrutura e identidade da exportação Excel | Referência congelada; binário verificado e aguardando inclusão |
| Relatório e Guia do Ciclo A v1.0 | Relatório funcional e guia para usuários | Produzido; binário verificado e aguardando inclusão |
| [`reference/STATUS_DOCUMENTOS.md`](reference/STATUS_DOCUMENTOS.md) | Matriz de precedência, disponibilidade, integridade e caminhos previstos | Vigente |

Os nomes, caminhos previstos e hashes SHA-256 dos arquivos binários constam na matriz de status. Links diretos serão adicionados somente após a inclusão efetiva dos arquivos no GitHub.

## Arquitetura e regras de manutenção

- [`architecture/competencias.md`](architecture/competencias.md) — contexto mensal e chaves de competência;
- [`architecture/modelo-operacional.md`](architecture/modelo-operacional.md) — projeção compartilhada entre telas;
- [`architecture/retificacoes.md`](architecture/retificacoes.md) — retificação administrativa auditável;
- [`architecture/testing.md`](architecture/testing.md) — estratégia de validação;
- [`architecture/excel-export.md`](architecture/excel-export.md) — exportação estruturada para Excel.

## Planos e especificações

Os diretórios `superpowers/specs` e `superpowers/plans` registram o desenho aprovado e o plano de cada pacote. Esses documentos explicam como as regras canônicas foram materializadas, mas não substituem o Dossiê, o Plano aprovado nem o relatório mais recente de execução.

## Situação funcional

### Incorporado à `main`

- Ciclo A concluído até as Tasks 10–13;
- quatro filas canônicas de pendências;
- novo envio e reanálise;
- registro de contatos, cancelamento e reabertura;
- retificação administrativa pelo perfil Assistente;
- Dashboard operacional do Controlador;
- Carteira de Escolas com filtros técnicos e interface aprovada restaurada;
- navegação contextual e relatório Excel.

### Publicação

- o Preview corrigido está pronto;
- a produção ainda está na versão anterior ao PR 19;
- a promoção ficou temporariamente impedida pelo limite diário do plano gratuito da Vercel;
- o próximo passo é promover o Preview corrigido quando o limite for restabelecido.

## Regra de preservação da experiência

Melhorias visuais podem aperfeiçoar espaçamento, tipografia, contraste, alinhamento, hierarquia, responsividade e acabamento. Qualquer mudança que retire ou acrescente caminhos, botões, componentes, colunas, permissões ou funcionalidades exige aprovação expressa prévia.

## Princípios que não devem ser reinterpretados

- A unidade escolar permanece como entidade monitorada.
- A bonificação, a análise técnica e a pendência são dimensões independentes.
- Novo envio não resolve a pendência.
- Reanálise positiva resolve; reanálise negativa reabre a providência.
- Pendência não altera automaticamente a bonificação.
- Retificação não altera automaticamente análise técnica ou pendências.
- `Aberta` e `Aguardando reanálise` são estados ativos.
- Não existe estado `Vencida`.
- Indicadores operacionais podem se sobrepor e não devem ser somados.

## Limitações atuais

- persistência local no navegador;
- Supabase desabilitado;
- ausência de autenticação real;
- permissões definitivas ainda não estabelecidas;
- sem integração automática com o Google Drive;
- publicação da correção aguardando renovação do limite da Vercel.
