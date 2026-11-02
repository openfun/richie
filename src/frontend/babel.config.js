module.exports = {
  plugins: [
    [
      'polyfill-corejs3',
      {
        method: 'usage-global',
        version: require('core-js/package.json').version,
      },
    ],
  ],
  overrides: [
    {
      // Keep compiling richie-education's own messages even when it's used as a dependency (its code then lives under node_modules).
      exclude: /node_modules(?!\/richie-education)/,
      plugins: [
        [
          'formatjs',
          {
            ast: true,
            idInterpolationPattern: '[sha512:contenthash:base64:6]',
          },
        ],
      ],
    },
  ],
  presets: [
    [
      '@babel/preset-env',
      {
        forceAllTransforms: true,
        targets: 'last 1 version, >0.2%, IE 11',
      },
    ],
    [
      '@babel/preset-react',
      {
        runtime: 'automatic',
      },
    ],
    [
      '@babel/preset-typescript',
      {
        onlyRemoveTypeImports: false,
      },
    ],
  ],
};
