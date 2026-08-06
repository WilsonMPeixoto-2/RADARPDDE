# Auditoria — autorização da carteira na edição cadastral

**Data:** 5 de agosto de 2026  
**Estado:** correção em homologação no PR nº 154

## Achado

O modal de edição cadastral da unidade escolar era acessível ao perfil Controlador e expunha o seletor de controlador responsável. O comando enviava o campo `controller_id` para `save_school_with_programs`, cuja atualização aceitava a troca com base apenas na permissão de escrita sobre a escola.

Isso permitia contornar a rota institucional de redistribuição da Gestão de Equipe.

## Correção

A proteção é aplicada em três camadas:

1. o seletor de controlador permanece imutável para o perfil Controlador;
2. o serviço de escolas rejeita a alteração de carteira fora do perfil Assistente;
3. a migration `202608050001_school_assignment_authorization` instala um gatilho que bloqueia a mudança de `controller_id` por usuários autenticados sem papel `federal_assistant` ou `technical_admin`.

A manutenção autorizada por `postgres` ou `service_role` permanece disponível.

## Evidência

- a etapa RED falhou exclusivamente porque o serviço e a interface ainda permitiam a troca;
- 573 testes unitários aprovados após a implementação;
- 7 testes de integração aprovados;
- teste unitário negativo para Controlador;
- teste unitário positivo para Assistente;
- contrato estático da interface;
- aplicação limpa das 27 migrations aprovada em PostgreSQL descartável;
- pgTAP negativo e positivo da RPC incluído na suíte Supabase;
- gate final atualizado para exigir a migration, o trigger e o teste específico;
- nenhuma alteração de dados reais durante a homologação.

## Estado remoto

Production permanece com 26 migrations aplicadas enquanto este PR estiver aberto. A migration somente será aplicada após aprovação integral dos gates, integração do PR e conferência do histórico remoto.