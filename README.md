# Richie, the best OpenSource CMS to build education portals

[![CircleCI](https://circleci.com/gh/openfun/richie/tree/master.svg?style=svg)](https://circleci.com/gh/openfun/richie/tree/master)

## Overview

`Learning Management Systems` (LMS) are great tools for hosting and playing interactive online
courses and MOOCs.

However, if you need to build a complete website with flexible content to aggregate your courses,
in several languages and from different sources, **you will soon need a CMS**.

At "France Université Numérique", we wanted to build an OpenSource portal with `Python` and
`Django`. That's why we built `Richie` on top of [DjangoCMS](https://www.django-cms.org), one of
the best CMS on the market, as a toolbox to easily create full fledged websites with a catalog of
online courses.

Among the features that `Richie` offers out of the box:

- multi-lingual by default,
- advanced access rights and moderation,
- catalog of courses synchronized with one or more `LMS` instances,
- search engine based on `Elasticsearch` and pre-configured to offer full-text queries,
  multi-facetting, auto-complete,...
- flexible custom pages for courses, organizations, categories, teachers, blog posts,
  programs (and their inter-relations),
- Extensible with any third-party `DjangoCMS` plugin or any third-party `Django` application.

## Discover Richie

If you're looking for a quick preview of `Richie`, you can take a look and have a tour of
`Richie` on our dedicated [demo site](https://demo.richie.education).

It is connected back-to-back with a demo of OpenEdX running on
[OpenEdX Docker](https://github.com/openfun/openedx-docker).

Two users are available for testing:

- admin: `admin@example.com`/`admin`
- student: `edx@example.com`/`edx`

The database is regularly flushed.

## Getting started

Take a look at our [documentation](https://richie.education/docs/discover) to get started with Richie.

## Contributing

### [Contributing guide](https://richie.education/docs/contributing-guide)

Read our [contributing guide](https://richie.education/docs/contributing-guide) to learn about our development process and get started developing on `Richie`.

### License

This work is released under the MIT License (see [LICENSE](./LICENSE)).
