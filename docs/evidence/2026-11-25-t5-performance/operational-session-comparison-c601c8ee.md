# Operational session comparison

Status: **diagnostic-comparison-complete**. Cost budgets: **not-established / report-only**.

No operational cost SLO is established here. Timer-derived read limits are not cost acceptance criteria; a completed comparison is not release approval.

Workload: 400 rounds; gestures per session: 406, 300, 401, 0, 0, 0.

| Metric | Baseline | Candidate | Absolute delta | Change |
|---|---:|---:|---:|---:|
| gestures | 1107 | 1107 | 0 | 0% |
| writeAttempts | 1107 | 1107 | 0 | 0% |
| successfulWrites | 1107 | 1107 | 0 | 0% |
| readAttempts | 26 | 110 | 84 | 323.08% |
| successfulReadResponses | 24 | 26 | 2 | 8.33% |
| abortedReadAttempts | 1 | 83 | 82 | 8200% |
| readHttpErrors | 1 | 1 | 0 | 0% |
| readNetworkErrors | 0 | 0 | 0 | n/a (zero baseline) |
| payloadBytes | 31890653 | 11984786 | -19905867 | -62.42% |
| staleLoads | 1 | 84 | 83 | 8300% |
| abortedLoads | 1 | 83 | 82 | 8200% |
| failedLoads | 1 | 1 | 0 | 0% |
| stateApplies | 1131 | 1132 | 1 | 0.09% |
| renderCalls | 1127 | 1128 | 1 | 0.09% |
| domReplacements | 324 | 325 | 1 | 0.31% |
| domMutations | 91321 | 102959 | 11638 | 12.74% |
| sampledOpacityFrames | 11121 | 10258 | -863 | -7.76% |
| fadedOpacityFrames | 766 | 0 | -766 | -100% |
| nearlyInvisibleFrames | 686 | 0 | -686 | -100% |
| pageErrors | 0 | 0 | 0 | n/a (zero baseline) |
| longTaskCount | 1810 | 1922 | 112 | 6.19% |
| longTaskTotalMs | 148472 | 167601 | 19129 | 12.88% |
| longTaskBlockingMs | 57972 | 71501 | 13529 | 23.34% |
| applyMeasuredCount | 1131 | 1132 | 1 | 0.09% |
| applyTotalMs | 25275.20 | 25038.50 | -236.70 | -0.94% |
| renderMeasuredCount | 1127 | 1128 | 1 | 0.09% |
| renderTotalMs | 4833.30 | 6094.00 | 1260.70 | 26.08% |
| elapsedMs | 488068.00 | 500306.01 | 12238.01 | 2.51% |
| readsPerMinute | 3.20 | 13.19 | 10.00 | 312.73% |
| longTasksPerMinute | 222.51 | 230.50 | 7.99 | 3.59% |
| sqlCalls | 51 | 56 | 5 | 9.80% |
| sqlTotalExecMs | 11553.03 | 9172.37 | -2380.66 | -20.61% |

Read attempts are browser observations; sqlCalls are completed pg_stat_statements deltas. Their collection intervals differ.

## Sessions

| Variant | Session | Gestures | Read attempts | HTTP successes | Read aborts | HTTP / network errors | Read bytes | Reads/min | DOM replacements / mutations | Faded / sampled opacity frames |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| baseline | 1 | 406 | 4 | 3 | 1 | 0 / 0 | 3986797 | 0.49 | 3 / 27959 | 6 / 1765 |
| baseline | 2 | 300 | 4 | 4 | 0 | 0 / 0 | 5314887 | 0.49 | 304 / 34364 | 732 / 1585 |
| baseline | 3 | 401 | 4 | 4 | 0 | 0 / 0 | 5314887 | 0.49 | 4 / 27734 | 8 / 1720 |
| baseline | 4 | 0 | 6 | 5 | 0 | 1 / 0 | 6644306 | 0.74 | 5 / 585 | 10 / 2032 |
| baseline | 5 | 0 | 4 | 4 | 0 | 0 / 0 | 5314889 | 0.49 | 4 / 468 | 10 / 2004 |
| baseline | 6 | 0 | 4 | 4 | 0 | 0 / 0 | 5314887 | 0.49 | 4 / 211 | 0 / 2015 |
| candidate | 1 | 406 | 23 | 3 | 20 | 0 / 0 | 3989003 | 2.76 | 3 / 27258 | 0 / 1610 |
| candidate | 2 | 300 | 48 | 2 | 46 | 0 / 0 | 2659646 | 5.76 | 301 / 46356 | 0 / 1517 |
| candidate | 3 | 401 | 18 | 1 | 17 | 0 / 0 | 1329353 | 2.16 | 1 / 26620 | 0 / 1610 |
| candidate | 4 | 0 | 9 | 8 | 0 | 1 / 0 | 2665358 | 1.08 | 8 / 1194 | 0 / 1845 |
| candidate | 5 | 0 | 8 | 8 | 0 | 0 / 0 | 8780 | 0.96 | 8 / 1232 | 0 / 1835 |
| candidate | 6 | 0 | 4 | 4 | 0 | 0 / 0 | 1332646 | 0.48 | 4 / 299 | 0 / 1841 |

