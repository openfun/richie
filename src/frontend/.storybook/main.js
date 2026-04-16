import { dirname, join } from "path";
import { createRequire } from "module";
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';

const require = createRequire(import.meta.url);

function getAbsolutePath(value) {
  return dirname(require.resolve(join(value, "package.json")));
}

export default {
  stories: ['../stories/**/*.stories.@(js|jsx|ts|tsx)', '../js/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    getAbsolutePath('@storybook/addon-links'),
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
  webpackFinal: async (config, { configType }) => {
    config.resolve.plugins = [new TsconfigPathsPlugin()];
    return config;
  },
  docs: {
    autodocs: false,
  },
};
