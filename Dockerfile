# Richie A FUN CMS for Open edX
#
# Nota bene:
#
# this container expects two volumes for statics and media files (that will be
# served by nginx):
#
# * /data/media
# * /data/static
#
# Once mounted, you will need to collect static files via the eponym django
# admin command:
#
#     python sandbox/manage.py collectstatic
#

# ---- base image to inherit from ----
FROM python:3.6-stretch as base

# ---- back-end builder image ----
FROM base as back-builder

WORKDIR /builder

COPY setup.py setup.cfg MANIFEST.in /builder/
COPY ./src /builder/src/

RUN mkdir /install && \
    pip install --prefix=/install .

# ---- front-end builder image ----
FROM node:10 as front-builder

WORKDIR /app

COPY . /app/

RUN yarn install --frozen-lockfile && \
    yarn build && \
    yarn sass

# ---- final application image ----
FROM base

# Install gettext
RUN apt-get update && \
    apt-get install -y \
    gettext && \
    rm -rf /var/lib/apt/lists/*

# Copy installed python dependencies
COPY --from=back-builder /install /usr/local

# Copy richie application (see .dockerignore)
COPY . /app/

# Copy front-end dependencies
COPY --from=front-builder /app/src/richie/static/richie /app/src/richie/static/richie

WORKDIR /app

# Gunicorn
RUN mkdir -p /usr/local/etc/gunicorn
COPY docker/files/usr/local/etc/gunicorn/richie.py /usr/local/etc/gunicorn/richie.py

# Give the "root" group the same permissions as the "root" user on /etc/passwd
# to allow a user belonging to the root group to add new users; typically the
# docker user (see entrypoint).
RUN chmod g=u /etc/passwd

# We wrap commands run in this container by the following entrypoint that
# creates a user on-the-fly with the container user ID (see USER) and root group
# ID.
ENTRYPOINT [ "/app/bin/entrypoint" ]

# The default command runs gunicorn WSGI server in the sandbox
CMD cd sandbox && \
    gunicorn -c /usr/local/etc/gunicorn/richie.py wsgi:application

# Un-privileged user running the application
USER 10000
