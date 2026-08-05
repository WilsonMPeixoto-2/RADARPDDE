# Plano — Smoke autenticado de leitura em Production

**Data:** 5 de agosto de 2026  
**Baseline reconciliado:** `4c182a318ef6a2037af7358bbfe52a77543cc769`  
**Baseline funcional publicado:** `2ae98da8a547d46cd7e8e64977b855b1a90a2495`  
**Vercel Production:** `dpl_BvrxJUahgWpaRbtn6Y5FrfzknKAw` — `READY`  
**Edge Function de equipe:** versão 103 — `ACTIVE` — JWT obrigatório  
**Natureza:** garantia operacional não destrutiva  
**Matriz de origem:** `docs/reference/FUNCTIONAL_CONTRACT_MATRIX.md`

## 1. Objetivo

Provar periodicamente, no site efetivamente publicado e no Supabase Production, que os cinco perfis autenticam, recebem o recorte correto e concluem as seis operações de leitura marcadas como `authenticated-read`:

| ID | Operação |
|---|---|
| `AUTH-01` | entrar, restaurar sessão e aplicar perfil/escopos |
| `NAV-02` | pesquisar somente entidades autorizadas |
| `READ-01` | consultar dashboard |
| `READ-02` | consultar Carteira quando o perfil possui acesso |
| `READ-03` | consultar prontuário e timeline |
| `READ-04` | consultar pendências |

## 2. Perfis

- Controlador;
- Assistente de Verbas Federais;
- Gestão SME;
- Equipe de Inventário;
- Administrador técnico.

A Equipe de Inventário deve permanecer sem acesso à Carteira, conforme a matriz. Essa negativa integra a prova.

## 3. Princípios de segurança

1. não reutilizar contas pessoais ou institucionais de servidores;
2. usar cinco identidades técnicas dedicadas, uma por perfil;
3. não inserir, editar, excluir, desativar ou acionar Edge Functions;
4. permitir apenas autenticação, refresh de sessão, `GET` do PostgREST e a RPC exclusivamente de leitura `current_app_role`;
5. falhar se o navegador emitir `POST` para tabela, outra RPC, Edge Function ou métodos `PATCH`, `PUT` e `DELETE`;
6. não publicar e-mail, senha, token, trace, screenshot, vídeo ou conteúdo institucional;
7. manter o arquivo de credenciais em `${RUNNER_TEMP}`, permissão `600`, com remoção obrigatória;
8. não executar o acesso remoto em pull requests.

## 4. Provisionamento

A consulta agregada em Production encontrou usuários funcionais ativos, mas nenhuma conta provável de monitoramento. Esta fase não cria identidades automaticamente.

Para ativar a execução remota serão necessários:

- cinco contas técnicas dedicadas no Supabase Auth;
- perfil correto em `user_profiles`;
- escopo mínimo e representativo em `user_school_scopes`, quando aplicável;
- segredo GitHub `RADAR_PRODUCTION_READ_ACCOUNTS_JSON`;
- variável GitHub `RADAR_PRODUCTION_AUTH_READ_ENABLED=true`.

Formato do segredo:

```json
{
  "accounts": [
    { "profileId": "controller", "email": "...", "password": "..." },
    { "profileId": "federal_assistant", "email": "...", "password": "..." },
    { "profileId": "inventory", "email": "...", "password": "..." },
    { "profileId": "sme_management", "email": "...", "password": "..." },
    { "profileId": "technical_admin", "email": "...", "password": "..." }
  ]
}
```

E-mails e senhas reais nunca pertencem ao repositório, aos logs ou às evidências.

## 5. Execução

O workflow `.github/workflows/production-authenticated-read.yml` possui três comportamentos:

1. **pull request:** valida sintaxe e contratos sem acessar Production;
2. **agendamento/manual com monitor desabilitado:** registra provisionamento pendente sem falhar;
3. **agendamento/manual habilitado:** executa Playwright serialmente, um perfil por vez.

Periodicidade proposta: a cada seis horas. A frequência reduz autenticações desnecessárias e ainda detecta regressões operacionais no mesmo dia.

## 6. Evidência por perfil

A suíte confirma:

- ambiente `production` e modo `supabase-production`;
- repositório Supabase;
- papel efetivo esperado;
- ausência de sessão no contexto público;
- leitura sem erro de escolas, verificações, pendências e bens;
- leitura de vínculos de programas para perfis com Carteira;
- escola autorizada disponível;
- dashboard renderizado;
- busca global com resultado autorizado;
- Carteira visível ou corretamente negada;
- prontuário aberto por rota canônica;
- pendências renderizadas;
- restauração da sessão após recarregar;
- logout;
- ausência de requisição potencialmente mutante e de erro de navegador.

## 7. Critério de conclusão

A infraestrutura de teste pode ser integrada desabilitada. A fase de monitoramento somente será considerada concluída quando:

1. as cinco contas técnicas estiverem provisionadas de forma autorizada;
2. o segredo e a variável estiverem configurados;
3. uma execução manual no SHA candidato for aprovada;
4. uma execução agendada subsequente for aprovada;
5. a matriz alterar as seis operações de `partial/authenticated-read` para cobertura comprovada;
6. o monitor permanecer documentado e protegido por testes permanentes.

## 8. Fora do escopo

- qualquer escrita operacional;
- criação automática de usuários em cada execução;
- uso de service role no navegador;
- validação das 23 operações mutantes;
- correção de `ASSET-02`;
- decisão sobre `CFG-03` e `CFG-04`;
- incidentes automáticos antes da estabilização inicial do monitor.

## 9. Reconciliação cronológica

Esta entrega foi reconciliada depois dos PRs nº 150 e 151. A árvore preserva:

- o hotfix de transição Inventário → Controlador;
- a Edge Function versão 103 publicada;
- o estado canônico e a evidência da release;
- a ativação remota bloqueada até autorização específica.
