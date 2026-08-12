module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test-utils/jest.setup.ts'],
  testMatch: ['<rootDir>/src/**/*.test.{ts,tsx}'],
  moduleNameMapper: {
    '^@cro/shared$': '<rootDir>/../../packages/shared/src',
    '^@cro/shared/(.*)$': '<rootDir>/../../packages/shared/src/$1',
  },
  transform: {
    '^.+\\.(t|j)sx?$': 'babel-jest',
  },
  collectCoverageFrom: ['src/features/**/*.{ts,tsx}', '!src/**/*.d.ts'],
  coverageDirectory: '<rootDir>/coverage',
};
