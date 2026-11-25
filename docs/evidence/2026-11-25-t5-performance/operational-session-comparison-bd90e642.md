# Operational session comparison

Status: **diagnostic-comparison-complete**. Cost budgets: **not-established / report-only**.

No operational cost SLO is established here. Timer-derived read limits are not cost acceptance criteria; a completed comparison is not release approval.

Workload: 400 rounds; gestures per session: 406, 300, 401, 0, 0, 0.

| Metric | Baseline | Candidate | Absolute delta | Change |
|---|---:|---:|---:|---:|
| gestures | 1107 | 1107 | 0 | 0% |
| writeAttempts | 1107 | 1107 | 0 | 0% |
| successfulWrites | 1107 | 1107 | 0 | 0% |
| readAttempts | 26 | 42 | 16 | 61.54% |
| successfulReadResponses | 25 | 19 | -6 | -24% |
| abortedReadAttempts | 0 | 22 | 22 | n/a (zero baseline) |
| readHttpErrors | 1 | 1 | 0 | 0% |
| readNetworkErrors | 0 | 0 | 0 | n/a (zero baseline) |
| payloadBytes | 33218773 | 11972687 | -21246086 | -63.96% |
| staleLoads | 0 | 22 | 22 | n/a (zero baseline) |
| abortedLoads | 0 | 22 | 22 | n/a (zero baseline) |
| failedLoads | 1 | 1 | 0 | 0% |
| stateApplies | 1132 | 1126 | -6 | -0.53% |
| renderCalls | 1128 | 1122 | -6 | -0.53% |
| domReplacements | 325 | 319 | -6 | -1.85% |
| domMutations | 91438 | 107745 | 16307 | 17.83% |
| sampledOpacityFrames | 11707 | 11758 | 51 | 0.44% |
| fadedOpacityFrames | 747 | 0 | -747 | -100% |
| nearlyInvisibleFrames | 670 | 0 | -670 | -100% |
| pageErrors | 0 | 0 | 0 | n/a (zero baseline) |
| longTaskCount | 1200 | 915 | -285 | -23.75% |
| longTaskTotalMs | 89266 | 65578 | -23688 | -26.54% |
| longTaskBlockingMs | 29266 | 19828 | -9438 | -32.25% |
| applyMeasuredCount | 1132 | 1126 | -6 | -0.53% |
| applyTotalMs | 19509.10 | 15184.70 | -4324.40 | -22.17% |
| renderMeasuredCount | 1128 | 1122 | -6 | -0.53% |
| renderTotalMs | 3934.30 | 4129.70 | 195.40 | 4.97% |
| elapsedMs | 439490.18 | 424404.10 | -15086.08 | -3.43% |
| readsPerMinute | 3.55 | 5.94 | 2.39 | 67.28% |
| longTasksPerMinute | 163.83 | 129.36 | -34.47 | -21.04% |
| sqlCalls | 52 | 46 | -6 | -11.54% |
| sqlTotalExecMs | 8431.74 | 5004.25 | -3427.49 | -40.65% |

Read attempts are browser observations; sqlCalls are completed pg_stat_statements deltas. Their collection intervals differ.

## Sessions

