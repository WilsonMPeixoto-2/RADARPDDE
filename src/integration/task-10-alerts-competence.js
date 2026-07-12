(function installTask10Alerts(root) {
    'use strict';

    let installed = false;
    let originalGetAlerts = null;

    function dependenciesReady() {
        return Boolean(
            root.RadarOperationalProjection
            && typeof root.getAlerts === 'function'
            && typeof root.openPendencyDetail === 'function'
        );
    }

    function getSchoolName(school) {
        return String(school && (
            school.denominação || school.denominacao || school.name
        ) || 'Unidade não identificada');
    }

    function getSchoolDesignation(school) {
        return String(school && (school.designação || school.designacao) || '');
    }

    function getControllerName(school) {
        const controller = school
            ? controladores.find(item => item.id === school.controladorId)
            : null;
        return controller ? controller.name : 'Não designado';
    }

    function getProgramName(pendency) {
        const program = programas.find(item => item.id === pendency.programaId);
        return program ? (program.name || program.nome || pendency.programaId) : pendency.programaId;
    }

    function getDocumentLabel(pendency) {
        const labels = root.RadarOperationalProjection.DOCUMENT_LABELS || {};
        return labels[pendency.documentoKey]
            || pendency.item
            || pendency.documentoKey
            || 'documento';
    }

    function differenceInDays(baseDate, now) {
        const start = new Date(baseDate);
        if (!baseDate || Number.isNaN(start.getTime())) return null;
        const diff = now.getTime() - start.getTime();
        if (diff <= 0) return 0;
        return Math.floor(diff / 86400000);
    }

    function getLatestContact(pendencyId) {
        return contatos
            .filter(contact => (contact.pendenciaId || contact.pendencyId) === pendencyId)
            .map(contact => ({
                contact,
                at: contact.dataHora || contact.dataRegistro || contact.dataAtendimento || contact.data
            }))
            .filter(item => item.at && !Number.isNaN(new Date(item.at).getTime()))
            .sort((left, right) => new Date(right.at) - new Date(left.at))[0] || null;
    }

    function createOperationalPendencyAlert(pendency, now) {
        if (!['Aberta', 'Aguardando reanálise'].includes(pendency.status)) return null;
        const baseDate = root.RadarOperationalProjection.getOperationalBaseDate(pendency);
        const ageDays = differenceInDays(baseDate, now);
        if (ageDays == null || ageDays <= 10) return null;

        const school = escolas.find(item => item.id === pendency.escolaId);
        const programName = getProgramName(pendency);
        const documentLabel = getDocumentLabel(pendency);
        const action = root.RadarOperationalProjection.getConcreteNextAction({
            pendency,
            school,
            schoolId: pendency.escolaId,
            schoolName: getSchoolName(school),
            schoolDesignation: getSchoolDesignation(school),
            programName,
            documentLabel,
            competence: pendency.competenciaOrigem || pendency.competencia,
            ageDays
        });
        const latestContact = getLatestContact(pendency.id);
        const baseLabel = pendency.status === 'Aguardando reanálise'
            ? 'desde o último envio aguardando conferência'
            : 'desde a abertura';
        const contactLabel = latestContact
            ? ` Último contato em ${new Date(latestContact.at).toLocaleDateString('pt-BR')}.`
            : '';

        return {
            alertKind: pendency.status === 'Aguardando reanálise'
                ? 'awaiting-reanalysis'
                : 'open-pendency',
            schoolId: pendency.escolaId,
            pendencyRef: encodePendencyIdReference(pendency.id),
            type: pendency.status === 'Aguardando reanálise' ? 'info' : 'warning',
            text: `${action.label}. ${getSchoolName(school)} (${getSchoolDesignation(school)} | Controlador: ${getControllerName(school)}). ${ageDays} dias ${baseLabel}.`,
            time: `${programName} · ${documentLabel}.${contactLabel}`.trim(),
            action: () => root.openPendencyDetail(pendency.id)
        };
    }

    function getAlertsEnhanced() {
        const inherited = originalGetAlerts().filter(alert => alert.alertKind !== 'stale-pendency');
        const now = new Date();
        const pendencyAlerts = pendencias
            .map(pendency => createOperationalPendencyAlert(pendency, now))
            .filter(Boolean)
            .sort((left, right) => {
                if (left.type !== right.type) return left.type === 'info' ? -1 : 1;
                return String(left.text).localeCompare(String(right.text), 'pt-BR');
            });
        return [...pendencyAlerts, ...inherited];
    }

    function install() {
        if (installed || !dependenciesReady()) return false;
        originalGetAlerts = root.getAlerts.bind(root);
        root.getAlerts = getAlertsEnhanced;
        root.RadarTask10Alerts = Object.freeze({
            VERSION: '1.0.0',
            getAlerts: getAlertsEnhanced
        });
        installed = true;
        if (typeof root.updateAlertsBell === 'function') root.updateAlertsBell();
        return true;
    }

    if (!install()) {
        const interval = root.setInterval(() => {
            if (install()) root.clearInterval(interval);
        }, 20);
        root.setTimeout(() => root.clearInterval(interval), 10000);
    }
}(window));
