export default {
  extends: ['stylelint-config-recommended'],
  ignoreFiles: [
    'artifacts/**',
    'dist/**',
    'node_modules/**',
    'vendor/**'
  ],
  rules: {
    // O CSS atual usa camadas cumulativas e overrides deliberados. Estas regras
    // são úteis para refatoração editorial, mas não representam erro de runtime.
    'no-duplicate-selectors': null,
    'no-descending-specificity': null,
    // Deprecações existentes devem ser tratadas em frente própria para não
    // misturar modernização sintática com a introdução do gate de erros.
    'property-no-deprecated': null
  }
};
