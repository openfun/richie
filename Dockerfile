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
FROM python:3.7-stretch as base

# ---- front-end builder image ----
FROM node:10 as front-builder

# FIXME: we should only copy src/frontend, but for now compiling scss files
# requires files from the backend sources
COPY ./src /app/src/

WORKDIR /app/src/frontend

RUN yarn install --frozen-lockfile && \
    yarn build && \
    yarn sass

# ---- back-end builder image ----
FROM base as back-builder

WORKDIR /builder

# Copy distributed application's statics
COPY --from=front-builder /app/src/richie/static/richie /builder/src/richie/static/richie

# Copy required python dependencies
COPY setup.py setup.cfg MANIFEST.in /builder/
COPY ./src/richie /builder/src/richie/

# Upgrade pip to its latest release to speed up dependencies installation
RUN pip install --upgrade pip

RUN mkdir /install && \
    pip install --prefix=/install .

# ---- final application image ----
FROM base

# Install gettext
RUN apt-get update && \
    apt-get install -y \
    gettext && \
    rm -rf /var/lib/apt/lists/*

# Copy installed python dependencies
COPY --from=back-builder /install /usr/local

# Copy runtime-required files
COPY ./sandbox /app/sandbox/
COPY ./bin/entrypoint /app/bin/entrypoint

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
