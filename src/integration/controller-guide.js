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
                <div class="controller-guide-figure-label">PRINT REAL DO RADAR PDDE</div>
                <img src="${src}" alt="${escapeHtml(title)}">
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
                imageCaption: 'Use o menu à esquerda para mudar de área. No alto, confira a competência, a busca e o sino de alertas.',
                route: 'dashboard',
                routeLabel: 'Abrir Dashboard',
                body: `
                    <ol class="controller-guide-steps">
                        ${step(1, 'Confira a competência', 'Antes de qualquer lançamento, confirme o mês exibido no seletor de competência no cabeçalho.')}
                        ${step(2, 'Observe cartões e filas de trabalho', 'Os indicadores mostram o panorama do mês e ajudam a localizar escolas ou situações que precisam de atenção.')}
                        ${step(3, 'Use a busca global', 'Digite o nome ou a designação da escola no campo de busca do cabeçalho para chegar rapidamente à unidade.')}
                        ${step(4, 'Acompanhe o sino de alertas', 'O sino reúne situações que pedem atenção e pode levar você ao contexto relacionado.')}
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
                        ${step(2, 'Localize a unidade', 'Use a busca e os filtros da Carteira. Você também pode abrir a escola pela busca global do cabeçalho.')}
                        ${step(3, 'Abra o Prontuário', 'Clique no nome da escola ou na ação de abrir/detalhar a unidade. O Prontuário concentra o trabalho daquela escola.')}
                        ${step(4, 'Volte sem perder o contexto', 'Ao retornar, o RADAR preserva o caminho, a competência, os filtros, a posição da página e o foco quando a navegação contextual estiver ativa.')}
                    </ol>
                `
            }),
            section({
                id: 'guia-prontuario',
                eyebrow: '03 · Prontuário da unidade',
                title: 'Use o Prontuário como central de trabalho da escola',
                intro: 'Quando sua pergunta for “o que preciso fazer nesta escola?” ou “o que já aconteceu aqui?”, o Prontuário é o melhor ponto de partida.',
                image: SCREENS.carteira,
                imageTitle: 'Caminho para o Prontuário',
                imageCaption: 'Abra a escola pela Carteira ou pela busca global. Dentro da unidade, navegue pelas abas e pelas ações autorizadas ao Controlador.',
                route: 'escolas',
                routeLabel: 'Escolher uma escola',
                body: `
                    <div class="controller-guide-split">
                        <div class="controller-guide-mini-card"><strong>Competências e bonificação</strong><p>Onde você acompanha o mês, registra entrega/bonificação e faz a análise técnica documental.</p></div>
                        <div class="controller-guide-mini-card"><strong>Pendências e acompanhamento</strong><p>Onde você consulta ocorrências relacionadas à escola e acompanha regularizações.</p></div>
                        <div class="controller-guide-mini-card"><strong>Registros e informações da unidade</strong><p>Dados cadastrais, programas vinculados e demais informações apresentadas ao perfil.</p></div>
                        <div class="controller-guide-mini-card"><strong>Histórico cronológico</strong><p>Reúne eventos como análises, pendências, novos envios, reanálises, contatos, notas e movimentações patrimoniais.</p></div>
                    </div>
                    <ol class="controller-guide-steps">
                        ${step(1, 'Use “Registrar Contato”', 'Registre uma comunicação relevante com a unidade para que o acompanhamento não dependa de memória ou conversa fora do sistema.')}
                        ${step(2, 'Use “Gerar Cobrança”', 'Quando precisar cobrar uma regularização, abra a ação e utilize a mensagem preparada pelo RADAR como apoio à comunicação.')}
                        ${step(3, 'Use “Editar Dados”', 'Atualize os dados cadastrais que o Controlador está autorizado a manter, como contatos e responsáveis. O sistema protege campos institucionais e a responsabilidade da carteira que não podem ser alterados por esse perfil.')}
                        ${step(4, 'Troque de aba sem sair da escola', 'Use as abas do Prontuário para mudar o tipo de informação mantendo a unidade selecionada.')}
                    </ol>
                    ${callout('info', 'Programas vinculados', 'No Prontuário, a lista de programas da escola é informativa para o Controlador. Alteração de programa não é feita por essa tela.')}
                `
            }),
            section({
                id: 'guia-competencia',
                eyebrow: '04 · Trabalhe no mês certo',
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
                        ${step(3, 'Confirme o mês antes de lançar', 'Faça essa conferência antes de alterar bonificação, análise técnica, nota fiscal ou pendência.')}
                    </ol>
                    ${callout('attention', 'Meses fora do escopo', 'No Prontuário, competências fora do período aplicável à escola aparecem sem ação. Não tente usar outro mês para contornar esse bloqueio.')}
                `
            }),
            section({
                id: 'guia-avaliacao',
                eyebrow: '05 · Avaliação mensal',
                title: 'Faça a conferência documental e registre a análise',
                intro: 'A avaliação mensal separa três coisas: a entrega para bonificação, a qualidade técnica do documento e as pendências que surgem quando algo precisa ser corrigido.',
                image: SCREENS.competencias,
                imageTitle: 'Ponto de entrada para a avaliação mensal',
                imageCaption: 'Abra a escola/competência e trabalhe documento a documento. O resultado fica ligado à unidade, ao programa e ao mês.',
                route: 'competencias',
                routeLabel: 'Iniciar pela Competência',
                body: `
                    <div class="controller-guide-path-grid">
                        <div><strong>Extrato da Conta Corrente</strong><p>Registre a entrega e confira se o extrato corresponde à competência e está completo e legível.</p></div>
                        <div><strong>Extrato de Investimento</strong><p>Faça a mesma conferência considerando a existência e o movimento da conta de investimento.</p></div>
                        <div><strong>Notas Fiscais</strong><p>Se houver gasto, registre a entrega e cadastre as notas para que o RADAR conheça a natureza da despesa.</p></div>
                        <div><strong>Consulta à Assessoria</strong><p>O requisito acompanha despesas de serviço quando aplicável.</p></div>
                        <div><strong>Declaração BB Ágil</strong><p>Registre a entrega e faça a conferência documental normal.</p></div>
                        <div><strong>Encaminhamento para Inventariação</strong><p>É utilizado no fluxo de bens permanentes quando aplicável.</p></div>
                    </div>
                    <ol class="controller-guide-steps">
                        ${step(1, 'Abra a escola na competência', 'Na lista mensal ou no Prontuário, localize o programa que será analisado.')}
                        ${step(2, 'Registre a entrega/bonificação', 'Para cada requisito, marque “Sim”, “Não” ou “Não se aplica” somente quando essa opção for válida para o item.')}
                        ${step(3, 'Faça a análise técnica', 'Depois de conferir o arquivo, escolha o resultado da análise. “Correto” significa que o documento passou pela conferência, não apenas que foi entregue.')}
                        ${step(4, 'Abra pendência quando houver correção a fazer', 'Se o arquivo estiver ausente, ilegível, incompleto ou apresentar outro erro, registre a ocorrência de forma específica.')}
                        ${step(5, 'Revise o conjunto antes de consolidar', 'A consolidação só deve ser feita quando os requisitos necessários estiverem preenchidos e o estado da competência estiver coerente.')}
                    </ol>
                    ${callout('attention', 'Entrega e análise técnica são registros diferentes', 'Um documento pode ter sido entregue e ainda assim estar incorreto. Não altere a informação de entrega para tentar representar um problema de qualidade documental.')}
                `
            }),
            section({
                id: 'guia-excecoes',
                eyebrow: '06 · Exceções e “Não se aplica”',
                title: 'Use “Não se aplica” somente nos requisitos que permitem essa situação',
                intro: '“Não se aplica” não é uma forma de pular a análise. Ele representa uma situação real em que aquele requisito não é exigível para o caso.',
                body: `
                    <ol class="controller-guide-steps">
                        ${step(1, 'Verifique o requisito', 'Notas Fiscais, Consulta à Assessoria e Encaminhamento para Inventariação podem variar conforme o tipo de gasto e o caso concreto.')}
                        ${step(2, 'Não use N/A nos documentos obrigatórios', 'Extrato da Conta Corrente, Extrato de Investimento e Declaração BB Ágil não aceitam “Não se aplica” para a consolidação mensal.')}
                        ${step(3, 'Se já existe nota fiscal cadastrada, trate a nota primeiro', 'O RADAR não apaga nota ou bem automaticamente quando você tenta marcar N/A. Edite ou exclua a nota individualmente quando essa for realmente a correção necessária.')}
                        ${step(4, 'Confira o efeito antes de consolidar', 'Um “Não se aplica” indevido bloqueia a consolidação e deve ser corrigido no próprio requisito.')}
                    </ol>
                    ${callout('info', 'Exemplo', 'Se não houve gasto no período, Notas Fiscais pode ser uma situação não aplicável conforme o caso. Se existe nota cadastrada, não use N/A como atalho para apagar esse registro.')}
                `
            }),
            section({
                id: 'guia-documentos-problema',
                eyebrow: '07 · Documento faltante ou com erro',
                title: 'Registre documento ausente, ilegível ou outra ocorrência',
                intro: 'Quando o documento não puder ser considerado regular, identifique exatamente o problema e descreva o que a escola precisa corrigir.',
                body: `
                    <div class="controller-guide-split">
                        <div class="controller-guide-mini-card"><strong>Documento ausente</strong><p>Use quando o arquivo exigido não foi disponibilizado. Não use “ilegível” se simplesmente não existe arquivo.</p></div>
                        <div class="controller-guide-mini-card"><strong>Documento ilegível</strong><p>Use quando o arquivo existe, mas a qualidade impede conferir informações, assinaturas ou valores.</p></div>
                        <div class="controller-guide-mini-card"><strong>Competência incorreta</strong><p>Use quando o documento apresentado corresponde a outro período.</p></div>
                        <div class="controller-guide-mini-card"><strong>Outros erros</strong><p>Extrato incompleto, ausência de assinatura, arquivo incompatível e demais opções devem refletir o problema encontrado.</p></div>
                    </div>
                    <ol class="controller-guide-steps">
                        ${step(1, 'No documento analisado, abra a ação de pendência', 'Quando a ocorrência nasce da análise documental, o RADAR já leva escola, competência, programa e documento para o registro.')}
                        ${step(2, 'Marque todos os erros encontrados', 'É possível registrar mais de um erro no mesmo documento quando necessário.')}
                        ${step(3, 'Escreva uma observação objetiva', 'Diga o que está errado e o que precisa ser apresentado ou corrigido. Evite observações como apenas “errado”.')}
                        ${step(4, 'Crie a pendência', 'Depois de salvar, a ocorrência entra no acompanhamento da escola e aparece em Pendências Operacionais.')}
                    </ol>
                    ${callout('info', 'Exemplo de observação útil', '“Extrato da conta corrente está sem a página que contém o saldo final. Reenviar o extrato completo da competência.”')}
                `
            }),
            section({
                id: 'guia-notas',
                eyebrow: '08 · Notas fiscais e gastos',
                title: 'Cadastre a nota quando houver despesa e deixe o RADAR direcionar as exigências',
                intro: 'Ao informar que houve Nota Fiscal, o Controlador registra o gasto para que o sistema consiga relacionar serviço, consumo ou bem permanente às obrigações correspondentes.',
                body: `
                    <ol class="controller-guide-steps">
                        ${step(1, 'No Prontuário, localize “Notas Fiscais”', 'Na competência e no programa corretos, marque a entrega conforme o caso e utilize “Adicionar Nota”.')}
                        ${step(2, 'Preencha os dados da despesa', 'Informe descrição do gasto, tipo, número da nota fiscal e valor solicitados pela tela.')}
                        ${step(3, 'Escolha o tipo corretamente', 'Material de consumo não gera as mesmas exigências de um serviço ou de um bem permanente. Essa escolha influencia o acompanhamento posterior.')}
                        ${step(4, 'Serviço: acompanhe a Consulta à Assessoria', 'Ao cadastrar uma despesa de serviço, confira o requisito correspondente e registre o envio real à Assessoria quando aplicável.')}
                        ${step(5, 'Bem permanente: acompanhe o Inventário', 'Quando o gasto for permanente, o bem e o encaminhamento patrimonial passam a integrar o fluxo de Capital e Inventário.')}
                        ${step(6, 'Edite ou exclua uma nota pela própria nota', 'Se precisar corrigir um registro ainda não consolidado, use as ações de editar/excluir da nota. Não use “Não se aplica” para apagar uma nota existente.')}
                    </ol>
                    ${callout('attention', 'Depois da consolidação', 'O Controlador não cria, edita ou exclui notas de uma avaliação já consolidada. Se houver necessidade de ajuste posterior, siga o fluxo institucional autorizado em vez de tentar contornar o bloqueio.')}
                `
            }),
            section({
                id: 'guia-pendencia',
                eyebrow: '09 · Pendências',
                title: 'Abra, acompanhe e entenda o estado de cada pendência',
                intro: 'Pendências Operacionais organiza o que está aberto, o que recebeu novo envio e aguarda reanálise, o que foi resolvido e o que foi cancelado.',
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
                        ${step(1, 'Clique em “Pendências Operacionais”', 'Use o menu lateral, o Prontuário ou um alerta/atalho contextual.')}
                        ${step(2, 'Escolha a aba de situação', 'Use Abertas, Aguardando reanálise, Resolvidas ou Canceladas para reduzir o universo.')}
                        ${step(3, 'Filtre pela escola quando necessário', 'Se você chegou pelo contexto da unidade, o filtro pode ser aplicado automaticamente e será indicado na tela.')}
                        ${step(4, 'Clique em “Ver detalhes”', 'O painel mostra os erros, a tentativa mais recente, contatos e histórico, além das ações ainda disponíveis.')}
                    </ol>
                `
            }),
            section({
                id: 'guia-novo-envio',
                eyebrow: '10 · Nova entrega',
                title: 'Registre que a escola disponibilizou um novo arquivo',
                intro: 'Quando a escola corrigir o documento no Drive, registre o novo envio na pendência para que ela passe a “Aguardando reanálise”.',
                image: SCREENS.pendencias,
                imageTitle: 'Pendência pronta para receber nova entrega',
                imageCaption: 'Abra a pendência e utilize “Registrar novo envio”. O envio não resolve a pendência sozinho.',
                route: 'pendencias',
                routeLabel: 'Localizar pendência',
                body: `
                    <ol class="controller-guide-steps">
                        ${step(1, 'Abra a pendência correta', 'Confirme escola, competência, programa e documento antes de registrar o retorno.')}
                        ${step(2, 'Clique em “Registrar novo envio”', 'Informe a data em que o arquivo corrigido ficou disponível no Drive.')}
                        ${step(3, 'Preencha a observação', 'Registre o que foi disponibilizado. Se for útil, inclua o link direto do arquivo no campo opcional.')}
                        ${step(4, 'Clique em “Registrar e enviar para reanálise”', 'A pendência muda para “Aguardando reanálise” e passa a aparecer na fila correspondente.')}
                    </ol>
                    ${callout('attention', 'Novo envio não significa pendência resolvida', 'A pendência só é resolvida depois que o arquivo for reanalisado e considerado correto.')}
                `
            }),
            section({
                id: 'guia-reanalise',
                eyebrow: '11 · Reanálise',
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
                id: 'guia-comunicacao',
                eyebrow: '12 · Contatos, comentários e cobrança',
                title: 'Registre as comunicações que fazem parte do acompanhamento',
                intro: 'Uma orientação enviada por telefone, e-mail ou outro meio só vira histórico do RADAR quando você a registra. O sistema também oferece apoio para preparar uma cobrança.',
                body: `
                    <ol class="controller-guide-steps">
                        ${step(1, 'Use “Registrar Contato”', 'A ação pode ser aberta no contexto da escola ou da pendência. Registre a comunicação e a informação relevante para o acompanhamento.')}
                        ${step(2, 'Use “Gerar Cobrança” quando precisar de texto de apoio', 'A tela apresenta uma pré-visualização da mensagem e permite copiar o texto para o canal de comunicação utilizado pela equipe.')}
                        ${step(3, 'Use a observação da ação correta', 'Pendência, novo envio e reanálise possuem seus próprios campos. Registre em cada etapa o que ocorreu naquele momento.')}
                        ${step(4, 'Seja específico', 'Prefira “Arquivo sem assinatura do Presidente do CEC” a “documento errado”.')}
                        ${step(5, 'Consulte o histórico antes de repetir contato', 'O detalhe da pendência e o Prontuário mostram as movimentações anteriores e ajudam a evitar cobranças duplicadas.')}
                    </ol>
                    ${callout('info', 'Boa prática', 'Uma observação deve permitir que outra pessoa entenda o problema e a providência esperada sem precisar perguntar o que aconteceu.')}
                `
            }),
            section({
                id: 'guia-encerrar-pendencia',
                eyebrow: '13 · Cancelar ou reabrir pendência',
                title: 'Use cancelamento e reabertura somente quando o estado do caso realmente mudou',
                intro: 'Resolver é consequência da reanálise correta. Cancelar e reabrir são ações diferentes e permanecem registradas no histórico.',
                route: 'pendencias',
                routeLabel: 'Abrir Pendências',
                body: `
                    <ol class="controller-guide-steps">
                        ${step(1, 'Para cancelar, abra os detalhes da pendência', 'Use “Cancelar pendência” apenas quando existir motivo para encerrar a ocorrência sem uma regularização por reanálise.')}
                        ${step(2, 'Registre a justificativa', 'O motivo do cancelamento precisa permitir entender por que a pendência deixou de ser tratada como ativa.')}
                        ${step(3, 'Para reabrir, acesse a pendência resolvida ou cancelada', 'Quando surgir motivo legítimo para retomar o acompanhamento, use “Reabrir pendência”.')}
                        ${step(4, 'Continue pelo mesmo histórico', 'A reabertura não cria uma história paralela. O ciclo anterior continua disponível para consulta.')}
                    </ol>
                    ${callout('attention', 'Não use cancelamento para representar documento corrigido', 'Quando a escola corrigiu o documento, registre novo envio e faça a reanálise. Se estiver correto, a própria reanálise resolve a pendência.')}
                `
            }),
            section({
                id: 'guia-historico',
                eyebrow: '14 · Histórico e rastreabilidade',
                title: 'Encontre o que já foi lançado',
                intro: 'Use o Prontuário quando sua pergunta for “o que aconteceu com esta escola?” e Registros Internos quando precisar consultar a trilha administrativa disponível ao seu perfil.',
                image: SCREENS.auditoria,
                imageTitle: 'Registros Internos',
                imageCaption: 'A tela reúne eventos administrativos visíveis ao Controlador. Para a história completa de uma unidade, comece pelo Prontuário da escola.',
                route: 'auditoria',
                routeLabel: 'Abrir Registros Internos',
                body: `
                    <ol class="controller-guide-steps">
                        ${step(1, 'Para uma escola específica, abra o Prontuário', 'Comece pela Carteira ou pela busca global e abra a unidade.')}
                        ${step(2, 'Use o Histórico cronológico', 'A linha do tempo reúne acontecimentos da competência selecionada, como análises, pendências, tentativas, contatos, notas e bens.')}
                        ${step(3, 'Para eventos administrativos, use “Registros Internos”', 'A área mostra os registros administrativos que o perfil Controlador está autorizado a consultar.')}
                        ${step(4, 'Confira data, competência e responsável', 'O mesmo documento pode ter acontecimentos em meses e tentativas diferentes.')}
                    </ol>
                `
            }),
            section({
                id: 'guia-inventario',
                eyebrow: '15 · Capital e inventário',
                title: 'Acompanhe o fluxo patrimonial quando houver gasto permanente',
                intro: 'O Controlador pode cadastrar e acompanhar ações patrimoniais autorizadas, enquanto a conclusão da inventariação também envolve o fluxo próprio da equipe responsável.',
                image: SCREENS.inventario,
                imageTitle: 'Capital e Inventário',
                imageCaption: 'Use esta área para acompanhar bens, encaminhamentos, processo e situação da inventariação.',
                route: 'inventario',
                routeLabel: 'Abrir Capital e Inventário',
                body: `
                    <ol class="controller-guide-steps">
                        ${step(1, 'Abra “Capital e Inventário”', 'A opção fica no grupo Interno do menu.')}
                        ${step(2, 'Localize a escola ou o bem', 'Use os filtros disponíveis e confira a situação patrimonial registrada.')}
                        ${step(3, 'Cadastre/acompanhe o bem quando o gasto for permanente', 'O registro patrimonial deve corresponder à nota fiscal e ao que efetivamente foi adquirido.')}
                        ${step(4, 'Encaminhe para inventariação quando for o momento', 'Confira as informações exigidas pela tela antes de registrar o encaminhamento.')}
                        ${step(5, 'Acompanhe o status', 'Use a própria área para identificar o que ainda aguarda encaminhamento, inventariação ou registro complementar.')}
                    </ol>
                `
            }),
            section({
                id: 'guia-encontrar',
                eyebrow: '16 · Como encontrar qualquer coisa',
                title: 'Escolha o caminho de acordo com a sua pergunta',
                intro: 'O RADAR oferece mais de uma porta de entrada. A forma mais rápida depende do que você está procurando.',
                body: `
                    <div class="controller-guide-path-grid">
                        <div><strong>“Quero saber como está uma escola.”</strong><p>Carteira de Escolas → abra a unidade → Prontuário.</p>${quickAction('Ir para Carteira', 'escolas')}</div>
                        <div><strong>“Quero trabalhar o mês.”</strong><p>Selecione a competência → Competências Mensais.</p>${quickAction('Ir para Competências', 'competencias')}</div>
                        <div><strong>“Quero lançar uma nota fiscal.”</strong><p>Carteira → Prontuário → competência/programa → Notas Fiscais → Adicionar Nota.</p>${quickAction('Escolher escola', 'escolas')}</div>
                        <div><strong>“Quero ver o que falta corrigir.”</strong><p>Pendências Operacionais → escolha a aba de situação.</p>${quickAction('Ir para Pendências', 'pendencias')}</div>
                        <div><strong>“Recebi um arquivo corrigido.”</strong><p>Pendências → abra a ocorrência → Registrar novo envio → Reanalisar.</p>${quickAction('Abrir Pendências', 'pendencias')}</div>
                        <div><strong>“Quero registrar uma conversa.”</strong><p>Abra a escola ou a pendência → Registrar Contato.</p>${quickAction('Ir para Carteira', 'escolas')}</div>
                        <div><strong>“Quero saber o que já aconteceu.”</strong><p>Prontuário → Histórico cronológico; ou Registros Internos para a trilha administrativa.</p>${quickAction('Abrir Registros', 'auditoria')}</div>
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
                        <p>Passo a passo para navegar pelo RADAR, registrar a avaliação mensal, tratar exceções e documentos com problema, cadastrar notas, acompanhar pendências, registrar novas entregas e reanálises, documentar contatos e encontrar o histórico da escola.</p>
                        <div class="controller-guide-hero-actions">
                            <button type="button" class="btn btn-primary" id="controller-guide-print">${icon('print')} Salvar em PDF</button>
                            <a class="btn btn-secondary" href="#guia-avaliacao">Começar pela avaliação mensal</a>
                        </div>
                        <p class="controller-guide-print-help">Ao clicar em “Salvar em PDF”, escolha <strong>Salvar como PDF</strong> na janela de impressão do navegador.</p>
                    </div>
                    <div class="controller-guide-hero-card">
                        <span>Antes de lançar</span>
                        <strong>1. Escola certa<br>2. Competência certa<br>3. Programa e documento certos</strong>
                        <p>Essas conferências evitam a maior parte dos lançamentos no contexto errado.</p>
                    </div>
                </header>

                <div class="controller-guide-toolbar" aria-label="Ferramentas do guia">
                    <label class="controller-guide-search">
                        ${icon('search')}
                        <span class="sr-only">Buscar no guia</span>
                        <input type="search" id="controller-guide-search" placeholder="Buscar: pendência, nota fiscal, reanálise, documento ilegível...">
                    </label>
                    <span id="controller-guide-search-result" role="status" aria-live="polite"></span>
                </div>

                <nav class="controller-guide-toc" aria-label="Sumário do Guia do Controlador">
                    <a href="#guia-comecar"><span>01</span>Comece por aqui</a>
                    <a href="#guia-carteira"><span>02</span>Carteira</a>
                    <a href="#guia-prontuario"><span>03</span>Prontuário</a>
                    <a href="#guia-competencia"><span>04</span>Competência</a>
                    <a href="#guia-avaliacao"><span>05</span>Avaliação mensal</a>
                    <a href="#guia-excecoes"><span>06</span>Exceções / N/A</a>
                    <a href="#guia-documentos-problema"><span>07</span>Documento com erro</a>
                    <a href="#guia-notas"><span>08</span>Notas e gastos</a>
                    <a href="#guia-pendencia"><span>09</span>Pendências</a>
                    <a href="#guia-novo-envio"><span>10</span>Nova entrega</a>
                    <a href="#guia-reanalise"><span>11</span>Reanálise</a>
                    <a href="#guia-comunicacao"><span>12</span>Contatos e cobrança</a>
                    <a href="#guia-encerrar-pendencia"><span>13</span>Cancelar / reabrir</a>
                    <a href="#guia-historico"><span>14</span>Histórico</a>
                    <a href="#guia-inventario"><span>15</span>Inventário</a>
                    <a href="#guia-encontrar"><span>16</span>Como encontrar</a>
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
        isAvailable: () => true,
        view: GUIDE_VIEW,
        screenshots: SCREENS
    });

    root.RadarControllerGuide = api;
    install();
}(typeof window !== 'undefined' ? window : globalThis));
