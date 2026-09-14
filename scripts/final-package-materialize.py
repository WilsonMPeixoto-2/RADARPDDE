from pathlib import Path


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'{label} não encontrado')
    return text.replace(old, new, 1)


index_path = Path('index.html')
html = index_path.read_text(encoding='utf-8')
old_font = '    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&amp;family=Plus+Jakarta+Sans:wght@300;400;500;600;700&amp;display=swap">'
new_font = '''    <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&amp;family=Plus+Jakarta+Sans:wght@300;400;500;600;700&amp;display=swap" data-radar-nonblocking-font="true" onload="this.onload=null;this.rel='stylesheet'">
    <noscript>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&amp;family=Plus+Jakarta+Sans:wght@300;400;500;600;700&amp;display=swap">
    </noscript>'''
html = replace_once(html, old_font, new_font, 'link de fontes esperado')
index_path.write_text(html, encoding='utf-8')

styles_path = Path('styles.css')
styles = styles_path.read_text(encoding='utf-8')
import_line = "@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');\n\n"
styles = replace_once(styles, import_line, '', 'import duplicado de fontes')
for old, new in {
    "--font-heading: 'Outfit', sans-serif;": "--font-heading: 'Outfit', 'Segoe UI', Arial, sans-serif;",
    "--font-body: 'Plus Jakarta Sans', sans-serif;": "--font-body: 'Plus Jakarta Sans', 'Segoe UI', Arial, sans-serif;",
    "--shadow-md: 0 8px 24px rgba(124, 58, 237, 0.1);": "--shadow-md: 0 6px 18px rgba(124, 58, 237, 0.08);",
    "--shadow-glow: 0 0 16px var(--primary-glow);": "--shadow-glow: 0 0 10px var(--primary-glow);",
    "--shadow-md: 0 8px 24px rgba(0, 0, 0, 0.4);": "--shadow-md: 0 6px 18px rgba(0, 0, 0, 0.32);",
}.items():
    styles = replace_once(styles, old, new, f'estilo {old}')
styles_path.write_text(styles, encoding='utf-8')

stage_path = Path('docs/CURRENT_STAGE.md')
stage = stage_path.read_text(encoding='utf-8')
stage = replace_once(stage, '**Atualizado em:** 13 de setembro de 2026', '**Atualizado em:** 14 de setembro de 2026', 'data do CURRENT_STAGE')
old_opening = '''## Frente autorizada após a reabertura

Wilson solicitou restaurar as opções de edição do PR #299, com melhor orientação e confirmação visual, sobre a arquitetura atual. Essa decisão explícita substitui a restrição anterior de não restaurar a funcionalidade. Trabalho isolado em `feat/restore-evaluation-editing-2026-09-13`; Production permanece na versão liberada. Não há autorização de merge, deploy ou aplicação de migration em Production nesta frente.

Checkpoint incremental: [`audits/RESTAURACAO_EDICAO_AVALIACOES_2026-09-13.md`](audits/RESTAURACAO_EDICAO_AVALIACOES_2026-09-13.md). A homologação desta restauração ainda está em andamento.
'''
new_opening = '''## Pacote final de manutenção de 14/09/2026

O PR #305 restaurou e publicou em Production a edição auditável de avaliações sobre a arquitetura Supabase já certificada. Bonificação permanece editável diretamente por Sim/Não/N/A; correção de análise técnica continua explícita e, quando há Pendência ativa associada a um `Incorreto`, exige confirmação, justificativa, cancelamento atômico da Pendência e preservação do histórico.

A rodada final de manutenção está concentrada no PR #306. Seu escopo é deliberadamente limitado a dependências homologadas, desempenho de carregamento, acabamento visual discreto e reconciliação documental. Não altera regra de negócio, schema, migration, identidade de registros, RLS ou fluxos operacionais.
'''
stage = replace_once(stage, old_opening, new_opening, 'abertura antiga do CURRENT_STAGE')
old_baseline = '''**PR #301:** merged  
**Merge commit funcional:** `39cd984206b33c7d2a6d7084e23597f964235c9a`  
**Candidato funcional certificado:** `452d97267348957f7155fc77bb139a4adafd766b`  
**Data mode de Production:** `supabase-production`'''
new_baseline = '''- **PR #305:** merged
- **Merge commit funcional:** `b151f3f27cb28d5165916aa9be4086355742e839`
- **Candidato funcional certificado:** `86db8651134616fe03d6506e7f9bd073e1e1eb3f`
- **Data mode de Production:** `supabase-production`'''
stage = replace_once(stage, old_baseline, new_baseline, 'baseline antigo do CURRENT_STAGE')
stage = replace_once(
    stage,
    'O rollback do PR #299 permanece preservado; a funcionalidade de retificação de avaliação removida naquele rollback não foi reintroduzida.',
    'O PR #305 superou o rollback funcional do PR #299 e reintroduziu a retificação de avaliação de forma auditável, com confirmação visual, preservação de histórico e reconciliação da suíte de testes com o contrato atual.',
    'referência antiga ao rollback do PR #299'
)
stage = replace_once(stage, '`dpl_DKGa7PqP6KqiDrrWeevReEhyrKLS`', '`dpl_c9Be1LfZocKVBVmrB5pDHaVB7w3X`', 'deployment antigo')
stage = replace_once(stage, '`1020` testes;\n- `1020` aprovados;', '`1034` testes;\n- `1034` aprovados;', 'contagem antiga de testes')
stage_path.write_text(stage, encoding='utf-8')
