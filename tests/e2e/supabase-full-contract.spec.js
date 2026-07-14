const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const enabled = process.env.RADAR_E2E_SUPABASE_LOCAL === '1';
test.skip(!enabled, 'Exige Supabase local, Auth e RLS reais.');
const fixtures = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../supabase/fixtures/auth-users.json'), 'utf8'));
const password = process.env.RADAR_AUTH_FIXTURE_PASSWORD || '';

async function signInAdmin(page) {
  const admin = fixtures.find(item => item.profileId === 'technical_admin');
  await page.goto('/');
  await page.locator('#radar-auth-email').fill(admin.email);
  await page.locator('#radar-auth-password').fill(password);
  await page.locator('#radar-auth-form button[type="submit"]').click();
  await page.waitForFunction(() => window.RadarDataContext?.ready === true
    && window.RadarAuthContext?.authorization?.role === 'technical_admin');
}

test('contrato integral migra, retoma, reconcilia e reverte contra Supabase local', async ({ page }) => {
  await signInAdmin(page);
  const result = await page.evaluate(async () => {
    const repository = window.RadarApplicationServices.data.repository;
    const before = await repository.exportSnapshot({ includeEmpty: true });
    const fixed = '2032-01-01T00:00:00.000Z';
    const entities = {
      controllers: before.entities.controllers || [],
      inventoryTeamMembers: before.entities.inventoryTeamMembers || [],
      competences: [{ id: '2032-01', label: 'Janeiro 2032', exercise: 2032, starts_on: '2032-01-01', ends_on: '2032-01-31', bonus_deadline: '2032-02-15', closed_at: null, row_version: 1, created_at: fixed, updated_at: fixed }],
      programs: [{ id: 'FULL', name: 'Programa Contrato Integral', description: '', active: true, row_version: 1, created_at: fixed, updated_at: fixed }],
      appConfig: [{ id: 'global', exercises: ['2032'], closing_competence: '2032-01', bonus_deadline_extended: null, settings: {}, row_version: 1, created_at: fixed, updated_at: fixed }],
      schools: [{ id: 'FULL-SCHOOL', designation: '04.99.932', denomination: 'Escola Contrato Integral', phone: '', institutional_mobile: '', email: '', director_name: '', director_phone: '', deputy_director_name: '', deputy_director_phone: '', inep: '', cnpj: '', cre: '4ª CRE', ra: '', sici: '', controller_id: null, inventory_process: '', initial_competence: '2032-01', active: true, row_version: 1, created_at: fixed, updated_at: fixed }],
      schoolPrograms: [{ id: 'FULL-SCHOOL::FULL', school_id: 'FULL-SCHOOL', program_id: 'FULL', active: true, starts_on: null, ends_on: null, row_version: 1, created_at: fixed, updated_at: fixed }],
      verifications: [{ id: 'FULL-V', school_id: 'FULL-SCHOOL', competence_id: '2032-01', program_id: 'FULL', bonification: {}, analysis: { ata: 'Correto' }, bonus_result: 'apta', payload: {}, row_version: 1, created_at: fixed, updated_at: fixed }],
      pendencies: [{ id: 'FULL-P', school_id: 'FULL-SCHOOL', competence_origin: '2032-01', program_id: 'FULL', document_key: 'ata', status: 'Resolvida', responsible_area: '', next_actor: '', reason: '', notes: 'Regularizada', opened_at: fixed, resolved_at: fixed, canceled_at: null, payload: {}, row_version: 1, created_at: fixed, updated_at: fixed }],
      pendencyAttempts: [{ id: 'FULL-A', pendency_id: 'FULL-P', attempt_number: 1, submitted_at: fixed, analyzed_at: fixed, result: 'correto', observation: '', drive_url: '', errors: [], payload: {}, created_by: null, row_version: 1, created_at: fixed, updated_at: fixed }],
      pendencyContacts: [{ id: 'FULL-C', school_id: 'FULL-SCHOOL', pendency_id: 'FULL-P', contact_type: 'E-mail', contact_date: '2032-01-02', description: 'Contato de homologação', official_charge: true, payload: {}, created_by: null, row_version: 1, created_at: fixed, updated_at: fixed }],
      assets: [{ id: 'FULL-ASSET', school_id: 'FULL-SCHOOL', competence_id: '2032-01', description: 'Notebook', expense_type: 'permanente', invoice_number: 'FULL-NF', amount: 2500, status: 'Inventariada', inventory_process: 'PROC-2032', notes: '', payload: {}, inventoried_by_member_id: null, inventoried_at: fixed, row_version: 1, created_at: fixed, updated_at: fixed }],
      registeredInvoices: [{ id: 'FULL-NF', school_id: 'FULL-SCHOOL', competence_id: '2032-01', program_id: 'FULL', verification_id: 'FULL-V', source_context_key: '2032-01_FULL', linked_asset_id: 'FULL-ASSET', description: 'Notebook', expense_type: 'permanente', invoice_number: '2032-1', amount: 2500, payload: {}, registered_at: fixed, row_version: 1, created_at: fixed, updated_at: fixed }],
      administrativeLogs: [{ id: 'FULL-LOG', school_id: 'FULL-SCHOOL', actor_user_id: null, user_identifier: 'homologacao', profile_name: 'technical_admin', action: 'Contrato Integral', details: { task: 10 }, event_at: fixed, created_at: fixed }]
    };
    const snapshot = window.RadarSnapshotTools.createSnapshot(entities, {
      version: 'gate-1', importId: `full-contract-${Date.now()}`, exportedAt: fixed
    });
    const coordinator = new window.RadarImportCoordinator.ImportCoordinator({
      targetRepository: repository,
      checkpointStore: window.RadarImportCoordinator.createMemoryCheckpointStore(),
      batchSize: 3
    });
    let interrupted = false;
    try { await coordinator.import(snapshot, { failAfterBatches: 1 }); }
    catch (error) { interrupted = error.code === 'IMPORT_INTERRUPTED'; }
    const imported = await coordinator.import(snapshot);
    const reconciled = await coordinator.reconcile(snapshot);
    const restored = await coordinator.rollback(snapshot.importId);
    const afterRollback = await repository.exportSnapshot({ includeEmpty: true });
    return {
      interrupted,
      importedStatus: imported.status,
      resumed: imported.resumed,
      reconciliationOk: reconciled.ok,
      rollbackStatus: restored.status,
      originalSchoolIds: (before.entities.schools || []).map(row => row.id).sort(),
      rollbackSchoolIds: (afterRollback.entities.schools || []).map(row => row.id).sort()
    };
  });

  expect(result.interrupted).toBe(true);
  expect(result.importedStatus).toBe('reconciled');
  expect(result.resumed).toBe(true);
  expect(result.reconciliationOk).toBe(true);
  expect(result.rollbackStatus).toBe('rolled_back');
  expect(result.rollbackSchoolIds).toEqual(result.originalSchoolIds);
});
