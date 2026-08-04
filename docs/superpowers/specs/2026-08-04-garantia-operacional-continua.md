# Garantia Operacional Contínua do RADAR PDDE

## Objetivo

Reduzir a possibilidade de uma funcionalidade permanecer defeituosa em produção até que um usuário a descubra, por meio de verificações automáticas, não destrutivas e progressivamente mais completas.

## Princípios

- A fonte de verdade é o código remoto integrado à `main` e o ambiente efetivamente publicado.
- Testes pré-merge não substituem a homologação do deployment real.
- A primeira camada deve ser simples, rápida, sem credenciais administrativas e sem alteração de dados.
- Verificações de escrita em produção somente poderão usar identidades e registros técnicos reservados, com compensação e prova de limpeza.
- Nenhum segredo, token, senha ou conteúdo sensível pode aparecer em logs, artefatos ou issues.
- Falhas devem produzir diagnóstico por módulo, URL, código HTTP, deployment e etapa afetada.

## Arquitetura em fases

### Fase 1 — Smoke público e de infraestrutura

Executar após cada atualização da `main`, a cada hora e manualmente:

- confirmar que o alias oficial responde;
- confirmar que o manifesto aponta para Production, Supabase Production e o commit esperado;
- validar o shell de login e a ausência de página de erro;
- descobrir e baixar todos os arquivos locais referenciados no HTML;
- rejeitar JavaScript ou CSS substituído por HTML, arquivo vazio ou resposta não bem-sucedida;
- confirmar que o usuário anônimo não lê escolas;
- validar o preflight das Edge Functions catalogadas;
- registrar resumo legível no GitHub Actions.

A execução agendada não modifica dados e não exige conta de usuário.

### Fase 2 — Smoke autenticado somente leitura

Criar identidades técnicas dedicadas para cada perfil e validar login, navegação, visibilidade, filtros, consultas e permissões em desktop e mobile. As credenciais permanecerão apenas em GitHub Actions Secrets.

### Fase 3 — Integridade contínua do banco

Executar consultas somente leitura para detectar vínculos quebrados, perfis divergentes, escolas atribuídas a controladores inativos, referências órfãs, duplicidades proibidas e campos obrigatórios ausentes.

### Fase 4 — Provas controladas de escrita

Exercitar cadastro, edição, redistribuição, pendências, inventário e exportações com registros técnicos efêmeros. Cada prova deverá confirmar a gravação, a auditoria, a compensação e a inexistência de resíduos.

### Fase 5 — Saúde operacional e resposta automática

Consolidar resultados em painel técnico, abrir ou atualizar incidentes automaticamente, fechar incidentes após recuperação confirmada e preparar rollback operacional documentado.

## Escopo desta implementação

Esta entrega implementa somente a Fase 1 e prepara contratos reutilizáveis para as fases seguintes. Não adiciona serviço externo, pacote npm, credencial, alteração de banco, migration, mudança de RLS ou operação destrutiva.

## Critérios de aceite da Fase 1

1. O monitor falha quando o site, manifesto ou asset obrigatório está indisponível ou inconsistente.
2. O monitor aguarda a propagação do deployment antes de declarar divergência de commit.
3. O monitor valida todos os `src` e `href` locais presentes no HTML, sem seguir URLs externas, `data:`, âncoras ou links de navegação.
4. O monitor confirma o bloqueio anônimo da tabela `schools`.
5. O workflow executa em `push` para `main`, a cada hora e por acionamento manual.
6. A origem oficial da Edge Function continua aprovada e uma origem indevida continua bloqueada.
7. A bateria unitária, readiness e smoke remoto terminam sem falhas.
