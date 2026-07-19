const SAVE_OPERATIONS = new Set(['save_controller', 'save_inventory_member']);
const DEACTIVATE_OPERATIONS = new Set(['deactivate_controller', 'deactivate_inventory_member']);
const OPERATIONS = new Set([...SAVE_OPERATIONS, ...DEACTIVATE_OPERATIONS]);
const TEAM_MANAGER_ROLES = new Set(['federal_assistant', 'technical_admin']);

function text(value) {
    return value == null ? '' : String(value).trim();
}

export function normalizeEmail(value) {
    const email = text(value).toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        throw new Error('E-mail institucional inválido.');
    }
    return email;
}

export function isTeamManagerRole(role) {
    return TEAM_MANAGER_ROLES.has(text(role));
}

function administrativeLog(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value) || !text(value.id)) {
        throw new Error('Registro administrativo obrigatório e inválido.');
    }
    return structuredClone(value);
}

function normalizeEntity(value, profileId) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error('Integrante da equipe inválido.');
    }
    const id = text(value.id);
    const name = text(value.name);
    if (!id || !name) throw new Error('Identificador e nome do integrante são obrigatórios.');
    return {
        id,
        name,
        email: normalizeEmail(value.email),
        active: value.active !== false,
        cre_scope: text(value.cre_scope || value.creScope) || '4ª CRE',
        profile_id: profileId
    };
}

export function normalizeTeamCommand(input = {}) {
    const operation = text(input.operation);
    if (!OPERATIONS.has(operation)) throw new Error('Operação de Gestão de Equipe não reconhecida.');
    const log = administrativeLog(input.administrativeLog);

    if (operation === 'save_controller') {
        const entity = normalizeEntity(input.controller, 'controller');
        return {
            operation,
            profileId: 'controller',
            entity: {
                id: entity.id,
                name: entity.name,
                email: entity.email,
                active: entity.active,
                cre_scope: entity.cre_scope
            },
            previousEntity: input.previousController ? structuredClone(input.previousController) : null,
            administrativeLog: log
        };
    }

    if (operation === 'save_inventory_member') {
        const entity = normalizeEntity(input.member, 'inventory');
        return {
            operation,
            profileId: 'inventory',
            entity: {
                id: entity.id,
                name: entity.name,
                email: entity.email,
                active: entity.active,
                cre_scope: entity.cre_scope
            },
            previousEntity: input.previousMember ? structuredClone(input.previousMember) : null,
            administrativeLog: log
        };
    }

    if (operation === 'deactivate_controller') {
        const entityId = text(input.controllerId);
        const fallbackControllerId = text(input.fallbackControllerId);
        if (!entityId) throw new Error('Controlador a desativar é obrigatório.');
        if (!fallbackControllerId || fallbackControllerId === entityId) {
            throw new Error('Controlador substituto ativo é obrigatório.');
        }
        return {
            operation,
            profileId: 'controller',
            entityId,
            fallbackControllerId,
            reassignedCount: Number(input.reassignedCount || 0),
            administrativeLog: log
        };
    }

    const entityId = text(input.memberId);
    if (!entityId) throw new Error('Integrante do Inventário a desativar é obrigatório.');
    return {
        operation,
        profileId: 'inventory',
        entityId,
        administrativeLog: log
    };
}

export function buildInviteMetadata(command) {
    const profileId = text(command?.profileId);
    const entity = command?.entity || {};
    if (!['controller', 'inventory'].includes(profileId) || !text(entity.id) || !text(entity.name)) {
        throw new Error('Comando de convite inválido.');
    }
    return {
        display_name: text(entity.name),
        radar_profile: profileId,
        radar_entity_id: text(entity.id),
        radar_cre_scope: text(entity.cre_scope) || '4ª CRE'
    };
}

export const TEAM_ACCOUNT_OPERATIONS = Object.freeze([...OPERATIONS]);
