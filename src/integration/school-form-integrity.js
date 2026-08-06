(function installRadarSchoolFormIntegrity(root, factory) {
    'use strict';

    const api = factory();
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (root) {
        root.RadarSchoolFormIntegrity = Object.freeze(api);
        if (root.document) api.start(root);
    }
}(typeof window !== 'undefined' ? window : globalThis, function createSchoolFormIntegrityApi() {
    'use strict';

    const FIELD_DEFINITIONS = Object.freeze([
        Object.freeze({ id: 'edit-school-code', label: 'Código institucional', key: 'id' }),
        Object.freeze({ id: 'edit-designation', label: 'Designação', key: 'designation' }),
        Object.freeze({ id: 'edit-denomination', label: 'Denominação', key: 'denomination' }),
        Object.freeze({ id: 'edit-inep', label: 'INEP', key: 'inep' }),
        Object.freeze({ id: 'edit-cnpj', label: 'CNPJ', key: 'cnpj' })
    ]);

    function text(value) {
        return value == null ? '' : String(value).trim();
    }

    function normalizeProfile(value) {
        const normalized = text(value).toLocaleLowerCase('pt-BR').replace(/\s+/g, ' ');
        if (['assistente', 'assistente cre', 'assistente de verbas federais', 'federal_assistant'].includes(normalized)) {
            return 'assistente';
        }
        return normalized;
    }

    function resolveProfile(root) {
        try {
            if (typeof root?.getRadarAccessProfile === 'function') {
                return normalizeProfile(root.getRadarAccessProfile());
            }
        } catch (_error) {
            // Segue para os fallbacks.
        }
        return normalizeProfile(root?.currentProfile || '');
    }

    function resolveSchools(root) {
        try {
            if (typeof escolas !== 'undefined' && Array.isArray(escolas)) return escolas;
        } catch (_error) {
            // Global lexical ainda indisponível.
        }
        return Array.isArray(root?.escolas) ? root.escolas : [];
    }

    function resolveSchoolService(root) {
        try {
            if (typeof radarSchoolService !== 'undefined' && radarSchoolService) return radarSchoolService;
        } catch (_error) {
            // Global lexical ainda indisponível.
        }
        return root?.radarSchoolService || null;
    }

    function createField(documentRef, definition) {
        const group = documentRef.createElement('div');
        group.className = 'form-group';

        const label = documentRef.createElement('label');
        label.htmlFor = definition.id;
        label.textContent = definition.label;

        const input = documentRef.createElement('input');
        input.type = 'text';
        input.className = 'form-control';
        input.id = definition.id;
        input.autocomplete = 'off';
        input.dataset.radarInstitutionalField = definition.key;

        group.append(label, input);
        return group;
    }

    function ensureInstitutionalFields(documentRef) {
        const form = documentRef?.getElementById?.('form-escola-edit');
        if (!form) return null;
        const existing = form.querySelector?.('[data-radar-school-institutional="true"]');
        if (existing) return existing;

        const section = documentRef.createElement('fieldset');
        section.dataset.radarSchoolInstitutional = 'true';
        section.className = 'school-institutional-fields';

        const legend = documentRef.createElement('legend');
        legend.textContent = 'Identificação institucional';
        section.appendChild(legend);

        for (let index = 0; index < FIELD_DEFINITIONS.length; index += 2) {
            const row = documentRef.createElement('div');
            row.className = 'form-row';
            row.appendChild(createField(documentRef, FIELD_DEFINITIONS[index]));
            if (FIELD_DEFINITIONS[index + 1]) {
                row.appendChild(createField(documentRef, FIELD_DEFINITIONS[index + 1]));
            }
            section.appendChild(row);
        }

        const hiddenId = documentRef.getElementById('edit-escola-id');
        if (hiddenId?.nextSibling) form.insertBefore(section, hiddenId.nextSibling);
        else form.prepend(section);
        return section;
    }

    function fieldValue(documentRef, id) {
        return text(documentRef?.getElementById?.(id)?.value);
    }

    function collectInstitutionalInput(documentRef, originalInput = {}) {
        const persistedId = text(originalInput.id);
        return {
            ...originalInput,
            isNewSchool: originalInput.isNewSchool === true || !persistedId,
            id: persistedId || fieldValue(documentRef, 'edit-school-code'),
            designation: fieldValue(documentRef, 'edit-designation'),
            denomination: fieldValue(documentRef, 'edit-denomination'),
            inep: fieldValue(documentRef, 'edit-inep'),
            cnpj: fieldValue(documentRef, 'edit-cnpj'),
            sici: fieldValue(documentRef, 'edit-sici')
        };
    }

    function setField(documentRef, id, value, options = {}) {
        const input = documentRef?.getElementById?.(id);
        if (!input) return;
        input.value = text(value);
        input.required = options.required === true;
        input.readOnly = options.readOnly === true;
        input.setAttribute('aria-required', input.required ? 'true' : 'false');
    }

    function populateInstitutionalFields(root, schoolId) {
        const documentRef = root?.document;
        if (!ensureInstitutionalFields(documentRef)) return false;
        const id = text(schoolId);
        const school = resolveSchools(root).find(item => String(item?.id) === id) || null;
        const isNew = !school;
        const mayEditIdentity = isNew || resolveProfile(root) === 'assistente';

        setField(documentRef, 'edit-school-code', school?.id, {
            required: true,
            readOnly: !isNew
        });
        setField(documentRef, 'edit-designation', school?.designação || school?.designation, {
            required: true,
            readOnly: !mayEditIdentity
        });
        setField(documentRef, 'edit-denomination', school?.denominação || school?.denomination, {
            required: true,
            readOnly: !mayEditIdentity
        });
        setField(documentRef, 'edit-inep', school?.inep, {
            required: true,
            readOnly: !mayEditIdentity
        });
        setField(documentRef, 'edit-cnpj', school?.cnpj, {
            required: true,
            readOnly: !mayEditIdentity
        });
        setField(documentRef, 'edit-sici', school?.sici, {
            required: true,
            readOnly: !mayEditIdentity
        });
        return true;
    }

    function wrapService(root) {
        const service = resolveSchoolService(root);
        if (!service || typeof service.saveSchool !== 'function') return false;
        if (service.__radarInstitutionalInputWrapped === true) return true;

        const original = service.saveSchool.bind(service);
        service.saveSchool = input => original(collectInstitutionalInput(root.document, input));
        Object.defineProperty(service, '__radarInstitutionalInputWrapped', {
            value: true,
            configurable: false,
            enumerable: false,
            writable: false
        });
        return true;
    }

    function wrapModal(root) {
        if (root.__radarSchoolModalIntegrityWrapped === true) return true;
        if (typeof root.openEscolaEditModal !== 'function') return false;

        const original = root.openEscolaEditModal.bind(root);
        const wrapped = function openSchoolModalWithInstitutionalData(schoolId) {
            ensureInstitutionalFields(root.document);
            const result = original(schoolId);
            populateInstitutionalFields(root, schoolId);
            return result;
        };
        root.openEscolaEditModal = wrapped;
        try { openEscolaEditModal = wrapped; } catch (_error) { /* global lexical fallback */ }
        root.__radarSchoolModalIntegrityWrapped = true;
        return true;
    }

    function install(root) {
        if (!root?.document) return false;
        const fieldsReady = Boolean(ensureInstitutionalFields(root.document));
        const serviceReady = wrapService(root);
        const modalReady = wrapModal(root);
        const installed = fieldsReady && serviceReady && modalReady;
        if (installed) root.__radarSchoolFormIntegrityInstalled = true;
        return installed;
    }

    function start(root) {
        if (install(root)) return true;
        let attempts = 0;
        const retry = () => {
            attempts += 1;
            if (install(root) || attempts >= 120) {
                if (timer) root.clearInterval?.(timer);
            }
        };
        const timer = root.setInterval?.(retry, 50) || null;
        root.document.addEventListener?.('DOMContentLoaded', retry, { once: true });
        root.addEventListener?.('load', retry, { once: true });
        return false;
    }

    return Object.freeze({
        FIELD_DEFINITIONS,
        collectInstitutionalInput,
        ensureInstitutionalFields,
        install,
        normalizeProfile,
        populateInstitutionalFields,
        start
    });
}));
