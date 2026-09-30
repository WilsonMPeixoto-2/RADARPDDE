# Publicação do PR #397 em Production

O PR #397 foi integrado e publicado em 30/09/2026. Despesas e Notas Fiscais passam a ser operadas por perfis autorizados independentemente da bonificação. A entrega foi executada pelo agente principal.

- Candidato homologado: `0e149e148ecef708db3ab05faf9c1b5e43338fe6`.
- Merge: `a5e200e5c3d7955cea0a6122bde1904469771ac3`; árvore idêntica à do candidato: `3fd57652658361e697321de4537760632e0b70eb`.
- [PR integrado](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/397).
- [Site publicado](https://radarpdde-fix.vercel.app) e [manifesto público](https://radarpdde-fix.vercel.app/radar-build-manifest.json), ambos no merge acima.
- [Deployment Vercel READY / Production](https://vercel.com/wilson-m-peixotos-projects/radarpdde-fix/suHN66eJ41tsHKPmS5SAs6N7iJnu).
- [Aplicação das duas migrations](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/36775217508), em ordem, com dry-run exigindo exatamente os dois arquivos canônicos. Histórico: 56 → 58. Corpos das três funções conferidos contra o SQL original; assinaturas, owner, grants, security definer e search_path preservados.
- CI anterior no candidato: 45 checks concluídos, 43 aprovados e dois condicionais de Preview ignorados. A continuação operacional não repetiu os 45 gates. [Ciclos de despesas em Supabase descartável real](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/36737810199): 20/20 aprovados.

Smoke autenticado em Production: abertos formulários de Nota Fiscal com bonificação vazia, Não e N/A, inclusive em contexto consolidado; aberto formulário de despesa a identificar; ações reconferidas após recarregar. Os formulários foram cancelados. As capturas da interface real foram preservadas no notebook, sem publicação dos dados das escolas no repositório.

O ciclo de gravação/edição/exclusão de registros em Production não foi executado porque não foi definido um contexto de teste. A preservação da bonificação durante esses ciclos está comprovada no Supabase descartável do candidato, não atribuída a um teste de escrita em Production.

O backup completo deixou de ser uma condição da publicação após a correção de escopo solicitada pelo usuário. A execução que já estava em andamento concluiu com `restoreVerified: true`: [run do backup](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/36774647367), commit `7fbb7b9a784ed266f35f58e0806e8cd23939699d`, 57 tabelas conferidas. O artefato cifrado foi baixado, seu SHA256 conferido e sua descriptografia autenticada localmente. A chave privada permaneceu exclusivamente no notebook. Nenhuma nova atividade de backup é necessária para esta entrega.

- [Evidência completa e limites do smoke](release.json).
- [Conferência do SQL aplicado](sql-verification.json).
- [Diagnóstico e correção localizada do verificador de backup](backup-diagnosis.json).

O deployment anterior `dpl_2B2hpgGupfEcHouH9RpWeuHmmfnH` permanece identificado para recuperação do frontend. As definições anteriores das três funções e um roteiro de reversão restrito às funções foram preservados localmente; nenhuma reversão foi aplicada.
