#!/usr/bin/env python3
from pathlib import Path
import argparse


def prepare_tests():
    unit_path = Path('tests/pendencias.test.js')
    unit = unit_path.read_text()
    marker = "test('numera novo envio a partir do maior número legado existente'"
    if marker not in unit:
        unit += r'''

test('numera novo envio a partir do maior número legado existente', () => {
    const source = createOpenPendencyFixture();
    source.tentativas = [
        { id: 'tentativa-1', numero: 1, status: 'analisada' },
        { id: 'tentativa-3', numero: 3, status: 'analisada' }
    ];

    const result = registerCorrectiveSubmission(source, {
        id: 'tentativa-4',
        dataDisponibilizacao: '2026-07-18',
        observacao: 'Nova versão disponível.'
    }, {
        eventId: 'evt-envio-4',
        at: '2026-07-18T12:00:00.000Z',
        usuario: 'Operador de teste',
        perfil: 'controlador'
    });

    assert.equal(result.tentativas.at(-1).numero, 4);
});

test('marca contexto documental estruturado parcial como incompleto', () => {
    const result = normalizePendencyRecord({
        id: 'pendencia-legada-parcial',
        programaId: 'BASIC',
        documentoKey: 'extCC',
        status: 'Aberta',
        motivo: 'Documento ausente'
    });

    assert.equal(result.tipo, 'documental');
    assert.equal(result.contextoIncompleto, true);
});
'''
        unit_path.write_text(unit)

    e2e_path = Path('tests/e2e/pendency-cycle.spec.js')
    e2e = e2e_path.read_text()
    marker = 'não pré-seleciona Documento ausente ao classificar um arquivo como Incorreto'
    if marker not in e2e:
        e2e += r'''

test.describe('abertura automática de pendência documental', () => {
  test('não pré-seleciona Documento ausente ao classificar um arquivo como Incorreto', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chromium', 'Cenário exclusivo do projeto desktop.');

    await page.goto('/');
    await page.evaluate(target => {
      switchProfile('controlador');
      const competencia = activeCompetenciaKey;
      const escola = escolas.find(candidate => (
        Array.isArray(candidate.programasIds)
        && candidate.programasIds.includes(target.programaId)
        && isCompetenceInScope(candidate.competenciaInicial, competencia)
      ));
      if (!escola) throw new Error('Escola determinística não encontrada.');

      const compProgKey = competencia + '_' + target.programaId;
      verificacoes[escola.id] = verificacoes[escola.id] || {};
      verificacoes[escola.id][compProgKey] = RadarFluxoOperacional.createEmptyVerification();
      verificacoes[escola.id][compProgKey].bonificacao[target.documentoKey] = 'Sim';
      persist();
      activeProntuarioCompetencia = competencia;
      switchView('prontuario', escola.id);
      changeAnaliseTecnica(escola.id, compProgKey, target.documentoKey, 'Incorreto');
    }, DOCUMENT_CONTEXT);

    const modal = page.locator('#modal-nova-pendencia');
    await expect(modal).toHaveClass(/show/);
    await expect(modal.locator('input[name="pend-erros"]:checked')).toHaveCount(0);
    await expect(modal.getByLabel('Documento ausente', { exact: true })).not.toBeChecked();
  });
});
'''
        e2e_path.write_text(e2e)


def replace_once(text, old, new, label):
    if text.count(old) != 1:
        raise SystemExit(f'Trecho não encontrado de forma única ({label}).')
    return text.replace(old, new)


