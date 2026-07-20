module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run start',
      startServerReadyPattern: 'Available on:',
      url: ['http://127.0.0.1:4175/'],
      numberOfRuns: 2,
      settings: {
        preset: 'desktop',
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
        onlyCategories: ['performance', 'accessibility', 'best-practices']
      }
    },
    assert: {
      assertions: {
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:performance': ['warn', { minScore: 0.75 }],
        'errors-in-console': 'error',
        'total-byte-weight': ['warn', { maxNumericValue: 2000000 }]
      }
    },
    upload: {
      target: 'filesystem',
      outputDir: 'lighthouse-report'
    }
  }
};
