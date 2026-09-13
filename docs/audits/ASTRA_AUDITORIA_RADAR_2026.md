# Auditoria independente — RADAR PDDE 2026

**Data:** 13/09/2026. **Classe:** relatório incremental de auditoria; não substitui decisões canônicas.  
**Alvo:** `WilsonMPeixoto-2/RADARPDDE`, branch `fix/supabase-query-architecture-2026-09-11`.  
**Código auditado:** `8409297194e7b65dcf080c0638af77c882d8e2e0`. **Comparação funcional:** merge do PR #299, `d2663f1ae7554516caf315f53b2509fbcd295e01`.

## Estado atual da auditoria

- Último bloco concluído: 2 — ciclo de vida das entidades e custo do estado.
- Descobertas: logs excluídos do bootstrap, mas 13 outras coleções continuam integralmente carregadas; confirmado bloqueio de readiness no modo local por extensão exclusiva do remoto. Integração corrigida; desktop incompleto.
- Investigação seguinte: Análise e Bonificação, da interação ao retorno confirmado.
- Pendentes: blocos 3–12; situação efetiva de Production não revalidada; nenhuma medição atual do banco; nenhuma prova de equivalência integral.
- Restrições: somente a branch isolada; nenhuma alteração de main, banco, migrations, secrets, configuração ou deployment de Production.

## Método e escala de evidência

Cada bloco registra arquivos/funções, conclusões, problemas, riscos, descartes e pendências antes do seguinte. Classificações: **confirmado**, **provável**, **hipótese**, **descartado**. Prioridades: crítica, alta, média, baixa. Medidas sintéticas não serão apresentadas como desempenho de Production; testes locais ou com fronteiras simuladas não certificam RLS/banco remoto.

A autoria desta auditoria é a assistência executada nesta conversa; o nome do arquivo segue a solicitação. Não se presume independência por troca de modelo: a independência é metodológica, por contraprovas e separação entre fatos e hipóteses.

## Bloco 0 — base e certificação

**Examinado:** `AGENTS.md`, modelo canônico, catálogo de superfícies, CURRENT_STAGE, método de engenharia, gate de frontend, validade documental, matriz funcional; manifests e workflows; `SupabaseRepository.load/loadAfterId/exportSnapshot`; teste de integração do bootstrap administrativo.

**Evidências:**

- Ancestralidade do merge #299 confirmada por `git merge-base --is-ancestor`.
- Base inicial `4c10fdd`: integração reproduzida com 1 aprovação e 3 falhas `MISSING_KEYSET_PAGINATION` em `appConfig`.
- `loadAfterId` recebe `this.pageSize`; o cliente simulado não tinha os métodos `limit` e `gt`. Correção registrada em `4fa29f3`; proteção do produto não modificada.
- Verificações locais: integração 8/8, unitários 984/984, sintaxe aprovada, arquitetura sem violações em 180 módulos/254 dependências; lint de segurança sem erros e 42 avisos existentes; lint E2E sem erros e 159 avisos.
- [Execução 34718744668](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/34718744668), código `8409297`: cinco testes desktop aprovados, um reprovado e 19 não executados pela parada na primeira falha. Não há certificação desktop integral.
- Falha: `tests/e2e/evaluation-retification-ui.spec.js`, linha 67, `await page.evaluate(() => window.RadarProductExtensionsReady)`; timeout de 30 s nas duas tentativas. O teste não chegou à retificação.
- [Artefato de screenshots/trace](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/34718744668/artifacts/10305153527), SHA-256 `8e9dc63b49942f0bc6d73444dc0bf9087ec643ee5f78ee8d10f69a8ff3c6e92e`.
- Execução anterior 34718133423 foi cancelada pela concorrência ao publicar parada na primeira falha; não representa aprovação.

**A-01 — Certificação desktop bloqueada na espera das extensões.** Impacto: não foi possível provar o fluxo de retificação. Causa ainda aberta; não atribuir o timeout à RPC, Supabase, regra de retificação ou autenticação sem trace. Situação: falha do teste confirmada; defeito de produto ainda indeterminado. Prioridade alta para certificação. Recomendação: localizar a promessa/dependência pendente e reproduzir com fronteira controlada. Cobertura: não corrigido.

**Hipótese descartada neste recorte:** ausência de tamanho da página no fluxo `exportSnapshot → load → loadAfterId` como causa das três falhas anteriores. O limite existe; faltava suporte no simulador.

**Contexto recebido, não remensurado:** cerca de 3.562 logs e 46 s de leitura pelo Controlador; rollback anterior não autorizado; migration #299 permaneceu aplicada. São informações do handoff, a confrontar com código e evidência remota disponível.

