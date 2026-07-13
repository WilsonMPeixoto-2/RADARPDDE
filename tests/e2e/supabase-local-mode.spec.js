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
    ));

    const state = await page.evaluate(() => ({
        dataMode: window.RADAR_PDDE_CONFIG.dataMode,
        activeRepository: window.RADAR_PDDE_CONFIG.activeRepository,
        connectionEnabled: window.RADAR_PDDE_CONFIG.supabase.connectionEnabled,
        supabaseUrl: window.RADAR_PDDE_CONFIG.supabase.url,
        publishableKey: window.RADAR_PDDE_CONFIG.supabase.publishableKey,
        repositoryEnabled: window.RADAR_PDDE_CONFIG.features.supabaseRepositoryEnabled,
        bridgeEnabled: window.RADAR_PDDE_CONFIG.features.legacyAppBridgeEnabled,
        legacyAdapterLoaded: typeof window.RadarLegacyStateAdapter.exportLegacySnapshot === 'function'
    }));

    expect(state).toEqual({
        dataMode: 'local',
        activeRepository: 'local',
        connectionEnabled: false,
        supabaseUrl: '',
        publishableKey: '',
        repositoryEnabled: false,
        bridgeEnabled: false,
        legacyAdapterLoaded: true
    });

    await page.waitForTimeout(300);
    expect(supabaseRequests).toEqual([]);
});

test('estado local real pode ser convertido em snapshot canônico sem registros rejeitados', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => (
        window.RadarLegacyStateAdapter
        && window.RadarSnapshotTools
        && window.localStorage.getItem('radar_pdde_escolas')
    ));

    const result = await page.evaluate(() => {
        const exported = window.RadarLegacyStateAdapter.exportLegacySnapshot(
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
    expect(result.counts.competences).toBeGreaterThan(0);
});
