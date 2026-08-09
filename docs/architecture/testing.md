# Estratégia de testes e gates de qualidade

**Estado:** vigente  
**Atualizado em:** 9 de agosto de 2026

> A regra operacional de interpretação e encerramento está em [`../reference/TEST_GOVERNANCE.md`](../reference/TEST_GOVERNANCE.md). Este documento descreve as camadas técnicas disponíveis, não um checklist universal para toda mudança.

## 1. Princípio

Uma função crítica não é aprovada apenas porque DOM, serviço ou banco funciona isoladamente. Ao mesmo tempo, não é necessário testar todas as camadas do sistema para qualquer alteração.

A profundidade da validação acompanha o risco e as camadas realmente afetadas.

Fluxo de referência:

```text
experiência do usuário e contrato funcional
→ capacidade por perfil
→ serviço/integração afetados
→ persistência/Auth/RLS quando aplicável
→ atualização e releitura quando houver escrita
→ erro/conflito/compensação quando material
→ publicação quando houver mudança de Production
```

O estado corrente fica em [`../CURRENT_STAGE.md`](../CURRENT_STAGE.md).

## 2. Autoridade dos testes

Testes protegem o contrato vigente. Não criam regra de negócio autonomamente.

Diante de uma falha, classificar antes de alterar código:

1. defeito de produto;
2. contrato de teste superado;
3. defeito do próprio teste/fixture;
4. infraestrutura/ambiente;
5. flaky não reproduzível.

Somente um defeito real do produto justifica alterar comportamento de produção em resposta à falha.

## 3. Matriz funcional executável

```text
docs/reference/functional-contract-matrix.json
docs/reference/functional-contract-matrix/*.json
docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md
scripts/check-functional-contract-matrix.mjs
tests/unit/functional-contract-matrix.test.js
```

```bash
npm run generate:functional-matrix
npm run check:functional-matrix
```

A matriz registra 41 operações e o estado de evidência de cada uma. `partial` significa que uma prova adicional pode ser útil em contexto adequado; **não significa defeito, regressão ou bloqueio automático**.

## 4. Gate base

```bash
npm run test:readiness
```

O readiness é um gate abrangente disponível para mudanças transversais, releases relevantes e reconciliações de contrato. Ele não precisa ser repetido mecanicamente para cada ajuste visual ou documental se um conjunto menor comprovar o risco real.

Camadas menores podem ser usadas isoladamente:

```bash
npm run check
npm run test:unit
npm run test:integration
npm run check:functional-matrix
```

## 5. Regressão proporcional

Ao corrigir defeito real, preferir regressão pequena capaz de detectar sua reintrodução.

Antes de criar teste novo:

- verificar se já existe cenário que cobre a jornada;
- atualizar contrato antigo quando a regra mudou;
- evitar duplicar o mesmo comportamento em várias suites;
- não criar infraestrutura nova apenas para elevar cobertura nominal.

Uma mudança documental/teste que não altera o produto não exige nova prova de banco ou Production apenas por existir um pipeline capaz de executá-la.

## 6. Supabase local

Disponível quando a mudança alcança schema, Auth, RLS, RPC, Edge Function ou persistência:

```bash
npm run supabase:start
npm run supabase:reset
npm run supabase:test:db
npm run supabase:lint:db
npm run supabase:gen:types
npm run typecheck:database
```

Usar quando materialmente relacionado. Não iniciar Supabase local para alteração sem impacto nessas camadas.

## 7. Escritas e operações compostas

Para mudança que grava dados, selecionar as provas necessárias entre:

- perfil autorizado;
- negativa relevante;
- payload e serviço corretos;
- persistência;
- releitura após refresh;
- autoria/auditoria;
- conflito de versão;
- compensação de falha parcial.

Não é obrigatório executar todos os itens quando o risco não os envolve.

## 8. Pendências

Contrato vigente:

- estados: Aberta, Aguardando reanálise, Resolvida e Cancelada;
- novo envio não resolve automaticamente;
- Controlador, Assistente e `technical_admin` podem reanalisar;
- SME e Inventário não executam reanálise;
- tentativa, agregado, verificação e histórico permanecem coerentes;
- competência vem de `RadarCompetenceContext`.

