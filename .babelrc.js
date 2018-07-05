module.exports = {
  plugins: [
    [
      'react-intl',
      {
        messagesDir: './src/richie-front/i18n',
      },
    ],
  ],
  presets: [
    [
      '@babel/preset-env',
      {
        forceAllTransforms: true,
        useBuiltIns: 'usage',
      },
    ],
    'react',
  ],
};