def apply_fixes():
    domain_path = Path('src/domain/pendencias.js')
    domain = domain_path.read_text()
    domain = replace_once(
        domain,
        '        next.contextoIncompleto = !documentary;',
        '        next.contextoIncompleto = !hasCompleteStructuredContext(source);',
        'contextoIncompleto'
    )
    domain = replace_once(
        domain,
        '            numero: next.tentativas.length + 1,',
        '            numero: getNextAttemptNumber(next.tentativas),',
        'numeração da tentativa'
    )
    domain_path.write_text(domain)

    app_path = Path('app.js')
    app = app_path.read_text()
    old = (
        "        // Auto seleção de um erro documental compatível com o contexto detectado.\n"
        "        const defaultError = docKey === 'declBBAgil'\n"
        "            ? 'Sem assinatura'\n"
        "            : 'Documento ausente';\n"
        "        const defaultErrorInput = Array.from(document.querySelectorAll('input[name=\"pend-erros\"]'))\n"
        "            .find(input => input.value === defaultError);\n"
        "        if (defaultErrorInput) {\n"
        "            defaultErrorInput.checked = true;\n"
        "            syncAbsentErrorExclusivity(defaultErrorInput);\n"
        "        }\n"
    )
    new = (
        "        // Ao abrir a pendência a partir de uma análise \"Incorreto\",\n"
        "        // nenhum erro é presumido: o Controlador registra apenas as falhas efetivamente observadas.\n"
    )
    app_path.write_text(replace_once(app, old, new, 'pré-seleção de erro'))

    functional_path = Path('tests/e2e/functional-core.spec.js')
    functional = functional_path.read_text()
    old = (
        "    await expect(page.locator('#modal-nova-pendencia')).toHaveClass(/show/);\n"
        "    await page.locator('#form-nova-pendencia button[type=\"submit\"]').click();"
    )
    new = (
        "    const pendencyModal = page.locator('#modal-nova-pendencia');\n"
        "    await expect(pendencyModal).toHaveClass(/show/);\n"
        "    await pendencyModal.getByLabel('Documento ilegível', { exact: true }).check();\n"
        "    await page.locator('#form-nova-pendencia button[type=\"submit\"]').click();"
    )
    functional_path.write_text(replace_once(
        functional, old, new, 'adaptação do fluxo funcional sem erro presumido'
    ))

    config_path = Path('playwright.config.js')
    config = config_path.read_text()
    config = replace_once(
        config,
        "      name: 'mobile-chromium',\n      use: { ...devices['Pixel 7'] }",
        "      name: 'mobile-chromium',\n      testMatch: /mobile-smoke\\.spec\\.js/,\n      use: { ...devices['Pixel 7'] }",
        'escopo mobile chromium'
    )
    config = replace_once(
        config,
        "      name: 'mobile-webkit',\n      use: { ...devices['iPhone 15'] }",
        "      name: 'mobile-webkit',\n      testMatch: /mobile-smoke\\.spec\\.js/,\n      use: { ...devices['iPhone 15'] }",
        'escopo mobile webkit'
    )
    config = replace_once(
        config,
        "      name: 'desktop-chromium',\n      use: { ...devices['Desktop Chrome'] }",
        "      name: 'desktop-chromium',\n      testIgnore: /mobile-smoke\\.spec\\.js/,\n      use: { ...devices['Desktop Chrome'] }",
        'escopo desktop chromium'
    )
    config_path.write_text(config)

    workflow_path = Path('.github/workflows/playwright-mobile.yml')
    workflow = workflow_path.read_text()
    workflow = replace_once(
        workflow,
        'name: Testes mobile Playwright',
        'name: Testes E2E Playwright',
        'nome do workflow E2E'
    )
    workflow = replace_once(
        workflow,
        '    name: Android e iPhone',
        '    name: Desktop, Android e iPhone',
        'nome do job E2E'
    )
    workflow = replace_once(
        workflow,
        '    timeout-minutes: 20',
        '    timeout-minutes: 35',
        'timeout E2E'
    )
    workflow = replace_once(
        workflow,
        '      - name: Executar testes mobile\n        run: npm run test:mobile',
        '      - name: Executar testes E2E completos\n        run: npm run test:e2e',
        'comando E2E completo'
    )
    workflow_path.write_text(workflow)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--prepare-tests', action='store_true')
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    if args.prepare_tests:
        prepare_tests()
    if args.apply:
        apply_fixes()