## Bloco 1 — autenticação e entrada

**Examinado:** `src/auth/session-service.js` (`signIn`, `establishFresh`, `loadAuthorization`), `src/integration/auth-bootstrap.js`, `auth-gate.js` (`waitForAuthorizedData`, `handleSubmit`, `showWorkspaceError`), `app.js` (`initializeRadarData`, `initializeRadarApplicationServices`, handler DOMContentLoaded), `src/application/data-service.js` (`bootstrap`), `src/data/supabase-repository.js` (`exportSnapshot`, `load`, `loadAfterId`), `repository-contract.js`, loader e leitor administrativo.

**Fluxo comprovado:** sessão Supabase → três verificações paralelas de perfil/papel/escopo → criação do repository/state port → snapshot de 13 entidades → conversão para estruturas legadas em memória → serviços → `RadarDataContext.ready` → aplicação de autorização/abertura da interface. A sessão persiste pelo SDK; as coleções operacionais não devem persistir. O snapshot executa até seis entidades em paralelo; dentro de cada entidade percorre páginas de 500, sequencialmente, até esgotar todos os registros visíveis por RLS. Não há recorte de competência nessa consulta genérica. Uma página limitada não limita o volume total do bootstrap.

**A-01 refinado — Readiness impossível no modo local.** Impacto: consumidores de `RadarProductExtensionsReady` ficam esperando indefinidamente; E2E de retificação não inicia, embora o Dashboard esteja visível. Evidência: `product-extensions-bootstrap.js/installCriticalExtensions` exige sempre sucesso do leitor administrativo; `administrative-log-read-model.js/install` retorna falso se o repository não tem `queryAdministrativeLogs`; o repository local não tem essa capacidade. `waitForCriticalExtensions` só acorda com evento de serviços e não distingue dependência inaplicável de dependência atrasada. Reprodução Node/VM reutilizando o harness do loader, com o **instalador real**: 22 scripts solicitados, zero falhas de scripts, instalador falso, loading verdadeiro e promessa ainda pendente após 100 ms. Trace do Chromium: 145 requisições, scripts relevantes HTTP 200; screenshot inspecionado mostra Dashboard carregado. Situação: **confirmado**, prioridade **alta**, presente na branch. Correção mínima: condicionar a obrigatoriedade ao modo/capacidade remota, mantendo falha fechada quando o Supabase realmente exigir esse leitor. Teste deve cobrir ambos os modos e atraso real dos serviços. O harness atual substitui o instalador por `() => true`, mascarando a incompatibilidade. Não é evidência de falha da RPC de retificação ou do login Supabase.

**A-02 — Barreira de inicialização ainda depende de todo o acervo operacional autorizado.** Impacto: qualquer entidade crescente ou consulta lenta pode atrasar a primeira tela, mesmo que ela não use os dados. Evidência: `REMOTE_BOOTSTRAP_ENTITIES` inclui verificações, despesas, bens, Pendências, tentativas e contatos; `load` varre até o fim; abertura ocorre após `await bootstrap`. Causa: contrato de snapshot ainda completo para esses domínios. Situação: arquitetura **confirmada**, futuro impacto de volume **provável**, prioridade **alta**; correção dos logs resolve uma fonte, não estabelece limite total. Recomendação: medir por entidade e depois introduzir consultas de operação atual/contexto temporal com carregamento explícito de competências antigas; não remover essas entidades sem mapear consumidores. Cobertura: parcial.

**Conclusão causal provisória:** o código sustenta a hipótese de demora pós-autenticação por leitura desnecessária; os números históricos recebidos ainda não são prova instrumental produzida nesta auditoria. Há pelo menos uma regressão independente em readiness local. A nova distinção visual de erro pós-autenticação é correta; `unhandledrejection/error` permite informar falha, mas uma promessa que nunca termina não dispara esses eventos. A espera de dados/autorização/navegação também não tem prazo máximo.

**Descartes:** scripts de retificação ausentes no trace; falta de senha como explicação do E2E local; ausência de limite no repository como causa das três integrações antigas. **Questões abertas:** distribuição real do tempo por consulta/RLS, tamanho por entidade e comportamento de timeout no modo remoto. **Checkpoint:** bloco concluído com análise estática e reprodução controlada; sem chamadas ao banco de Production.

## Bloco 2 — ciclo de vida e custos transversais

**Examinado:** política `ENTITY_LIFECYCLE`; serviços configuration/directory/school/verification/pendency/invoice/inventory/audit; consumidores em `app.js` (alerts, Dashboard, Pendências, prontuário, avaliações); `UnitOfWork.run`, `DataService.executeCommand`, `StatePort.capture/exportFromMemory/applyEntities` e ponte de estado.

