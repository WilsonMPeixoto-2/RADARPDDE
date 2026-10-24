# PDDE Qualidade — limpar origem do formulário fiscal

Escopo: dois campos ocultos em `openModalDadosNota`; sem migration, autorização,
regra fiscal, timer, preferência de foco ou alteração de layout.

## Defeito confirmado e contenção

O #494 foi integrado em `96f49554` após 22 workflows aprovados e a migration 62
aplicada/verificada em Production. Na conferência final, a sequência sem reload
revelou que os inputs hidden conservam os valores atribuídos também como valores
default: `form.reset()` não limpa o ID/versão da movimentação anterior.

Reprodução inicial em Chromium com a função real de abertura: abrir identificação,
atribuir origem, fechar e abrir NF comum conservava ambos os campos. A jornada
com Controlador/Auth/RLS reais reproduziu depois **pela interface**:
identificar → Cancelar → Adicionar Nota, esperando origem vazia e recebendo o UUID
anterior. Uma NF comum podia ser enviada para o comando de identificação.

O frontend foi revertido para `22faf548` / `dpl_HJaPgzTG4Z27cib7BYSe12u1vM5b`;
Vercel confirmou READY e alias no SHA anterior. Banco e migration 62 preservados.
Consulta somente leitura confirmou **0 provisórios e 0 identificados** naquele
momento. Não houve escrita de teste em Production.

## Correção e aceite

Limpar explicitamente ID e versão da origem no ponto canônico de abertura da NF,
assim como já se limpa o ID da própria nota. O fluxo Qualidade preenche esses
campos depois da abertura, somente quando uma identificação está sendo iniciada.

O E2E existente agora cobre cancelamento e identificação concluída seguidos por
NF comum **antes de qualquer reload**. Verifica origem vazia, botão Salvar Gasto,
requisição à RPC fiscal ordinária, uma NF por intenção e vínculo original intacto.
O cenário anterior de erro 503, retomada, persistência e reload continua presente.
RED reproduzido antes da correção; GREEN local com duas NFs intencionais (uma de
identificação e outra ordinária). Não confundir o total de duas com duplicidade.

O primeiro aceite do #494 não cobria essa transição de contexto. A ampliação
cobre a falha real; não relaxa expectativas nem normaliza dados para passar.
Os logs/imagens completos ficam nos artifacts dos gates; este registro preserva
a causa e a decisão, sem telemetria bruta ou credenciais.

## Liberação

Após CI do hotfix, integrar e **promover explicitamente** o deployment Production
corrigido: o rollback da Vercel suspendeu atribuição automática de novos builds.
Verificar alias/SHA, assets e pós-deploy. Nenhuma nova aplicação da migration 62
é necessária. Resultado final e deployment devem ser registrados no PR do hotfix;
este arquivo registra a ocorrência e não afirma antecipadamente sua publicação.
