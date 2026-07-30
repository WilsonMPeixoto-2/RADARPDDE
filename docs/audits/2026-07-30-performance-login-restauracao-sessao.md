# Auditoria — desempenho do login e restauração de sessão

**Data:** 30 de julho de 2026  
**PR:** #113  
**Escopo:** reconhecimento de sessão, autorização inicial e bootstrap remoto

## 1. Sintoma

A tela de acesso podia permanecer por vários segundos em **Verificando a sessão**, inclusive quando o navegador já possuía uma sessão Supabase válida. O login informado manualmente também demorava para liberar a aplicação.

## 2. Causas comprovadas

### 2.1 Validação Auth duplicada

`SessionService.initialize()` registrava `onAuthStateChange` e também executava `restore()`. Em uma restauração ou login, o evento Auth e a chamada explícita podiam iniciar simultaneamente a mesma validação de autorização.

O teste vermelho comprovou duas leituras de cada contrato:

```text
user_profiles:       2
current_app_role:    2
user_school_scopes:  2
```

### 2.2 Consultas de autorização em série

Perfil institucional, papel efetivo e escopos escolares eram consultados um após o outro. Cada latência de rede era somada à anterior.

### 2.3 Snapshot remoto integral e sequencial

Após autenticar, o frontend mantinha a tela de acesso enquanto `DataService.bootstrap()` solicitava todas as 19 entidades do repositório. `SupabaseRepository.exportSnapshot()` processava cada entidade em sequência.

Na data do diagnóstico, `audit_events` possuía 2.741 registros em Production e exigia múltiplas páginas, embora auditoria, perfis e dados de importação não fossem necessários para montar o estado operacional inicial.

## 3. Correção

### Auth

- validação em voo único por usuário autenticado;
- evento Auth e login explícito compartilham a mesma promessa;
- perfil, papel efetivo e escopos iniciam juntos com `Promise.all`;
- nenhuma regra de autorização foi removida ou relaxada.

### Bootstrap de dados

- seleção explícita de entidades em `exportSnapshot()`;
- leituras concorrentes com limite padrão de seis;
- bootstrap remoto restrito às 14 entidades utilizadas pelo estado operacional;
- exportações integrais continuam disponíveis quando nenhum subconjunto é informado.

### Experiência da tela de acesso

Depois que Auth e autorização são confirmados, a tela passa para uma fase distinta:

```text
Sessão reconhecida. Carregando os dados autorizados…
```

O formulário permanece oculto e a aplicação continua inerte até o bootstrap autorizado terminar. A melhoria visual não antecipa exposição de dados.

## 4. Redução estrutural do caminho crítico

Antes:

```text
até 6 consultas Auth duplicadas e serializadas
+ até 24 leituras HTTP de dados em fila para o escopo técnico observado
```

Depois:

```text
3 consultas Auth em uma única rodada paralela
+ 14 entidades operacionais em lotes concorrentes limitados
```

A correção reduz esperas acumuladas, mas não fixa um tempo absoluto, pois a duração final também depende da rede do usuário, da região e da resposta do Supabase.

## 5. Regressões automatizadas

`tests/unit/auth-startup-performance.test.js` comprova:

1. início paralelo das três consultas de autorização;
2. deduplicação entre evento Auth e login explícito;
3. respeito ao subconjunto solicitado e ao limite de concorrência;
4. exclusão de entidades não operacionais do bootstrap inicial.

`tests/unit/auth-gate.test.js` protege a fase visual intermediária sem revelar o formulário ou liberar a aplicação.

## 6. Evidências do SHA candidato

SHA inicial validado:

```text
b0af31f64e2049f6d8de9ddc9c5ad53d5e801118
```

Execuções aprovadas:

- snapshot canônico — `30547345253`;
- Lighthouse — `30547345010`;
- Supabase readiness — `30547345192`;
- gate remoto de perfis e viewports — `30547345100`;
- Playwright E2E — `30547345105`.

Uma nova bateria deve ser vinculada ao SHA final após a inclusão desta auditoria e da regressão visual.

## 7. Impacto operacional

- nenhuma migration;
- nenhuma alteração de schema ou dados;
- nenhuma mudança em RLS;
- nenhum segredo novo;
- nenhum acesso administrativo a Production;
- publicação na Vercel depende de janela controlada posterior.
