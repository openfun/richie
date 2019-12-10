---
id: accessibility-testing
title: Automated accessibility checks
sidebar_label: Accessibility testing
---

Richie includes automated accessibility checks built through a `Cypress` end-to-end testing infrastructure.

Automated accessibility checks can only surface around 30% of possible problems in any given page. This does not mean they are not useful, but they cannot replace human audits and developer proficiency.

We use `axe` to run these checks. You can find more about axe on the [`axe-core` GitHub repository](https://github.com/dequelabs/axe-core).

## Testing environment setup

Both `Cypress` and `axe` are used through their respective NPM packages. This means everything goes through `yarn` commands. You need to have `node` and `yarn` installed locally to run the tests.

```bash
cd tests_e2e
yarn install
```

This should install everything you need.

## Running the tests

There are two way to use the `Cypress` tests: through a terminal-based runner and through the `Cypress` UI. Both are started through `yarn` but they have different use cases.

```bash
yarn cypress run
```

You can start by running the tests directly from the terminal. This is the quickest way to make sure all views pass checks (or find out which ones do not). This is also the starting point for work on running `Cypress` in the CI.

```bash
yarn cypress open
```

This command simply opens the `Cypress` UI. From there, you can run all or some of the test suites with live reloading. This is a great way to understand why some tests are failing, especially when it comes to a11y violations.

When there are a11y violations, an assertion fails and prints out a list in the `Cypress` UI. You can then click on a violation to print more information in the browser console.

## Running through docker

Richie also includes docker configuration and a make command to run the end-to-end tests (and thus the accessibility checks) through docker.

```bash
make test-e2e
```

This will launch the tests using `cypress run`. We do not provide a way to use `cypress open` through docker as this requires dependencies on the host [0]. In our opinion users who need `cypress open` are better off just using `cypress` natively.

## Documentation reference

- [List of all possible violations covered by `axe`](https://dequeuniversity.com/rules/axe/3.4)
- [`Cypress` documentation](https://docs.cypress.io)
- [`axe` and `Cypress` integration](https://github.com/avanslaars/cypress-axe)
- [[0] - running `cypress open` through docker](https://www.cypress.io/blog/2019/05/02/run-cypress-with-a-single-docker-command/#Interactive-mode)
