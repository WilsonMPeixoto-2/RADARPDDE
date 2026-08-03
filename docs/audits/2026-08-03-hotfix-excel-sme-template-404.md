# Hotfix do Excel SME — template ausente no artefato Vercel

**Data:** 3 de agosto de 2026  
**Incidente:** HTTP 404 ao gerar o Excel SME  
**PR:** `#133`  
**Estado:** correção implementada; validação final e publicação em Production pendentes

## 1. Sintoma observado

Ao acionar **Excel SME** no ambiente de Production, o navegador exibia:

```text
Não foi possível carregar o template Excel SME (404).
```

A falha ocorria antes da geração do arquivo, durante o carregamento sob demanda do template canônico.

## 2. Diagnóstico confirmado

O carregador de runtime solicita o caminho absoluto:

```text
/assets/templates/CRE_04_CONTROLE_ONEDRIVE2026.xlsx
```

O arquivo existe na árvore versionada do repositório. Entretanto, o build público da Vercel copiava para `dist` somente:

```text
index.html
app.js
config.js
styles.css
src
vendor
```

A pasta `assets` não integrava o artefato publicado. A consulta direta ao caminho canônico em Production retornou HTTP `404` com `x-vercel-error: NOT_FOUND`.

Portanto, a causa não era corrupção do XLSX, incompatibilidade do ExcelJS, erro do renderer nem ausência do arquivo na `main`. O defeito estava na composição do artefato de implantação.

## 3. Reprodução regressiva — RED

Antes da correção, foi acrescentado ao contrato do build um teste que exige a presença física de:

```text
dist/assets/templates/CRE_04_CONTROLE_ONEDRIVE2026.xlsx
```

No commit `1cc495e6e87b065610bb4d8aeb5fec0470ea639d`, o gate de readiness falhou exatamente por:

```text
ENOENT: no such file or directory, access '.../dist/assets/templates/CRE_04_CONTROLE_ONEDRIVE2026.xlsx'
```

Resultado da suíte unitária nessa etapa:

```text
457 testes
456 aprovados
1 reprovado
```

A falha demonstrou que o teste detectava a causa real do incidente.

## 4. Correção — GREEN

O build da Vercel passou a incluir `assets` entre as entradas públicas obrigatórias de `RUNTIME_ENTRIES`.

A alteração é restrita a:

- publicar a pasta já versionada no diretório `dist`;
- preservar o caminho absoluto consumido pelo carregador;
- proteger a presença do template por teste unitário específico.

O teste foi isolado com o nome:

```text
inclui o template canônico do Excel SME no artefato público da Vercel
```

## 5. Escopo preservado

Não foram alterados:

- conteúdo binário do template XLSX;
- 30 colunas e regras do Excel SME;
- renderer ou integração do botão;
- ExcelJS `4.4.0`;
- ausência deliberada de `dataValidations`;
- banco, dados, migrations, Auth, RLS ou Edge Functions do Supabase;
- configuração de runtime do Supabase;
- regras de perfil ou negócio.

Nenhuma dependência nova foi necessária. A solução adequada é o ajuste mínimo do pipeline de build existente.

## 6. Condições de conclusão

A correção somente poderá ser declarada disponível aos usuários após o cumprimento cumulativo de:

1. teste unitário e readiness verdes no SHA final;
2. testes E2E aplicáveis verdes;
3. revisão do diff do PR;
4. integração à `main`;
5. publicação controlada em Vercel Production;
6. confirmação de HTTP `200` no caminho do template;
7. geração e download do Excel SME no ambiente publicado.

Enquanto não houver novo deployment, a versão atualmente publicada continua sujeita ao HTTP `404` constatado.
