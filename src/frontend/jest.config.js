const path = require('path');

module.exports = {
  moduleDirectories: [path.resolve(__dirname, 'js'), 'node_modules'],
  moduleFileExtensions: ['css', 'js', 'ts', 'tsx'],
  moduleNameMapper: {
    '\\.(css)$': '<rootDir>/front/__mocks__/styleMock.js',
  },
  setupFilesAfterEnv: ['./js/testSetup.ts'],
  testMatch: [`${__dirname}/js/**/*.spec.+(ts|tsx|js)`],
  testURL: 'https://localhost',
  coverageDirectory: '.coverage',
  transformIgnorePatterns: ['node_modules/(?!(lodash-es)/)'],
  globals: {
    RICHIE_VERSION: 'test',
  },
};