| Variant | Session | Gestures | Read attempts | HTTP successes | Read aborts | HTTP / network errors | Read bytes | Reads/min | DOM replacements / mutations | Faded / sampled opacity frames |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| baseline | 1 | 406 | 4 | 4 | 0 | 0 / 0 | 5314892 | 0.55 | 4 / 28076 | 9 / 1870 |
| baseline | 2 | 300 | 4 | 4 | 0 | 0 / 0 | 5314892 | 0.55 | 304 / 34364 | 709 / 1708 |
| baseline | 3 | 401 | 4 | 4 | 0 | 0 / 0 | 5314892 | 0.55 | 4 / 27734 | 10 / 1816 |
| baseline | 4 | 0 | 6 | 5 | 0 | 1 / 0 | 6644312 | 0.82 | 5 / 585 | 10 / 2119 |
| baseline | 5 | 0 | 4 | 4 | 0 | 0 / 0 | 5314893 | 0.55 | 4 / 468 | 9 / 2105 |
| baseline | 6 | 0 | 4 | 4 | 0 | 0 / 0 | 5314892 | 0.55 | 4 / 211 | 0 / 2089 |
| candidate | 1 | 406 | 4 | 4 | 0 | 0 / 0 | 5314889 | 0.57 | 4 / 27484 | 0 / 1845 |
| candidate | 2 | 300 | 23 | 1 | 22 | 0 / 0 | 1329352 | 3.25 | 301 / 51774 | 0 / 1829 |
| candidate | 3 | 401 | 1 | 1 | 0 | 0 / 0 | 1329352 | 0.14 | 1 / 26638 | 0 / 1886 |
| candidate | 4 | 0 | 6 | 5 | 0 | 1 / 0 | 2662062 | 0.85 | 5 / 862 | 0 / 2070 |
| candidate | 5 | 0 | 4 | 4 | 0 | 0 / 0 | 4389 | 0.57 | 4 / 688 | 0 / 2068 |
| candidate | 6 | 0 | 4 | 4 | 0 | 0 / 0 | 1332643 | 0.57 | 4 / 299 | 0 / 2060 |

## Successful request timing and UI write/apply timing

| Variant | Session | Read HTTP p50 / p95 / p99 / max ms | Write HTTP p50 / p95 / p99 / max ms | UI samples | Apply p50 / p95 ms | Click to stable p50 / p95 ms |
|---|---:|---:|---:|---:|---:|---:|
| baseline | 1 | 719.77 / 1424.61 / 1424.61 / 1424.61 | 172.58 / 259.05 / 317.21 / 409.96 | 100 | 1 / 1.90 | 258.80 / 484.60 |
| baseline | 2 | 619.07 / 1395.80 / 1395.80 / 1395.80 | 153.95 / 305.22 / 366.74 / 379.67 | 0 | n/a / n/a | n/a / n/a |
| baseline | 3 | 603.89 / 1345.96 / 1345.96 / 1345.96 | 174.07 / 266.10 / 320.15 / 378.45 | 100 | 0.90 / 2.10 | 280 / 545.50 |
| baseline | 4 | 865.72 / 3877.29 / 3877.29 / 3877.29 | n/a / n/a / n/a / n/a | 0 | n/a / n/a | n/a / n/a |
| baseline | 5 | 738.63 / 1364.19 / 1364.19 / 1364.19 | n/a / n/a / n/a / n/a | 0 | n/a / n/a | n/a / n/a |
| baseline | 6 | 682.56 / 1380.92 / 1380.92 / 1380.92 | n/a / n/a / n/a / n/a | 0 | n/a / n/a | n/a / n/a |
| candidate | 1 | 541.33 / 1270.58 / 1270.58 / 1270.58 | 155.59 / 235.76 / 303.08 / 378.81 | 100 | 1.10 / 2.30 | 269.80 / 571.10 |
| candidate | 2 | 253.00 / 253.00 / 253.00 / 253.00 | 166.99 / 249.89 / 284.05 / 340.93 | 0 | n/a / n/a | n/a / n/a |
| candidate | 3 | 461.19 / 461.19 / 461.19 / 461.19 | 154.91 / 231.35 / 275.61 / 331.49 | 100 | 1.10 / 2.30 | 264.80 / 496.90 |
| candidate | 4 | 860.31 / 3955.76 / 3955.76 / 3955.76 | n/a / n/a / n/a / n/a | 0 | n/a / n/a | n/a / n/a |
| candidate | 5 | 436.68 / 1223.36 / 1223.36 / 1223.36 | n/a / n/a / n/a / n/a | 0 | n/a / n/a | n/a / n/a |
| candidate | 6 | 471.84 / 1201.54 / 1201.54 / 1201.54 | n/a / n/a / n/a / n/a | 0 | n/a / n/a | n/a / n/a |

