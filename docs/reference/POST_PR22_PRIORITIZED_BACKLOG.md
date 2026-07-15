# Backlog priorizado pós-PR 22

## Método

- **P0** — risco crítico atual comprovado;
- **P1** — bloqueia próximo estágio ou causa perda operacional relevante;
- **P2** — ganho alto de produto ou manutenção;
- **P3** — evolução útil não bloqueadora;
- **P4** — hipótese para estudo posterior.

A prioridade não substitui os gates do Plano Diretor. Itens `CP` e `ID` são proteções; itens `DQ` não entram em implementação antes de decisão.

## Itens

| ID | Prioridade | Ciclo | Superfície | Classe | Evidência | Problema/oportunidade | Resultado esperado | Preservações | Dependências | Visual | Decisão humana | Supabase | Pacote sugerido |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| BL-DATA-01 | P0 | proteção anterior a B/F | dados iniciais | DC | `app.js:79-4180`; 163 registros D0/D1/D2 | contato e direção reais estão no repositório público e bundle | árvore ativa e bundle sem D2 real; fixtures seguras | cadastro, programas, atribuições e testes | BL-DATA-02/03 | não | sim | não depende de RLS | Separação de dados reais e fixtures |
| BL-DATA-02 | P0 decisão | governança | Git | DQ | auditoria de dados DQ-01 | remover da árvore não remove commits anteriores | decisão proporcional sobre histórico, clones e Vercel | rastreabilidade e recuperação | avaliação jurídica/institucional | não | sim | independente | Plano de saneamento do histórico |
| BL-DATA-03 | P1 decisão | governança/F | cadastro escolar | DQ | auditoria DQ-02 | fonte oficial, campos necessários e perfis não estão formalizados | contrato de dados e acesso minimizado | tarefa operacional dos perfis | responsável institucional | não | sim | orienta schema/RLS | Matriz de campos e perfis |
| BL-GUARD-01 | P1 proteção | todos | domínio | CP/ID | `PRODUCT_DECISIONS.md`; E2E | risco de simplificação eliminar semântica | testes e PRs referenciam IDs preservados | todo o modelo de domínio | nenhuma | não | não | neutro | Checklist automático de decisões |
| BL-FE-01 | P1 | B1 | frontend | IC | `config.js:90-116`; 9 CSS/17 scripts | precedência acumulativa e sobreposição potencial | grafo de carga e consolidação sem mudança visual | identidade, seletores e fluxos | baseline visual | sim, se mudar aparência | não para auditoria; sim para mudança | neutro | Precedência e consolidação frontend |
| BL-UX-01 | P1 | B3 | modais/feedback | IC/FA | piloto concluído na desativação de controladora; demais `alert/confirm` seguem inventariados | contratos acessíveis e diálogos nativos ainda coexistem | expandir feedback previsível e confirmações críticas acessíveis por fluxo auditado | texto, regras e bloqueios | contratos C-01–C-16; piloto B3 | sim | sim para ações críticas | neutro | Interações compartilhadas |
| BL-NAV-01 | P1 | C | navegação | FA | `switchView`; filtros em estado local | contexto não é plenamente recuperável ou compartilhável | refresh, back/forward, deep link, filtro e rolagem preservados | fluxos e permissões | contrato de navegação | sim | sim | não expor D2 na URL | Estado navegável e URLs |
| BL-SUP-01 | P1 | F1/F2 | backend remoto | DF | PR 22; runbook de conexão | projeto remoto ainda não executado | Preview autorizado e 12 migrations aplicadas | produção local e rollback | A2 concluído; projeto autorizado | não | sim para projeto | núcleo do item | Projeto Preview e migrations |
| BL-SUP-02 | P1 | F3 | autenticação/RLS | DF | matriz de permissões e Auth local | usuários reais e escopos ainda não homologados | cinco perfis e negações comprovados remotamente | políticas e contratos locais | BL-SUP-01; BL-DATA-03 | não | sim | núcleo do item | Usuários e RLS remotos |
| BL-SEC-01 | P1 antes de F6 | G1 | entrega web | FA | ausência de contrato de CSP/headers no repositório | proteção de entrega não está formalizada | headers e recursos externos testados sem quebrar app | fontes, exportação e assets | inventário de recursos; Preview | não | sim para política | antecede produção remota | Hardening Vercel/web |
| BL-WAL-01 | P2 decisão | D2 | Carteira | FA/DQ | tabela desktop ampla; cartões mobile | densidade pode elevar custo de comparação | tarefa mais rápida sem perder coluna ou ação | tabela integral e mobile cards | pesquisa com usuário; mockups | sim | sim | neutro | Produtividade da Carteira |
| BL-DASH-01 | P2 | D1/C | Dashboard | FA | filtros e recortes em memória | ao retornar, recorte pode não ser recuperado | card, lista e próxima ação retomados exatamente | universos sobrepostos | BL-NAV-01 | sim | sim se mudar hierarquia | neutro | Estado recuperável do Dashboard |
| BL-EMPTY-01 | P2 | B/D/E | estados vazios | FA/IC | catálogo S-04/S-06/S-18 | vazios variam e podem parecer falha | motivo, filtro e próxima ação explícitos | não inventar dados | contrato C-09 | sim | sim para texto institucional | neutro | Sistema de estados vazios |
| BL-FORM-01 | P2 | B/E | formulários | FA/IC | S-08/S-17; `data-error-ux` | dirty, saving, sucesso e erro não são uniformes | prevenção de perda e feedback por campo | serviços/rollback e conteúdo | C-01/C-03/C-10/C-11 | sim | sim para fluxo | deve equivaler remoto/local | Contrato de formulários |
| BL-INV-01 | P2 | E1 | Inventário | FA | S-06; notas permanentes integradas | informação e próxima ação menos maduras | fila, filtro e estado claros | vínculo nota-bem-processo | auditoria específica | sim | sim | backend já preparado | Evolução do Inventário |
| BL-AUD-01 | P2 | E2 | Registros Internos | FA | S-07; modelo de eventos rico | tela de consulta não explora filtro e contexto | localizar evento e origem com rapidez | integridade e retenção | política D6 | sim | sim | logs remotos no F/G | Consulta de auditoria |
| BL-SME-01 | P2 | E3 | Configurações SME | FA/IC | S-08; estilos inline e `alert` | experiência administrativa abaixo das áreas centrais | cadastros previsíveis e auditáveis | regras transacionais e permissões | BL-UX-01/FORM-01 | sim | sim | Auth/RLS por perfil | Paridade de Configurações |
| BL-HELP-01 | P3 | E | ajuda contextual | EP | conceitos complexos sem sistema comum de ajuda | novos usuários dependem de conhecimento tácito | glossário e ajuda ligados à tarefa | nomenclatura institucional | catálogo e contratos | sim | sim | neutro | Ajuda e onboarding contextual |
| BL-OBS-01 | P2/P3 | G2/G4 | operação | EP/FA | sem contrato de erro real/métricas | falhas e abandono em produção não são mensuráveis | diagnóstico com dados minimizados | privacidade e conteúdo institucional | BL-DATA-03; Preview | não | sim para telemetria | após conexão ou piloto | Observabilidade e métricas |
| BL-PERF-01 | P3 | G3 | desempenho | EP | `app.js`, CSS e tabelas extensas; sem baseline Web Vitals | não há budget nem comparação real | budgets baseados em cenários reais | comportamento e qualidade visual | observabilidade mínima | não | não | medir local/remoto | Baseline de desempenho |
| BL-EXCEL-01 | P2 decisão | E/exportação | Excel | ID/DQ | protótipo v2.1 congelado; auditoria DQ-03 | classificação e distribuição do arquivo não definidas | orientação acompanha o relatório sem regressão | workbook aprovado integral | decisão institucional | sim, se alterar workbook | sim | dados remotos influenciam recorte | Governança da exportação |
| BL-PWA-01 | P4 | estudo | plataforma | EP | operação local funciona offline parcialmente, sem PWA | benefício não comprovado | decisão baseada em necessidade de campo | não aumentar risco/cache de dados | pesquisa de uso | sim | sim | conflito com dados sensíveis | Estudo offline/PWA |
| BL-INTEL-01 | P4 | H | inteligência | EP | dados e fórmulas ainda serão estabilizados | risco de indicadores sem ação ou leitura errada | alertas e tendências auditáveis ligados a decisão | decisão humana e sobreposição | F/G concluídos | sim | sim | requer dados estáveis | Inteligência operacional |

