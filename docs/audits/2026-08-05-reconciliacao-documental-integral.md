# Auditoria — Reconciliação Documental Integral

**Data de corte:** 5 de agosto de 2026, 00h45, horário de Brasília  
**Escopo:** somente leitura sobre GitHub, Vercel Production e Supabase Production  
**Resultado:** baseline remoto fixado para atualização dos documentos canônicos

## 1. Objetivo

Eliminar divergências documentais capazes de induzir diagnósticos, planos ou implementações incorretos. A reconciliação foi motivada por falhas funcionais recentes que não estavam adequadamente refletidas na documentação: indisponibilidade do Excel SME no ambiente publicado e quebra integral da Gestão de Equipe antes da correção de CORS e vínculos Auth.

## 2. Fontes de verdade consultadas

1. `main` remota do GitHub;
2. PRs integrados e PRs ainda abertos;
3. deployment efetivo da Vercel Production;
4. projeto Supabase Production, schema, migrations, configuração e Edge Functions;
5. contratos executáveis e versões do `package.json`;
6. workflows, testes e evidências versionadas.

Documentos anteriores foram tratados como apoio histórico, nunca como prova autônoma do estado atual.

## 3. Baseline reconciliado

### GitHub

```text
repositório: WilsonMPeixoto-2/RADARPDDE
main: f812e5dbf3aaa18fb9851948445b0820ac7a5435
último merge: PR #140
mensagem: Alertar e gerenciar incidentes de Production automaticamente
```

### Vercel Production

```text
projeto: radarpdde-fix
projectId: prj_GfXuUuO3dF2jykpp9QgyqIDsxg4U
deployment: dpl_7G3Wmh1YiV4c4aXVwe2P5tN7N7Y4
estado: READY
target: production
commit: f812e5dbf3aaa18fb9851948445b0820ac7a5435
runtime de dados: supabase-production
```

A Production está alinhada à `main` na data de corte. Deployments de Preview do PR nº 141 não representam Production.

### Supabase Production

```text
projeto: scnryinorqeucbfkioxo
nome: RADAR PDDE 2026
região: sa-east-1
estado: ACTIVE_HEALTHY
PostgreSQL: 17.6.1.147
migrations aplicadas: 25
closing_competence: 2026-12
app_config.row_version: 20
```

### Edge Functions

```text
team-account-management
status: ACTIVE
versão: 95
verify_jwt: true
```

Há uma única Edge Function ativa catalogada na data de corte.

### Ferramentas principais

```text
Node.js: 24.x
Playwright: 1.62.0
Supabase JS: 2.110.8
Supabase CLI: 2.110.0
ESLint: 10.8.0
Knip: 6.29.0
eslint-plugin-playwright: 2.10.5
ExcelJS: 4.4.0
```

## 4. Cronologia funcional recente

| PR | Estado | Resultado efetivo |
|---:|---|---|
| **#136** | integrado e publicado | corrigiu o runtime do Excel SME e adicionou os dois relatórios Excel ao dashboard da Assistente |
| **#137** | integrado e publicado | entregou Excel SME de 27 colunas, bordas, designação textual, cabeçalho alinhado e retirou a explicação interna do seletor global |
| **#138** | integrado e publicado | corrigiu CORS, gestão de contas, vínculos Auth legados e homologou cadastro, edição, redistribuição e desativação da equipe |
| **#139** | integrado e publicado | implantou monitor geral de Production, assets, Auth gate, bloqueio anônimo e preflight das Edge Functions |
| **#140** | integrado e publicado | passou a abrir, atualizar e encerrar incidentes automáticos do monitor de Production |
| **#141** | aberto em rascunho | propõe auditoria contínua de integridade dos dados; não integra a `main`, não altera Production e não deve ser documentado como concluído |

## 5. Contratos funcionais confirmados

### Excel SME

- uma competência mensal por arquivo;
- 27 colunas, intervalo A:AA;
- remoção exclusiva das posições-fonte K, R e Y do template de 30 colunas;
- preservação dos campos administrativos posteriores;
- designação textual no padrão `XX.XX.XXX`;
- bordas completas;
- cabeçalho centralizado, com quebra automática e sem espaços artificiais;
- filtro, impressão e congelamento preservados;
- abertura aprovada no Microsoft Excel desktop;
- template e ExcelJS protegidos por manifesto, hash, smoke e reabertura automatizada.

### Gestão de Equipe

- Assistente pode cadastrar, editar e desativar Controladores e integrantes do Inventário;
- cadastro e edição atravessam frontend, serviço, Edge Function, Auth e RPC transacional;
- CORS aceita origens institucionais canônicas e rejeita origem indevida;
- JWT e papel institucional são obrigatórios;
- vínculos legados são recuperados por `user_profiles` quando seguros;
- divergências ambíguas são rejeitadas;
- redistribuição de carteira e compensações são protegidas por testes completos.

### Garantia operacional

- monitor executa após `push` na `main`, a cada hora e manualmente;
- valida commit publicado, manifesto, shell, assets, configuração pública, bloqueio anônimo e preflight;
- falha abre ou atualiza incidente automático único;
- recuperação confirmada encerra o incidente;
- a camada não substitui testes autenticados de escrita por perfil, que permanecem na sequência de confiabilidade funcional.

## 6. Divergências documentais encontradas

Os documentos canônicos ainda continham, entre outras, as seguintes afirmações superadas:

- Excel SME com 30 colunas como produto público;
- incidente de HTTP 404 ainda aberto;
- PR nº 133 ainda como próxima ação;
- Production e SHAs de 1º a 3 de agosto já superados;
- `app_config.row_version = 5` em vez de 20;
- ausência das correções dos PRs nº 136 a 140;
- ausência do monitor e dos incidentes automáticos;
- sequência técnica centrada em CodeQL antes da confiabilidade funcional ponta a ponta;
- falta de distinção entre o PR nº 141 em rascunho e recursos já integrados.

## 7. Prioridade corrente aprovada

A prioridade do projeto passa a ser documentada nesta ordem:

1. documentação canônica coerente com o estado remoto;
2. confiabilidade funcional ponta a ponta por perfil, tela e operação;
3. integridade e disponibilidade contínuas do Supabase e da Vercel;
4. provas de leitura, escrita, releitura e compensação;
5. atualizações menores de dependências com regressão completa;
6. melhorias futuras de experiência e produto.

A auditoria de segurança permanece válida como referência, mas não define a sequência imediata de execução para uma ferramenta interna operada por equipe reduzida.

## 8. Limites desta entrega

Esta reconciliação:

- não altera código funcional;
- não modifica `package.json` ou lockfile;
- não cria migration;
- não acessa nem altera dados operacionais;
- não publica Edge Function;
- não modifica RLS ou Auth;
- não realiza novo deployment;
- não integra o PR nº 141;
- não autoriza merge desta branch.
