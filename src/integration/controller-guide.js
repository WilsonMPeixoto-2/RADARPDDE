(function installRadarControllerGuide(root) {
    'use strict';

    if (!root?.document || root.RadarControllerGuide) return;

    const SCREEN_ROOT = '/docs/evidence/global-baseline/desktop';
    const SCREENS = Object.freeze({
        dashboard: `${SCREEN_ROOT}/controlador__dashboard__padrao__desktop.png`,
        carteira: `${SCREEN_ROOT}/controlador__carteira__resultado__desktop.png`,
        competencias: `${SCREEN_ROOT}/controlador__competencias__padrao__desktop.png`,
        pendencias: `${SCREEN_ROOT}/controlador__pendencias__padrao__desktop.png`,
        inventario: `${SCREEN_ROOT}/controlador__inventario__padrao__desktop.png`,
        auditoria: `${SCREEN_ROOT}/controlador__registros-internos__padrao__desktop.png`
    });

    const GUIDE_VIEW = 'guia-controlador';
    const GUIDE_TITLE = 'Guia do Controlador';
    let installed = false;
    let baseSwitchView = null;
    let baseSwitchProfile = null;

    function text(value) {
        return value == null ? '' : String(value).trim();
    }

    function isController() {
        try {
            if (typeof root.getRadarAccessProfile === 'function') {
                return root.getRadarAccessProfile() === 'controlador';
            }
        } catch (_error) {
            // O rodapé ainda oferece um fallback visual durante o bootstrap.
        }
        return /controlador/i.test(text(root.document.querySelector('#current-user-role')?.textContent));
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
            alert: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path>',
            history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"></path><path d="M3 3v5h5"></path><path d="M12 7v5l3 2"></path>'
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
                <div class="controller-guide-figure-label">PRINT REAL DO RADAR PDDE</div>
                <img src="${src}" alt="${escapeHtml(title)}" loading="lazy">
                <figcaption><strong>${title}</strong><span>${caption}</span></figcaption>
            </figure>`;
    }

    function quickAction(label, view) {
        return `<button type="button" class="controller-guide-route" data-guide-view="${view}">${label} ${icon('arrow')}</button>`;
    }

    function section({ id, eyebrow, title, intro, body, image = null, imageTitle = '', imageCaption = '', route = null, routeLabel = '' }) {
        return `
            <section class="controller-guide-section" id="${id}" data-guide-section>
                <div class="controller-guide-section-head">
                    <span>${eyebrow}</span>
                    <h2>${title}</h2>
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
                id: 'guia-comecar',
                eyebrow: '01 · Comece por aqui',
                title: 'Entenda o que você vê ao entrar',
                intro: 'O Dashboard é seu ponto de partida. Ele resume a competência selecionada e ajuda a localizar o que exige ação.',
                image: SCREENS.dashboard,
                imageTitle: 'Dashboard do Controlador',
                imageCaption: 'Use o menu à esquerda para mudar de área. No alto, confira a competência e utilize a busca e o sino de alertas.',
                route: 'dashboard',
                routeLabel: 'Abrir Dashboard',
                body: `
                    <ol class="controller-guide-steps">
                        ${step(1, 'Confira a competência', 'Antes de qualquer lançamento, confirme o mês exibido no seletor de competência no cabeçalho.')}
                        ${step(2, 'Observe os cartões e filas de trabalho', 'Os indicadores mostram o panorama do mês e ajudam a identificar escolas ou situações que precisam de atenção.')}
                        ${step(3, 'Use a busca global', 'Digite o nome ou a designação da escola no campo de busca do cabeçalho para chegar rapidamente à unidade.')}
                        ${step(4, 'Acompanhe o sino de alertas', 'O sino reúne situações que pedem atenção e pode levar você diretamente ao contexto relacionado.')}
                    </ol>
                    ${callout('attention', 'Regra de ouro', 'Se uma informação parecer ter desaparecido, confira primeiro a competência selecionada. O RADAR organiza o acompanhamento por mês.')}
                `
            }),
            section({
                id: 'guia-carteira',
                eyebrow: '02 · Escolha a escola',
                title: 'Encontre e abra uma unidade da sua carteira',
                intro: 'A Carteira de Escolas reúne as unidades sob sua responsabilidade e permite filtrar rapidamente o acompanhamento.',
                image: SCREENS.carteira,
                imageTitle: 'Carteira de Escolas',
                imageCaption: 'A lista mostra as escolas e o contexto operacional da competência. Os filtros reduzem a lista sem alterar os dados.',
                route: 'escolas',
                routeLabel: 'Abrir Carteira',
                body: `
                    <ol class="controller-guide-steps">
                        ${step(1, 'Clique em “Carteira de Escolas”', 'A opção fica no grupo Operação do menu lateral.')}
                        ${step(2, 'Localize a unidade', 'Use a busca ou os filtros da própria Carteira. Você também pode abrir a escola pela busca global do cabeçalho.')}
                        ${step(3, 'Abra o Prontuário', 'Clique no nome da escola ou na ação de abrir/detalhar a unidade. O Prontuário concentra cadastro, competências, pendências e histórico.')}
                        ${step(4, 'Volte sem perder o contexto', 'Ao retornar, o RADAR preserva o caminho, a competência e os filtros quando a navegação contextual estiver ativa.')}
                    </ol>
                    ${callout('result', 'O que você encontra no Prontuário', 'Identificação da escola, programas, competências e bonificação, análise técnica, pendências, registros de atendimento, notas/bens quando aplicáveis e a linha do tempo da unidade.')}
                `
            }),
            section({
                id: 'guia-competencia',
                eyebrow: '03 · Trabalhe no mês certo',
                title: 'Selecione a competência antes de avaliar',
                intro: 'A competência é global: ao trocar o mês, Dashboard, Carteira, Competências, Prontuário e Pendências passam a trabalhar com o mesmo contexto.',
                image: SCREENS.competencias,
                imageTitle: 'Competências Mensais',
                imageCaption: 'A tela mensal permite acompanhar entrega, bonificação, análise técnica e pendências da competência escolhida.',
                route: 'competencias',
                routeLabel: 'Abrir Competências',
                body: `
                    <ol class="controller-guide-steps">
                        ${step(1, 'Clique no seletor “Competência”', 'Ele fica no cabeçalho superior e apresenta os meses disponíveis no exercício.')}
                        ${step(2, 'Escolha o mês', 'A tela é atualizada para a competência selecionada. Não é necessário selecionar o mês novamente em cada aba.')}
                        ${step(3, 'Confirme o mês antes de lançar', 'Faça essa conferência antes de alterar bonificação, análise técnica ou registrar uma pendência.')}
                    </ol>
                    ${callout('attention', 'Evite lançamento no mês errado', 'Trocar a competência muda o contexto de trabalho do sistema. Antes de salvar, confira sempre o mês no cabeçalho.')}
                `
            }),
            section({
                id: 'guia-avaliacao',
                eyebrow: '04 · Avaliação mensal',
                title: 'Faça a conferência documental e registre a análise',
                intro: 'Na competência mensal ou no Prontuário da escola, você registra a situação dos documentos e o resultado da análise técnica.',
                image: SCREENS.competencias,
                imageTitle: 'Ponto de entrada para a avaliação mensal',
                imageCaption: 'Abra a escola/competência e trabalhe documento a documento. O RADAR mantém o resultado ligado à unidade, programa e mês.',
                route: 'competencias',
                routeLabel: 'Iniciar pela Competência',
                body: `
                    <ol class="controller-guide-steps">
                        ${step(1, 'Abra a escola na competência', 'Na lista mensal, localize a escola e abra o detalhamento disponível para a análise.')}
                        ${step(2, 'Confira a bonificação/entrega', 'Registre a situação de entrega solicitada para cada documento. Use “Não se aplica” apenas quando o requisito realmente não se aplicar ao caso.')}
                        ${step(3, 'Faça a análise técnica', 'Depois de conferir o arquivo, marque o resultado correspondente: correto, incorreto ou a situação oferecida pela tela.')}
                        ${step(4, 'Registre o problema quando houver', 'Documento ausente, ilegível, competência incorreta, extrato incompleto, falta de assinatura e outras ocorrências devem ser registradas de forma específica.')}
                        ${step(5, 'Conclua somente após revisar', 'Confira o conjunto de documentos e as pendências antes de consolidar o resultado mensal quando a ação estiver disponível.')}
                    </ol>
                    ${callout('info', 'Avaliação não é só um “sim” ou “não”', 'O registro deve explicar o que ocorreu. Quando houver problema documental que exija correção da escola, abra a pendência correspondente para que o ciclo fique rastreável.')}
                `
            }),
            section({
                id: 'guia-excecoes',
                eyebrow: '05 · Exceções e documentos problemáticos',
                title: 'Registre documento faltante, ilegível ou outra ocorrência',
                intro: 'Quando o documento não pode ser considerado regular, identifique a situação correta e descreva o que a escola precisa corrigir.',
                body: `
                    <div class="controller-guide-split">
                        <div class="controller-guide-mini-card"><strong>Documento ausente</strong><p>Use quando o arquivo exigido não foi disponibilizado. Não use “ilegível” se simplesmente não existe arquivo.</p></div>
                        <div class="controller-guide-mini-card"><strong>Documento ilegível</strong><p>Use quando o arquivo existe, mas a qualidade impede a conferência das informações, assinaturas ou valores.</p></div>
                        <div class="controller-guide-mini-card"><strong>Competência incorreta</strong><p>Use quando o documento apresentado corresponde a outro período e não comprova a competência em análise.</p></div>
                        <div class="controller-guide-mini-card"><strong>Outros erros</strong><p>Extrato incompleto, ausência de assinatura, arquivo incompatível e demais opções devem refletir exatamente o problema encontrado.</p></div>
                    </div>
                    <ol class="controller-guide-steps">
                        ${step(1, 'No item analisado, abra a ação de pendência', 'O RADAR preenche o contexto da escola, competência, programa e documento quando a pendência nasce da análise documental.')}
                        ${step(2, 'Marque o tipo de erro', 'É possível registrar mais de um erro quando o mesmo documento apresenta problemas diferentes.')}
                        ${step(3, 'Escreva uma observação objetiva', 'Diga o que está errado e o que precisa ser apresentado ou corrigido. Evite observações genéricas como “errado”.')}
                        ${step(4, 'Crie a pendência', 'Após salvar, a ocorrência entra no acompanhamento da escola e aparece na área de Pendências.')}
                    </ol>
                    ${callout('info', 'Exemplo de observação útil', '“Extrato da conta corrente está sem a página que contém o saldo final. Reenviar o extrato completo da competência.”')}
                `
            }),
            section({
                id: 'guia-pendencia',
                eyebrow: '06 · Pendências',
                title: 'Abra, acompanhe e entenda o estado de cada pendência',
                intro: 'A tela Pendências Operacionais organiza o que está aberto, o que recebeu novo envio e aguarda reanálise, o que foi resolvido e o que foi cancelado.',
                image: SCREENS.pendencias,
                imageTitle: 'Pendências Operacionais',
                imageCaption: 'Use as abas de situação e os filtros. Ao abrir os detalhes, você vê erros, tentativas de envio, contatos e histórico.',
                route: 'pendencias',
                routeLabel: 'Abrir Pendências',
                body: `
                    <div class="controller-guide-status-grid">
                        <div><span class="status-open">Aberta</span><p>A correção ainda está pendente.</p></div>
                        <div><span class="status-wait">Aguardando reanálise</span><p>Houve novo envio e o Controlador precisa conferir.</p></div>
                        <div><span class="status-done">Resolvida</span><p>A reanálise confirmou a regularização.</p></div>
                        <div><span class="status-cancel">Cancelada</span><p>A ocorrência foi encerrada por cancelamento justificado.</p></div>
                    </div>
                    <ol class="controller-guide-steps">
                        ${step(1, 'Clique em “Pendências Operacionais”', 'Use o menu lateral ou um alerta/atalho contextual vindo da escola.')}
                        ${step(2, 'Escolha a aba de situação', 'Use “Abertas”, “Aguardando reanálise”, “Resolvidas” ou “Canceladas” para reduzir o universo.')}
                        ${step(3, 'Filtre pela escola quando necessário', 'Se você chegou pelo Prontuário, o filtro da unidade pode ser aplicado automaticamente e será indicado na tela.')}
                        ${step(4, 'Clique em “Ver detalhes”', 'O painel de detalhes mostra o histórico e as ações que ainda podem ser executadas.')}
                    </ol>
                `
            }),
            section({
                id: 'guia-novo-envio',
                eyebrow: '07 · Nova entrega',
                title: 'Registre que a escola disponibilizou um novo arquivo',
                intro: 'Quando a escola corrigir o documento no Drive, registre o novo envio na pendência para que ela passe ao estado “Aguardando reanálise”.',
                image: SCREENS.pendencias,
                imageTitle: 'Pendência pronta para receber nova entrega',
                imageCaption: 'Abra a pendência e utilize a ação “Registrar novo envio”. O envio não resolve a pendência sozinho.',
                route: 'pendencias',
                routeLabel: 'Localizar pendência',
                body: `
                    <ol class="controller-guide-steps">
                        ${step(1, 'Abra a pendência correta', 'Confirme escola, competência, programa e documento antes de registrar o retorno.')}
                        ${step(2, 'Clique em “Registrar novo envio”', 'Informe a data em que o arquivo corrigido ficou disponível no Drive.')}
                        ${step(3, 'Preencha a observação', 'Registre o que foi disponibilizado. Se for útil, inclua o link direto do arquivo no campo opcional.')}
                        ${step(4, 'Clique em “Registrar e enviar para reanálise”', 'A pendência muda para “Aguardando reanálise” e passa a aparecer na fila correspondente.')}
                    </ol>
                    ${callout('attention', 'Novo envio não significa pendência resolvida', 'A pendência só é encerrada como resolvida depois que o documento for efetivamente reanalisado e considerado correto.')}
                `
            }),
            section({
                id: 'guia-reanalise',
                eyebrow: '08 · Reanálise',
                title: 'Confira a nova entrega e registre uma nova avaliação',
                intro: 'A reanálise registra o que aconteceu com o arquivo reenviado e mantém a história completa da regularização.',
                image: SCREENS.pendencias,
                imageTitle: 'Fila “Aguardando reanálise”',
                imageCaption: 'Entre na pendência que recebeu novo envio e use a ação “Reanalisar”.',
                route: 'pendencias',
                routeLabel: 'Abrir fila de reanálise',
                body: `
                    <ol class="controller-guide-steps">
                        ${step(1, 'Abra “Aguardando reanálise”', 'Localize a pendência e confira a tentativa mais recente, a data e a observação do novo envio.')}
                        ${step(2, 'Clique em “Reanalisar”', 'A tela apresenta o contexto da tentativa e pede o resultado da nova conferência.')}
                        ${step(3, 'Escolha o resultado', 'Selecione “Documento correto”, “Documento ainda incorreto” ou “Arquivo não localizado ou inacessível”, conforme o que você encontrou.')}
                        ${step(4, 'Registre a observação da análise', 'Explique o resultado. Se ainda estiver incorreto, marque os erros documentais encontrados.')}
                        ${step(5, 'Confirme a reanálise', 'Se correto, a pendência é resolvida. Se ainda houver problema, ela retorna ao fluxo de correção sem apagar as tentativas anteriores.')}
                    </ol>
                    ${callout('result', 'Nada do histórico é perdido', 'O RADAR preserva abertura, novos envios, reanálises, erros e observações. Isso permite entender quantas tentativas ocorreram e por que a pendência foi ou não resolvida.')}
                `
            }),
            section({
                id: 'guia-comentarios',
                eyebrow: '09 · Comentários e contatos',
                title: 'Registre observações que ajudem a próxima ação',
                intro: 'Comentários úteis tornam o acompanhamento compreensível para quem consultar a escola depois. Registre também contatos realizados quando a pendência exigir cobrança ou orientação.',
                body: `
                    <ol class="controller-guide-steps">
                        ${step(1, 'Use o campo de observação da própria ação', 'Pendência, novo envio e reanálise possuem campos próprios. Escreva o que foi verificado naquele momento.')}
                        ${step(2, 'Use “Registrar contato” quando houver comunicação', 'Na pendência, registre contato/cobrança quando precisar documentar uma orientação à escola ou outro acompanhamento.')}
                        ${step(3, 'Seja específico', 'Prefira “Arquivo sem assinatura do Presidente do CEC” a “documento errado”.')}
                        ${step(4, 'Consulte o histórico antes de repetir uma cobrança', 'O detalhe da pendência e o Prontuário mostram as movimentações anteriores.')}
                    </ol>
                    ${callout('info', 'Boa prática', 'Uma observação deve permitir que outra pessoa entenda o problema sem precisar perguntar o que aconteceu.')}
                `
            }),
            section({
                id: 'guia-historico',
                eyebrow: '10 · Histórico e rastreabilidade',
                title: 'Encontre o que já foi lançado',
                intro: 'Use o Prontuário quando sua pergunta for “o que aconteceu com esta escola?” e Registros Internos quando precisar consultar a trilha administrativa disponível ao seu perfil.',
                image: SCREENS.auditoria,
                imageTitle: 'Registros Internos',
                imageCaption: 'A tela reúne eventos administrativos visíveis ao perfil. Para a história completa de uma unidade, prefira começar pelo Prontuário da escola.',
                route: 'auditoria',
                routeLabel: 'Abrir Registros Internos',
                body: `
                    <ol class="controller-guide-steps">
                        ${step(1, 'Para uma escola específica, abra o Prontuário', 'Comece pela Carteira ou busca global e abra a unidade.')}
                        ${step(2, 'Navegue pelas áreas do Prontuário', 'Confira competências, pendências, registros e a linha do tempo conforme o conteúdo disponível.')}
                        ${step(3, 'Para eventos administrativos, use “Registros Internos”', 'A área mostra os registros que o seu perfil está autorizado a consultar.')}
                        ${step(4, 'Sempre confira data e competência', 'O mesmo documento pode ter acontecimentos em meses e tentativas diferentes.')}
                    </ol>
                `
            }),
            section({
                id: 'guia-inventario',
                eyebrow: '11 · Capital e inventário',
                title: 'Acompanhe o fluxo patrimonial quando houver gasto permanente',
                intro: 'O Controlador pode visualizar e executar as ações patrimoniais autorizadas no fluxo, enquanto a conclusão de inventariação também pode envolver a equipe responsável.',
                image: SCREENS.inventario,
                imageTitle: 'Capital e Inventário',
                imageCaption: 'Use esta área para acompanhar bens, encaminhamentos, processo e situação da inventariação.',
                route: 'inventario',
                routeLabel: 'Abrir Capital e Inventário',
                body: `
                    <ol class="controller-guide-steps">
                        ${step(1, 'Abra “Capital e Inventário”', 'A opção fica no grupo Interno do menu.')}
                        ${step(2, 'Localize a escola ou o bem', 'Use os filtros disponíveis e confira a situação patrimonial registrada.')}
                        ${step(3, 'Registre apenas as ações que correspondem ao fluxo real', 'Dados de nota, encaminhamento e inventariação devem permanecer coerentes com o que ocorreu fora do sistema.')}
                    </ol>
                `
            }),
            section({
                id: 'guia-encontrar',
                eyebrow: '12 · Como encontrar qualquer coisa',
                title: 'Escolha o caminho de acordo com a sua pergunta',
                intro: 'O RADAR oferece mais de uma porta de entrada. A forma mais rápida depende do que você está procurando.',
                body: `
                    <div class="controller-guide-path-grid">
                        <div><strong>“Quero saber como está uma escola.”</strong><p>Carteira de Escolas → abra a unidade → Prontuário.</p>${quickAction('Ir para Carteira', 'escolas')}</div>
                        <div><strong>“Quero trabalhar o mês.”</strong><p>Selecione a competência → Competências Mensais.</p>${quickAction('Ir para Competências', 'competencias')}</div>
                        <div><strong>“Quero ver o que falta corrigir.”</strong><p>Pendências Operacionais → escolha a aba de situação.</p>${quickAction('Ir para Pendências', 'pendencias')}</div>
                        <div><strong>“Recebi um arquivo corrigido.”</strong><p>Pendências → abra a ocorrência → Registrar novo envio → Reanalisar.</p>${quickAction('Abrir Pendências', 'pendencias')}</div>
                        <div><strong>“Quero saber o que já aconteceu.”</strong><p>Prontuário da escola → histórico/linha do tempo; ou Registros Internos para a trilha administrativa.</p>${quickAction('Abrir Registros', 'auditoria')}</div>
                        <div><strong>“Quero localizar uma escola rapidamente.”</strong><p>Use a busca no cabeçalho pelo nome ou designação e abra o resultado.</p>${quickAction('Voltar ao Dashboard', 'dashboard')}</div>
                    </div>
                `
            })
        ];

        return `
            <article class="controller-guide" id="controller-guide-root">
                <header class="controller-guide-hero">
                    <div class="controller-guide-hero-copy">
                        <span class="controller-guide-kicker">RADAR PDDE · 4ª CRE</span>
                        <h1>Guia do Controlador</h1>
                        <p>Um passo a passo para registrar a avaliação mensal, tratar documentos com problema, acompanhar pendências, registrar novas entregas e reenálises e encontrar o histórico da escola.</p>
                        <div class="controller-guide-hero-actions">
                            <button type="button" class="btn btn-primary" id="controller-guide-print">${icon('print')} Salvar em PDF</button>
                            <a class="btn btn-secondary" href="#guia-avaliacao">Começar pela avaliação mensal</a>
                        </div>
                        <p class="controller-guide-print-help">Ao clicar em “Salvar em PDF”, escolha <strong>Salvar como PDF</strong> na janela de impressão do navegador.</p>
                    </div>
                    <div class="controller-guide-hero-card">
                        <span>Antes de lançar</span>
                        <strong>1. Escola certa<br>2. Competência certa<br>3. Documento certo</strong>
                        <p>Essas três conferências evitam a maior parte dos lançamentos no contexto errado.</p>
                    </div>
                </header>

                <div class="controller-guide-toolbar" aria-label="Ferramentas do guia">
                    <label class="controller-guide-search">
                        ${icon('search')}
                        <span class="sr-only">Buscar no guia</span>
                        <input type="search" id="controller-guide-search" placeholder="Buscar: pendência, reanálise, documento ilegível...">
                    </label>
                    <span id="controller-guide-search-result" role="status" aria-live="polite"></span>
                </div>

                <nav class="controller-guide-toc" aria-label="Sumário do Guia do Controlador">
                    <a href="#guia-comecar"><span>01</span>Comece por aqui</a>
                    <a href="#guia-carteira"><span>02</span>Carteira e Prontuário</a>
                    <a href="#guia-competencia"><span>03</span>Competência</a>
                    <a href="#guia-avaliacao"><span>04</span>Avaliação mensal</a>
                    <a href="#guia-excecoes"><span>05</span>Exceções</a>
                    <a href="#guia-pendencia"><span>06</span>Pendências</a>
                    <a href="#guia-novo-envio"><span>07</span>Nova entrega</a>
                    <a href="#guia-reanalise"><span>08</span>Reanálise</a>
                    <a href="#guia-comentarios"><span>09</span>Comentários</a>
                    <a href="#guia-historico"><span>10</span>Histórico</a>
                    <a href="#guia-inventario"><span>11</span>Inventário</a>
                    <a href="#guia-encontrar"><span>12</span>Como encontrar</a>
                </nav>

                <div class="controller-guide-content">${sections.join('')}</div>

                <footer class="controller-guide-footer">
                    <strong>RADAR PDDE · Guia do Controlador</strong>
                    <span>Referência de uso do sistema · Atualizado em agosto de 2026</span>
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
                const query = text(event.target.value).toLocaleLowerCase('pt-BR');
                let visible = 0;
                container.querySelectorAll('[data-guide-section]').forEach(section => {
                    const matches = !query || section.textContent.toLocaleLowerCase('pt-BR').includes(query);
                    section.hidden = !matches;
                    if (matches) visible += 1;
                });
                if (result) result.textContent = query
                    ? `${visible} tópico${visible === 1 ? '' : 's'} encontrado${visible === 1 ? '' : 's'}`
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
        if (!isController()) {
            baseSwitchView?.call(root, 'dashboard');
            return false;
        }
        const main = root.document.querySelector('#main-container');
        if (!main) return false;
        main.innerHTML = buildGuideMarkup();
        updateNavState();
        bindGuideEvents(main);
        root.scrollTo?.({ top: 0, behavior: 'instant' });
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
        const visible = isController();
        item.style.display = visible ? '' : 'none';
        item.setAttribute('aria-hidden', visible ? 'false' : 'true');
        if (!visible && root.document.querySelector('#controller-guide-root')) {
            baseSwitchView?.call(root, 'dashboard');
        }
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
        isAvailable: isController,
        view: GUIDE_VIEW,
        screenshots: SCREENS
    });

    root.RadarControllerGuide = api;
    install();
}(typeof window !== 'undefined' ? window : globalThis));
