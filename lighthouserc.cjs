'use strict';

module.exports = Object.freeze({
    url: 'http://127.0.0.1:4175/',
    numberOfRuns: 2,
    categories: Object.freeze([
        'performance',
        'accessibility',
        'best-practices'
    ]),
    profiles: Object.freeze({
        mobile: Object.freeze({
            args: Object.freeze([]),
            thresholds: Object.freeze({
                performance: 0.5,
                accessibility: 0.85,
                'best-practices': 0.95
            }),
            metricBudgets: Object.freeze({
                'first-contentful-paint': 6000,
                'largest-contentful-paint': 15000,
                'total-blocking-time': 500,
                'cumulative-layout-shift': 0.1
            })
        }),
        desktop: Object.freeze({
            args: Object.freeze(['--preset=desktop']),
            thresholds: Object.freeze({
                performance: 0.75,
                accessibility: 0.95,
                'best-practices': 0.95
            }),
            metricBudgets: Object.freeze({
                'first-contentful-paint': 2000,
                'largest-contentful-paint': 3500,
                'total-blocking-time': 250,
                'cumulative-layout-shift': 0.1
            })
        })
    })
});
