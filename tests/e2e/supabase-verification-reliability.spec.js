'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const enabled = process.env.RADAR_E2E_SUPABASE_LOCAL === '1';
test.skip(!enabled, 'Exige Supabase local descartável, Auth e persistência reais.');

const fixtures = JSON.parse(fs.readFileSync(
  path.resolve(__dirname, '../../supabase/fixtures/auth-users.json'),
  'utf8'
));
const password = process.env.RADAR_AUTH_FIXTURE_PASSWORD || '';

async function signInController(page) {
  const fixture = fixtures.find(item => item.profileId === 'controller' && item.active);
  if (!fixture) throw new Error('Fixture ativa de Controlador ausente.');
  await page.goto('/');
  await page.locator('#radar-auth-email').fill(fixture.email);
  await page.locator('#radar-auth-password').fill(password);
  await page.locator('#radar-auth-form button[type="submit"]').click();
  await page.waitForFunction(() => (
    window.RadarDataContext?.ready === true
    && window.RadarAuthContext?.authorization?.role === 'controller'
    && Boolean(window.RadarApplicationServices?.verifications)
  ));
}

async function waitForRestoredController(page) {
  await page.waitForFunction(() => (
    window.RadarDataContext?.ready === true
    && window.RadarAuthContext?.authorization?.role === 'controller'
    && Boolean(window.RadarApplicationServices?.verifications)
  ));
}