## Dependências

```text
BL-DATA-02 + BL-DATA-03
        ↓
BL-DATA-01 ───────────────┐
                          ├→ BL-SUP-02 → ensaio de migração → F6
BL-SUP-01 ────────────────┘

baseline visual → BL-FE-01 → BL-UX-01/BL-FORM-01
                         └→ BL-NAV-01 → BL-DASH-01/BL-WAL-01

BL-SEC-01 + backup/restauração + homologação → ativação remota

F + G estáveis → BL-INTEL-01
```

BL-SUP-01 pode avançar em paralelo à consolidação visual. A importação de dados reais e os perfis definitivos dependem da classificação institucional de campos e acesso.

## Dúvidas que exigem decisão

### DQ-DATA-01 — Histórico Git

- **Evidência:** D2 já existe em commits públicos.
- **Alternativa A:** retirar da árvore ativa e preservar histórico; menor impacto, exposição histórica remanescente.
- **Alternativa B:** reescrever histórico; maior redução, alto impacto em clones, PRs, tags e rastreabilidade.
- **Recomendação provisória:** remover da árvore ativa imediatamente após aprovação e abrir avaliação autônoma do histórico.

### DQ-DATA-02 — Campos e perfis

- **Evidência:** cadastro mistura contato institucional, pessoal e dados operacionais.
- **Alternativa A:** manter todos no banco protegido; maior conveniência e responsabilidade.
- **Alternativa B:** manter apenas o indispensável e consultar fonte oficial para demais dados; menor exposição.
- **Recomendação provisória:** privilegiar contato institucional e acesso por necessidade funcional.

