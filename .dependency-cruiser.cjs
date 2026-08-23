'use strict';

module.exports = {
    forbidden: [
        {
            name: 'no-circular',
            severity: 'error',
            comment: 'Ciclos tornam a ordem de inicialização das IIFEs e serviços imprevisível.',
            from: {},
            to: { circular: true }
        },
        {
            name: 'domain-does-not-depend-on-integration',
            severity: 'error',
            comment: 'Domínio permanece independente da camada de integração/UI.',
            from: { path: '^src/domain/' },
            to: { path: '^src/integration/' }
        },
        {
            name: 'production-does-not-depend-on-tests',
            severity: 'error',
            comment: 'Código de produção não pode importar suporte ou fixtures de teste.',
            from: { path: '^src/' },
            to: { path: '^tests/' }
        },
        {
            name: 'no-unresolved-local-dependencies',
            severity: 'error',
            comment: 'Imports/requires locais devem resolver para arquivos existentes.',
            from: { path: '^(src|scripts|supabase/functions)/' },
            to: { couldNotResolve: true, dependencyTypesNot: ['npm', 'npm-dev', 'npm-optional', 'npm-peer'] }
        }
    ],
    options: {
        doNotFollow: { path: 'node_modules' },
        exclude: '(^|/)(dist|coverage|playwright-report|test-results|docs/evidence)/',
        enhancedResolveOptions: {
            extensions: ['.js', '.mjs', '.cjs', '.json']
        },
        reporterOptions: {
            dot: { collapsePattern: 'node_modules/[^/]+' }
        }
    }
};
