# Avaliação mensal — contrato canônico

## 1. Finalidade

A avaliação mensal registra, para cada combinação de unidade escolar, competência e programa, três dimensões relacionadas e independentes:

1. bonificação pela entrega dos documentos;
2. análise técnica da qualidade documental;
3. pendências e regularizações decorrentes.

A aplicação não pode calcular resultados diferentes em Dashboard, Carteira, Competências, Prontuário ou exportações.

## 2. Identidade do registro

```text
schoolId + competenceKey + programId
```

Na camada de compatibilidade do frontend, a chave pode aparecer como:

```text
2026-08_BASIC
```

No Supabase, competência e programa permanecem campos relacionais distintos.

## 3. Projeção canônica

`RadarFluxoOperacional.evaluateMonthlyEvaluation()` recebe:

```javascript
evaluateMonthlyEvaluation({
  bonification,
  analysis,
  pendencies
});
```

E retorna:

```javascript
{
  canConsolidate: true,
  bonusResult: 'apta',
  missingFields: [],
  bonificationStatus: 'apta',
  technicalStatus: 'correto',
  technicalCompletion: 'complete',
  openPendencyCount: 0,
  awaitingReanalysisCount: 0,
  activePendencyCount: 0
}
```

A projeção é pura, serializável e não persiste dados.

## 4. Bonificação

Documentos avaliados:

- Extrato da Conta Corrente;
- Extrato de Investimento;
- Notas Fiscais;
- Consulta à Assessoria;
- Declaração BB Ágil;
- Encaminhamento para Inventariação.

Valores aceitos:

- `Sim`;
- `Não`;
- `Não se aplica`.

Extrato da Conta Corrente, Extrato de Investimento e Declaração BB Ágil não aceitam `Não se aplica` para consolidação.

### Resultado

- todos os campos válidos e nenhum `Não`: `apta`;
- todos os campos válidos e pelo menos um `Não`: `inapta`;
- campo ausente ou `Não se aplica` indevido: resultado nulo e consolidação bloqueada.

A regularização posterior não reescreve automaticamente a bonificação histórica.

## 5. Análise técnica

Estados documentais existentes:

- `Não analisado`;
- `Correto`;
- `Correto (Atrasado)`;
- `Incorreto`;
- estados intermediários compatíveis com a interface vigente.

A situação técnica e o grau de conclusão são calculados de forma independente:

| Situação dos documentos | `technicalStatus` | `technicalCompletion` |
|---|---|---|
| todos não analisados | `nao-analisado` | `not_started` |
| estados parciais sem incorreção | `em-analise` | `in_progress` |
| algum incorreto e ainda há item não analisado | `incorreto` | `in_progress` |
| algum incorreto e todos foram analisados | `incorreto` | `complete` |
| todos corretos | `correto` | `complete` |
| todos corretos, com atraso em algum item | `correto-atrasado` | `complete` |

Análise técnica não altera automaticamente o resultado da bonificação.

## 6. Pendências

A projeção contabiliza apenas pendências da mesma escola, competência e programa.

- `openPendencyCount`: estado `Aberta`;
- `awaitingReanalysisCount`: estado `Aguardando reanálise`;
- `activePendencyCount`: soma dos dois estados ativos.

Pendências `Resolvida` e `Cancelada` permanecem no histórico, mas não entram na contagem ativa.

## 7. Serviço de aplicação

`VerificationService.getMonthlyEvaluation()` resolve o registro canônico e filtra as pendências correspondentes.

`VerificationService.closeBonification()`:

1. confirma que o perfil pode editar;
2. lê o registro da escola, competência e programa;
3. obtém a projeção canônica;
4. bloqueia consolidação incompleta;
5. grava `resultadoBonif` igual a `bonusResult`;
6. registra log administrativo;
7. persiste verificação e log pela operação atômica existente;
8. utiliza `row_version` para impedir sobrescrita silenciosa;
9. devolve a mesma projeção usada na decisão.

Nenhuma tabela, RPC ou migration nova é necessária para este contrato.

## 8. Perfis

- Controlador: lança e consolida nas escolas autorizadas da própria CRE;
- Assistente: lança, consolida e executa ajustes autorizados;
- Gestão SME: consulta bonificação, sem análise técnica ou mutações operacionais;
- Inventário: não lança avaliação mensal;
- Administrador técnico: não herda operação cotidiana por padrão.

A política de capacidades, os handlers, o serviço e a RLS permanecem cumulativos.

## 9. Testes obrigatórios

### Domínio

- APTA;
- INAPTA;
- campo vazio;
- `Não se aplica` indevido;
- análise não iniciada, em andamento e completa;
- situação incorreta com análise ainda incompleta;
- contagem de pendências ativas.

### Serviço

- recorte por escola, competência e programa;
- consolidação devolvendo a projeção persistida;
- estado incompleto sem alteração do resultado;
- persistência atômica e log já cobertos pelos testes remotos existentes;
- concorrência por `row_version`.

### Interface

- seleção de competência posterior a maio;
- lançamento no Prontuário;
- consolidação do PDDE Básico;
- correspondência entre tela, objeto canônico e armazenamento;
- recarga preservando competência e resultado;
- ausência de erros de página.

## 10. Relação com Excel

Os dois modelos Excel devem consumir o mesmo resultado canônico. A certificação posterior comparará:

```text
Supabase → estado carregado → evaluateMonthlyEvaluation → modelo → célula XLSX
```

Nenhum exportador pode manter regra própria de APTA/INAPTA.
