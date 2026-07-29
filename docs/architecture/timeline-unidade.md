# Timeline cronológica da unidade — contrato arquitetural

## 1. Finalidade

A timeline consolida eventos operacionais e administrativos relevantes de uma unidade escolar em uma única leitura cronológica. Ela não cria uma nova fonte de verdade e não persiste registros derivados.

A projeção é produzida em tempo de leitura por:

```javascript
RadarSchoolTimeline.buildSchoolTimeline(input)
```

## 2. Escopo da projeção

A chave de recorte é:

```text
schoolId + competenceKey
```

Programa e pendência permanecem vínculos opcionais em cada evento.

Fontes consideradas:

- verificações e consolidações;
- pendências;
- tentativas de regularização;
- contatos;
- notas fiscais;
- bens permanentes;
- registros administrativos.

## 3. Contrato do evento

Cada evento é serializável e contém:

```javascript
{
  id,
  occurredAt,
  type,
  title,
  description,
  actor,
  status,
  competenceKey,
  programId,
  pendencyId,
  visibility,
  sourceEntity,
  sourceId
}
```

### Campos de rastreabilidade

- `sourceEntity`: coleção de origem;
- `sourceId`: identificador original;
- `id`: identificador estável da projeção;
- `actor`: autoria disponível na fonte;
- `occurredAt`: instante normalizado em ISO 8601.

## 4. Tipos canônicos

| Tipo | Origem típica |
|---|---|
| `verification_consolidated` | verificação ou log de consolidação |
| `pendency_opened` | pendência |
| `pendency_resolved` | pendência |
| `pendency_cancelled` | pendência |
| `pendency_attempt_registered` | tentativa ainda não reanalisada |
| `pendency_attempt_reviewed` | tentativa reanalisada |
| `pendency_contact` | contato ou cobrança |
| `invoice_registered` | nota fiscal |
| `asset_registered` | bem sem inventariação concluída |
| `asset_inventoried` | bem inventariado |
| `technical_analysis_changed` | log técnico |
| `administrative_event` | demais logs autorizados |

## 5. Ordenação e deduplicação

A ordem é decrescente por `occurredAt`. Eventos no mesmo instante são ordenados pelo `id` estável.

A abertura da pendência é projetada a partir do registro principal. Um item equivalente dentro do histórico incorporado não cria uma segunda abertura.

Uma consolidação pode aparecer em duas fontes legítimas:

1. o estado da verificação;
2. o log administrativo correlacionado.

As duas entradas são preservadas porque cumprem funções distintas: resultado material e trilha administrativa. A interface exibe a mesma classificação de resultado em ambas.

## 6. Visibilidade por perfil

Eventos recebem uma das classificações:

- `managerial`: conteúdo gerencial e operacional consultável;
- `technical`: detalhe de análise técnica restrito aos perfis autorizados;
- `operational`: classificação padrão para fontes sem restrição especial.

A Gestão SME não recebe eventos `technical`. Permanecem visíveis consolidações, contatos, pendências e demais fatos gerenciais autorizados.

A filtragem da timeline não substitui capacidades, serviços ou RLS. É uma camada adicional de apresentação.

## 7. Integração visual

A aba **Histórico cronológico** é instalada no Prontuário após o renderizador principal.

O carregamento segue:

```text
auth-gate
→ navigation-routes
→ product-extensions-bootstrap
→ school-timeline.css
→ school-timeline.js (domínio)
→ school-timeline.js (integração)
```

`RadarProductExtensionsReady` representa a conclusão do carregamento das extensões.

A integração envolve `renderProntuario` uma única vez e mantém um `MutationObserver` de contingência para conteúdo produzido novamente pelo núcleo. O marcador de instalação impede cadeias recursivas de wrappers.

## 8. Persistência

A timeline não:

- cria tabela;
- cria migration;
- cria RPC;
- grava eventos derivados;
- altera `row_version`;
- reescreve logs existentes.

Qualquer edição continua ocorrendo pelos serviços transacionais já existentes. A timeline é somente leitura.

## 9. Testes obrigatórios

### Domínio

- ordenação cronológica;
- desempate estável;
- abertura sem duplicidade;
- vínculos por competência, programa e pendência;
- isolamento entre escolas e competências;
- recorte da Gestão SME;
- serialização integral.

### Interface

- extensão carregada sem erro;
- aba visível no Prontuário;
- nove eventos da massa controlada;
- consolidação no topo;
- uma única abertura;
- contato, inventariação e reanálise visíveis;
- log técnico oculto para Gestão SME;
- ausência de `pageerror`.

## 10. Evolução futura

Novas fontes podem ser acrescentadas somente quando possuírem:

1. vínculo confiável com a unidade;
2. data de ocorrência válida;
3. origem e identificador rastreáveis;
4. regra explícita de visibilidade;
5. teste de deduplicação e ordenação.

A criação de uma tabela materializada de timeline exigirá ADR específica e comprovação de necessidade de desempenho ou retenção que a projeção atual não consiga atender.