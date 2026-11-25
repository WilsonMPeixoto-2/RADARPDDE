(function installRadarControllerGuide(root) {
    'use strict';

    if (!root?.document || root.RadarControllerGuide) return;

    const SCREEN_ROOT = '/assets/controller-guide';
    const SCREENS = Object.freeze({
        prontuario: `${SCREEN_ROOT}/prontuario.png`,
        bonificacao: `${SCREEN_ROOT}/corrigir-bonificacao.png`,
        historico: `${SCREEN_ROOT}/excluir-analise-pendencias.png`
    });

    const GUIDE_VIEW = 'guia-controlador';
    const GUIDE_TITLE = 'Guia do Controlador';
    const GUIDE_TOPICS = Object.freeze([
        ['guia-comecar', 'Localizar escola e mês'],
        ['guia-corrigir', 'Escolher a correção'],
        ['guia-avaliacao', 'Avaliar e consolidar'],
        ['guia-notas', 'Registrar despesas'],
        ['guia-pendencia', 'Pendências e reanálise'],
        ['guia-excluir-contexto', 'Mês ou programa errado'],
        ['guia-inventario', 'Acompanhar patrimônio'],
        ['guia-historico', 'Comunicar e consultar']
    ].map(topic => Object.freeze(topic)));
    let installed = false;
    let baseSwitchView = null;
    let baseSwitchProfile = null;

    function text(value) {
        return value == null ? '' : String(value).trim();
    }

    function searchText(value) {
        return text(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
    }

    function escapeHtml(value) {
        return text(value)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function icon(name) {
        const icons = {
            guide: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>',
            arrow: '<path d="M5 12h14"></path><path d="m13 6 6 6-6 6"></path>',
            print: '<path d="M6 9V2h12v7"></path><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect>',
            search: '<circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path>',
            check: '<path d="m20 6-11 11-5-5"></path>',
            alert: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path>'
        };
        return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.guide}</svg>`;
    }

    function step(number, title, body) {
        return `
            <li class="controller-guide-step">
                <span class="controller-guide-step-number">${number}</span>
                <div><strong>${title}</strong><p>${body}</p></div>
            </li>`;
    }

    function callout(kind, title, body) {
        const iconName = kind === 'attention' ? 'alert' : (kind === 'result' ? 'check' : 'guide');
        return `
            <aside class="controller-guide-callout controller-guide-callout-${kind}">
                ${icon(iconName)}
                <div><strong>${title}</strong><p>${body}</p></div>
            </aside>`;
    }

    function screenFigure(src, title, caption) {
        return `
            <figure class="controller-guide-figure">
                <a href="${src}" target="_blank" rel="noopener" aria-label="Ampliar captura: ${escapeHtml(title)}">
                    <img src="${src}" alt="${escapeHtml(title)}" loading="lazy" decoding="async">
                </a>
                <figcaption><strong>${title}</strong><span>${caption}</span><small>Captura da aplicação com dados de exemplo. Clique para ampliar.</small></figcaption>
            </figure>`;
    }

    function decisionRow(situation, action, effect, preserved) {
        return `<tr><th scope="row">${situation}</th><td data-label="Use">${action}</td><td data-label="O que muda">${effect}</td><td data-label="O que permanece">${preserved}</td></tr>`;
    }

    function quickAction(label, view) {
        return `<button type="button" class="controller-guide-route" data-guide-view="${view}">${label} ${icon('arrow')}</button>`;
    }

    function section({ id, eyebrow, title, intro, body, image = null, imageTitle = '', imageCaption = '', route = null, routeLabel = '' }) {
        return `
            <section class="controller-guide-section" id="${id}" data-guide-section aria-labelledby="${id}-title" tabindex="-1">
                <div class="controller-guide-section-head">
                    <span>${eyebrow}</span>
                    <h2 id="${id}-title">${title}</h2>
                    <p>${intro}</p>
                </div>
                ${image ? screenFigure(image, imageTitle || title, imageCaption) : ''}
                <div class="controller-guide-section-body">${body}</div>
                ${route ? `<div class="controller-guide-section-action">${quickAction(routeLabel || 'Abrir esta tela', route)}</div>` : ''}
            </section>`;
    }

    function buildGuideMarkup() {
        const sections = [
            section({
                id: 'guia-comecar', eyebrow: '01 · Localize o trabalho',
                title: 'Escola, mês e programa: confira os três',
                intro: 'Abra a escola pela Carteira ou pela busca do cabeçalho. No Prontuário, confirme o contexto antes de registrar ou corrigir qualquer informação.',
                body: `
                    <div class="controller-guide-context" aria-label="Contexto de cada lançamento">
                        <span><strong>Escola</strong>Qual unidade?</span><span><strong>Competência</strong>Qual mês?</span><span><strong>Programa</strong>Qual recurso?</span>
                    </div>
                    <p>O <strong>Painel do Controlador</strong> ajuda a priorizar; a <strong>Carteira</strong> localiza unidades; <strong>Competências</strong> acompanha o mês; o <strong>Prontuário</strong> reúne os registros da escola. A responsabilidade pela carteira organiza o trabalho: colegas com o mesmo perfil autorizado podem colaborar sem transferir a escola.</p>
                    ${callout('info', 'Pendências atravessa os meses', 'A fila abre em <strong>Todas as competências</strong>. Use seu filtro local para escolher um mês. Trocar a competência no cabeçalho não esconde automaticamente as pendências antigas.')}
                    <div class="controller-guide-shortcuts">${quickAction('Abrir Painel', 'dashboard')}${quickAction('Escolher escola', 'escolas')}${quickAction('Abrir Competências', 'competencias')}</div>
                    ${screenFigure(SCREENS.prontuario, 'Prontuário: contexto e avaliação no mesmo lugar', 'Escola, mês e programa identificam a avaliação. Neste exemplo, a bonificação aguarda nova consolidação.')}
                `
            }),
            section({
                id: 'guia-corrigir', eyebrow: '02 · Corrija com o alcance certo',
                title: 'Qual ação devo usar?',
                intro: 'Escolha pelo que precisa mudar. A prévia mostra os registros afetados e o que será preservado antes da confirmação.',
                body: `
                    <table class="controller-guide-decision-table">
                        <caption>Decida pela tarefa e confira os efeitos</caption>
                        <thead><tr><th scope="col">Sua situação</th><th scope="col">Use</th><th scope="col">O que muda</th><th scope="col">O que permanece</th></tr></thead>
                        <tbody>
                            ${decisionRow('Número, descrição ou valor da despesa está errado', '<strong>Editar despesa</strong>', 'Os dados editáveis do lançamento. A tela informa as condições para mudar o tipo.', 'O mesmo lançamento, seu contexto e o histórico; o resultado consolidado da bonificação.')}
                            ${decisionRow('Você registrou uma avaliação técnica errada', '<strong>Corrigir análise técnica</strong>', 'O resultado e, quando necessário, as pendências ativas relacionadas listadas na prévia.', 'Documento, bem, bonificação e pendências que não fazem parte da correção.')}
                            ${decisionRow('Quer retirar o resultado técnico do item', '<strong>Redefinir como não analisado</strong>, dentro da correção', 'Volta a Não analisado. Pode excluir pendências ativas que sustentavam o Incorreto, com seus envios e contatos.', 'Documento, bem, bonificação e histórico de pendências resolvidas/canceladas.')}
                            ${decisionRow('Precisa apagar a análise e todo o histórico de pendências do item', '<strong>Excluir análise e pendências</strong>', 'Volta a Não analisado e exclui as pendências vinculadas, inclusive resolvidas/canceladas, seus envios e contatos.', 'Despesa, bens, bonificação, outros itens e contatos gerais da escola.')}
                            ${decisionRow('A própria despesa foi lançada indevidamente', '<strong>Excluir despesa</strong>', 'Exclui a despesa e os dependentes da prévia, inclusive o bem exclusivo, se houver.', 'Outras despesas, bens compartilhados e resultado consolidado; resumos derivados são recalculados.')}
                            ${decisionRow('Uma pendência foi aberta indevidamente', '<strong>Excluir pendência</strong>, nos detalhes', 'Exclui aquela pendência, seus envios e contatos. A prévia pode devolver a análise a Não analisado.', 'A despesa, os bens e as demais pendências; a bonificação é preservada.')}
                            ${decisionRow('A avaliação de entrega precisa de ajuste', '<strong>Corrigir bonificação</strong>', 'Corrige o critério escolhido. Um programa já consolidado volta a aguardar consolidação.', 'Despesas e pendências; eventuais efeitos na análise do BB Ágil são mostrados na prévia.')}
                        </tbody>
                    </table>
                    <ol class="controller-guide-steps">
                        ${step(1, 'Abra a ação no item correto', 'Confira o documento ou a nota fiscal, além da escola, mês e programa.')}
                        ${step(2, 'Leia mudanças e preservações', 'Se houver várias pendências ativas relacionadas à análise, confira a seleção exigida. Corrigir ou redefinir a análise mantém pendências resolvidas e canceladas; excluir o histórico completo do item também as remove.')}
                        ${step(3, 'Confirme o que você conferiu', 'Cancelar fecha sem gravar. Se alguém alterou o caso, use Revisar prévia ou Conferir novamente e leia os efeitos atualizados.')}
                    </ol>
                    ${callout('attention', 'A escola enviou um documento novo?', 'Use <strong>Registrar novo envio → Reanalisar</strong>. A correção de um lançamento equivocado e a regularização documental têm histórias diferentes.')}
                    ${screenFigure(SCREENS.historico, 'Exclusão de análise e pendências de um item', 'A janela distingue o que será excluído dos documentos, bens e bonificação que permanecerão.')}
                `
            }),
            section({
                id: 'guia-avaliacao', eyebrow: '03 · Avaliação mensal',
                title: 'Separe entrega, análise e bonificação',
                intro: 'Um documento entregue pode estar incorreto. Registre cada dimensão conforme a conferência realizada.',
                body: `
                    <dl class="controller-guide-dimensions">
                        <div><dt>Entrega</dt><dd>Sim, Não ou Não se aplica, quando permitido. É um critério da bonificação.</dd></div>
                        <div><dt>Análise técnica</dt><dd>Resultado da conferência do documento. Nota fiscal e Consulta à Assessoria têm análise individual.</dd></div>
                        <div><dt>Pendência</dt><dd>Problema específico que exige providência e acompanhamento.</dd></div>
                    </dl>
                    <ol class="controller-guide-steps">
                        ${step(1, 'Confira os documentos', 'Registre a entrega e a análise. Documento ausente e Documento ilegível são problemas diferentes: descreva a providência necessária.')}
                        ${step(2, 'Revise os critérios', 'Extratos da conta corrente e de investimento não aceitam Não se aplica. No BB Ágil, essa opção corresponde à ausência de despesas a lançar. Assessoria e Inventariação são calculadas pelos registros vinculados.')}
                        ${step(3, 'Consolide quando a conferência estiver pronta', 'Use <strong>Consolidar bonificação</strong>, confira o contexto e escolha <strong>Confirmar consolidação</strong>. O cálculo registra Apta/Inapta sem apagar notas, análises ou pendências.')}
                    </ol>
                    <h3>Precisa corrigir depois?</h3>
                    <p>Use <strong>Corrigir bonificação</strong> no critério. Nos campos manuais, escolha a nova avaliação ou <strong>Limpar resposta</strong>; em Assessoria e Inventariação, confira o recálculo pelos fatos registrados. A ação não inventa envio de documento ou inventariação.</p>
                    <p>Ao entrar ou sair de <strong>Não se aplica no BB Ágil</strong>, confira também a mudança da análise: para Correto ao marcar N/A, ou para Não analisado ao retirar N/A. Pendência ativa nesse documento precisa ser tratada antes.</p>
                    ${callout('result', 'Corrigir e consolidar são duas ações', 'Se o programa estava consolidado, ficará com <strong>Alterações pendentes de consolidação</strong>. Revise e use <strong>Consolidar bonificação</strong> novamente. Planilhas já baixadas não são regravadas; gere uma nova exportação quando necessário.')}
                    ${screenFigure(SCREENS.bonificacao, 'Correção individual da bonificação', 'Compare a avaliação atual, a nova avaliação e as consequências antes de confirmar.')}
                `
            }),
            section({
                id: 'guia-notas', eyebrow: '04 · Despesas e documentos fiscais',
                title: 'Cadastre e ajuste cada despesa',
                intro: 'As despesas podem ser registradas, editadas e excluídas conforme a permissão do perfil, inclusive com a bonificação já consolidada.',
                body: `
                    <ol class="controller-guide-steps">
                        ${step(1, 'Abra Notas Fiscais → Adicionar Nota', 'No Prontuário, confirme mês e programa. Informe descrição, tipo, número/referência e valor solicitados.')}
                        ${step(2, 'Acompanhe os efeitos do tipo', '<strong>Consumo:</strong> sem bem patrimonial. <strong>Serviço:</strong> Consulta à Assessoria por nota. <strong>Permanente:</strong> bem vinculado. <strong>Boleto de internet:</strong> disponível em Educação Conectada.')}
                        ${step(3, 'Confira a nota individualmente', 'Registre a análise na própria nota. Um Incorreto exige os apontamentos da pendência; o resumo mensal acompanha as análises individuais.')}
                    </ol>
                    <h3>O registro precisa de correção</h3>
                    <p><strong>Editar despesa</strong> informa quais campos estão disponíveis. Número, descrição e valor podem ser corrigidos mesmo com pendência ativa. A troca de tipo tem condições próprias: histórico de Assessoria, pendência ativa, despesa ainda a identificar ou bem inventariado podem impedir essa alteração.</p>
                    <h3>Ainda não sabe o que foi pago?</h3>
                    <p>Com escola, mês e programa conhecidos, registre <strong>Despesa a identificar</strong>: ela nasce com análise Incorreto e pendência vinculada. Quando chegar o primeiro documento, abra <strong>Visualizar pendência → Registrar envio / identificação da despesa</strong>. O mesmo lançamento recebe a identificação e vai para reanálise.</p>
                    <p>Se a saída é da <strong>conta PDDE Qualidade e a Ação Integrada ainda é desconhecida</strong>, use o registro provisório dessa conta. Ele não é uma nota fiscal nem abre pendência; a identificação posterior vincula o programa e a despesa.</p>
                    ${callout('attention', 'Ao excluir uma despesa', 'Leia os vínculos da prévia. Um bem exclusivo pode ser excluído mesmo se inventariado; bens compartilhados permanecem. Uma saída Qualidade vinculada volta a aguardar identificação. Nada disso efetua baixa patrimonial em outro sistema.')}
                `
            }),
            section({
                id: 'guia-pendencia', eyebrow: '05 · Pendências e reanálise',
                title: 'Acompanhe a providência até a regularização',
                intro: 'Abra os detalhes pela fila de Pendências ou pelo documento no Prontuário. Confira a nota e a dimensão fiscal ou Assessoria antes de agir.',
                route: 'pendencias', routeLabel: 'Abrir Pendências',
                body: `
                    <ol class="controller-guide-flow" aria-label="Ciclo de regularização">
                        <li><strong>Aberta</strong><span>A escola precisa corrigir.</span></li>
                        <li><strong>Aguardando reanálise</strong><span>O novo envio foi registrado.</span></li>
                        <li><strong>Resolvida</strong><span>A reanálise confirmou a regularização.</span></li>
                    </ol>
                    <h3 id="guia-reanalise">Novo envio → Reanálise</h3>
                    <ol class="controller-guide-steps">
                        ${step(1, 'Registrar novo envio', 'Informe a data em que o documento corrigido ficou disponível, a observação e o link opcional. Registrar o envio não resolve a pendência.')}
                        ${step(2, 'Reanalisar', 'Confira a tentativa mais recente. No Prontuário, <strong>Aguardando reanálise</strong> também abre essa ação.')}
                        ${step(3, 'Registrar o resultado', 'Documento correto resolve a pendência. Documento ainda incorreto ou arquivo não localizado/inacessível devolve a providência à escola, preservando as tentativas anteriores.')}
                    </ol>
                    <p><strong>Cancelar pendência</strong> encerra o acompanhamento com justificativa e mantém o histórico. <strong>Reabrir pendência</strong> retoma uma ocorrência resolvida ou cancelada. <strong>Excluir pendência</strong> remove o registro e seus dependentes após conferência; use para um lançamento indevido.</p>
                    ${callout('info', 'A pendência obrigatória acompanha a despesa a identificar', 'Ela não pode ser excluída isoladamente enquanto a despesa continuar provisória. Identifique a despesa pelo fluxo de envio ou, se o lançamento foi indevido, confira sua exclusão.')}
                `
            }),
            section({
                id: 'guia-excluir-contexto', eyebrow: '06 · Mês ou programa errado',
                title: 'Exclua somente o conjunto que foi lançado no contexto errado',
                intro: 'Se apenas uma despesa está errada, use a ação da própria despesa. Para o conjunto de um programa no mês, use Excluir lançamentos deste programa.',
                body: `
                    <ol class="controller-guide-steps">
                        ${step(1, 'Localize o programa no Prontuário', 'Confira a escola e o mês. Abra <strong>Excluir lançamentos deste programa</strong> no cabeçalho do programa.')}
                        ${step(2, 'Confira a lista e os totais', 'A prévia inclui a avaliação mensal, despesas, pendências, envios, contatos vinculados e bens exclusivos afetados. Leia os avisos sobre patrimônio e saídas Qualidade.')}
                        ${step(3, 'Confirme o alcance completo', 'Use <strong>Excluir estes lançamentos</strong> somente se todo o conjunto estiver indevido. Outros meses e programas, contatos gerais e bens compartilhados são preservados.')}
                    </ol>
                    ${callout('attention', 'Não há transferência automática', 'A exclusão é definitiva no Prontuário. Para registrar no contexto correto, selecione a escola, o mês e o programa adequados e faça os lançamentos necessários. A autoria da exclusão permanece no registro administrativo.')}
                `
            }),
            section({
                id: 'guia-inventario', eyebrow: '07 · Capital e Inventário',
                title: 'Acompanhe o bem até a inventariação',
                intro: 'Uma despesa permanente e o bem vinculado precisam representar a mesma aquisição.',
                route: 'inventario', routeLabel: 'Abrir Capital e Inventário',
                body: `
                    <ol class="controller-guide-flow" aria-label="Acompanhamento patrimonial">
                        <li><strong>Não encaminhada</strong><span>Confira os dados e o encaminhamento necessário.</span></li>
                        <li><strong>Encaminhada</strong><span>Acompanhe o processo e a conclusão.</span></li>
                        <li><strong>Inventariada</strong><span>Consulte os dados da inventariação registrada.</span></li>
                    </ol>
                    <p>Na área <strong>Capital e Inventário</strong>, localize a escola ou o bem e use as ações disponíveis ao seu perfil. O acesso ao <strong>Registro de Capital</strong> orienta a consulta; abrir esse atalho não registra movimentação patrimonial.</p>
                    <p><strong>Sem vínculo cadastrado</strong> ou <strong>bem não disponível na consulta</strong> pede conferência do cadastro. Esses avisos não afirmam desaparecimento físico. Para um bem já inventariado, confira os dados e as ações que a tela permite ao seu perfil.</p>
                `
            }),
            section({
                id: 'guia-historico', eyebrow: '08 · Comunicação e continuidade',
                title: 'Registre o que aconteceu e retome o trabalho',
                intro: 'Use o Histórico cronológico do Prontuário para a escola e Registros Internos para consultar autoria, data e contexto das operações disponíveis ao seu perfil.',
                route: 'auditoria', routeLabel: 'Abrir Registros Internos',
                body: `
                    <ul class="controller-guide-notes">
                        <li><strong>Gerar comunicação:</strong> prepare e copie a mensagem. Copiar não envia nem comprova contato com a escola.</li>
                        <li><strong>Registrar Contato:</strong> depois da comunicação, informe canal, data e conteúdo. Vincule à pendência quando for o caso; contatos gerais têm alcance diferente.</li>
                        <li><strong>Editar Dados:</strong> mantenha os campos cadastrais autorizados. A responsabilidade da carteira não é transferida pelo editor comum.</li>
                        <li><strong>Precisa retomar?</strong> Volte pelo caminho da aplicação para conservar o contexto disponível. Se não encontrar um registro, confira escola, mês, programa e filtros.</li>
                    </ul>
                    ${callout('attention', 'Salvamento, conflito ou atualização pendente', 'Aguarde a resposta da operação. Se houver confirmação de gravação com atualização pendente, atualize a consulta antes de repetir. Em caso de conflito, releia o registro e confira uma nova prévia. A mensagem da tela orienta a próxima ação.')}
                `
            })
        ];

        return `
            <article class="controller-guide" id="controller-guide-root">
                <header class="controller-guide-hero">
                    <div class="controller-guide-hero-copy">
                        <span class="controller-guide-kicker">RADAR PDDE · 4ª CRE</span>
                        <h1>Guia do Controlador</h1>
                        <p>Encontre a tarefa, confira seus efeitos e continue o trabalho. Orientações para Controladores e Assistentes; as ações disponíveis dependem do perfil e do contexto.</p>
                        <div class="controller-guide-hero-actions">
                            <a class="btn btn-primary" href="#guia-corrigir">Qual correção usar?</a>
                            <button type="button" class="btn btn-secondary" id="controller-guide-print">${icon('print')} Salvar em PDF</button>
                        </div>
                        <p class="controller-guide-print-help">Para guardar o guia completo, escolha <strong>Salvar como PDF</strong> na impressão do navegador.</p>
                    </div>
                </header>
                <div class="controller-guide-toolbar" aria-label="Ferramentas do guia">
                    <label class="controller-guide-search">
                        ${icon('search')}<span class="sr-only">Buscar no guia</span>
                        <input type="search" id="controller-guide-search" placeholder="Buscar uma tarefa: corrigir, bonificação, pendência…" aria-controls="controller-guide-content">
                    </label>
                    <span id="controller-guide-search-result" role="status" aria-live="polite"></span>
                </div>
                <nav class="controller-guide-toc" aria-label="Sumário do Guia do Controlador">
                    ${GUIDE_TOPICS.map(([id, label], index) => `<a href="#${id}"><span>${String(index + 1).padStart(2, '0')}</span>${label}</a>`).join('')}
                </nav>
                <div class="controller-guide-content" id="controller-guide-content">${sections.join('')}</div>
                <footer class="controller-guide-footer">
                    <strong>RADAR PDDE · Guia do Controlador</strong>
                    <span>Atualizado em 25 de novembro de 2026 · Exemplos sem dados institucionais</span>
                </footer>
            </article>
        `;
    }

    function updateNavState() {
        root.document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        root.document.querySelector('#nav-guia-controlador')?.classList.add('active');
    }

    function bindGuideEvents(container) {
        const search = container.querySelector('#controller-guide-search');
        const result = container.querySelector('#controller-guide-search-result');
        if (search) {
            search.addEventListener('input', event => {
                const query = searchText(event.target.value);
                let visible = 0;
                container.querySelectorAll('[data-guide-section]').forEach(section => {
                    const matches = !query || searchText(section.textContent).includes(query);
                    section.hidden = !matches;
                    if (matches) visible += 1;
                });
                if (result) result.textContent = query
                    ? visible ? `${visible} tópico${visible === 1 ? '' : 's'} encontrado${visible === 1 ? '' : 's'}`
                        : 'Nenhum tópico encontrado. Tente outra palavra ou escolha uma tarefa no sumário.'
                    : '';
            });
        }

        container.querySelectorAll('[data-guide-view]').forEach(button => {
            button.addEventListener('click', () => root.switchView?.(button.dataset.guideView));
        });

        container.querySelector('#controller-guide-print')?.addEventListener('click', () => {
            root.document.body.classList.add('controller-guide-printing');
            root.addEventListener('afterprint', () => {
                root.document.body.classList.remove('controller-guide-printing');
            }, { once: true });
            root.print();
        });
    }

    function renderGuide() {
        const main = root.document.querySelector('#main-container');
        if (!main) return false;
        main.innerHTML = buildGuideMarkup();
        updateNavState();
        bindGuideEvents(main);
        root.scrollTo?.({ top: 0, behavior: 'instant' });
        return true;
    }

    // Ponto de entrada para ajuda contextual: abre uma tarefa conhecida sem
    // acrescentar fragmentos à rota operacional nem alterar dados da escola.
    function openTopic(topicId) {
        const id = text(topicId).replace(/^#/, '');
        if (!GUIDE_TOPICS.some(([knownId]) => knownId === id) && id !== 'guia-reanalise') return false;
        if (!renderGuide()) return false;
        const target = root.document.getElementById(id);
        if (!target) return false;
        target.setAttribute('tabindex', '-1');
        target.scrollIntoView({ behavior: 'instant', block: 'start' });
        target.focus?.({ preventScroll: true });
        return true;
    }

    function ensureNavItem() {
        const existing = root.document.querySelector('#nav-guia-controlador');
        if (existing) return existing;
        const anchor = root.document.querySelector('#nav-pendencias');
        if (!anchor?.parentElement) return null;
        const item = root.document.createElement('div');
        item.className = 'nav-item controller-guide-nav-item';
        item.id = 'nav-guia-controlador';
        item.setAttribute('role', 'button');
        item.setAttribute('tabindex', '0');
        item.innerHTML = `${icon('guide')}<span>${GUIDE_TITLE}</span>`;
        item.addEventListener('click', () => root.switchView?.(GUIDE_VIEW));
        item.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                root.switchView?.(GUIDE_VIEW);
            }
        });
        anchor.insertAdjacentElement('afterend', item);
        return item;
    }

    function updateVisibility() {
        const item = ensureNavItem();
        if (!item) return;
        item.style.display = '';
        item.setAttribute('aria-hidden', 'false');
    }

    function wrapNavigation() {
        if (typeof root.switchView === 'function' && !root.switchView.__radarControllerGuideWrapped) {
            baseSwitchView = root.switchView;
            const wrapped = function switchViewWithControllerGuide(view, param) {
                if (view === GUIDE_VIEW) return renderGuide();
                return baseSwitchView.call(this, view, param);
            };
            wrapped.__radarControllerGuideWrapped = true;
            wrapped.__radarControllerGuideBase = baseSwitchView;
            root.switchView = wrapped;
        }

        if (typeof root.switchProfile === 'function' && !root.switchProfile.__radarControllerGuideWrapped) {
            baseSwitchProfile = root.switchProfile;
            const wrappedProfile = function switchProfileWithControllerGuide(profile) {
                const result = baseSwitchProfile.apply(this, arguments);
                root.setTimeout(updateVisibility, 0);
                return result;
            };
            wrappedProfile.__radarControllerGuideWrapped = true;
            wrappedProfile.__radarControllerGuideBase = baseSwitchProfile;
            root.switchProfile = wrappedProfile;
        }
    }

    function install() {
        if (installed) {
            wrapNavigation();
            updateVisibility();
            return true;
        }
        installed = true;
        wrapNavigation();
        updateVisibility();

        const role = root.document.querySelector('#current-user-role');
        if (role && typeof MutationObserver === 'function') {
            new MutationObserver(updateVisibility).observe(role, { childList: true, subtree: true, characterData: true });
        }
        root.addEventListener('radar:auth-ready', updateVisibility);
        return true;
    }

    const api = Object.freeze({
        install,
        render: renderGuide,
        openTopic,
        topics: GUIDE_TOPICS,
        isAvailable: () => true,
        view: GUIDE_VIEW,
        screenshots: SCREENS
    });

    root.RadarControllerGuide = api;
    install();
}(typeof window !== 'undefined' ? window : globalThis));