Teste atual deve usar o contexto canônico, não manipular `activeCompetenciaKey` diretamente para simular troca de mês.

## 9. Gestão de Equipe

Quando essa superfície for alterada, as provas de maior valor são as ações reais e reversíveis contra Supabase descartável:

- cadastrar/editar membro;
- transição de perfil autorizada;
- redistribuir carteira;
- desativar;
- verificar persistência e vínculo Auth/RPC.

Não repetir essas operações após mudança sem relação com Gestão de Equipe.

## 10. Auditoria

Teste de autoria deve selecionar o evento pela identidade/contexto corretos. Coleção ordenada por UUID não é ordem cronológica.

Evitar padrões como `reverse().find(...)` para inferir “último evento” sem ordenação temporal explícita.

## 11. Excel

Quando a mudança afetar exportação:

```bash
npm run certify:excel:fixture
```

O Excel SME protege competência mensal, 27 colunas A:AA, estrutura, manifesto e geração. Homologação humana no Excel desktop é necessária quando houver mudança material no artefato, não para alterações alheias à exportação.

## 12. Playwright e dispositivos

Disponíveis:

```bash
npm run test:e2e
npm run test:mobile
```

Usar desktop/mobile conforme a superfície alterada. Se o código coberto não mudou e a jornada já possui evidência válida, não repetir a mesma suíte apenas por ritual.

Alteração de layout, navegação, foco, cabeçalho, modal ou responsividade justifica validação no viewport afetado.

## 13. Experiência do usuário

Além de “funciona”, verificar quando aplicável:

- ação encontrável;
- contexto visível e compreensível;
- legibilidade;
- clique/teclado/foco estáveis;
- feedback de sucesso/erro;
- dados mostrados coerentes com os gravados;
- retorno e filtros preservados;
- conteúdo essencial disponível no mobile.

Um backend correto não compensa uma interface que esconde o estado ou a próxima ação.

## 14. Backup e restauração

```bash
RADAR_ALLOW_DISPOSABLE_BACKUP_RESTORE=true npm run test:backup-restore
```

Executar para mudanças de migration, importação, restauração, snapshot ou risco de recuperação de dados. Não é gate padrão para alteração visual, documental ou teste de interface.

## 15. Production

### Monitor geral

`.github/workflows/production-system-smoke.yml` verifica a saúde técnica publicada.

### Integridade dos dados

`.github/workflows/production-data-integrity.yml` verifica invariantes agregadas.

### Leitura autenticada

A infraestrutura dedicada permanece separada e protegida. Ausência de execução recorrente não transforma uma função já homologada em defeito.

Após mudança realmente publicada, confirmar o SHA do deployment quando isso fizer parte da entrega.

## 16. Lighthouse e auditorias especializadas

Ferramentas disponíveis:

```bash
npm run audit:lighthouse
npm run audit:baseline
npm run audit:frontend-precedence:check
npm run test:frontend-precedence
npm run build:vercel
```

Usar quando a mudança toca desempenho, acessibilidade estrutural, precedência de frontend ou build. Um Lighthouse vermelho sem relação material com a mudança não deve iniciar sozinho uma nova frente de correção.

## 17. Dependências

```bash
npm run lint
npm run analyze:unused
npm run check:team-account-function
```

Atualização de dependência deve permanecer em frente isolada quando possível e validar somente os riscos introduzidos pela atualização.

## 18. Mesmo SHA e encerramento

Para entrega com publicação:

1. identificar o SHA candidato;
2. executar a validação proporcional nesse código;
3. classificar qualquer falha relevante;
4. integrar quando objetivamente pronto;
5. confirmar o SHA publicado.

Não exigir que todos os jobs possíveis estejam verdes se falhas restantes forem comprovadamente históricas, artificiais ou não relacionadas.

Uma rodada termina quando o risco da mudança foi coberto e não há evidência concreta de regressão relevante ao usuário. Não iniciar outra rodada integral sem nova evidência.
