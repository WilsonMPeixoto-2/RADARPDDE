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
| `reference/RADAR_PDDE_Dossie_Contexto_Regras_Decisoes_v1_0.docx` | Contexto, regras de negócio e decisões consolidadas | Canônico |
| `reference/RADAR_PDDE_Plano_Lote_2_Revisao_Consolidada_v2_0.docx` | Contrato funcional, visual e de navegação | Aprovado |
| `reference/RADAR_PDDE_Prototipo_Exportacao_Conservadora_v2-1.xlsx` | Estrutura e identidade da exportação Excel | Referência congelada |
| `reports/RADAR_PDDE_Relatorio_Guia_Ciclo_A_v1_0.docx` | Relatório funcional e guia para usuários | Referência de uso |
| `reference/STATUS_DOCUMENTOS.md` | Matriz de precedência, disponibilidade e atualização | Vigente |

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
