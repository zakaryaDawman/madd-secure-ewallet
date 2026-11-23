/** Jest setup: run TypeScript tests from the test/ folder. */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  setupFiles: ['<rootDir>/test/env.ts'],
  setupFilesAfterEnv: ['<rootDir>/test/mailbox.ts'],
  maxWorkers: 1, // test files share one test database, so run them one at a time
};
