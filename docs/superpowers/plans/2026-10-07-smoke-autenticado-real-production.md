# Plano — Smoke autenticado real em Production

**Data:** 7 de outubro de 2026  
**Natureza:** garantia operacional com leitura recorrente e escrita manual reversível  
**Ambiente:** Vercel Production + Supabase Production  
**Autorização:** uso de contas reais e ciclo controlado de criação/edição/exclusão autorizado pelo responsável do produto.

## 1. Objetivo

Provar no sistema efetivamente publicado que contas reais conseguem:

1. autenticar e restaurar sessão;
2. receber o perfil e o escopo corretos;
3. usar busca, Dashboard, Carteira quando aplicável, Prontuário e Pendências;
4. ler Supabase Production sob as RLS reais;
5. em execução manual, realizar um ciclo fiscal completo criar → editar → reler → excluir;
6. terminar sem registro fiscal sintético residual.

A intenção é verificar experiência e persistência reais, não criar uma segunda infraestrutura de homologação.

## 2. Contas

O monitor aceita de uma a cinco contas reais, uma por perfil:

- `controller`;
- `federal_assistant`;
- `inventory`;
- `sme_management`;
- `technical_admin`.

Para o ciclo de escrita, exatamente uma conta `controller` ou `federal_assistant` deve receber `allowWrite: true`.

Não existe requisito de senha técnica com comprimento artificial. A suíte apenas exige que e-mail e senha estejam presentes e que o perfil informado corresponda ao papel efetivamente devolvido pelo RADAR.

## 3. Credenciais

O workflow lê preferencialmente o segredo GitHub:

`RADAR_PRODUCTION_AUTH_ACCOUNTS_JSON`

Mantém compatibilidade temporária com:

`RADAR_PRODUCTION_READ_ACCOUNTS_JSON`

Formato:

```json
{
  "accounts": [
    {
      "profileId": "controller",
      "email": "usuario-real@dominio",
      "password": "senha-real",
      "allowWrite": true
    },
    {
      "profileId": "federal_assistant",
      "email": "outro-usuario-real@dominio",
      "password": "senha-real"
    }
  ]
}
```

As credenciais podem pertencer a contas institucionais reais autorizadas. Elas não são versionadas no repositório nem incluídas em logs, traces, screenshots ou vídeos do CI.

## 4. Leitura recorrente

A execução agendada continua **somente leitura**. Para cada conta fornecida, comprova:

- ambiente `production`;
- modo `supabase-production`;
- SupabaseRepository ativo;
- papel efetivo esperado;
- leitura de escolas, verificações, pendências e bens;
- vínculos de programas quando aplicável;
- Dashboard;
- busca global;
- Carteira ou negativa esperada para Inventário;
- Prontuário;
- Pendências;
- reload/restauração de sessão;
- logout;
- ausência de requisição mutante nessa etapa;
- ausência de erro de navegador.

Periodicidade: a cada seis horas, enquanto a variável de habilitação estiver ativa.

## 5. Escrita manual reversível

Somente `workflow_dispatch` habilita a etapa de escrita.

O teste:

1. autentica a conta marcada com `allowWrite: true`;
2. escolhe um contexto fiscal existente e autorizado que já tenha ao menos uma NF, evitando um contexto vazio;
3. captura `analysis`, `bonification` e `bonus_result` da verificação;
4. cria uma NF de consumo com identificação `TESTE_AUTOMACAO`;
5. confirma a linha persistida diretamente no Supabase;
6. edita o valor e confirma a releitura remota;
7. recarrega a página e confirma que o registro continua visível;
8. exclui a NF pelo fluxo normal do produto;
9. confirma ausência da NF no Supabase;
10. compara os campos funcionais da verificação com o snapshot inicial;
11. executa cleanup de contingência se uma falha ocorrer depois da criação.

Os logs administrativos do ciclo **não são apagados**. Eles são parte do contrato de auditoria e registram que houve uma operação de teste. O dado fiscal sintético, porém, deve ser removido.

## 6. Limites

Este smoke não:

- usa `service_role` no navegador;
- altera schema, migrations, Auth ou RLS;
- cria usuários;
- publica conteúdo institucional;
- testa todas as mutações do produto;
- substitui as suítes com Supabase descartável;
- executa escrita automaticamente a cada seis horas.

## 7. Critério de conclusão

A frente é considerada operacional quando:

1. código e contratos do workflow passam na CI;
2. ao menos uma execução manual usa conta real e conclui o ciclo reversível;
3. a NF sintética não permanece em Production;
4. os campos funcionais da verificação retornam ao snapshot inicial;
5. uma execução agendada posterior de leitura passa;
6. o estado é registrado no `CURRENT_STAGE.md`.

O plano anterior de 05/08/2026, que exigia cinco identidades técnicas e proibia qualquer escrita em Production, permanece apenas como histórico da política anterior.
