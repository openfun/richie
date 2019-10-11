const webpack = require('webpack');

module.exports = {
  // Disable production-specific optimizations by default
  // They can be re-enabled by running the cli with `--mode=production` or making a separate
  // webpack config for production.
  mode: 'development',

  // chunkFilename must have a unique and different name on each build
  // this will prevent overwriting of existing chunks if backend static storage
  // is on AWS.
  entry: ['./public-path.js', './js/index.tsx'],
  output: {
    filename: 'index.js',
    path: __dirname + '/../richie/static/richie/js',
    chunkFilename: '[id].[hash].index.js',
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
