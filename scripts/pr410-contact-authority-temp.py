from pathlib import Path


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: esperado 1 anchor, encontrado {count}')
    return text.replace(old, new, 1)


test_path = Path('tests/unit/school-operational-context-application.test.js')
text = test_path.read_text()
text = replace_once(
    text,
    "    let schoolReader = options.schoolReader || (async () => schoolEnvelope('S1', {}));\n    const applied = [];",
    "    let schoolReader = options.schoolReader || (async () => schoolEnvelope('S1', {}));\n    let schoolContactsReader = options.schoolContactsReader || (async () => []);\n    const applied = [];",
    'test reader'
)
text = replace_once(
    text,
    "        queryOperationalContext: async () => ({ entities: clone(globalEntities) }),\n        querySchoolOperationalContext: async request => schoolReader(request)\n",
    "        queryOperationalContext: async () => ({ entities: clone(globalEntities) }),\n        querySchoolOperationalContext: async request => schoolReader(request),\n        querySchoolContacts: async schoolId => schoolContactsReader(schoolId)\n",
    'test repository contacts'
)
text = replace_once(
    text,
    "        setCurrent: value => { current = clone(value); },\n        setSchoolReader: reader => { schoolReader = reader; }\n",
    "        setCurrent: value => { current = clone(value); },\n        setSchoolReader: reader => { schoolReader = reader; },\n        setSchoolContactsReader: reader => { schoolContactsReader = reader; }\n",
    'test setter'
)
text = replace_once(
    text,
    "    harness.setSchoolReader(async () => schoolEnvelope('S1', {\n",
    "    harness.setSchoolContactsReader(async schoolId => {\n        assert.equal(schoolId, 'S1');\n        return [\n            { id: 'c3', school_id: 'S1', pendency_id: 'p3' },\n            { id: 'cg', school_id: 'S1', pendency_id: null, channel: 'geral' }\n        ];\n    });\n\n    harness.setSchoolReader(async () => schoolEnvelope('S1', {\n",
    'test first authority'
)
test_path.write_text(text)

product_path = Path('src/application/data-service.js')
text = product_path.read_text()
anchor = """            if (envelope?.coverage?.complete !== true || envelope?.fallback) {
                return {
                    schoolId, competenceId, stale: false, applied: false,
                    fallback: cloneValue(envelope?.fallback || { kind: 'global', reason: 'INCOMPLETE_COVERAGE' })
                };
            }

            const current = typeof this.statePort.exportCanonicalEntities === 'function'
"""
replacement = """            if (envelope?.coverage?.complete !== true || envelope?.fallback) {
                return {
                    schoolId, competenceId, stale: false, applied: false,
                    fallback: cloneValue(envelope?.fallback || { kind: 'global', reason: 'INCOMPLETE_COVERAGE' })
                };
            }

            const previousContactIds = new Set(previousCoverage.pendencyContacts || []);
            const incomingContactIds = new Set(
                normalizedRecords(envelope.entities?.pendencyContacts).map(recordId).filter(Boolean)
            );
            const contactAuthorityNeeded = [...previousContactIds].some(id => !incomingContactIds.has(id));
            let authoritativeSchoolContacts = null;
            if (contactAuthorityNeeded) {
                if (typeof this.repository.querySchoolContacts !== 'function') {
                    return {
                        schoolId, competenceId, stale: false, applied: false,
                        fallback: { kind: 'global', reason: 'SCHOOL_CONTACT_AUTHORITY_UNAVAILABLE' }
                    };
                }
                authoritativeSchoolContacts = await this.repository.querySchoolContacts(schoolId);
                if (!canApply()) {
                    return { schoolId, competenceId, stale: true, applied: false };
                }
                if (!Array.isArray(authoritativeSchoolContacts)) {
                    throw new RepositoryError(
                        'INVALID_SCHOOL_CONTACT_CONTEXT',
                        'A autoridade de contatos da escola deve retornar uma coleção.',
                        { operation: 'loadSchoolOperationalContext' }
                    );
                }
                const contactIds = new Set();
                for (const contact of authoritativeSchoolContacts) {
                    const id = recordId(contact);
                    if (!id || contactIds.has(id)
                        || String(contact?.school_id || '').trim() !== schoolId) {
                        throw new RepositoryError(
                            'INVALID_SCHOOL_CONTACT_CONTEXT',
                            'A autoridade de contatos retornou identidade inválida ou outra escola.',
                            { operation: 'loadSchoolOperationalContext' }
                        );
                    }
                    contactIds.add(id);
                }
                authoritativeSchoolContacts = cloneValue(authoritativeSchoolContacts);
            }

            const current = typeof this.statePort.exportCanonicalEntities === 'function'
"""
text = replace_once(text, anchor, replacement, 'product contact authority')
anchor = """            const next = replaceSchoolOperationalSlice(current, envelope, previousCoverage);
            await this.applyRemoteState(
                next, REMOTE_CONTEXT_ENTITIES, options.source || 'remote-school-operational-context'
            );
"""
replacement = """            let next = replaceSchoolOperationalSlice(current, envelope, previousCoverage);
            if (authoritativeSchoolContacts) {
                const otherSchoolContacts = normalizedRecords(next.entities?.pendencyContacts)
                    .filter(contact => String(contact?.school_id || '').trim() !== schoolId);
                next.entities.pendencyContacts = [
                    ...otherSchoolContacts,
                    ...cloneValue(authoritativeSchoolContacts)
                ];
                next = assertSnapshotJson(next, 'replaceSchoolOperationalContacts');
            }
            await this.applyRemoteState(
                next, REMOTE_CONTEXT_ENTITIES, options.source || 'remote-school-operational-context'
            );
"""
text = replace_once(text, anchor, replacement, 'product contact replacement')
product_path.write_text(text)
