# RADAR PDDE — Encerramento operacional do PR1 / PR #202

**Atualizado em:** 27 de agosto de 2026

**Classe documental:** Evidência publicada — encerramento operacional do PR1

**PR:** #202 — `fix: conter submit repetido de notas fiscais`

## 1. Resultado

PR1 foi integrado à `main` e publicado em Production.

- head funcional auditado do PR: `798a35c3194d865e7023ed0bc256dd9596e85abb`;
- merge commit: `3f4bcdfffd6f0d36ea2a05380ae53c3515a12f70`;
- Vercel Production: `dpl_HLof2Sweji1HB8Yq2YMAcqQgEfc9`;
- estado Vercel: `READY`;
- Supabase Production: `ACTIVE_HEALTHY`;
- nenhuma migration, backfill ou reparo de dados.

## 2. Correções entregues

### Guard canônico de Nota Fiscal/Despesa

`salvarDadosNota()` passou a ser a entrada pública única do fluxo de gravação.

O guard:

- é adquirido antes do primeiro `await`;
- cobre submit de formulário e chamada pública direta;
- impede a segunda chamada enquanto a primeira está pendente;
- usa `aria-busy="true"`;
- desabilita submit, Cancelar e fechar;
- mostra `Salvando…`;
- impede `Escape` durante estado ambíguo;
- restaura interface e rótulo original em `finally`;
- libera nova tentativa após erro.

O listener paralelo de captura foi removido para não existir segunda autoridade concorrente.

### Refresh mínimo no núcleo

`invoice:save` e `invoice:remove` declaram no próprio `InvoiceService`:

`remoteRefreshExemptEntities: ['administrativeLogs']`

A extensão `operational-write-performance.js` deixou de determinar essa consistência para invoice.

## 3. Reconciliação com PR #203

Antes da correção final, a branch do PR1 foi reconciliada com a `main` pós-PR203.

- nenhuma regra de `boletoInternet` foi reimplementada;
- o hotfix permanece integralmente preservado;
- a branch ficou 0 commits atrás da `main` antes do merge.

## 4. Evidências do head final

- domínio: 139 aprovados, 0 falhas;
- integração: 7 aprovados, 0 falhas;
- unitários: 728 aprovados, 0 falhas;
- Playwright: 152 aprovados, 39 ignorados, 0 falhas;
- CodeQL: aprovado;
- Supabase readiness: aprovado;
- snapshot canônico: aprovado;
- perfis e viewports: aprovado;
- contratos-fonte Excel SME: aprovado;
- Lighthouse dedicado: aprovado;
- Preview Vercel do head funcional: READY.

Os cinco cenários específicos do guard passaram, inclusive:

1. duplo submit;
2. chamada direta à entrada pública;
3. recuperação após falha;
4. restauração de `Salvar Alterações`;
5. bloqueio de `Escape`.

## 5. Lighthouse

No mesmo head funcional:

- Lighthouse dedicado mobile: LCP 14,52 s;
- Lighthouse dedicado desktop: LCP 3,26 s.

A homologação agregada obteve LCP mobile de 15,071 s para teto de 15,000 s e ficou vermelha por 71 ms. A divergência foi classificada como ruído sintético mobile já conhecido, sem evidência de regressão causada pelo PR1.

Nenhum threshold foi alterado e não houve repetição oportunística até verde.

## 6. Smoke autenticado em Production

Foi executado smoke autenticado no perfil Controlador, na Escola Municipal Ary Barroso, competência Agosto/2026.

O modal real de despesa abriu normalmente.

Para não contaminar Production com NF fictícia, o método `InvoiceService.save()` foi temporariamente substituído apenas dentro da sessão do navegador por uma Promise controlada. Nenhuma RPC ou escrita remota foi chamada.

Resultado observado na entrada pública real:

- duas chamadas simultâneas;
- somente 1 chamada ao serviço controlado;
- `aria-busy="true"`;
- submit desabilitado;
- rótulo `Salvando…`;
- Cancelar e fechar desabilitados;
- segunda chamada retornou `false`;
- ao concluir, `aria-busy="false"`;
- controles restaurados;
- rótulo original restaurado;
- modal fechado normalmente.

Depois do smoke, a implementação original do serviço foi restaurada na sessão.

## 7. Estado operacional

Vercel Production não apresentou erros de runtime no período de validação.

Supabase Production permaneceu saudável e não recebeu alteração decorrente deste smoke.

## 8. Próxima entrega

PR1 está encerrado.

A próxima frente obrigatória do plano mestre é **PR2 — Regra canônica de Consulta Assessoria, plano de efeitos e no-op**.

PR2 não contém:

- reparo de dados existentes;
- idempotência de servidor;
- redesenho de Pendências.
