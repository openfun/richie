---
id: lms-connection
title: Connecting Richie with an LMS
sidebar_label: LMS connection
---

`richie` can be connected to one or more Learning Management Systems (LMS) like OpenEdx, Moodle
or Canvas for a seamless experience between browsing the course catalog on `richie` and following
the course itself on the LMS.

In order to connect `richie` with a LMS, there is an API bridge
to synchronize course information and enrollments.

### API bridge

The `APIHandler` utility acts as a proxy that routes queries to the correct LMS backend API,
based on a regex match on the URL of the course.

```python
LMS_BACKENDS=[
    {
        "BACKEND": "richie.apps.courses.lms.edx.TokenEdXLMSBackend",
        "SELECTOR_REGEX": r".*lms-example2.org.*",
        "JS_SELECTOR_REGEX": r".*lms-example2.org.*",
        "BASE_URL": "https://www.lms-example2.org",
        "JS_COURSE_REGEX": r"^.*/course/(?<course_id>[0-9]*)$",
    },
]
```

For information about how to generate an API access on your OpenEdx instance, refer to the
documentation.


## Connecting Richie and OpenEdx over TLS

#### Purpose

About the default configuration, if you check `LMS_BACKEND` settings in `env.d/development` you will
see that we use `base.BaseLMSBackend` as `LMS_BACKEND`.
In fact, this base backend uses session storage to fake enrollment to course runs.

Maybe are you asking why? Because, to make Create/Update/Delete requests from an external domain,
OpenEdx requires the use of a CORS CSRF Cookie. This cookie is flagged as secure, that means we are
not able to use it without a SSL connection.

So if you need to use the OpenEdx API to Create, Update or Delete data from Richie, you have to
enable SSL on Richie and OpenEdx on your development environment. So we need a little bit more 
configuration. Below, we explain how to serve OpenEdx and Richie over SSL.

#### Run OpenEdx and Richie on the same domain

Richie and OpenEdx must be on the same domain to work properly (Cookie security policy blocks
secure cookie sharing on localhost) To do that you have to edit your hosts file 
(_.e.g_ `/etc/hosts` on a \*NIX system) to alias a domain `local.dev` with
two subdomains `richie` and `edx` to localhost:

```
# /etc/hosts
127.0.0.1 richie.local.dev
127.0.0.1 edx.local.dev
```

Once this has been done, the OpenEdx app should respond on http://edx.local.dev:8073
and Richie should respond on http://richie.local.dev:8070 and should be able
to make CORS XHR requests.

#### Enable TLS

If you want to develop with OpenEdx as `LMS_BACKEND` of Richie, you need to enable TLS for your
development servers. Both Richie and OpenEdx use Nginx as reverse proxy that ease the SSL setup.

##### 1. Install mkcert ans its Certificate Authority

First you will need to install mkcert and its Certificate Authority.
[mkcert](https://mkcert.org/) is a little util to ease local certificate generation.

###### a. Install `mkcert` on your local machine

- [Read the doc](https://github.com/FiloSottile/mkcert)
- Linux users who do not want to use linuxbrew : [read this article](https://www.prado.lt/how-to-create-locally-trusted-ssl-certificates-in-local-development-environment-on-linux-with-mkcert).

###### b. Install Mkcert Certificate Authority

`mkcert -install`

> If you do not want to use mkcert, you can generate [CA and certificate with openssl](https://www.freecodecamp.org/news/how-to-get-https-working-on-your-local-development-environment-in-5-minutes-7af615770eec/).
> You will have to put your certificate and its key in `docker/files/etc/nginx/ssl` directory
> and named them `richie.local.dev.pem` and `richie.local.dev.key`.

##### 2. On Richie

To setup SSL conf with mkcert, just run:
`bin/setup-ssl`

> If you do not want to use mkcert, read instructions above to generate Richie certificate then
> run `bin/setup-ssl --no-cert` instead.

##### 3. On OpenEdx

In the same way, about OpenEdx, you also have to update the Nginx configuration to enable SSL.
Read how to [enable SSL on OpenEdx](https://github.com/openfun/openedx-docker#ssl).

Once this has been done, the OpenEdx app should respond on https://edx.local.dev:8073
and Richie should respond on https://richie.local.dev:8070 and should be able
to share cookies with OpenEdx to allow CORS CSRF Protected XHR requests.

##### 4. Start Richie and OpenEdx over SSL

Now, OpenEdx app should respond on https://edx.local.dev:8073, and Richie
on https://richie.local.dev:8070 without browser warning about the certificate validity.

You need to follow these steps once. If you want to use SSL later, just use `make run-ssl` to run
OpenEdx and Richie apps.
Of course, you can still run apps without ssl by using `make run`.
