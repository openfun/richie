const SETTINGS = require('./fun_cms/settings.json');
const webpack = require('webpack');

module.exports = {
  entry: "./fun_cms/index.tsx",
  output: {
    filename: "index.js",
    path: __dirname + "/../" + "/data/static/js"
  },

  // Enable sourcemaps for debugging webpack's output.
  devtool: "source-map",

  resolve: {
    // Add '.ts' and '.tsx' as resolvable extensions.
    extensions: [".ts", ".tsx", ".js", ".json"]
  },

  module: {
    rules: [
      // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
      { test: /\.tsx?$/, loader: "awesome-typescript-loader" },
      // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
      { enforce: "pre", test: /\.js$/, loader: "source-map-loader" }
    ]
  },

  plugins: [
    // Only load the locales we need to support in moment.js
    new webpack.ContextReplacementPlugin(
      /moment[\/\\]locale$/,
      new RegExp(SETTINGS.SUPPORTED_LANGUAGES.join('|')),
    ),
  ],
};
