// @babel/preset-env: enables the needed JS features based on environment
// @babel/preset-react: enables JSX transformation
// @babel/preset-typescript: enables TypeScript support

module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current',
        },
      },
    ],
    ['@babel/preset-react', { 
      runtime: 'automatic',
    }],
    '@babel/preset-typescript',
  ],
  plugins: [
    ['@babel/plugin-transform-runtime', {
      regenerator: true,
      useESModules: false, // Disable ESM for Jest
    }],
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-optional-chaining',
    '@babel/plugin-proposal-nullish-coalescing-operator',
  ],
};
