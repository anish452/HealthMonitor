/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/coverage/',
    '<rootDir>/.vscode/',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?@?react|@babel|@testing-library|@radix-ui|@hookform|@tanstack|sonner)',
  ],
  moduleDirectories: ['node_modules', 'src'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/_app.{js,jsx,ts,tsx}',
    '!src/**/_document.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/types.ts',
    '!src/pages/_app.tsx',
    '!src/pages/_document.tsx',
  ],
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
  // Add this to handle CSS imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  // Add this to handle TypeScript paths
  modulePaths: ['<rootDir>/src'],
  // Add this to handle modern JavaScript features
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?@?react|@babel|@testing-library|@radix-ui|@hookform|@tanstack|sonner)',
  ],
};
