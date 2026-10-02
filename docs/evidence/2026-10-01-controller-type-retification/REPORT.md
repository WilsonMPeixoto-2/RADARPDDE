# Retificação de classificação — Fase 2

**Classe:** evidência concluída da Fase 2.
**Baseline funcional de entrada:** main `92ddea14de25bfe644917900cac002a20094c57c` (#403).
**Estado:** encerrada, integrada pelo PR #404 e publicada em Production em 02/10/2026.

**PR:** [#404](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/404), merge `de7bebb06b867ebd557ff83cd9194fe3d45f5903`.
**Production:** `dpl_CLYY92KojCXpmQcL8xXQkmc3TdgG`, `READY`, alias `https://radarpdde-fix.vercel.app`, manifesto no merge `de7bebb06b867ebd557ff83cd9194fe3d45f5903`.
**Smoke pós-publicação:** HTTP 200 na raiz e em `/escolas/04.31.001`, sem escrita de dados reais.

## Contrato aprovado

Controlador/Assistente pode corrigir tipo de gasto no mesmo lançamento quando todo histórico individual for de Nota Fiscal e todas essas Pendências estiverem Resolvidas ou Canceladas. Qualquer histórico de Consulta à Assessoria impede essa mudança. Pendência ativa continua permitindo descrição, número/referência e valor.

Escola, competência, programa, identificação e histórico permanecem. Exclusão com histórico e transformação direta de `a_identificar` continuam bloqueadas. Bem já Inventariada impede conversão que o removeria. Versão e estado histórico desconhecidos falham fechados.

## Autoridade e efeitos

- A política compartilhada pertence ao InvoiceService; o editor consulta a mesma regra.
- O salvamento passa pelo InvoiceService, invoice-effects, DataService e saveInvoiceWithEffects existentes.
- A política é conferida antes do plano e novamente antes de aplicar a mutação.
- A auditoria contém tipo anterior/novo e identidade/contexto.
- As versões esperadas da NF, verificação e bem acompanham a operação atômica.
- Não há schema, migration, RPC, RLS, perfil ou segunda via de persistência novos.

O trigger existente protege o tipo com histórico de Assessoria e mantém contexto/exclusão bloqueados. A elegibilidade da retificação comum é regra da aplicação, como já era antes desta mudança. A execução descartável com Auth/RLS, row_version, efeitos patrimoniais e reload foi concluída e aprovada no candidato final.

## UX

Título Editar lançamento; NF/tipo/escola/competência/programa visíveis; orientações por estado; motivo específico do bloqueio; comparação Antes/Depois; efeitos administrativos antes de salvar; confirmação acessível com cancelamento/Escape; feedback específico de atualização e valor anterior/novo.

Foi corrigida a disputa com unidentified-expense-ux, que restaurava título e botão após a montagem da edição. A apresentação da retificação fica com auditable-retification; a extensão provisória continua cuidando do cadastro e da identificação.

As primeiras capturas revelaram confirmação no canto e seletor estreito. Isso impediu aprovação visual apesar dos testes funcionais verdes. A confirmação foi centralizada e recebeu fundo opaco; o seletor passou a usar a largura completa. As capturas finais de 1440×900 foram abertas e inspecionadas.

O teste adicional de Escape revelou que o gerenciador de modais legados fechava a edição sob a confirmação nativa. A integração agora respeita o modal nativo do topo para foco/Escape, sem adicionar um segundo trap de teclado. RED nos dois viewports; GREEN depois da correção, preservando formulário e valores.

Capturas: [classificação assistida](classificacao-assistida.png), [confirmação](confirmacao.png), [bem inventariado protegido](protegida-inventariada.png).

## Provas locais até este checkpoint

- RED real: oito transições inicialmente permitidas falharam no bloqueio genérico de tipo antes da implementação.
- Novo contrato: 22 testes, incluindo seis transições entre consumo/serviço/permanente com histórico Resolvida e Cancelada e contraprovas.
- Contrato + feedback: 30/30 aprovados.
- Readiness completo local: 1.209 testes unitários e oito de integração aprovados, com demais etapas do comando concluídas. Executado antes dos últimos ajustes apenas de composição/confirmação; o CI do candidato final deverá reaplicar os gates.
- Cinco novos E2Es de classificação/UX aprovados sem retries; sete E2Es com descobribilidade aprovados no checkpoint anterior.
- Sete E2Es finais da nova classificação/UX aprovados sem retries, incluindo 1366×768 e 1920×1080 com título/ação no viewport e Escape preservando a edição.
- Quinze E2Es relacionados aprovados sem retries: edição cadastral com Pendência ativa, dados provisórios, patrimônio/Assessoria, projeções, envio repetido, foco/Escape e jornada completa de identificação.
- Axe na confirmação sem violações.
- Evidência de reload desta rodada local usa repositório local; não é prova de Supabase Production.

## Encerramento

- candidato final antes do merge: `af76855c3a11a82f5e2fce985531f2f39a79f2fc`;
- todos os workflows aplicáveis do candidato final encerraram verdes, incluindo E2E completo, ciclos funcionais reais com Supabase, confiabilidade com reload, Supabase readiness, Auth/RLS/pgTAP, regressão visual desktop, perfis/viewports, Lighthouse e CodeQL;
- integração: PR #404, merge `de7bebb06b867ebd557ff83cd9194fe3d45f5903`;
- Vercel Production: `dpl_CLYY92KojCXpmQcL8xXQkmc3TdgG`, `READY`, target `production`, região `gru1`;
- smoke observacional pós-publicação: raiz e rota profunda `/escolas/04.31.001` responderam HTTP 200;
- nenhuma escrita em dados reais de Production foi necessária para o encerramento.

A Fase 2 está encerrada. NAV-01/UX-04, PROD-UX-08, exclusão, anulação auditável, transferência estrutural e futuras flexibilizações não fazem parte desta entrega e não são abertas automaticamente por este encerramento.

## Checkpoint remoto do candidato inicial

O [CI de ciclos reais](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/36941153472) do SHA `834e6fef134905bfb46729915e04e3c5855d9bdc` aprovou 21 jornadas sem falhas, incluindo a nova retificação autenticada por Controlador: consumo → serviço → permanente → consumo, versões incrementadas, histórico/snapshots preservados, bonificação manual preservada e reload relendo Supabase após cada gravação. Este ambiente é descartável; não é Production.

O gate direcionado desse mesmo SHA revelou a falha de Escape nos dois viewports. A correção e o GREEN local estão registrados acima e serão reaplicados pelo CI do novo head. O Preview automático foi ignorado pela configuração do repositório; status Vercel verde não é prova de artefato publicado.

No SHA `93753031075b29565395875248fc86d0f5f502ef`, o [gate direcionado](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/36941908969) passou. A nova jornada de retificação também passou no [job de ciclos reais](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/36941908924), mas o agregado não foi aprovado: 17 passed, 1 flaky, 1 failed e 2 did not run. A falha é a captura integral do painel CONECTADA em `supabase-expense-independence.spec.js:58`, também presente na [baseline #403](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/36935874406). Não foi enfraquecida a asserção nem expandido o escopo para corrigir esse painel. A prova nova foi ampliada para conferir criação/remoção do bem em cada etapa e estado inicial de Assessoria, e precisa reaplicar o CI.

O Preview prebuilt inicial `dpl_EGdMxm92uRpkUjk1fcrKyQiBqmNQ` foi publicado como READY, com manifesto no SHA `93753031…`, modo local e Supabase desabilitado. A navegação pela UI permitiu criar NF sintética, abrir Pendência, registrar envio e resolver pela reanálise, e mostrou a nova edição protegida. Entretanto, o refresh direto de `/escolas/04.31.001` retornou 404; esse artefato não está homologado. Será conferida a publicação com build remoto a partir do código versionado, sem alteração de regras ou rotas de produto neste PR.

Outro limite do Preview local: uma NF criada pela UI não recebe `row_version`; após resolver a Pendência, o editor mantém classificação bloqueada pedindo recarregamento. Isso preserva a proteção de estado/versionamento desconhecido. A elegibilidade com versão real é comprovada no Supabase descartável e nas fixtures versionadas; o Preview local não deve ser descrito como homologação desse ciclo persistente.

