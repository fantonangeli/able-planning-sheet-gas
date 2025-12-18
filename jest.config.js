module.exports = {
  testEnvironment: 'node',

  roots: ['<rootDir>/__tests__'],

  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],

  setupFiles: ['<rootDir>/__mocks__/gas-api.js'],

  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
  ],

  coverageThresholds: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },

  moduleDirectories: ['node_modules', 'src'],

  clearMocks: true,

  verbose: true,
};
