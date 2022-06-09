---
id: building-the-frontend
title: Building Richie's frontend in your own project
sidebar_label: Building the frontend
---

Richie offers plenty of opportunities to customize the way it works and make it suit the needs of your own project. Most of these go through Django settings.

Part of Richie is a React frontend however. If you want to change how it works in ways that cannot be changed from the Django settings, you will need to build your own frontend.

## Installing `richie-education`

If you have not already, you should create a directory for the frontend in your project. We recommend you mirror Richie's file structure so it's easier to keep track of the changes you make.

```bash
mkdir -p src/frontend
```

Then, you need to bootstrap your own frontend project in this new directory.

```bash
cd src/frontend
yarn init
```

With each version of Richie, we build and publish an `NPM` package to enable Richie users to build their own Javascript and CSS. You're now ready to install it.

```bash
yarn add richie-education
```

In your `package.json` file, you should see it in the list of dependencies. Also, there's a `node_modules` directory where the package and its dependencies are actually installed.

```json
"dependencies": {
    "richie-education": "1.12.0"
},
```

## Building the Javascript bundle

You are now ready to run your own frontend build. We'll just be using webpack directly.

```bash
yarn webpack --config node_modules/richie-education/webpack.config.js --output-path ./build --richie-dependent-build
```

Here is everything that is happening:

- `yarn webpack` — run the webpack CLI;
- `--config node_modules/richie-education/webpack.config.js` — point webpack to `richie-education`'s webpack config file;
- `--output-path ./build` — make sure we get our output where we need it to be;
- `--richie-dependent-build` — enable some affordances with import paths. We pre-configured Richie's webpack to be able to run it from a dependent project.

You can now run your build to change frontend settings or override frontend components with your own.

## Building the CSS

If you want to change styles in Richie, or add new styles for components & templates you develop yourself, you can run the SASS/CSS build yourself.

Start by creating your own `main` file. The `_` underscore at the beginning is there to prevent sass from auto-compiling the file.

```bash
mkdir -p src/frontend/scss
touch src/frontend/scss/_mains.scss
```

Start by importing Richie's main scss file. If you prefer, you can also directly import any files you want to include — in effect re-doing Richie's `_main.scss` on your own.

```sass
@import "richie-education/scss/main";
```

You are now ready to run the CSS build:

```
cd src/frontend
yarn build-sass
```

This gives you one output CSS file that you can put in the static files directory of your project and use to override Richie's style or add your own parts.
