'use strict';

module.exports = Object.freeze({
    url: 'http://127.0.0.1:4175/',
    numberOfRuns: 2,
    categories: Object.freeze([
        'performance',
        'accessibility',
        'best-practices'
    ]),
    thresholds: Object.freeze({
        performance: 0.5,
        accessibility: 0.85,
        'best-practices': 0.8
    }),
    profiles: Object.freeze({
        mobile: Object.freeze({ args: Object.freeze([]) }),
        desktop: Object.freeze({ args: Object.freeze(['--preset=desktop']) })
    })
});
