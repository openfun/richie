const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
module.exports = {
  stories: [
    '../stories/**/*.stories.mdx',
    '../stories/**/*.stories.@(js|jsx|ts|tsx)',
    '../js/**/*.stories.@(js|jsx|ts|tsx)'
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions'
  ],
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
  staticDirs: [{
    from: './public',
    to: '/static',
  }, {
    from: '../../richie/static',
    to: '/static',
  }, {
    from: '../../richie/apps/core/static',
    to: '/static',
  }, '../../richie/apps/core/templates/richie'],
  webpackFinal: async (config, {
    configType,
  }) => {
    config.resolve.plugins = [new TsconfigPathsPlugin()];
    return config;
  },
  docs: {
    autodocs: true,
  },
};
