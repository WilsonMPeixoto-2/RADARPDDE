# F12 — checkpoint inicial preservado

Baseline `e700fba8`, sem alteração de produto, regras, lint ou dependências.

- ESLint executado: 42 avisos, 0 erros; 38 `nounsanitized/property` e 4 `nounsanitized/method`, distribuídos em 10 arquivos.
- [Inventário por sítio e prova local](../evidence/2026-10-24-f12-initial-inventory.json). Ainda não declarar classificação concluída ou 42 vulnerabilidades.
- Prova controlada em navegador: nome de Controlador contendo um span literal foi interpretado como um elemento no cabeçalho do Dashboard. Não houve gravação; o nome original da fixture foi restaurado. Não extrapolar para conta institucional ou exploração remota.
- Próximo passo concreto: rastrear produtores e escapes dos 42 sítios, separar constante/HTML construído de dado livre; reproduzir o contrato de texto literal antes de modificar renderer. Não relaxar o scanner nem habilitar regras globais.
- Suspensão explícita desta execução: reconciliar a duplicidade F06 #490/#493, incluindo a prova complementar de proteção de foco. Retomar F12 após existir um único candidato F06 homologado; cota de deployment não impede o trabalho local da próxima etapa.

Esta é preservação diagnóstica, não nova prioridade canônica ou candidato de correção funcional.