Todas as coleções da tabela permanecem em memória até recarga/encerramento do documento; o modo remoto não persiste o bootstrap em localStorage. Quantidades atuais não foram consultadas.

| Entidade | Nascimento/escrita | Leitores reais | Natureza e carga atual | Avaliação |
|---|---|---|---|---|
| Configuração, programas, controladores, equipe | Serviços configuration/directory | Calendário, perfil operacional, formulários | Pequenos estruturais; bootstrap | Adequado manter inicial |
| Escolas e vínculos escola/programa | SchoolService e atribuições | Carteira, Dashboard, seletores, avaliação | Estrutural por escopo; bootstrap | Adequado para carteira atual; depende do escopo RLS |
| Competências | createExercise → RPC | Navegação temporal e regras mensais | Calendário cresce lentamente; bootstrap | Manter; não confundir com os registros mensais |
| Verificações/avaliações | VerificationService, efeitos de Pendências/notas | Dashboard, Análise, Bonificação, prontuário | Escola × programa × mês; todos os meses no bootstrap | Histórico crescente tratado como operação atual |
| Pendências | PendencyService, avaliação incorreta, notas | Fila, alertas, detalhes, prontuário | Workflow com acúmulo de encerradas; bootstrap integral | Separar ativos de histórico exige preservar passivos |
| Tentativas | registerAttempt/RPC documental | Detalhes/reanálise e estado aninhado da Pendência | Histórico filho crescente; bootstrap integral | Candidato a consulta contextual, após mapear projeções |
| Contatos | registerContact → RPC | Alertas, Pendências, prontuário | Histórico filho crescente; bootstrap integral | Alertas precisam de último contato/resumo, não necessariamente todo histórico |
| Notas/despesas | InvoiceService/RPCs e reanálises | Documentos, avaliação, Pendências, Inventário | Histórico por competência; bootstrap integral | Recorte por contexto possível; não simplesmente retirar |
| Bens | InventoryService, efeitos de nota permanente | Fila patrimonial, Dashboard, prontuário | Operação pendente + histórico concluído; bootstrap integral | Preservar bens pendentes de competências anteriores |
| Logs administrativos | appendLog e RPC/insertOnly | Auditoria e histórico escolar | Append-only; página contextual sob demanda | Estratégia alinhada, sujeita a avaliação de cache no bloco 6 |
| Perfis/vínculos/escopos | Gestão institucional | SessionService/RLS | Auth-only | Não duplicar no snapshot operacional |
| dataImportRuns/auditEvents | Importação/mecanismos técnicos | Manutenção/auditoria técnica | Append-only; fora do bootstrap | Adequado |

**A-03 — Escrita incremental de rede ainda reconstrói o snapshot completo no navegador.** Impacto: uma alteração simples custa CPU e aloca memória proporcional a todos os dados carregados, mesmo sem reler o banco; coleções auxiliares já abertas também participam. Evidência: `UnitOfWork.run` captura memória completa, muta, exporta estado inteiro e clona o snapshot na entrada da persistência e no retorno; `StatePort.exportFromMemory` clona memória, executa `JSON.stringify` de cada chave legada em um storage temporário e chama `exportLegacySnapshot`. `applyEntities` reduz a aplicação final, mas recebe coleções inteiras daquela entidade, não somente uma linha. Causa: fronteira transacional reutiliza snapshots de compatibilidade para toda operação. Situação **confirmada**, prioridade **alta** para crescimento; magnitude temporal ainda não medida. Correção mínima: caminho transacional por entidades/registro afetado e captura de rollback correspondente, preservando fila, versões e retorno confirmado. Cobertura: rede parcialmente otimizada; CPU/memória ainda presentes.

**A-04 — Alertas têm varredura multiplicativa de contatos.** Impacto: trabalho de primeira tela aumenta com Pendências ativas × total de contatos. Evidência: `app.js/getAlerts` percorre `pendencias` e executa `contatos.filter` dentro de cada ativa. Existem índices para outros consumidores (`rebuildOperationalIndexes`), mas esse trecho não os usa. Situação **confirmada**, prioridade **média**; recomendação: índice por Pendência/último contato construído uma vez, sem mudar regra do alerta. Cobertura: presente.

**Conclusão:** a arquitetura tem política central útil, mas as classes `scoped/workflow` não estabelecem limite temporal ou quantitativo. A ponte legada e estruturas em memória possuem numerosos consumidores legítimos; remoção indiscriminada quebraria o produto. **Descartado:** pressupor que atualização incremental elimina serialização global. **Aberto:** custos medidos e quantidades reais; avaliação de caminhos específicos de releitura nos blocos seguintes.
