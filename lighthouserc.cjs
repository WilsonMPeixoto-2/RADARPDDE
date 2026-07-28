'use strict';

const profile = process.env.LHCI_PROFILE === 'desktop' ? 'desktop' : 'mobile';
const isDesktop = profile === 'desktop';

module.exports = {
    ci: {
        collect: {
            startServerCommand: 'npm run start',
            startServerReadyPattern: 'Available on',
            startServerReadyTimeout: 30000,
            url: ['http://127.0.0.1:4175/'],
            numberOfRuns: 2,
            settings: isDesktop
                ? {
                    preset: 'desktop',
                    onlyCategories: ['performance', 'accessibility', 'best-practices']
                }
                : {
                    formFactor: 'mobile',
                    screenEmulation: {
                        mobile: true,
                        width: 390,
                        height: 844,
                        deviceScaleFactor: 3,
                        disabled: false
                    },
                    onlyCategories: ['performance', 'accessibility', 'best-practices']
                }
        },
        assert: {
            assertions: {
                'categories:performance': ['warn', { minScore: 0.5 }],
                'categories:accessibility': ['warn', { minScore: 0.85 }],
                'categories:best-practices': ['warn', { minScore: 0.8 }]
            }
        },
        upload: {
            target: 'filesystem',
            outputDir: `artifacts/lighthouse/${profile}`
        }
    }
};
