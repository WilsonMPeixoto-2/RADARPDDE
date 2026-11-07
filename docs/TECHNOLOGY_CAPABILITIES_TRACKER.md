# RADAR PDDE — registro vivo de capacidades e aprofundamentos pós-upgrade

**Natureza:** registro operacional de acompanhamento ligado à [issue #481](https://github.com/WilsonMPeixoto-2/RADARPDDE/issues/481). **Não** altera regras canônicas de negócio, ADRs, escopo de Production ou autoridade de Supabase. A [auditoria aprofundada de 22–23/10](audits/2026-10-23-modernization-decision-trace.md) fundamenta as decisões; este arquivo controla **o que ainda falta**.  
**Foto-base de dependências:** `package.json` em `main@fef3e7834edefbe178e241c4957c52fa781bf877`, verificado em 23/10/2026. Esse SHA é histórico, **não o HEAD futuro** do merge documental. Atualizar versões/linhas quando o manifesto mudar, e consultar o lockfile quando a versão resolvida importar.  
**Escopo:** 26 dependências diretas (1 `dependencies`, 25 `devDependencies`). Serviços hospedados/runtime da plataforma estão no bloco separado; dependências transitivas continuam sob política de segurança, mas não exigem 1 issue de produto por pacote.

## Como evitar dois tipos de esquecimento

**Trilha A — cobertura de todos os pacotes.** Cada uma das 26 linhas precisa de uma **decisão conclusiva de triagem**, independentemente de ter ou não oportunidade de implementação.  
**Trilha B — aprofundamentos.** Cada hipótese que pedir análise longa recebe identificador, prova existente, estado, próximo passo, condição de retomada e critério de encerramento. Não há “pausado” sem condiö��q�^