## Successful request timing and UI write/apply timing

| Variant | Session | Read HTTP p50 / p95 / p99 / max ms | Write HTTP p50 / p95 / p99 / max ms | UI samples | Apply p50 / p95 ms | Click to stable p50 / p95 ms |
|---|---:|---:|---:|---:|---:|---:|
| baseline | 1 | 1249.50 / 1433.13 / 1433.13 / 1433.13 | 206.64 / 328.94 / 390.76 / 571.93 | 100 | 1.20 / 2.30 | 315.20 / 649.50 |
| baseline | 2 | 934.65 / 1459.51 / 1459.51 / 1459.51 | 171.93 / 379.99 / 444.19 / 491.50 | 0 | n/a / n/a | n/a / n/a |
| baseline | 3 | 1088.17 / 1540.46 / 1540.46 / 1540.46 | 198.85 / 308.42 / 363.67 / 462.28 | 100 | 1.10 / 2 | 305.80 / 625.80 |
| baseline | 4 | 1124.31 / 4236.16 / 4236.16 / 4236.16 | n/a / n/a / n/a / n/a | 0 | n/a / n/a | n/a / n/a |
| baseline | 5 | 1024.05 / 1462.97 / 1462.97 / 1462.97 | n/a / n/a / n/a / n/a | 0 | n/a / n/a | n/a / n/a |
| baseline | 6 | 795.52 / 1534.76 / 1534.76 / 1534.76 | n/a / n/a / n/a / n/a | 0 | n/a / n/a | n/a / n/a |
| candidate | 1 | 1269.06 / 2952.29 / 2952.29 / 2952.29 | 211.93 / 355.23 / 481.44 / 546.59 | 100 | 1.10 / 2.60 | 331.10 / 558.80 |
| candidate | 2 | 623.54 / 2272.29 / 2272.29 / 2272.29 | 207.70 / 405.10 / 494.24 / 557.92 | 0 | n/a / n/a | n/a / n/a |
| candidate | 3 | 3049.16 / 3049.16 / 3049.16 / 3049.16 | 209.37 / 357.98 / 437.54 / 547.66 | 100 | 1.20 / 3.10 | 332.10 / 647.50 |
| candidate | 4 | 2286.51 / 3661.34 / 3661.34 / 3661.34 | n/a / n/a / n/a / n/a | 0 | n/a / n/a | n/a / n/a |
| candidate | 5 | 1424.00 / 2640.18 / 2640.18 / 2640.18 | n/a / n/a / n/a / n/a | 0 | n/a / n/a | n/a / n/a |
| candidate | 6 | 681.92 / 1386.77 / 1386.77 / 1386.77 | n/a / n/a / n/a / n/a | 0 | n/a / n/a | n/a / n/a |

## Browser work (when instrumented)

| Variant | Session | Status | Long tasks / min | Long-task total / blocking ms | Apply count / total ms | Render count / synchronous total ms |
|---|---:|---|---:|---:|---:|---:|
| baseline | 1 | recorded | 79.05 | 49352 / 17202 | 409 / 8036.20 | 409 / 161.30 |
| baseline | 2 | recorded | 66.14 | 49388 / 22488 | 304 / 8318.10 | 304 / 4222.70 |
| baseline | 3 | recorded | 75.73 | 47026 / 16226 | 405 / 7723.60 | 405 / 210.60 |
| baseline | 4 | recorded | 0.61 | 929 / 679 | 5 / 443.40 | 5 / 114.50 |
| baseline | 5 | recorded | 0.49 | 877 / 677 | 4 / 352.90 | 4 / 124.20 |
| baseline | 6 | recorded | 0.49 | 900 / 700 | 4 / 401 | 0 / 0 |
| candidate | 1 | recorded | 74.71 | 50083 / 18933 | 409 / 7892.00 | 409 / 187.60 |
| candidate | 2 | recorded | 78.08 | 61865 / 29315 | 301 / 7810.00 | 301 / 5308.70 |
| candidate | 3 | recorded | 74.84 | 49175 / 17975 | 402 / 7544.10 | 402 / 131.30 |
| candidate | 4 | recorded | 0.96 | 2257 / 1857 | 8 / 720.90 | 8 / 205.80 |
| candidate | 5 | recorded | 0.96 | 2723 / 2323 | 8 / 663.80 | 8 / 260.60 |
| candidate | 6 | recorded | 0.96 | 1498 / 1098 | 4 / 407.70 | 0 / 0 |

