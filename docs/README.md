# Documentação do RADAR PDDE

Este diretório organiza as fontes funcionais, arquiteturais, históricas e de acompanhamento do projeto.

## Estado de referência

A base funcional consolidada contém os PRs 18 a 21, já incorporados à `main` e publicados no Vercel. A preparação estrutural para Supabase é tratada em pacote separado, sem ativação de conexão remota.

O relatório histórico mais recente anterior a esse pacote permanece em:

- [`reports/RELATORIO_ESTADO_ATUAL_2026-07-12.md`](reports/RELATORIO_ESTADO_ATUAL_2026-07-12.md) — progressão dos PRs 18 e 19 e situação registrada naquela data.

Para o estado técnico atual da persistência, prevalecem a arquitetura e os runbooks de prontidão para Supabase listados abaixo.

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
- [`architecture/excel-export.md`](architecture/excel-export.md) — exportação estruturada para Excel;
- [`architecture/supabase-readiness.md`](architecture/supabase-readiness.md) — arquitetura de persistência preparada e bloqueada por configuração.

## Supabase: referências e runbooks

- [`reference/SUPABASE_DATA_DICTIONARY.md`](reference/SUPABASE_DATA_DICTIONARY.md) — tabelas, campos, chaves e relacionamentos;
- [`reference/SUPABASE_PERMISSIONS_MATRIX.md`](reference/SUPABASE_PERMISSIONS_MATRIX.md) — perfis e permissões futuras;
- [`runbooks/SUPABASE_CONNECTION.md`](runbooks/SUPABASE_CONNECTION.md) — conexão futura em ambiente controlado;
- [`runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md`](runbooks/SUPABASE_MIGRATION_AND_ROLLBACK.md) — snapshot, importação, reconciliação e retorno ao modo local;
- [`superpowers/specs/2026-07-13-supabase-readiness-design.md`](superpowers/specs/2026-07-13-supabase-readiness-design.md) — desenho aprovado;
- [`superpowers/plans/2026-07-13-supabase-readiness.md`](superpowers/plans/2026-07-13-supabase-readiness.md) — plano de implementação.

## Situação funcional

### Incorporado à `main` e produção

- Ciclo A concluído até as Tasks 10–13;
- quatro filas canônicas de pendências;
- novo envio e reanálise;
- registro de contatos, cancelamento e reabertura;
- retificação administrativa pelo perfil Assistente;
- Dashboard operacional do Controlador;
- Carteira de Escolas com filtros técnicos, ações contextuais e interface aprovada;
- acessibilidade dos modais legados;
- navegação contextual e relatório Excel;
- adaptação móvel da Carteira.

### Persistência vigente

- dados iniciais e regras continuam no frontend;
- persistência oficial continua no `localStorage`;
- Supabase permanece sem URL, sem chave e sem chamadas de rede;
- os adaptadores e migrations são infraestrutura preparada, não ativada.

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
- ausência de autenticação real;
- ausência de sincronização entre dispositivos;
- permissões definitivas ainda não ativadas;
- sem integração automática com o Google Drive.