### DQ-WAL-01 — Densidade da Carteira

- **Alternativa A:** todas as colunas sempre visíveis; comparação integral e rolagem maior.
- **Alternativa B:** colunas configuráveis; flexibilidade e necessidade de gestão de preferência.
- **Alternativa C:** detalhe expansível; leitura inicial mais leve e comparação secundária menos direta.
- **Recomendação provisória:** testar configuração de colunas preservando um conjunto operacional obrigatório.

### DQ-EXCEL-01 — Classificação do workbook

- **Alternativa A:** aviso dentro do arquivo; acompanha a cópia, mas altera referência congelada.
- **Alternativa B:** aviso apenas na interface; preserva workbook, mas não acompanha redistribuição.
- **Recomendação provisória:** decidir em plano autônomo de governança da exportação.

## Primeiro pacote recomendado

- **Pacote:** Proteção da árvore ativa e separação entre dados reais, fixtures e demonstração.
- **Achados envolvidos:** BL-DATA-01, BL-DATA-02 e BL-DATA-03.
- **Evidências:** `app.js:79-4180`; auditoria de dados; repositório público.
- **Por que vem primeiro:** é o único defeito atual com consequência independente do Supabase e do redesign.
- **Resultado esperado:** bundle público sem D2 real, fixtures determinísticas e fonte de dados preparada para ambiente protegido.
- **O que será preservado:** 163 unidades, designações, programas, atribuições, regras, testes e funcionamento local, usando dados autorizados ou sintéticos conforme ambiente.
- **Dependências satisfeitas:** arquitetura de repositório e migração já preparadas.
- **Aprovação visual necessária:** não para separação de dados; sim se campos visíveis forem removidos ou reorganizados.
- **Decisão humana necessária:** DQ-DATA-01 e DQ-DATA-02.
- **Plano técnico a criar:** `docs/superpowers/plans/YYYY-MM-DD-protecao-dados-arvore-ativa.md` após as decisões.

Enquanto essas decisões são obtidas, `BL-SUP-01` (projeto Preview e migrations) e a auditoria de precedência `BL-FE-01` podem ser planejadas sem dados reais e sem bloquear uma à outra.
