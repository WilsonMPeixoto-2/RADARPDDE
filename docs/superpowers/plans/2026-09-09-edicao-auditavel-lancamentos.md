# Edição auditável de lançamentos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Permitir retificação auditável de todos os campos cadastrais editáveis de lançamentos e Pendências, inclusive com Pendência ativa, preservando identidade, histórico e ciclo de regularização e propagando cada alteração para todas as projeções de estado atual.

**Fora do escopo do PR #295:** exclusão de lançamentos. A remoção, sobretudo quando houver histórico protegido, será tratada em PR próprio e não terá suas regras ampliadas nesta entrega.

**Architecture:** A edição será um comando canônico de retificação, distinto de novo envio/reanálise. O serviço valida campos permitidos, mantém IDs/contexto/status, persiste com controle de versão, registra diff antes/depois e reconcilia as entidades retornadas. Snapshots históricos permanecem imutáveis.

**Spec:** `docs/superpowers/specs/2026-09-09-edicao-auditavel-lancamentos-design.md`

## Tasks
1. Inventariar campos editáveis reais e todas as projeções que os exibem; criar matriz campo × projeção e testes RED.
2. Implementar comando canônico de retificação de NF/despesa e `a_identificar`, com auditoria, rowVersion e efeitos derivados.
3. Implementar retificação cadastral de Pendência sem alterar status, tentativas, contexto ou resultados.
4. Expor UI única de Editar e reconciliar imediatamente todas as projeções atuais.
5. Executar suíte completa, Supabase/pgTAP, Playwright, perfis/viewports, revisão adversarial, PR, merge e validação de Production.
