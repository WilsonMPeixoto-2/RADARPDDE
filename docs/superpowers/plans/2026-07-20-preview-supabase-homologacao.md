# Preview Supabase e Homologação Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Conectar somente o ambiente Preview da Vercel ao Supabase remoto já carregado, validar o manifesto e preparar a homologação funcional sem alterar Production.

**Architecture:** Um workflow GitHub Actions idempotente configura exclusivamente as variáveis Preview da Vercel, executa build prebuilt, valida o manifesto público e publica um deployment Preview. Os gates do repositório verificam que não há `--prod`, chave administrativa ou ativação de Production. A documentação operacional passa a refletir as 14 migrations, os dados remotos e os quatro acessos iniciais.

**Tech Stack:** GitHub Actions, Vercel CLI 56.2.0, Node.js 24, Supabase, Node Test Runner.

## Global Constraints

- Production deve permanecer em `dataMode=local` e `supabaseRepositoryEnabled=false`.
- O frontend pode receber apenas URL e chave publicável do Supabase.
- Nenhuma chave `service_role`, `sb_secret_*`, senha ou token administrativo pode ser versionado ou publicado.
- O Preview deve usar `RADAR_DATA_MODE=supabase-preview` e `RADAR_SUPABASE_PRODUCTION_ACTIVATION_APPROVED=false`.
- O projeto remoto é `scnryinorqeucbfkioxo` e contém 14 migrations, 163 escolas e 430 vínculos escola–programa.

---

### Task 1: Contrato testável do workflow Preview

**Files:**
- Modify: `tests/unit/vercel-preview-workflow.test.js`
- Create: `.github/workflows/configurar-e-publicar-preview-supabase.yml`

**Interfaces:**
- Consumes: segredos `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
- Produces: deployment Preview com manifesto validado e Production inalterada.

- [ ] Atualizar o teste para exigir configuração idempotente das seis variáveis Preview.
- [ ] Exigir build e deploy `--prebuilt`, sem `--prod` e sem ambiente Production.
- [ ] Criar o workflow com acionamento por merge na `main` e acionamento manual confirmado.
- [ ] Validar os manifestos do Preview e de Production após o deployment.

### Task 2: Gates e limpeza operacional

**Files:**
- Modify: `scripts/check-supabase-readiness.js`
- Delete: `.github/workflows/vercel-preview-prebuilt.yml`
- Delete: `.github/workflows/vincular-administrador-existente.yml`

**Interfaces:**
- Consumes: lista canônica de artefatos obrigatórios.
- Produces: gate sem referências a workflows substituídos.

- [ ] Substituir o workflow Preview antigo pelo workflow combinado.
- [ ] Remover o workflow de bootstrap administrativo já consumado.
- [ ] Confirmar que o scanner de segredos rejeita material administrativo no repositório.

### Task 3: Estado operacional atualizado

**Files:**
- Modify: `docs/CURRENT_STAGE.md`
- Modify: `docs/runbooks/SUPABASE_CONNECTION.md`

**Interfaces:**
- Consumes: estado verificado em GitHub, Supabase e Vercel.
- Produces: fonte operacional atual para continuidade do projeto.

- [ ] Registrar 14 migrations, carga canônica concluída e perfis iniciais vinculados.
- [ ] Documentar Preview como próxima etapa e Production como bloqueada.
- [ ] Registrar critérios de homologação por perfil e de ativação futura de Production.

### Task 4: Integração e validação remota

**Files:**
- Nenhum arquivo adicional.

**Interfaces:**
- Consumes: CI do PR e workflow automático após merge.
- Produces: URL do Preview, manifesto validado e evidência de Production local.

- [ ] Abrir PR contra `main`.
- [ ] Aguardar todos os gates.
- [ ] Fazer merge somente com CI verde.
- [ ] Confirmar o workflow de Preview concluído.
- [ ] Validar o manifesto do Preview e o manifesto de Production.
- [ ] Prosseguir para testes funcionais e RLS; não ativar Production sem homologação humana dos logins.
