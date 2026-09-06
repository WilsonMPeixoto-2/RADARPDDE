const SAVE_OPERATIONS = new Set(['save_controller', 'save_inventory_member']);
const DEACTIVATE_OPERATIONS = new Set(['deactivate_controller', 'deactivate_inventory_member']);
const OPERATIONS = new Set([...SAVE_OPERATIONS, ...DEACTIVATE_OPERATIONS]);
const TEAM_MANAGER_ROLES = new Set(['federal_assistant', 'technical_admin']);

function text(value) {
    return value == null ? '' : String(value).trim();
}

function rowVersionOf(value) {
    const candidate = Number(value?.rowVersion ?? value?.row_version);
    return Number.isInteger(candidate) && candidate > 0 ? candidate : null;
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

function normalizeEntity(value) {
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
        cre_scope: text(value.cre_scope || value.creScope) || '4ª CRE'
    };
}

function normalizeSaveCommand(input, operation, profileId, entityKey, previousKey) {
    const entity = normalizeEntity(input[entityKey]);
    const previousEntity = input[previousKey] ? structuredClone(input[previousKey]) : null;
    const expectedVersion = previousEntity
        ? (rowVersionOf(previousEntity) || rowVersionOf(input[entityKey]))
        : null;
    if (previousEntity && expectedVersion == null) {
        throw new Error('Versão anterior do integrante é obrigatória para edição concorrente segura.');
    }
    if (expectedVersion != null) entity.row_version = expectedVersion;
    return {
        operation,
        profileId,
        entity,
        previousEntity,
        expectedVersion,
        administrativeLog: administrativeLog(input.administrativeLog)
    };
}

export function normalizeTeamCommand(input = {}) {
    const operation = text(input.operation);
    if (!OPERATIONS.has(operation)) throw new Error('Operação de Gestão de Equipe não reconhecida.');

    if (operation === 'save_controller') {
        return normalizeSaveCommand(
            input,
            operation,
            'controller',
            'controller',
            'previousController'
        );
    }

    if (operation === 'save_inventory_member') {
        return normalizeSaveCommand(
            input,
            operation,
            'inventory',
            'member',
            'previousMember'
        );
    }

    const log = administrativeLog(input.administrativeLog);
    if (operation === 'deactivate_controller') {
        const entityId = text(input.controllerId);
        const fallbackControllerId = text(input.fallbackControllerId) || null;
        const reassignedCount = Number(input.reassignedCount || 0);
        if (!entityId) throw new Error('Controlador a desativar é obrigatório.');
        if (fallbackControllerId || reassignedCount > 0) {
            throw new Error('Transfira todas as escolas antes de desativar o controlador.');
        }
        return {
            operation,
            profileId: 'controller',
            entityId,
            fallbackControllerId,
            reassignedCount,
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
    const operationId = text(command?.administrativeLog?.id);
    return {
        display_name: text(entity.name),
        radar_profile: profileId,
        radar_entity_id: text(entity.id),
        radar_cre_scope: text(entity.cre_scope) || '4ª CRE',
        ...(operationId ? { radar_account_operation_id: operationId } : {})
    };
}

export function canCompensateAmbiguousInvite(user, command) {
    const operationId = text(command?.administrativeLog?.id);
    const profileId = text(command?.profileId);
    const entityId = text(command?.entity?.id);
    const metadata = user?.user_metadata || {};
    if (!operationId || !profileId || !entityId) return false;
    return text(metadata.radar_account_operation_id) === operationId
        && text(metadata.radar_profile) === profileId
        && text(metadata.radar_entity_id) === entityId;
}

export const TEAM_ACCOUNT_OPERATIONS = Object.freeze([...OPERATIONS]);
