---
id: lms-connection
title: Connecting Richie with one or more LMS
sidebar_label: LMS connection
---

## Connecting Richie to an LMS

Richie can be connected to an LMS in several ways, ranging from SSO to a fully integrated
seamless experience.

As of today, each approach has been implemented for OpenEdX but the same could be done for
other LMSes like Moodle, at the cost of minor adaptations.


### 1. Displaying connection status

OpenEdX can be configured to allow CORS requests. Doing so allows Richie to retrieve a user's
connection status from OpenEdx and display the user's profile information directly on the Richie
site: username, dashboard url, etc.

In this approach, a user visiting your Richie site and trying to signup or login, is sent to the
OpenEdX site for authentication and is redirected back to the Richie site upon successful login.

You can see this in action on https://www.fun-mooc.fr.

We provide detailed instructions on
[how to configure displaying OpenEdX connection status in Richie](displaying-connection-status.md).


### 2. Seamless enrollment

Thanks to OpenEdX's enrollment API, it is possible to let users enroll on course runs without
leaving Richie.

You can see this in action on https://www.fun-mooc.fr.

> This feature requires that Richie and OpenEdX be hosted on sibling domains i.e. domains that
> are both subdomains of the same root domain, e.g. `richie.example.com` and `lms.example.com`.

You should read our guide on [how to use OpenEdX as LMS backend for Richie](lms-backends).


### 3. Synchronizing course runs details

Course runs in Richie can be handled manually, filling all fields via the DjangoCMS front-end
editing interface. But a better way to handle course runs is to synchronize them automatically
from your LMS using the course run synchronization API.

Please refer to our guide on [how to synchronize course runs between Richie and OpenEdx][sync]

### 4. Joanie, the enrollment manager

For more advanced use cases, we have started a new project called [Joanie] which acts as an
enrollment manager for Richie.

Authentication in Joanie is done via JWT Tokens for maximum flexibility and decoupling in
identity management.

The project started early 2021, but over time, Joanie will handle:

- paid enrollments / certification
- micro-credentials
- user dashboard
- cohorts management (academic or B2B)
- multi-LMS catalogs
- time based enrollment


## Development

For development purposes, the docker compose project provided on
[Richie's code repository](https://github.com/openfun/richie) is pre-configured to connect
with an OpenEdx instance started with
[OpenEdx Docker](https://github.com/openfun/openedx-docker), which provides a ready-to-use
docker compose stack of OpenEdx in several flavors. Head over to
[OpenEdx Docker README](https://github.com/openfun/openedx-docker#readme) for instructions on how to bootstrap an OpenEdX instance.

Now, start both the OpenEdX and Richie projects separately with `make run`.

Richie should respond on `http://localhost:8070`, OpenEdx on `http://localhost:8073` and both
apps should be able to communicate with each other via the network bridge defined in
docker compose.

If you want to activate [seamless enrollment](#2-seamless-enrollment) locally for development,
you will need to set up TLS domains for both Richie and OpenEdX. To do this, head over to our
guide on [setting-up TLS connections for Richie and OpenEdX](tls-connection).


[Joanie]: https://github.com/openfun/joanie
[sync]: synchronizing-course-runs
