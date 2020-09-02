const fs = require('fs');
const path = require('path');
const webpack = require('webpack');

const argv = require('yargs').argv;

// Specific path resolutions for builds ran by a Richie dependent
const richieDependentModuleResolutions = argv.richieDependentBuild
  ? [
      // Richie dependent node modules
      path.resolve(__dirname, '..'),
      // Richie dependent's own code
      path.resolve(__dirname, '..', '..'),
    ]
  : [];

// Load the settings file if its path was passed as an argument and use its overrides
const overrides = argv.richieSettings
  ? JSON.parse(fs.readFileSync(argv.richieSettings)).overrides
  : {};

const babelCompileDeps = [
  'query-string',
  'react-intl',
  'react-modal',
  'split-on-first',
  'strict-uri-encode',
];

// Get the version from package.json to make it available in the bundle
let version;
// Get it from the dependent's version first (if there is one)
if (argv.richieDependentBuild) {
  version = require(path.resolve(__dirname, '..', '..', 'package.json')).version;
}
// Otherwise get it from Richie itself
else {
  version = require(path.resolve(__dirname, 'package.json')).version;
}

module.exports = {
  // Disable production-specific optimizations by default
  // They can be re-enabled by running the cli with `--mode=production` or making a separate
  // webpack config for production.
  mode: 'development',

  entry: [path.resolve(__dirname, 'public-path.js'), path.resolve(__dirname, 'js', 'index.tsx')],

  output: {
    filename: 'index.js',
    path: __dirname + '/../richie/static/richie/js',
    // `chunkFilename` must have a unique and different name on each build. This will prevent overwriting
    // of existing chunks if backend static storage is on AWS.
    chunkFilename: '[id].[hash].index.js',
  },

  // Enable sourcemaps for debugging webpack's output.
  devtool: 'source-map',

  resolve: {
    // Add '.ts' and '.tsx' as resolvable extensions.
    extensions: ['.ts', '.tsx', '.js', '.json'],
    modules: [
      path.resolve(__dirname, 'js'),
      __dirname,
      'node_modules',
      ...richieDependentModuleResolutions,
    ],
  },

  module: {
    rules: [
      {
        test: new RegExp(`(${babelCompileDeps.join('|')}.*)`),
        use: [
          {
            loader: 'babel-loader',
            options: {
              plugins: [
                ...require('./babel.config').plugins,
                // Some modules (eg. query-string) are not pre-compiled but do not use import/export
                // We need to give webpack
                '@babel/plugin-transform-modules-commonjs',
              ],
              presets: require('./babel.config').presets,
            },
          },
        ],
      },
      {
        exclude: /node_modules/,
        test: new RegExp(`\.(tsx?|jsx?)$`),
        use: [
          {
            loader: 'babel-loader',
            options: require('./babel.config'),
          },
        ],
      },
      // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
      { enforce: 'pre', test: /\.js$/, loader: 'source-map-loader' },
    ],
  },

  plugins: [
    // Use module replacement to override any number of Richie components as defined in the settings
    ...Object.entries(overrides).map(
      (entry) =>
        new webpack.NormalModuleReplacementPlugin(new RegExp(`components\/${entry[0]}$`), entry[1]),
    ),
    // Provide the current running version as a global to our bundle. This is useful for eg. reporting
    // errors when using different versions in the backend and frontend.
    new webpack.DefinePlugin({
      RICHIE_VERSION: `'${version.toString()}'`,
    }),
  ],
};
