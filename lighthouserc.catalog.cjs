module.exports = {
  ci: {
    collect: {
      startServerCommand:
        'node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3112',
      startServerReadyPattern: 'Ready',
      numberOfRuns: 3,
      url: [
        'http://127.0.0.1:3112/',
        'http://127.0.0.1:3112/categorie/processeurs',
        'http://127.0.0.1:3112/produit/test-2',
      ],
      settings: {
        formFactor: 'mobile',
        onlyCategories: [
          'performance',
          'accessibility',
          'best-practices',
          'seo',
        ],
        skipAudits: ['uses-http2'],
      },
    },
    upload: { target: 'filesystem', outputDir: 'lighthouse-catalog-reports' },
    assert: {
      assertions: {
        'categories:performance': [
          'error',
          { minScore: 0.9, aggregationMethod: 'median' },
        ],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'largest-contentful-paint': [
          'error',
          { maxNumericValue: 2500, aggregationMethod: 'median' },
        ],
        'cumulative-layout-shift': [
          'error',
          { maxNumericValue: 0.1, aggregationMethod: 'median' },
        ],
        'uses-http2': 'off',
      },
    },
  },
};
