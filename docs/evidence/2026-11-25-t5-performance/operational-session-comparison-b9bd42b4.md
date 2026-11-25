# Operational session comparison

Status: **diagnostic-comparison-complete**. Cost budgets: **not-established / report-only**.

No operational cost SLO is established here. Timer-derived read limits are not cost acceptance criteria; a completed comparison is not release approval.

Workload: 400 rounds; gestures per session: 406, 300, 401, 0, 0, 0.

| Metric | Baseline | Candidate | Absolute delta | Change |
|---|---:|---:|---:|---:|
| gestures | 1107 | 1107 | 0 | 0% |
| writeAttempts | 1107 | 1107 | 0 | 0% |
| successfulWrites | 1107 | 1107 | 0 | 0% |
| readAttempts | 32 | 88 | 56 | 175% |
| successfulReadResponses | 30 | 27 | -3 | -10% |
| abortedReadAttempts | 1 | 60 | 59 | 5900% |
| readHttpErrors | 1 | 1 | 0 | 0% |
| readNetworkErrors | 0 | 0 | 0 | n/a (zero baseline) |
| payloadBytes | 39866789 | 10656717 | -29210072 | -73.27% |
| staleLoads | 1 | 60 | 59 | 5900% |
| abortedLoads | 1 | 60 | 59 | 5900% |
| failedLoads | 1 | 1 | 0 | 0% |
| stateApplies | 1137 | 1134 | -3 | -0.26% |
| renderCalls | 1132 | 1128 | -4 | -0.35% |
| domReplacements | 330 | 327 | -3 | -0.91% |
| domMutations | 91111 | 100801 | 9690 | 10.64% |
| sampledOpacityFrames | 10923 | 10765 | -158 | -1.45% |
| fadedOpacityFrames | 767 | 0 | -767 | -100% |
| nearlyInvisibleFrames | 699 | 0 | -699 | -100% |
| pageErrors | 0 | 0 | 0 | n/a (zero baseline) |
| longTaskCount | 1873 | 2018 | 145 | 7.74% |
| longTaskTotalMs | 162185 | 181997 | 19812 | 12.22% |
| longTaskBlockingMs | 68535 | 81097 | 12562 | 18.33% |
| applyMeasuredCount | 1137 | 1134 | -3 | -0.26% |
| applyTotalMs | 26911.30 | 26221.90 | -689.40 | -2.56% |
| renderMeasuredCount | 1132 | 1128 | -4 | -0.35% |
| renderTotalMs | 5368.80 | 6111.20 | 742.40 | 13.83% |
| elapsedMs | 517216.96 | 502904.30 | -14312.66 | -2.77% |
| readsPerMinute | 3.71 | 10.50 | 6.79 | 182.83% |
| longTasksPerMinute | 217.28 | 240.76 | 23.48 | 10.81% |
| sqlCalls | 56 | 54 | -2 | -3.57% |
| sqlTotalExecMs | 14001.81 | 9602.89 | -4398.92 | -31.42% |

Read attempts are browser observations; sqlCalls are completed pg_stat_statements deltas. Their collection intervals differ.

## Sessions