test.describe.serial('Verificação mensal com persistência real', () => {
  test('bonificação, análise e consolidação sobrevivem a leituras e reloads sucessivos', async ({ page }) => {
    await signInController(page);

    const context = await page.evaluate(async () => {
      const client = window.RadarSessionContext?.service?.client;
      if (!client) throw new Error('Cliente Supabase autenticado ausente.');
      const schoolId = 'ESC-LOCAL';
      const competence = '2026-05';
      const programId = 'BASIC';
      const compKey = `${competence}_${programId}`;
      const verificationId = `${schoolId}::${competence}::${programId}`;

      const clean = window.buildVerificationSnapshot({});
      const write = await client.from('verifications').upsert({
        id: verificationId,
        school_id: schoolId,
        competence_id: competence,
        program_id: programId,
        bonification: clean.bonificacao,
        analysis: clean.analise,
        bonus_result: null,
        payload: {}
      }).select('*').single();
      if (write.error) throw write.error;

      verificacoes[schoolId] = verificacoes[schoolId] || {};
      const local = window.buildVerificationSnapshot({
        bonificacao: write.data.bonification,
        analise: write.data.analysis,
        resultadoBonif: ''
      });
      local.rowVersion = write.data.row_version;
      verificacoes[schoolId][compKey] = local;

      return { schoolId, competence, programId, compKey, verificationId };
    });

    await page.evaluate(async current => {
      await window.RadarApplicationServices.verifications.setBonification({
        schoolId: current.schoolId,
        compKey: current.compKey,
        documentKey: 'extCC',
        value: 'Sim',
        profile: 'controlador'
      });
    }, context);

    const persistedFirstWrite = await page.evaluate(async current => {
      const rows = await window.RadarApplicationServices.data.repository.load('verifications');
      const row = rows.find(item => item.id === current.verificationId);
      return {
        delivery: row?.bonification?.extCC,
        analysis: row?.analysis?.extCC,
        result: row?.bonus_result || null
      };
    }, context);
    expect(persistedFirstWrite).toEqual({
      delivery: 'Sim',
      analysis: 'Não analisado',
      result: null
    });

    const prematureClose = await page.evaluate(async current => {
      try {
        await window.RadarApplicationServices.verifications.closeBonification({
          schoolId: current.schoolId,
          compKey: current.compKey,
          profile: 'controlador'
        });
        return { accepted: true, code: null };
      } catch (error) {
        return { accepted: false, code: error?.code || null };
      }
    }, context);
    expect(prematureClose).toEqual({ accepted: false, code: 'INCOMPLETE_BONIFICATION' });

    await page.reload();
    await waitForRestoredController(page);
    expect(await page.evaluate(current => ({
      delivery: verificacoes[current.schoolId]?.[current.compKey]?.bonificacao?.extCC,
      result: verificacoes[current.schoolId]?.[current.compKey]?.resultadoBonif || ''
    }), context)).toEqual({ delivery: 'Sim', result: '' });

    await page.evaluate(async current => {
      const service = window.RadarApplicationServices.verifications;
      await service.setTechnicalAnalysis({
        schoolId: current.schoolId,
        compKey: current.compKey,
        documentKey: 'extCC',
        value: 'Correto',
        profile: 'controlador'
      });
      await service.setBonification({
        schoolId: current.schoolId,
        compKey: current.compKey,
        documentKey: 'extINV',
        value: 'Sim',
        profile: 'controlador'
      });
      await service.setBonification({
        schoolId: current.schoolId,
        compKey: current.compKey,
        documentKey: 'notaFiscal',
        value: 'Não se aplica',
        profile: 'controlador'
      });
      await service.setBonification({
        schoolId: current.schoolId,
        compKey: current.compKey,
        documentKey: 'declBBAgil',
        value: 'Não se aplica',
        profile: 'controlador'
      });
    }, context);

    const beforeClose = await page.evaluate(async current => {
      const rows = await window.RadarApplicationServices.data.repository.load('verifications');
      const row = rows.find(item => item.id === current.verificationId);
      return {
        bonification: row?.bonification,
        analysis: row?.analysis,
        result: row?.bonus_result || null
      };
    }, context);

    expect(beforeClose.bonification).toMatchObject({
      extCC: 'Sim',
      extINV: 'Sim',
      notaFiscal: 'Não se aplica',
      consAssessoria: 'Não se aplica',
      declBBAgil: 'Não se aplica',
      encampInventario: 'Não se aplica'
    });
    expect(beforeClose.analysis).toMatchObject({
      extCC: 'Correto',
      notaFiscal: 'Correto',
      consAssessoria: 'Correto',
      declBBAgil: 'Correto',
      encampInventario: 'Correto'
    });
    expect(beforeClose.result).toBeNull();

    await page.reload();
    await waitForRestoredController(page);
    expect(await page.evaluate(current => ({
      extCC: verificacoes[current.schoolId]?.[current.compKey]?.analise?.extCC,
      fiscal: verificacoes[current.schoolId]?.[current.compKey]?.bonificacao?.notaFiscal,
      advisory: verificacoes[current.schoolId]?.[current.compKey]?.bonificacao?.consAssessoria,
      inventory: verificacoes[current.schoolId]?.[current.compKey]?.bonificacao?.encampInventario
    }), context)).toEqual({
      extCC: 'Correto',
      fiscal: 'Não se aplica',
      advisory: 'Não se aplica',
      inventory: 'Não se aplica'
    });

    const closed = await page.evaluate(async current => {
      const result = await window.RadarApplicationServices.verifications.closeBonification({
        schoolId: current.schoolId,
        compKey: current.compKey,
        profile: 'controlador'
      });
      return {
        result: result.value.verification.resultadoBonif,
        unchanged: result.value.unchanged === true
      };
    }, context);
    expect(closed).toEqual({ result: 'apta', unchanged: false });

    const persistedClosed = await page.evaluate(async current => {
      const rows = await window.RadarApplicationServices.data.repository.load('verifications');
      const row = rows.find(item => item.id === current.verificationId);
      return {
        result: row?.bonus_result,
        extCC: row?.bonification?.extCC,
        fiscal: row?.bonification?.notaFiscal
      };
    }, context);
    expect(persistedClosed).toEqual({
      result: 'apta',
      extCC: 'Sim',
      fiscal: 'Não se aplica'
    });

    await page.reload();
    await waitForRestoredController(page);
    expect(await page.evaluate(current => {
      const verification = verificacoes[current.schoolId]?.[current.compKey];
      return {
        result: verification?.resultadoBonif,
        evaluation: window.RadarApplicationServices.verifications.getMonthlyEvaluation({
          schoolId: current.schoolId,
          compKey: current.compKey
        })
      };
    }, context)).toMatchObject({
      result: 'apta',
      evaluation: {
        canConsolidate: true,
        bonusResult: 'apta',
        bonificationStatus: 'apta'
      }
    });
  });
});
