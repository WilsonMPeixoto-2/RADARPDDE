# Notas para a próxima integração

A inclusão do módulo `src/domain/competencia.js` na aplicação deve ocorrer em pull request separado. Essa separação reduz o risco de regressão e permite comparar o comportamento visual antes e depois da substituição da função local de formatação.

Checklist da integração:

- incluir o módulo antes de `app.js` no HTML;
- criar adaptador temporário para chamadas existentes;
- substituir comparações manuais de competência;
- revisar alertas, títulos, prontuário e exportações;
- executar a suíte automatizada;
- validar as telas principais em desktop e mobile;
- remover a função antiga apenas após confirmar ausência de chamadas restantes.
