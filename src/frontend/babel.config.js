module.exports = {
  plugins: [
    [
      'react-intl',
      {
        messagesDir: './i18n',
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
    '@babel/preset-typescript',
    'react',
  ],
};
