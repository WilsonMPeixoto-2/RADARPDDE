# Auditoria — autorização da carteira na edição cadastral

**Data:** 5 de agosto de 2026  
**Estado:** concluída e publicada em Production

## Achado

O modal de edição cadastral da unidade escolar era acessível ao perfil Controlador e expunha o seletor de controlador responsável. O comando enviava o campo `controller_id` para `save_school_with_programs`, cuja atualização aceitava a troca com base apenas na permissão de escrita sobre a escola.

Isso permitia contornar a rota institucional de redistribuição da Gestão de Equipe.

## Regra confirmada

- o Controlador pode editar os dados cadastrais das escolas da própria carteira;
- o Controlador não pode redistribuir escolas entre controladores;
- a redistribuição permanece na Gestão de Equipe;
- `federal_assistant` e `technical_admin` podem alterar a atribuição;
- manutenção administrativa por `postgres` ou `service_role` permanece disponível quando formalmente autorizada.

## Correção

A proteção foi aplicada em três camadas:

1. o seletor de controlador permanece imutável para o perfil Controlador;
2. o serviço de escolas rejeita a alteração de carteira fora do perfil Assistente;
3. a migration `202608050001_school_assignment_authorization` instala um gatilho que bloqueia a mudança de `controller_id` por usuários autenticados sem papel `federal_assistant` ou `technical_admin`.

## Evidência de homologação

- a etapa RED falhou exclusivamente porque o serviço e a interface ainda permitiam a troca;
- 573 testes unitários aprovados após a implementação;
- 7 testes de integração aprovados;
- teste unitário negativo para Controlador;
- teste unitário positivo para Assistente;
- contrato estático da interface;
- aplicação limpa das 27 migrations aprovada em PostgreSQL descartável;
- 244 testes pgTAP aprovados;
- lint de PL/pgSQL aprovado;
- tipos e bundles regenerados de forma reproduzível;
- Auth, RLS, Edge Function e frontend exercitados contra Supabase local;
- Playwright completo, perfis e viewports, backup/restauração, Lighthouse e homologação integral aprovados.

## Publicação

```text
PR: 154
merge commit: 48a1b07deffab96746382b3db65ba22a4ecf80e5
Vercel deployment: dpl_F37c95nWHCdEUSj2825VL81nBV5g — READY — Production
migration: 202608050001_school_assignment_authorization — aplicada
migrations em Production: 27
trigger: public.schools_controller_assignment_authorization — ativo
função: public.enforce_school_controller_assignment_authorization() — SECURITY INVOKER
```

A conferência remota somente leitura confirmou a presença da migration, da função e do trigger. O workflow operacional criado para aplicar a migration interrompeu antes de qualquer DDL porque o histórico remoto já continha `202608050001`, evitando reaplicação duplicada.

## Pendências separadas

Este PR não altera as regras de cadastro institucional de novas escolas nem a persistência da auditoria dos exports XLSX. Esses achados permanecem separados para análise e confirmação de regra antes de qualquer implementação.