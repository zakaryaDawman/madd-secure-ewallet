// Runs before every test file: points the server at the separate test database so tests never touch real data.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? 'postgres://madd:madd_dev_only@localhost:5433/madd_test';
process.env.JWT_SECRET ??= 'test-secret';
