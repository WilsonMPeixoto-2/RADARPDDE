# Prontuário — navegação rápida e hierarquia visual

Implementado em 14/09/2026:

- `Próxima unidade →` no canto superior direito do cabeçalho do Prontuário;
- navegação pela ordem da designação da unidade, preservando a competência ativa;
- botão desabilitado na última unidade da sequência;
- `Exibir/Ocultar dados da unidade` junto das ações da escola, ao lado de `Editar Dados` para perfis com ações e ainda disponível para perfis de consulta;
- maior contraste visual no botão cadastral;
- sidebar do tema claro escurecida, preservando estados hover/ativo e contraste;
- nenhuma alteração em banco, RLS, regras de avaliação, persistência ou permissões.

Validação direcionada concluída: sintaxe de `app.js`, contrato cadastral existente e novo contrato de navegação/UX.
