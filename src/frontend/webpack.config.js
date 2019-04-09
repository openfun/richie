const webpack = require('webpack');

module.exports = {
  // Disable production-specific optimizations by default
  // They can be re-enabled by running the cli with `--mode=production` or making a separate
  // webpack config for production.
  mode: 'development',

  // Currently, @babel/preset-env is unaware that using import() with Webpack relies on Promise internally.
  // Environments which do not have builtin support for Promise, like Internet Explorer, will require both
  // the promise and iterator polyfills be added manually.
  entry: [
    'core-js/modules/es.promise',
    'core-js/modules/es.array.iterator',
    './js/index.tsx',
  ],
  output: {
    filename: 'index.js',
    publicPath: '/static/richie/js/',
    path: __dirname + '/../richie/static/richie/js',
  },

  // Enable sourcemaps for debugging webpack's output.
  devtool: 'source-map',

  resolve: {
    // Add '.ts' and '.tsx' as resolvable extensions.
    extensions: ['.ts', '.tsx', '.js', '.json'],
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              babelrc: true,
            },
          },
        ],
      },
      // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
      { enforce: 'pre', test: /\.js$/, loader: 'source-map-loader' },
    ],
  },
};
