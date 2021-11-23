module.exports = {
  plugins: [
    [
      'react-intl',
      {
        ast: true,
        extractFromFormatMessageCall: true,
        idInterpolationPattern: '[sha512:contenthash:base64:6]',
      },
    ],
    ['@babel/plugin-syntax-dynamic-import'],
  ],
  presets: [
    [
      '@babel/preset-env',
      {
        corejs: 3,
        forceAllTransforms: true,
        targets: 'last 1 version, >0.2%, IE 11',
        useBuiltIns: 'usage',
      },
    ],
    [
      '@babel/preset-react',
      {
        runtime: 'automatic',
      },
    ],
    '@babel/preset-typescript',
  ],
};
