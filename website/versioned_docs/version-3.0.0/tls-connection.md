---
id: tls-connection
title: Connecting Richie and OpenEdX over TLS for development
sidebar_label: TLS connection for development
---

## Purpose

By default in the docker compose environment for development, Richie is hosted on `localhost:8070`
and uses a fake LMS backend (`base.BaseLMSBackend`) as you can see if you check the
`RICHIE_LMS_BACKENDS` setting in `env.d/development`.

This base backend uses session storage to fake enrollments to course runs.

If you want to test real enrollments to an OpenEdX instance hosted on an external domain, OpenEdX
will need to generate a CORS CSRF Cookie. This cookie is flagged as secure, which implies that
we are not able to use it without SSL connections.

So if you need to use the OpenEdx API to Create, Update or Delete data from Richie, you have to
enable SSL on Richie and OpenEdx on your development environment, which requires a little bit more 
configuration. Below, we explain how to serve OpenEdx and Richie over SSL.

## Run OpenEdx and Richie on sibling domains

Richie and OpenEdx must be on sibling domains ie domains that both are subdomains of the same
parent domain, because sharing secure Cookies on `localhost` or unrelated domains is blocked.
To do that, you have to edit your hosts file (_.e.g_ `/etc/hosts` on a \*NIX system) to alias a
domain `local.dev` with two subdomains `richie` and `edx` pointing to `localhost`:

```
# /etc/hosts
127.0.0.1 richie.local.dev
127.0.0.1 edx.local.dev
```

Once this has been done, the OpenEdx app should respond on http://edx.local.dev:8073
and Richie should respond on http://richie.local.dev:8070. The Richie application should now be
able to make CORS XHR requests to the OpenEdX application.

## Enable TLS

If you want to develop with OpenEdx as LMS backend of the Richie application (see the
`RICHIE_LMS_BACKENDS` setting), you need to enable TLS for your development servers.
Both Richie and OpenEdx use Nginx as reverse proxy which eases the SSL setup.

### 1. Install mkcert and its Certificate Authority

First you will need to install mkcert and its Certificate Authority.
[mkcert](https://mkcert.org/) is a little util to ease local certificate generation.

#### a. Install `mkcert` on your local machine

- [Read the doc](https://github.com/FiloSottile/mkcert)
- Linux users who do not want to use linuxbrew : [read this article](https://www.prado.lt/how-to-create-locally-trusted-ssl-certificates-in-local-development-environment-on-linux-with-mkcert).

#### b. Install Mkcert Certificate Authority

`mkcert -install`

> If you do not want to use mkcert, you can generate [CA and certificate with openssl](https://www.freecodecamp.org/news/how-to-get-https-working-on-your-local-development-environment-in-5-minutes-7af615770eec/).
> You will have to put your certificate and its key in the `docker/files/etc/nginx/ssl` directory
> and respectively name them `richie.local.dev.pem` and `richie.local.dev.key`.

### 2. On Richie

Then, to setup the SSL configuration with mkcert, run our helper script:

```bash
$ bin/setup-ssl
```

> If you do not want to use mkcert, read the instructions above to generate a Richie certificate,
> and run the helper script with the `--no-cert` option:

```bash
bin/setup-ssl --no-cert
```

### 3. On OpenEdx

In the same way, you also have to enable SSL in OpenEdx, by updating the Nginx configuration.
Read how to [enable SSL on OpenEdx][ssl].

Once this has been done, the OpenEdx app should respond on https://edx.local.dev:8073
and Richie should respond on https://richie.local.dev:8070. The richie application should be able
to share cookies with the OpenEdx application to allow CORS CSRF Protected XHR requests.

### 4. Start Richie and OpenEdx over SSL

Now, the OpenEdx application should respond on https://edx.local.dev:8073, and Richie
on https://richie.local.dev:8070 without browser warning about the certificate validity.

You need to follow these steps once. The next time you want to use SSL, you can run the following
command on both the Richie and OpenEdX projects:

```bash
$ make run-ssl
```

Of course, you can still run apps without ssl by using:

```bash
$ make run
```

[ssl]: https://github.com/openfun/openedx-docker/blob/master/docs/richie-configuration.md#richie-configuration
