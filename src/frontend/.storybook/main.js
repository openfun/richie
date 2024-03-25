import { dirname, join } from "path";

const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
module.exports = {
  stories: ['../stories/**/*.mdx', '../stories/**/*.stories.@(js|jsx|ts|tsx)', '../js/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    getAbsolutePath('@storybook/addon-links'),
    getAbsolutePath('@storybook/addon-essentials'),
    getAbsolutePath('@storybook/addon-interactions'),
    getAbsolutePath('@storybook/addon-webpack5-compiler-babel'),
  ],
  framework: {
    name: getAbsolutePath('@storybook/react-webpack5'),
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
    autodocs: false,
  },
};

function getAbsolutePath(value) {
  return dirname(require.resolve(join(value, "package.json")));
}
