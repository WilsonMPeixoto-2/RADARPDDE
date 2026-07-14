const { test, expect } = require('@playwright/test');

test('modo local mantém a infraestrutura Supabase passiva e sem requisições remotas', async ({ page }) => {
    const supabaseRequests = [];
    page.on('request', request => {
        const url = request.url();
        if (/\.supabase\.co\b|\/rest\/v1\b|\/auth\/v1\b/i.test(url)) {
            supabaseRequests.push(url);
        }
    });

    await page.goto('/');
    await page.waitForFunction(() => (
        window.RADAR_PDDE_CONFIG
        && window.RadarRepositoryContract
        && window.RadarLocalStorageRepository
        && window.RadarSupabaseRepository
        && window.RadarRepositoryFactory
        && window.RadarSnapshotTools
        && window.RadarLegacyStateAdapter
        && window.RadarStateBridge
        && window.RadarStatePort
        && window.RadarDataService
        && window.RadarDataContext
        && window.RadarDataContext.ready === true
    ));

    const state = await page.evaluate(() => ({
        dataMode: window.RADAR_PDDE_CONFIG.dataMode,
        activeRepository: window.RADAR_PDDE_CONFIG.activeRepository,
        connectionEnabled: window.RADAR_PDDE_CONFIG.supabase.connectionEnabled,
        supabaseUrl: window.RADAR_PDDE_CONFIG.supabase.url,
        publishableKey: window.RADAR_PDDE_CONFIG.supabase.publishableKey,
        repositoryEnabled: window.RADAR_PDDE_CONFIG.features.supabaseRepositoryEnabled,
        hasLegacyBridge: Object.hasOwn(window.RADAR_PDDE_CONFIG.features, 'legacyAppBridgeEnabled'),
        gatewayReady: window.RadarDataContext.ready,
        gatewayMode: window.RadarDataContext.capabilities.mode,
        waitLoaded: typeof window.waitForRadarPersistence === 'function',
        exportLoaded: typeof window.RadarStateBridge.exportLegacySnapshot === 'function',
        restoreLoaded: typeof window.RadarStateBridge.restoreCanonicalSnapshotToLegacyStorage === 'function'
    }));

    expect(state).toEqual({
        dataMode: 'local',
        activeRepository: 'local',
        connectionEnabled: false,
        supabaseUrl: '',
        publishableKey: '',
        repositoryEnabled: false,
        hasLegacyBridge: false,
        gatewayReady: true,
        gatewayMode: 'local',
        waitLoaded: true,
        exportLoaded: true,
        restoreLoaded: true
    });

    await page.waitForTimeout(300);
    expect(supabaseRequests).toEqual([]);
});

test('estado local real pode ser convertido em snapshot canônico sem registros rejeitados', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => (
        window.RadarStateBridge
        && window.RadarSnapshotTools
        && window.localStorage.getItem('radar_pdde_escolas')
    ));

    const result = await page.evaluate(() => {
        const exported = window.RadarStateBridge.exportLegacySnapshot(
            window.localStorage,
            {
                version: '1',
                importId: 'e2e-local-state',
                exportedAt: '2026-07-13T12:00:00.000Z'
            }
        );
        const validation = window.RadarSnapshotTools.validateSnapshot(exported.snapshot);
        const counts = Object.fromEntries(
            Object.entries(exported.snapshot.entities)
                .map(([entity, records]) => [entity, records.length])
        );
        return {
            validation,
            rejected: exported.rejected,
            warnings: exported.warnings,
            sourceDataVersion: exported.sourceDataVersion,
            counts
        };
    });

    expect(result.validation).toEqual({ ok: true, errors: [] });
    expect(result.rejected).toEqual([]);
    expect(result.warnings).toEqual(expect.any(Array));
    expect(result.sourceDataVersion).toBeTruthy();
    expect(result.counts.schools).toBeGreaterThan(100);
    expect(result.counts.programs).toBeGreaterThan(0);
    expect(result.counts.schoolPrograms).toBeGreaterThanOrEqual(result.counts.schools);
    expect(result.counts.competences).toBeGreaterThanOrEqual(12);
});

test('estado real admite restauração simulada e ida e volta sem divergência funcional', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Reconciliação completa executada uma vez no desktop.');

    await page.goto('/');
    await page.waitForFunction(() => (
        window.RadarStateBridge
        && window.RadarSnapshotTools
        && window.localStorage.getItem('radar_pdde_escolas')
    ));

    const result = await page.evaluate(() => {
        function createMemoryStorage() {
            const values = new Map();
            return {
                getItem(key) {
                    return values.has(key) ? values.get(key) : null;
                },
                setItem(key, value) {
                    values.set(key, String(value));
                },
                removeItem(key) {
                    values.delete(key);
                },
                size() {
                    return values.size;
                }
            };
        }

        const source = window.RadarStateBridge.exportLegacySnapshot(window.localStorage, {
            version: '1',
            importId: 'e2e-roundtrip-source',
            exportedAt: '2026-07-13T12:00:00.000Z'
        });
        const destination = createMemoryStorage();
        const simulation = window.RadarStateBridge.restoreCanonicalSnapshotToLegacyStorage(
            source.snapshot,
            destination,
            { dryRun: true }
        );
        const beforeRestoreSize = destination.size();
        window.RadarStateBridge.restoreCanonicalSnapshotToLegacyStorage(
            source.snapshot,
            destination,
            {
                dataVersion: source.sourceDataVersion || 'e2e-restored',
                pendencySchemaVersion: localStorage.getItem('radar_pdde_pendency_schema_version') || ''
            }
        );
        const target = window.RadarStateBridge.exportLegacySnapshot(destination, {
            version: '1',
            importId: 'e2e-roundtrip-target',
            exportedAt: '2026-07-13T12:00:01.000Z'
        });
        const reconciliation = window.RadarSnapshotTools.reconcileSnapshots(
            source.snapshot,
            target.snapshot
        );

        return {
            simulationWrites: simulation.writes.length,
            beforeRestoreSize,
            afterRestoreSize: destination.size(),
            reconciliation,
            sourceRejected: source.rejected,
            targetRejected: target.rejected
        };
    });

    expect(result.simulationWrites).toBeGreaterThanOrEqual(11);
    expect(result.beforeRestoreSize).toBe(0);
    expect(result.afterRestoreSize).toBeGreaterThanOrEqual(11);
    expect(result.sourceRejected).toEqual([]);
    expect(result.targetRejected).toEqual([]);
    expect(result.reconciliation.ok).toBe(true);
});
