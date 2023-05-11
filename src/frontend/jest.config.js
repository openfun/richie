const path = require('path');

module.exports = {
  moduleDirectories: [path.resolve(__dirname, 'js'), 'node_modules'],
  moduleFileExtensions: ['css', 'js', 'ts', 'tsx'],
  moduleNameMapper: {
    '\\.(css)$': '<rootDir>/front/__mocks__/styleMock.js',
  },
  setupFilesAfterEnv: ['<rootDir>/jest/setup.ts'],
  testMatch: [`${__dirname}/js/**/*.spec.+(ts|tsx|js)`],
  coverageDirectory: '.coverage',
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    url: 'https://localhost',
  },
  resolver: '<rootDir>/jest/resolver.js',
  transformIgnorePatterns: [
    'node_modules/(?!(lodash-es|@hookform/resolvers|query-string|decode-uri-component|split-on-first|filter-obj|@openfun/cunningham-react)/)',
  ],
  globals: {
    RICHIE_VERSION: 'test',
  },
};