| Variant | Session | Gestures | Read attempts | HTTP successes | Read aborts | HTTP / network errors | Read bytes | Reads/min | DOM replacements / mutations | Faded / sampled opacity frames |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| baseline | 1 | 406 | 5 | 4 | 1 | 0 / 0 | 5316151 | 0.58 | 4 / 28076 | 7 / 1747 |
| baseline | 2 | 300 | 5 | 5 | 0 | 0 / 0 | 6644244 | 0.58 | 305 / 34480 | 729 / 1524 |
| baseline | 3 | 401 | 5 | 5 | 0 | 0 / 0 | 6644244 | 0.58 | 5 / 27024 | 9 / 1688 |
| baseline | 4 | 0 | 7 | 6 | 0 | 1 / 0 | 7973662 | 0.81 | 6 / 702 | 12 / 1989 |
| baseline | 5 | 0 | 5 | 5 | 0 | 0 / 0 | 6644244 | 0.58 | 5 / 585 | 10 / 1991 |
| baseline | 6 | 0 | 5 | 5 | 0 | 0 / 0 | 6644244 | 0.58 | 5 / 244 | 0 / 1984 |
| candidate | 1 | 406 | 23 | 3 | 20 | 0 / 0 | 3989000 | 2.74 | 3 / 26431 | 0 / 1710 |
| candidate | 2 | 300 | 41 | 1 | 40 | 0 / 0 | 1329354 | 4.89 | 301 / 44851 | 0 / 1567 |
| candidate | 3 | 401 | 1 | 1 | 0 | 0 / 0 | 1329354 | 0.12 | 1 / 26620 | 0 / 1686 |
| candidate | 4 | 0 | 9 | 8 | 0 | 1 / 0 | 2665359 | 1.07 | 8 / 1234 | 0 / 1932 |
| candidate | 5 | 0 | 8 | 8 | 0 | 0 / 0 | 8781 | 0.95 | 8 / 1232 | 0 / 1933 |
| candidate | 6 | 0 | 6 | 6 | 0 | 0 / 0 | 1334869 | 0.72 | 6 / 433 | 0 / 1937 |

## Successful request timing and UI write/apply timing

| Variant | Session | Read HTTP p50 / p95 / p99 / max ms | Write HTTP p50 / p95 / p99 / max ms | UI samples | Apply p50 / p95 ms | Click to stable p50 / p95 ms |
|---|---:|---:|---:|---:|---:|---:|
| baseline | 1 | 1342.80 / 1991.24 / 1991.24 / 1991.24 | 213.65 / 344.54 / 469.08 / 555.21 | 100 | 1.20 / 2.10 | 330.40 / 587.60 |
| baseline | 2 | 1144.92 / 2018.87 / 2018.87 / 2018.87 | 183.21 / 375.92 / 425.48 / 523.95 | 0 | n/a / n/a | n/a / n/a |
| baseline | 3 | 1195.55 / 1880.67 / 1880.67 / 1880.67 | 214.98 / 320.73 / 419.76 / 490.89 | 100 | 1.20 / 2.20 | 330.30 / 643.30 |
| baseline | 4 | 905.72 / 6382.84 / 6382.84 / 6382.84 | n/a / n/a / n/a / n/a | 0 | n/a / n/a | n/a / n/a |
| baseline | 5 | 1056.70 / 1793.17 / 1793.17 / 1793.17 | n/a / n/a / n/a / n/a | 0 | n/a / n/a | n/a / n/a |
| baseline | 6 | 979.31 / 1952.73 / 1952.73 / 1952.73 | n/a / n/a / n/a / n/a | 0 | n/a / n/a | n/a / n/a |
| candidate | 1 | 1263.98 / 2734.78 / 2734.78 / 2734.78 | 215.99 / 357.45 / 476.08 / 830.18 | 100 | 1.20 / 4.10 | 331.10 / 658.80 |
| candidate | 2 | 966.69 / 966.69 / 966.69 / 966.69 | 219.71 / 401.27 / 488.71 / 572.03 | 0 | n/a / n/a | n/a / n/a |
| candidate | 3 | 2799.99 / 2799.99 / 2799.99 / 2799.99 | 216.22 / 351.50 / 430.70 / 662.86 | 100 | 1.20 / 3.60 | 324 / 629.30 |
| candidate | 4 | 2283.60 / 4639.52 / 4639.52 / 4639.52 | n/a / n/a / n/a / n/a | 0 | n/a / n/a | n/a / n/a |
| candidate | 5 | 1570.28 / 2545.51 / 2545.51 / 2545.51 | n/a / n/a / n/a / n/a | 0 | n/a / n/a | n/a / n/a |
| candidate | 6 | 754.62 / 2520.08 / 2520.08 / 2520.08 | n/a / n/a / n/a / n/a | 0 | n/a / n/a | n/a / n/a |

## Browser work (when instrumented)

