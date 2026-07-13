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
    ));

    const state = await page.evaluate(() => ({
        dataMode: window.RADAR_PDDE_CONFIG.dataMode,
        activeRepository: window.RADAR_PDDE_CONFIG.activeRepository,
        connectionEnabled: window.RADAR_PDDE_CONFIG.supabase.connectionEnabled,
        supabaseUrl: window.RADAR_PDDE_CONFIG.supabase.url,
        publishableKey: window.RADAR_PDDE_CONFIG.supabase.publishableKey,
        repositoryEnabled: window.RADAR_PDDE_CONFIG.features.supabaseRepositoryEnabled,
        bridgeEnabled: window.RADAR_PDDE_CONFIG.features.legacyAppBridgeEnabled
    }));

    expect(state).toEqual({
        dataMode: 'local',
        activeRepository: 'local',
        connectionEnabled: false,
        supabaseUrl: '',
        publishableKey: '',
        repositoryEnabled: false,
        bridgeEnabled: false
    });

    await page.waitForTimeout(300);
    expect(supabaseRequests).toEqual([]);
});
