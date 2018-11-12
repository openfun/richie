module.exports = {
  globals: {
    'ts-jest': {
      babelConfig: require('./babel.config.js'),
    },
    config: {
      enableDevTools: false,
    },
  },
  moduleFileExtensions: ['css', 'js', 'ts', 'tsx'],
  moduleNameMapper: {
    '\\.(css)$': '<rootDir>/front/__mocks__/styleMock.js',
  },
  testMatch: [`${__dirname}/src/richie-front/js/**/*.spec.+(ts|tsx|js)`],
  testURL: 'https://localhost',
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  transformIgnorePatterns: ['node_modules/(?!(lodash-es)/)'],
  preset: 'ts-jest/presets/default',
};
