import fs from 'node:fs';

function replaceOnce(path, before, after) {
  const source = fs.readFileSync(path, 'utf8');
  if (!source.includes(before)) throw new Error(`Trecho não encontrado em ${path}`);
  const next = source.replace(before, after);
  if (next === source) throw new Error(`Nenhuma alteração aplicada em ${path}`);
  fs.writeFileSync(path, next);
}

replaceOnce(
  'src/application/data-service.js',
`            const current = await this.repository.exportSnapshot({
                includeEmpty: true,
                ...(requestedEntities ? { entities: requestedEntities } : {})
            });
            assertSnapshotJson(current, 'bootstrap');`,
`            const requestedCompetence = normalizedCompetence(options.competenceId);
            const canPrefetchOperationalContext = capabilities.remote === true
                && !Array.isArray(options.entities)
                && Boolean(requestedCompetence)
                && typeof this.repository.queryOperationalContext === 'function';
            const prefetchedContext = canPrefetchOperationalContext
                ? this.repository.queryOperationalContext({ competenceId: requestedCompetence }).then(
                    value => ({ ok: true, value }),
                    error => ({ ok: false, error })
                )
                : null;
            const current = await this.repository.exportSnapshot({
                includeEmpty: true,
                ...(requestedEntities ? { entities: requestedEntities } : {})
            });
            assertSnapshotJson(current, 'bootstrap');`
);

replaceOnce(
  'src/application/data-service.js',
`                operationalCompetence = resolveOperationalCompetence(current, options.competenceId);
                if (operationalCompetence) {
                    const context = await this.repository.queryOperationalContext({
                        competenceId: operationalCompetence
                    });
                    hydrated = mergeOperationalContext(current, context);
                    this.currentOperationalCompetence = operationalCompetence;
                }`,
`                operationalCompetence = resolveOperationalCompetence(current, options.competenceId);
                if (operationalCompetence) {
                    let context;
                    if (prefetchedContext && operationalCompetence === requestedCompetence) {
                        const prefetched = await prefetchedContext;
                        if (!prefetched.ok) throw prefetched.error;
                        context = prefetched.value;
                    } else {
                        context = await this.repository.queryOperationalContext({
                            competenceId: operationalCompetence
                        });
                    }
                    hydrated = mergeOperationalContext(current, context);
                    this.currentOperationalCompetence = operationalCompetence;
                }`
);

replaceOnce(
  'app.js',
`    const bootstrap = await radarDataService.bootstrap();`,
`    const initialOperationalCompetence = window.RadarCompetencia?.previousCompetenceKeyFromDate?.() || '';
    const bootstrap = await radarDataService.bootstrap(
        initialOperationalCompetence ? { competenceId: initialOperationalCompetence } : {}
    );`
);
