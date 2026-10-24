# F06 — classificação da baseline incompleta em 24/10

Registro diagnóstico do run `40071155543`, HEAD consolidado `3314faa2`.
Não altera produto, teste, timeout, animação ou regra de autorização.

## Evidência primária

[Resultado compacto e hashes](../evidence/2026-10-24-f06-baseline-login-diagnostic.json).
O candidato completou a jornada; a baseline ficou em `stage=login`, com zero
gestos e nenhuma amostra. O comparador corretamente a recusou. Não há ganho
comparativo homologado nessa tentativa, nem evidência de regressão F06.

O relatório HTML completo localizou espera não concluída em `ready()`, linha 22:
DataContext.ready + perfil controller + InvoiceService. Cinco sessões chegaram
ao Prontuário; uma permaneceu no login. A terceira captura tem conteúdo destinado
à senha no controle de e-mail e mensagem de validação de e-mail/senha. O reporter
agrupa passos paralelos; sem trace não é possível afirmar univocamente a identidade
da página ou qual cláusula de readiness ficou falsa. Não publicar a captura bruta,
que contém credencial temporária de teste, nem chamá-la de dado institucional.

## Mecanismo isolado, sem autenticação

Na aplicação local, executar no mesmo task:

```js
RadarAuthGate.show();
document.getElementById('radar-auth-password').focus();
// Aguardar dois requestAnimationFrame reais.
```

O controle ativo voltou a `radar-auth-email`. Inserir a string pública
`PUBLIC-FOCUS-PROBE` colocou-a no e-mail, mantendo senha vazia. O método show()
é byte a byte idêntico no runtime histórico d9bf67f7 e no código atual; hash no
JSON. A rotina agenda foco de e-mail incondicional e não é alterada pelo #493.
Essa prova demonstra o mecanismo; não fornece o timestamp perdido do callback
na execução original. Não inventar causa de infraestrutura/Auth/RLS ou defeito
financeiro a partir do timeout.

## Decisão limitada

Uma repetição dos jobs reprovados baseline/comparador no mesmo SHA foi autorizada
pela análise do preparo inválido. Candidato e 11 workflows aprovados preservados.
Não elevar timeout ou normalizar baseline. Se a preparação falhar novamente,
interromper repetições, manter a comparação inconclusiva e encaminhar essa
prontidão/foco separadamente à F04, com critério explícito antes de novo teste.
Não incorporar correção de AuthGate à entrega de NF/F06 por proximidade.

O resultado da repetição e eventual integração/publicação serão registrados no
PR #493 e na issue #492. Este snapshot preserva a primeira falha, sem apagá-la
caso a repetição passe. Não confundir Preview CANCELED por política de branch
com rejeição de Production por quota: conferir `vercel.json` e deployment real.
