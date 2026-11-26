# T6 — consolidação por evidência e gate de compatibilidade

**Corte auditado:** 26/11/2026. Baseline `abb9559a89479e95629cbebb2a5860c0b8c357d9` (merge #575, D024); produto do #573 `1eb4c4d32f99669cf971b244e7ee360a0d04e39e`. Ordem expressa: concluir T6; não iniciar profissionalização da auditoria agêntica nem desenvolvimento documental. Este registro não concede permissões e não substitui aceite humano.

## Reconciliação dos gates

| Alcance | Evidência verificada | Limite |
|---|---|---|
| R1 T0–T3 | [#537](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/537), merge `9d0f50b0f42b44017591bce472581717c8a09bc0`; registro histórico de publicação no registry | Não repetir migração. |
| R2 T4 | [#546](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/546), [#562](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/562), [#564](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/564); baseline `7523782b`; [backup cifrado e restauração isolada](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45546167245); [prova produtiva](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45560905562) | Prova histórica de autorização e publicação; não inferir validação humana de cada viewport. |
| R3 T5 | [#565](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/565), merge `31c27155`, migration 69, [monitor produtivo](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45654478619) | Operações de escrita homologadas em ambiente descartável. |
| T2–T5, RLS, concorrência, F5/2ª sessão e compatibilidade sem flag | [readiness](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45726751773/job/139598426723): 27/27 T2–T5, 17/17 Auth e Realtime, 4/4 login tardio/histórico protegido, 3/3 orientação; logs consultados | G3 usa código atual com flag desligada, não binário histórico. |
| Perfis e navegadores | [gate](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45726751760/job/139598426390): 15/15 (5 perfis x desktop Chromium, celular Chromium, celular WebKit); 14/14 Auth e contrato e 4/4 histórico protegido | Emulação, não aparelhos físicos nem todas as jornadas em cada viewport. |
| Regressão, exportação, recuperação | [pré-production](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45726751925), nove jobs concluídos, inclusive backup/restauração descartáveis, Excel/OOXML, Auth/RLS, migrations, Lighthouse e gate final | CI não substitui aceite humano, restauração em produção ou prova de backup prévio de toda migration. |
| Estabilidade de posição | [11 + 2 jornadas](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45726751751/job/139598426988) aprovadas nos logs | Recorte dos cenários executados. |
| Desempenho | [carga operacional](https://github.com/WilsonMPeixoto-2/RADARPDDE/actions/runs/45726751955): seis sessões reais baseline/candidata e comparação de custo/invariantes aprovadas. [#572](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/572): P95 381→32 versões no A/B de base idêntica, bytes 13.305.192→27.845.064 | Sem SLA ou promessa de redução global; preservar trade-off. |
| Usabilidade móvel | [#573](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/573), 17/17 workflows; [evidências versionadas](https://github.com/WilsonMPeixoto-2/RADARPDDE/tree/main/docs/evidence/2026-11-25-capital-mobile): 3/3 jornadas, seis capturas examinadas anteriormente, 320 px disponíveis sem rolagem horizontal, botão 44 px | Inspeção anterior do executor; não aceite atribuído ao proprietário. |
| Continuidade D024 | [#575](https://github.com/WilsonMPeixoto-2/RADARPDDE/pull/575), 5/5 workflows aprovados e merge `abb9559a`; status Vercel success consultado | Manifesto público do SHA atual não recuperado nesta sessão; não inferir flags ativas apenas do status. |

## Compatibilidade: lacuna concreta e contraprova adicional

O teste G3 existente (linha 977 no corte) realmente passou, mas utiliza o mesmo checkout com flag piloto desativada. Adiciona-se um caso na mesma suíte: checkout fixado no merge publicado de R2 `7523782bdc572a631783deeae2ea59be048dd725`, servidor histórico em porta loopback livre, geração apenas de configuração descartável com flags desativadas e duas sessões autenticadas contra o mesmo backend atualizado. Confere SHA histórico, ausência de mudanças rastreadas fora da configuração, igualdade do endpoint, escrita pelo controle real antigo, leitura após F5, prévia pelo cliente novo, escrita concorrente e rejeição atômica da prévia obsoleta; preserva a asserção de estado persistido. A execução obrigatória do readiness não pode omitir o checkout. Não altera aplicação, schema, Auth, RLS ou configuração institucional. A prova nova permanece **pendente** até o resultado do CI deste PR; não confundir código escrito com teste aprovado. Não testar todo o R1/R2 histórico por presunção de equivalência, nem alegar que esse caso certifica todos os contratos históricos.

## Obrigações T6

- I006-01: provas de publicação e gates técnicos por release reconciliadas; manter gate-pending enquanto a aprovação humana e a compatibilidade específica não estiverem integralmente documentadas.
- I018-02: prova existente do fallback e contraprova da prévia obsoleta recuperadas; gate-pending para execução do cliente histórico.
- I020-03: evidência por SHA adicionada à matriz; candidato, não cobertura exaustiva das conversas e pranchas originais.
- I021-04: provas de textos, foco, layout e perfis recuperadas; candidato, sem promover a aceite humano.
- I017-02 / I023-07 / I024-01: invariantes permanentes; preservadas.
- Lacunas humanas: não atribuir aceite ao proprietário sem registro. A navegação integral nos marcos relevantes e o cotejo com pranchas originais não foram realizados nesta sessão. A execução remota em WebKit não certifica aparelho físico. Não condicionar conclusão técnica à criação de novas funcionalidades. Não reabrir #574, T5, #570 ou migration institucional.

**Próximo ato:** verificar todos os gates do novo PR e especificamente o novo caso de compatibilidade, resolver somente falhas comprovadas, confirmar manifesto e registrar aceite humano disponível com alcance explícito. Consolidar T6 sem reexecutar provas válidas no mesmo produto. Se faltar prova de aceite, manter esse bloqueio explícito em vez de declarar encerramento integral.
