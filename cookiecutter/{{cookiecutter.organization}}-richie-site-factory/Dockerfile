ARG NGINX_IMAGE_NAME=fundocker/openshift-nginx
ARG NGINX_IMAGE_TAG=1.13
ARG STATIC_ROOT=/data/static
ARG SITE

# The ID of the user running in the container
ARG DOCKER_USER=10000

# ---- base image to inherit from ----
FROM python:3.11-bookworm as base

# ---- front-end builder image ----
FROM node:20.11 as front-builder

ARG SITE

# Copy frontend app sources
COPY ./sites/${SITE}/src/frontend /builder/src/frontend

WORKDIR /builder/src/frontend

RUN yarn install --frozen-lockfile && \
    yarn compile-translations && \
    yarn build-ts-production && \
    yarn build-sass-production

# ---- back-end builder image ----
FROM base as back-builder

ARG SITE

WORKDIR /builder

# Copy required python dependencies
COPY ./sites/${SITE}/requirements/base.txt /builder/requirements.txt

# Upgrade pip to its latest release to speed up dependencies installation
RUN pip install --upgrade pip

RUN mkdir /install && \
    pip install --prefix=/install -r requirements.txt

# ---- Core application image ----
FROM base as core

ARG SITE

# Install gettext
RUN apt-get update && \
    apt-get install -y \
    gettext && \
    rm -rf /var/lib/apt/lists/*

# Copy installed python dependencies
COPY --from=back-builder /install /usr/local

# Copy runtime-required files
COPY ./sites/${SITE}/src/backend /app/
COPY ./docker/files/usr/local/bin/entrypoint /usr/local/bin/entrypoint

# Copy distributed application's statics
COPY --from=front-builder /builder/src/backend/base/static/richie /app/base/static/richie

WORKDIR /app

# Make sure .mo files are up-to-date
RUN mkdir -p locale && python manage.py compilemessages

# Gunicorn
RUN mkdir -p /usr/local/etc/gunicorn
COPY ./docker/files/usr/local/etc/gunicorn/app.py /usr/local/etc/gunicorn/app.py

# Give the "root" group the same permissions as the "root" user on /etc/passwd
# to allow a user belonging to the root group to add new users; typically the
# docker user (see entrypoint).
RUN chmod g=u /etc/passwd

# We wrap commands run in this container by the following entrypoint that
# creates a user on-the-fly with the container user ID (see USER) and root group
# ID.
ENTRYPOINT [ "/usr/local/bin/entrypoint" ]

# ---- Static files/links collector ----
FROM core as collector

ARG STATIC_ROOT

# Install rdfind
RUN apt-get update && \
    apt-get install -y \
    rdfind && \
    rm -rf /var/lib/apt/lists/*

# Collect static files
RUN python manage.py collectstatic --noinput
# Replace duplicated file by a symlink to decrease the overall size of the
# final image
RUN rdfind -makesymlinks true ${STATIC_ROOT}

# ---- Development image ----
FROM core as development

ARG SITE

# Copy required python dependencies
COPY ./sites/${SITE}/requirements/dev.txt /tmp/requirements.txt

# Install development dependencies
RUN pip install -r /tmp/requirements.txt

# Un-privileged user running the application
ARG DOCKER_USER
USER ${DOCKER_USER}

# Run django development server
CMD python manage.py runserver 0.0.0.0:8000

# ---- Production image ----
FROM core as production

ARG DOCKER_USER
ARG SITE
ARG STATIC_ROOT

ENV SITE=${SITE}

# Copy collected symlinks to static files
COPY --from=collector ${STATIC_ROOT}/staticfiles.json ${STATIC_ROOT}/

# Un-privileged user running the application
USER ${DOCKER_USER}

# The default command runs gunicorn WSGI server in the sandbox
CMD gunicorn -c /usr/local/etc/gunicorn/app.py ${SITE}.wsgi:application

# ---- Nginx ----
FROM ${NGINX_IMAGE_NAME}:${NGINX_IMAGE_TAG} as nginx

ARG STATIC_ROOT

RUN mkdir -p ${STATIC_ROOT}

COPY --from=collector ${STATIC_ROOT} ${STATIC_ROOT}
