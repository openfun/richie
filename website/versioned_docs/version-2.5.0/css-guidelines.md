---
id: css-guidelines
title: CSS Guidelines
sidebar_label: CSS Guidelines
---

The purpose of these CSS guidelines is to make our CSS as easy as possible to maintain, prune and/or modify over time. To that end, they forgo some of the unwanted parts of CSS. They also require the use of a CSS preprocessor (we picked SASS) to be used effortlessly.

Our approach is two-pronged. First, we put every piece of CSS as close as we can to the place it is used in a template or component. Second, we use strict class naming rules that act as a replacement to CSS selector combinations.

## File structuration

Rules should be placed where their purpose is most apparent, and where they are easiest to find.

Generally, this means CSS rules should live as close as possible to the place they are used. For example, the selectors and rules that define the look for a component should live in a `.scss` file in the same folder as the JS file for this component. This goes for templates too. Such files can only contain rules that are __specific to this component/template and this one only__

Only general base rules, utility rules, site layout rules as well as our custom variables should live in the central `app/static/scss` folder.

## Code structuration

In order to understand what classes are about at a glance and avoid collisions, naming conventions must be enforced for classes.

Following the [BEM naming convention](http://getbem.com/introduction/), we will write our classes as follows :

    .block {}
    .block__element {}
    .block--modifier {}

- `.block` represents the higher level of an abstraction or component.
- `.block__element` represents a descendent of .block that helps form .block as a whole.
- `.block--modifier` represents a different state or version of .block.

We use double hyphens and double underscores as delimiters so that names themselves can be hyphen-delimited (e.g. `.site-search__field--full`).

Yes, this notation is ugly. However, it allows our classes to express what they are doing. Both our CSS and our markup become more meaningful. It allows us to easily see what classes are related to others, and how they are related, when we look at the markup.

## Quick pointers

- In general, __do not use IDs__. _They can cause specificity wars and are not supposed to be reusable, and are therefore not very useful._
- Do not nest selectors unnecessarily. _It will increase specificity and affect where else you can use your styles._
- Do not qualify selectors unnecessarily. _It will impact the number of different elements you can apply styles to._
- Comment profusely, _whenever you think the CSS is getting complex or it would not be easy to understand its intent._
- Use !important proactively. _!important is a very useful tool when used proactively to make a state or a very specific rule on a tightly-scoped selector stronger. It is however to be avoided at all costs as an easy solution to specificity issues, reactively._

(Direct) child selectors can sometimes be useful. Please remember that the key selector to determine performance is the rightmost one. i.e. `div > #example` is A LOT more efficient than `#example > div` although it may appear otherwise at first glance. Browsers parse multi part selectors from the right. See [CSS Wizardry](http://csswizardry.com/2011/09/writing-efficient-css-selectors/) for more details.
