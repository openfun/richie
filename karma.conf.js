let fs = require('fs');
let webpack = require('webpack');
let webpackConfig = require('./webpack.config');

module.exports = function(config) {
  config.set({
    frameworks: ['jasmine'],

    files: ['src/richie-front/**/*.spec.@(ts|tsx)'],

    preprocessors: {
      '**/*.@(ts|tsx)': ['webpack', 'sourcemap'],
    },

    reporters: ['mocha'],

    browsers: ['Chrome'],

    plugins: [
      'karma-chrome-launcher',
      'karma-jasmine',
      'karma-mocha-reporter',
      'karma-sourcemap-loader',
      'karma-webpack',
    ],

    // Absolutely necessary to run typescript tests
    mime: {
      'text/x-typescript': ['ts', 'tsx'],
    },

    webpack: {
      plugins: [
        new webpack.SourceMapDevToolPlugin({
          filename: null, // if no value is provided the sourcemap is inlined
          test: /\.(ts|tsx|js)($|\?)/i, // process .js and .ts files only
        }),
      ],
      // Reuse our existing webpack config
      module: webpackConfig.module,
      resolve: webpackConfig.resolve,
    },

    webpackMiddleware: {
      log: () => {},
      stats: 'errors-only',
    },
  });
};
