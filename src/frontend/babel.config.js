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
      exclude: /node_modules/,
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
