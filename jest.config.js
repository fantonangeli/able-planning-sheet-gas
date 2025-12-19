module.exports = {
  testEnvironment: 'node',

  roots: ['<rootDir>/__tests__'],

  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],

  setupFiles: ['<rootDir>/__tests__/__mocks__/gas-api.js'],

  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
  ],

  moduleDirectories: ['node_modules', 'src'],

  clearMocks: true,

  verbose: true,
};
