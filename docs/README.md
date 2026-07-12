# Documentação do RADAR PDDE

Este diretório organiza as fontes funcionais, arquiteturais e históricas do projeto.

## Regra de precedência

1. orientação expressa mais recente do responsável pelo projeto;
2. Dossiê Consolidado;
3. Plano aprovado do Lote 2;
4. planos técnicos e especificações;
5. implementação vigente.

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
- [`architecture/pendencias-reanalise.md`](architecture/pendencias-reanalise.md) — ciclo documental e reanálise;
- [`architecture/modelo-operacional.md`](architecture/modelo-operacional.md) — projeção compartilhada entre telas;
- [`architecture/retificacoes.md`](architecture/retificacoes.md) — retificação administrativa auditável.

## Planos e especificações

Os diretórios `superpowers/specs` e `superpowers/plans` registram o desenho aprovado e o plano TDD de cada pacote. Esses documentos explicam como as regras canônicas foram materializadas, mas não substituem o Dossiê nem o Plano aprovado.

## Situação funcional

### Produção

- Ciclo A concluído até a Task 9;
- quatro filas canônicas de pendências;
- novo envio e reanálise;
- separação entre bonificação, análise técnica e pendência;
- navegação contextual e relatório Excel.

### Em desenvolvimento no PR 18

- Tasks 10–13;
- contatos, cancelamento e reabertura;
- retificação pelo perfil Assistente;
- Dashboard e Carteira do Ciclo B;
- alertas e indicadores alinhados;
- atualização documental.

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
- sem integração automática com o Google Drive.
