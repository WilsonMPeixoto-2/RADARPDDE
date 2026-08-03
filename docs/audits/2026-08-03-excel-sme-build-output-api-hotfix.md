# Hotfix — publicação do template Excel SME

Data: 3 de agosto de 2026

## Incidente

A rota pública do template `CRE_04_CONTROLE_ONEDRIVE2026.xlsx` retornava HTTP 404 em Production, embora o arquivo existisse no repositório e fosse copiado para `dist` durante o build.

## Correção

A publicação passou a usar a Build Output API v3 da Vercel, com o conteúdo estático em `.vercel/output/static`. O template é validado antes do deployment quanto à assinatura ZIP, ao diretório central e às entradas OOXML obrigatórias.

## Proteções regressivas

- teste HTTP do caminho público exato em servidor local;
- validação do tipo MIME e rejeição de respostas HTML;
- homologação do arquivo em `dist` e `.vercel/output/static`;
- smoke pós-deployment no alias de Production, condicionado ao commit publicado;
- preservação dos rewrites canônicos da aplicação e das rotas profundas de escola.

A correção não altera dados, migrations, políticas RLS, autenticação, regras funcionais ou o renderer do Excel SME.
