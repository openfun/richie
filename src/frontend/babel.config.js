module.exports = {
  plugins: [
    [
      'react-intl',
      {
        messagesDir: './i18n',
      },
    ],
  ],
  presets: [
    [
      '@babel/preset-env',
      {
        forceAllTransforms: true,
        useBuiltIns: 'usage',
        corejs: 3,
      },
    ],
    '@babel/preset-typescript',
    'react',
  ],
};
