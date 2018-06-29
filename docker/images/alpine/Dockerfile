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
FROM python:3.6-alpine as base

# ---- builder image ----
FROM base as back-builder

# Install development libraries required for compiled python dependencies (lxml,
# Pillow and psycopg2)
RUN apk --no-cache add --update \
    # lxml dependencies
    libxml2-dev \
    libxslt-dev \
    # Pillow dependencies
    build-base \
    freetype-dev \
    fribidi-dev \
    harfbuzz-dev \
    jpeg-dev \
    lcms2-dev \
    openjpeg-dev \
    tcl-dev \
    tiff-dev \
    tk-dev \
    zlib-dev \
    # psycopg2 dependencies
    postgresql-dev && \
    rm -rf /var/cache/apk/*

WORKDIR /builder

COPY setup.py setup.cfg MANIFEST.in /builder/
COPY ./src /builder/src/

RUN mkdir /install && \
    pip install --prefix=/install .

# ---- front-end builder image ----
FROM node:9-alpine as front-builder

WORKDIR /app

COPY . /app/

RUN yarn install && \
    yarn build && \
    yarn sass

# ---- final application image ----
FROM base

# Copy installed python dependencies
COPY --from=back-builder /install /usr/local

# Install only (linked) libraries required for compiled python dependencies
# (lxml, Pillow and psycopg2)
RUN apk --no-cache add --update \
    # lxml dependencies
    libxml2 \
    libxslt \
    # Pillow dependencies
    freetype \
    fribidi \
    harfbuzz \
    jpeg \
    lcms2 \
    openjpeg \
    tcl \
    tiff \
    tk \
    zlib \
    # psycopg2 dependencies
    postgresql && \
    rm -rf /var/cache/apk/*

# Copy richie application (see .dockerignore)
COPY . /app/

# Copy front-end dependencies
COPY --from=front-builder /app/sandbox/build /app/sandbox/build
COPY --from=front-builder /app/sandbox/static /app/sandbox/static

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

# The default command runs gunicorn WSGI server
CMD gunicorn -c /usr/local/etc/gunicorn/richie.py richie.wsgi:application

# Un-privileged user running the application
USER 10000
