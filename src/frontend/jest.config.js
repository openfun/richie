const path = require('path');

module.exports = {
  moduleDirectories: [path.resolve(__dirname, 'js'), 'node_modules'],
  moduleFileExtensions: ['css', 'js', 'ts', 'tsx'],
  setupFilesAfterEnv: ['<rootDir>/jest/setup.ts'],
  testMatch: [`${__dirname}/js/**/*.spec.+(ts|tsx|js)`],
  testURL: 'https://localhost',
  coverageDirectory: '.coverage',
  testEnvironment: 'jsdom',
  transformIgnorePatterns: ['node_modules/(?!(lodash-es)/)'],
  globals: {
    RICHIE_VERSION: 'test',
  },
};