## Browser work (when instrumented)

| Variant | Session | Status | Long tasks / min | Long-task total / blocking ms | Apply count / total ms | Render count / synchronous total ms |
|---|---:|---|---:|---:|---:|---:|
| baseline | 1 | recorded | 53.38 | 27347 / 7797 | 410 / 6202.10 | 410 / 162.30 |
| baseline | 2 | recorded | 54.61 | 32192 / 12192 | 304 / 6320.30 | 304 / 3434.50 |
| baseline | 3 | recorded | 54.06 | 27645 / 7845 | 405 / 5967.90 | 405 / 171.20 |
| baseline | 4 | recorded | 0.68 | 807 / 557 | 5 / 419.60 | 5 / 89.00 |
| baseline | 5 | recorded | 0.55 | 638 / 438 | 4 / 275.60 | 4 / 77.30 |
| baseline | 6 | recorded | 0.55 | 637 / 437 | 4 / 323.60 | 0 / 0 |
| candidate | 1 | recorded | 40.01 | 18677 / 4527 | 410 / 4902.60 | 410 / 197.40 |
| candidate | 2 | recorded | 49.34 | 27419 / 9969 | 301 / 4900.60 | 301 / 3667.80 |
| candidate | 3 | recorded | 38.03 | 16998 / 3548 | 402 / 4651.50 | 402 / 75.40 |
| candidate | 4 | recorded | 0.71 | 837 / 587 | 5 / 252.50 | 5 / 128.50 |
| candidate | 5 | recorded | 0.57 | 773 / 573 | 4 / 213.40 | 4 / 60.60 |
| candidate | 6 | recorded | 0.71 | 874 / 624 | 4 / 264.10 | 0 / 0 |

## SQL baseline/delta

| Variant | Query ID | Role | Before calls | After calls | Delta calls | Delta execution ms | Delta mean ms |
|---|---|---|---:|---:|---:|---:|---:|
| baseline | 7145021936814103127 | authenticated | 0 | 52 | 52 | 8431.74 | 162.15 |
| candidate | 502317007102243559 | authenticated | 0 | 36 | 36 | 4563.76 | 126.77 |
| candidate | 1768514264548670856 | authenticated | 0 | 10 | 10 | 440.49 | 44.05 |

Completed calls recorded by pg_stat_statements; not HTTP attempts. Snapshot max is not an interval maximum when a prior baseline exists. Reset epoch is not recorded by this artifact schema; counter regression/disappearance is rejected, but reset followed by regrowth cannot be excluded.

## Warnings

- cost-regression: readAttempts 26 → 42 (61.54%).
- cost-regression: domMutations 91438 → 107745 (17.83%).
- cost-regression: renderTotalMs 3934.30 → 4129.70 (4.97%).

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

Workflow run: 45580200196.

| Variant | Source file | SHA-256 |
|---|---|---|
| baseline | operational-sustained/baseline/session-report.json | a487c3f29c810a49a5095889b202928223fab74a1c04adc395b5170128cdaf30 |
| baseline | operational-sustained/pg-stat-before.json | 37517e5f3dc66819f61f5a7bb8ace1921282415f10551d2defa5c3eb0985b570 |
| baseline | operational-sustained/pg-stat-after.json | f92832a9bc1d1cbb2917b6ecf9b9c01b2ad91782005a4d7c2811e917b4f7ac49 |
| candidate | operational-sustained/candidate/session-report.json | 68c7cf313b773d8ccb62b1fd6b921d9f76929d7ec20542c2777e3c263df770b6 |
| candidate | operational-sustained/pg-stat-before.json | 37517e5f3dc66819f61f5a7bb8ace1921282415f10551d2defa5c3eb0985b570 |
| candidate | operational-sustained/pg-stat-after.json | c0924371654d7efabf4c577f50c749bac60e941a39c052933abc09b2d6812e81 |