| Variant | Session | Status | Long tasks / min | Long-task total / blocking ms | Apply count / total ms | Render count / synchronous total ms |
|---|---:|---|---:|---:|---:|---:|
| baseline | 1 | recorded | 75.40 | 52093 / 19593 | 410 / 8221.70 | 410 / 232.40 |
| baseline | 2 | recorded | 64.62 | 53197 / 25347 | 305 / 8516.60 | 305 / 4452.80 |
| baseline | 3 | recorded | 75.29 | 52969 / 20519 | 406 / 8262.30 | 406 / 320.60 |
| baseline | 4 | recorded | 0.70 | 1442 / 1142 | 6 / 684.80 | 6 / 167.40 |
| baseline | 5 | recorded | 0.58 | 1218 / 968 | 5 / 539.30 | 5 / 195.60 |
| baseline | 6 | recorded | 0.70 | 1266 / 966 | 5 / 686.60 | 0 / 0 |
| candidate | 1 | recorded | 81.61 | 56592 / 22392 | 409 / 8149.90 | 409 / 155.40 |
| candidate | 2 | recorded | 80.77 | 67520 / 33670 | 301 / 8255.30 | 301 / 5434.00 |
| candidate | 3 | recorded | 75.64 | 50280 / 18580 | 402 / 7562.50 | 402 / 69.70 |
| candidate | 4 | recorded | 0.95 | 2308 / 1908 | 8 / 762.60 | 8 / 225.00 |
| candidate | 5 | recorded | 0.95 | 2953 / 2553 | 8 / 769.70 | 8 / 227.10 |
| candidate | 6 | recorded | 0.84 | 2344 / 1994 | 6 / 721.90 | 0 / 0 |

## SQL baseline/delta

| Variant | Query ID | Role | Before calls | After calls | Delta calls | Delta execution ms | Delta mean ms |
|---|---|---|---:|---:|---:|---:|---:|
| baseline | 7145021936814103127 | authenticated | 0 | 56 | 56 | 14001.81 | 250.03 |
| candidate | 502317007102243559 | authenticated | 0 | 35 | 35 | 7897.26 | 225.64 |
| candidate | 1768514264548670856 | authenticated | 0 | 19 | 19 | 1705.64 | 89.77 |

Completed calls recorded by pg_stat_statements; not HTTP attempts. Snapshot max is not an interval maximum when a prior baseline exists. Reset epoch is not recorded by this artifact schema; counter regression/disappearance is rejected, but reset followed by regrowth cannot be excluded.

## Warnings

- cost-regression: readAttempts 32 → 88 (175%).
- cost-regression: domMutations 91111 → 100801 (10.64%).
- cost-regression: longTaskCount 1873 → 2018 (7.74%).
- cost-regression: longTaskTotalMs 162185 → 181997 (12.22%).
- cost-regression: longTaskBlockingMs 68535 → 81097 (18.33%).
- cost-regression: renderTotalMs 5368.80 → 6111.20 (13.83%).
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

Workflow run: 45573070537.

| Variant | Source file | SHA-256 |
|---|---|---|
| baseline | operational-sustained/baseline/session-report.json | b46eeb11a02cfdf8dc6dfa64409df498b82a2439db96a604256fa322faee5642 |
| baseline | operational-sustained/pg-stat-before.json | 37517e5f3dc66819f61f5a7bb8ace1921282415f10551d2defa5c3eb0985b570 |
| baseline | operational-sustained/pg-stat-after.json | 52df9764c01a31287bcac3e4b6f98a102fd39552fe2d323456a7633f237df7af |
| candidate | operational-sustained/candidate/session-report.json | 2c0faf8872dfa3103a6223c2669700fc18e85e74cb9daf05ff09ab5712362f74 |
| candidate | operational-sustained/pg-stat-before.json | 37517e5f3dc66819f61f5a7bb8ace1921282415f10551d2defa5c3eb0985b570 |
| candidate | operational-sustained/pg-stat-after.json | 9691044308f3945fe3bf4eacfa5390e9cc707eb17a9ecf08d24b2d0a343a4de8 |
