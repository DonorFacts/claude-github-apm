/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true,
        allowJs: true,
      },
    }],
  },
  // Handle ES modules from node_modules
  extensionsToTreatAsEsm: ['.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!(chalk|#ansi-styles|strip-ansi|ansi-regex)/)'
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/__tests__/**',
  ],
  moduleFileExtensions: ['ts', 'js', 'json'],
};