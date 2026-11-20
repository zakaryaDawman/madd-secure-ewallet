/** Jest setup: run TypeScript tests from the test/ folder. */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
};
