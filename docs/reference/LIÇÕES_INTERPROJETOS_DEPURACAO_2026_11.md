# RADAR PDDE — lições complementares de diagnóstico externo (04/11/2026)

**Classificação: referência suplementar histórica.** NÃO substitui `docs/reference/ENGINEERING_METHOD.md`, `docs/reference/FRONTEND_USER_VALIDATION_GATE.md`, as ADRs, `AGENTS.md`, `docs/CURRENT_STAGE.md` nem o estado real em Production.

O método canônico do RADAR já exige reproduções adversariais, comparação de código real, interleavings, provas de invariantes e validação do frontend. Este registro acrescenta apenas cuidados surgidos em incidentes interprojetos, sem importar arquitetura de outro produto.

## Ampliações práticas
1. **Falha Vercel em pré-build:** se código igual publica em outro projeto mas o original aborta antes de compilar, testar um artefato mínimo e inspecionar Storage/Marketplace, integrações suspensas, quotas e configuração específica do ID original. Não criar Vercel paralelo para contornar o sintoma.
2. **Ambientes múltiplos:** identificar equipe, project ID, commit e domínio em cada status `READY`. Status de *outro* projeto para o mesmo GitHub não confirma produção do RADAR.
3. **Navegador autenticado:** quando autorizado, investigar rede/console/capturas e comportamento real. Um 403 administrativo não equivale a 403 de RLS ou a um erro da aplicação; não desativar proteções para facilitar testes.
4. **Supabase e invariantes:** validar estado remoto persistido, reconsulta/reload, concorrência e fluxo vizinho legítimo. `READY`, teste unitário ou tela visível não basta.
5. **Evidências versionadas:** documentar falha inicial, causa comprovada, mudança e contraprova regressiva com IDs/SHA, sem reclassificar documentos históricos como estado atual.

Este arquivo NÃO cria tarefa, muda regra de negócio ou autoriza deploy. Usar o método canônico e as decisões vigentes para selecionar verificações proporcionais ao risco.

**Fontes do projeto:** `docs/reference/ENGINEERING_METHOD.md` e `AGENTS.md`.
