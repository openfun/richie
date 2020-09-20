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

export const CourseGlimpse: React.FC<CourseGlimpseProps> = ({course, context}) => {
  // Whatever happens in this component
  return <p>The glimpse</p>
}
```

Then, your override needs to provide the same exports, explicitly a named `CourseGlimpseProps` interface and a named `CourseGlimpse` component.

You also need to respect the assumptions made by other components that use your overridden version, if you are not overriding a root component.

For example returning `null` might break a layout if the original component never returned such a value, etc. You also need to make sure to avoid conflict with the parameters accepted by the original component.
