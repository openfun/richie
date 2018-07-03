module.exports = {
  plugins: [
    [
      'react-intl',
      {
        messagesDir: './strings/',
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