## SQL baseline/delta

| Variant | Query ID | Role | Before calls | After calls | Delta calls | Delta execution ms | Delta mean ms |
|---|---|---|---:|---:|---:|---:|---:|
| baseline | 7145021936814103127 | authenticated | 0 | 51 | 51 | 11553.03 | 226.53 |
| candidate | 502317007102243559 | authenticated | 0 | 39 | 39 | 7632.74 | 195.71 |
| candidate | 1768514264548670856 | authenticated | 0 | 17 | 17 | 1539.63 | 90.57 |

Completed calls recorded by pg_stat_statements; not HTTP attempts. Snapshot max is not an interval maximum when a prior baseline exists. Reset epoch is not recorded by this artifact schema; counter regression/disappearance is rejected, but reset followed by regrowth cannot be excluded.

## Warnings

- cost-regression: readAttempts 26 → 110 (323.08%).
- cost-regression: sqlCalls 51 → 56 (9.80%).
- cost-regression: domReplacements 324 → 325 (0.31%).
- cost-regression: domMutations 91321 → 102959 (12.74%).
- cost-regression: longTaskCount 1810 → 1922 (6.19%).
- cost-regression: longTaskTotalMs 148472 → 167601 (12.88%).
- cost-regression: longTaskBlockingMs 57972 → 71501 (23.34%).
- cost-regression: renderTotalMs 4833.30 → 6094.00 (26.08%).
- baseline-freshness-not-comparable: Baseline includes stale/aborted reads. Fewer completed SQL calls or payload bytes can reflect deferred updates; final convergence alone does not establish equal freshness during activity.

## Convergence and limits

Passed journey asserts final database/UI/reload state and reconnect recovery; it does not measure freshness lag during continuous activity.

- Browser read attempts include aborts before or after sending; they are not completed database statements.
- pg_stat_statements spans a different interval, including bootstrap/reload outside browser observation; SQL cannot be assigned to individual sessions from these snapshots.
- Payload is observed read response body bytes, including observed error bodies; it excludes unknown bodies, protocol overhead, writes and other endpoints.
- DOM replacement/mutation counts are distinct from render calls. Sampled panel opacity is not comprehensive flicker or layout stability measurement.
- Read durations use successful responses only (nearest-rank percentiles), include induced transport latency and exclude aborted requests.
- Write HTTP durations cover observed successful write requests. UI write/apply summaries are copied from the instrumented subset (currently at most the last 100 evaluation samples); they are not all gestures. Null RPC/UI timing is unavailable, not zero. Aggregate p95/p99 cannot be reconstructed from session percentiles.
- Browser long-task/apply/render timing is optional: older artifacts report not-recorded, not zero. Long-task availability depends on browser support; synchronous render duration does not include subsequent asynchronous rendering/paint.
- Session indices follow the same workload order. Samples end before reload; the passed report attests reload assertions separately.
- Completed observation records do not include requests still in flight at snapshot time. Absence of recorded errors does not certify unobserved intervals.
- Massa sintética calibrada; não clone de Production.
- Seis sessões/quatro Controladores: três escritores, dois observadores escolares e um Dashboard; inclui abas da mesma identidade.
- Esta jornada mede avaliações e CRUD fiscal; não certifica patrimônio, Pendências, horas de uso ou staging.
- Latência e HTTP 500 são induzidos no transporte; dados e Realtime são reais.
- Um socket real é desconectado; snapshot SQL anterior é retido até recovery ser solicitado. UI só converge após a nova resposta global de recovery. A sonda antiga acrescenta uma leitura nas duas variantes.

## Provenance

Workflow run: 45569519301.

| Variant | Source file | SHA-256 |
|---|---|---|
| baseline | operational-sustained/baseline/session-report.json | c942332e1ed05ade788df3812965c7820d20fa36b95516070ba7d7858243ba37 |
| baseline | operational-sustained/pg-stat-before.json | 37517e5f3dc66819f61f5a7bb8ace1921282415f10551d2defa5c3eb0985b570 |
| baseline | operational-sustained/pg-stat-after.json | e7d06ec97eaa441a41ce28b3ef852d9954139b35376f5114e932eafaf3c9e374 |
| candidate | operational-sustained/candidate/session-report.json | aef1b8dea0382fd714524a6fe29b2ae491e98202d2223f59a23ec130828842b5 |
| candidate | operational-sustained/pg-stat-before.json | 37517e5f3dc66819f61f5a7bb8ace1921282415f10551d2defa5c3eb0985b570 |
| candidate | operational-sustained/pg-stat-after.json | 1269bef6ca6f663d685887e72b4655167a83325960e51ddc1d40d8e477cfb1a9 |
