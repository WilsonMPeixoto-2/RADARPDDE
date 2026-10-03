# Evidência — Avaliação em Production e sincronização operacional

**Data:** 29 de setembro de 2026  
**Ambiente:** Production oficial `https://radarpdde-fix.vercel.app`  
**Baseline funcional da main:** `eb6f33f2ec123c5f2f6bdf08f63ab0e18cbc4fa2`  
**Execução diagnóstica principal:** GitHub Actions run `36523091435`  
**Branch diagnóstica descartável:** `diag/evaluation-production-measurement-2026-09-29`

## 1. Objetivo

Medir, em Production real e com autenticação técnica efêmera, a experiência da tela de Avaliação sem alterar dados operacionais. O experimento observou:

- troca de competência pelo seletor global;
- troca de competência pela faixa mensal da própria Avaliação;
- saída e retorno à aba de Avaliação;
- quantidade e distribuição de requests REST;
- tempo de `loadOperationalContext()`;
- custo de `switchView()`;
- mutações de DOM e amostragem visual frame a frame;
- comportamento real de gravações já existentes por telemetria Supabase.

O harness e a identidade técnica foram temporários. A identidade foi removida ao fim da execução e a consulta posterior confirmou **zero usuários residuais `radar-measurement-*`**.

## 2. Troca de competência em Production

Última execução homologada:

| Jornada | Tempo total | Requests REST | `loadOperationalContext()` | `switchView()` |
|---|---:|---:|---:|---:|
| global → 2026-07 | 8,842 s | 278 | 7,994 s | 12,0 ms |
| global → 2026-06 | 9,209 s | 292 | 8,363 s | 14,9 ms |
| global → 2026-08 | 5,694 s | 172 | 4,847 s | 18,7 ms |
| faixa mensal Avaliação → 2026-01 | 9,497 s | 280 | 8,615 s | 13,8 ms |

Média aproximada:

- **8,31 s** por troca;
- **255,5 requests REST** por troca;
- cerca de **89% do tempo** dentro de `loadOperationalContext()`.

A execução anterior, independente, reproduziu exatamente as mesmas contagens de requests para cada destino: 278, 292, 172 e 280. A latência variou, mas o fan-out permaneceu determinístico para o contexto.

A maior parte das requisições foi para:

- `verifications`;
- `registered_invoices`;
- em menor quantidade, `pendencies`, `assets`, `pendency_attempts` e `pendency_contacts`.

## 3. Interações locais

Sair da aba de Avaliação e voltar para ela:

- gerou **zero requests REST**;
- não executou `loadOperationalContext()`;
- não executou `switchView()`.

Os ~0,84 s medidos nesses casos refletem majoritariamente o critério deliberado do instrumento de aguardar 800 ms sem novas mutações antes de declarar estabilidade.

Conclusão suportada pela evidência:

> a lentidão não pertence à superfície Avaliação em si; ela aparece quando uma ação dispara nova hidratação do contexto operacional.

## 4. Gravações reais

Telemetria recente de `save_verification_with_log`:

- 306 chamadas;
- mediana de aproximadamente **73 ms**;
- média de aproximadamente **112 ms**;
- p95 de aproximadamente **300 ms**.

Foi localizada uma gravação isolada particularmente útil:

- uma única `save_verification_with_log`;
- duração de **301 ms**;
- um único broadcast `operational-change`;
- nenhuma outra gravação daquele cliente nas dezenas de segundos próximas.

Nos aproximadamente 16 s seguintes, o mesmo cliente fez **997 GETs operacionais**:

- `verifications`: 559;
- `registered_invoices`: 393;
- demais tabelas operacionais: 45.

Conclusão suportada pela evidência:

> a gravação remota é curta; a percepção de demora após salvar está fortemente associada à releitura/sincronização posterior, que reutiliza a mesma hidratação contextual ampla.

## 5. Mutações de DOM e relato de “piscada”

Cada troca de competência provocou aproximadamente:

- 279 a 291 registros de mutação;
- 51 nós removidos;
- 94 a 106 nós adicionados;
- seis lotes de mutação.

Entretanto, a amostragem frame a frame durante toda a operação registrou:

- 0 frames ocultos;
- 0 frames vazios;
- 0 frames classificados como visualmente degradados;
- as 12 linhas da Avaliação presentes em todos os frames;
- nenhum `layout-shift` reportado.

Portanto:

- a reconstrução relevante de DOM está comprovada;
- **a piscada relatada por usuários não foi reproduzida nessas trocas**;
- não existe base para atribuir a piscada à reconstrução do Prontuário sem nova reprodução específica.

## 6. Causa técnica mais bem suportada

A sequência observada é compatível com:

```
ação que requer novo contexto
→ DataService.loadOperationalContext()
→ repository.queryOperationalContext()
→ queryContextDependencies() por combinações escola/competência/programa
→ centenas de requests independentes
→ aplicação do contexto
→ rerender
```

Em gravações:

```
RPC remota curta
→ broadcast de invalidação
→ refresh contextual
→ mesma cadeia de hidratação ampla
→ centenas de releituras
```

O gargalo observado não está em `switchView()` nem, prioritariamente, na duração individual da RPC de gravação.

## 7. Limites da evidência

Esta evidência **não comprova**:

- causa da piscada relatada fora das jornadas medidas;
- que todo atraso do produto tenha a mesma causa;
- que Realtime deva ser removido;
- que a correção correta seja aumentar cache, timeout ou polling;
- que índices de banco sejam o primeiro alvo.

A correção deve preservar as regras de dependência histórica de Pendências, Notas Fiscais e bens e reduzir o fan-out sem regressão funcional.
