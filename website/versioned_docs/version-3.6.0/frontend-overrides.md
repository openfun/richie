---
id: frontend-overrides
title: Overriding frontend components
sidebar_label: Frontend overrides
---

Once you are able to build the frontend in your project (see previous section), you can override some parts of the frontend with a drop-in replacement you built yourself.

This enables you to customize Richie to your own needs in the same way you could do it with backend templates by overriding templates or blocks which do not suit your needs.

## Defining your overrides

Create a `json` settings files somewhere in your project. You'll use it to declare the overrides for your custom Richie build.

Currently, it is only possible to override components. Richie's build is only set up to handle them.

Inside, create an object with only one key: `"overrides"`. This is an object, whose key-value pairs is the name of a component as a key and the path to the drop-in replacement as the value.

```json
{
  "overrides": {
    "CourseGlimpse": "src/richie/components/CustomCourseGlimpse.tsx"
  }
}
```

## Building a component override

As overrides are supposed to be drop-in replacements, directly processed by the bundler instead of the original file, they need to expose the same API.

For example, if our component to override was the following:

```tsx
export interface CourseGlimpseProps {
  course: Course;
  context: { someProp: string };
}

export const CourseGlimpse: React.FC<CourseGlimpseProps> = ({ course, context }) => {
  // Whatever happens in this component
  return <p>The glimpse</p>;
};
```

Then, your override needs to provide the same exports, explicitly a named `CourseGlimpseProps` interface and a named `CourseGlimpse` component.

You also need to respect the assumptions made by other components that use your overridden version, if you are not overriding a root component.

For example returning `null` might break a layout if the original component never returned such a value, etc. You also need to make sure to avoid conflict with the parameters accepted by the original component.

## Override translation
When you create an application based on richie, you can encounter two cases about translations:
1. You created or overrode a react component and created new translation keys
2. You just want to override a translation in an existing richie component



### Create new translation keys

Once you created your new component with its translation keys, you have to extract them with the following command:
```
  formatjs extract './**/*.ts*' --ignore ./node_modules --ignore './**/*.d.ts' --out-file './i18n/frontend.json --id-interpolation-pattern '[sha512:contenthash:base64:6]' --format crowdin
```

This command extracts all translations defined in your typescript files then generates a `frontend.json` file in `i18n/` directory. This file is like a pot file, this is the base to create your translations in any language you want.

As `--format` option indicates, this command generates a file compatible with crowdin. If you want to customize this command to fit your needs, read the [formatjs/cli documentation](https://formatjs.io/docs/tooling/cli/).

Once translations keys are extracted and your local translations are ready, you need to compile these translations. In fact, the compilation process first aggregates all translation files found from provided paths then merges them with richie translations according their filename and finally generates an output formatted for `react-intl`. Below, here is an example of a compilation command:

```
  node-modules/richie-education/i18n/compile-translations.js ./i18n/locales/*.json
```

This command looks for all translation files in `i18n/locales` directory then merges files found with richie translation files. You can pass several path patterns. You can also use an `--ignore` argument to ignore a particular path.

### Override an existing translation key

As explain above, the compilation process aggregates translations files then **merges them according their filename**. That means if you want override for example the english translation, you just have to create a `en-US.json` file and redefine translation keys used by Richie.

Richie uses one file per language. Currently 4 languages supported:

- English: filename is `en-US.json`
- French: filename is `fr-FR.json`
- Canadian french: filename is `fr-CA.json`
- Spanish: filename is `es-ES.json`


For example, richie uses the translation key `components.UserLogin.logIn` for the Log in button. If you want to change this label for the english translation, you just have to create a translation file `en-US.json` which redefines this translation key:

```json
{
  "components.UserLogin.logIn": {
    "description": "Overriden text for the login button.",
    "message": "Authentication"
  },
}
```

Then, for example if you put your overridden translation in i18n/overrides directory, you have to launch the compilation command below:
```
  node-modules/richie-education/i18n/compile-translations.js ./i18n/overrides/*.json
```

In this way, "_Authentication_" will be displayed as label for login button instead of "_Sign in_".
