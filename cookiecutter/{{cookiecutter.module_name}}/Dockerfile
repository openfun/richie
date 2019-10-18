# The ID of the user running in the container
ARG DOCKER_USER=10000

# ---- base image to inherit from ----
FROM python:3.7-stretch as base

# ---- front-end builder image ----
FROM node:10 as front-builder

# Copy frontend app sources
COPY ./src/frontend /builder/src/frontend

WORKDIR /builder/src/frontend

RUN yarn install --frozen-lockfile && \
    yarn sass-production

# ---- back-end builder image ----
FROM base as back-builder

WORKDIR /builder

# Copy required python dependencies
COPY requirements/base.txt /builder/requirements.txt

# Upgrade pip to its latest release to speed up dependencies installation
RUN pip install --upgrade pip

RUN mkdir /install && \
    pip install --prefix=/install -r requirements.txt

# ---- Core application image ----
FROM base as core

# Install gettext
RUN apt-get update && \
    apt-get install -y \
    gettext && \
    rm -rf /var/lib/apt/lists/*

# Copy installed python dependencies
COPY --from=back-builder /install /usr/local

# Copy runtime-required files
COPY ./src/backend /app/
COPY ./docker/files/usr/local/bin/entrypoint /usr/local/bin/entrypoint

# Copy distributed application's statics
COPY --from=front-builder /builder/src/backend/{{cookiecutter.module_name}}/static/richie /app/src/backend/{{cookiecutter.module_name}}/static/richie

WORKDIR /app

# Gunicorn
RUN mkdir -p /usr/local/etc/gunicorn
COPY ./docker/files/usr/local/etc/gunicorn/{{cookiecutter.module_name}}.py /usr/local/etc/gunicorn/{{cookiecutter.module_name}}.py

# Give the "root" group the same permissions as the "root" user on /etc/passwd
# to allow a user belonging to the root group to add new users; typically the
# docker user (see entrypoint).
RUN chmod g=u /etc/passwd

# Un-privileged user running the application
ARG DOCKER_USER
USER ${DOCKER_USER}

# We wrap commands run in this container by the following entrypoint that
# creates a user on-the-fly with the container user ID (see USER) and root group
# ID.
ENTRYPOINT [ "/usr/local/bin/entrypoint" ]

# ---- Development image ----
FROM core as development

# Switch back to the root user to install development dependencies
USER root:root

# Copy required python dependencies
COPY requirements/dev.txt /tmp/requirements.txt

# Install development dependencies
RUN pip install -r /tmp/requirements.txt

# Install dockerize. It is used to ensure that the database service is accepting
# connections before trying to access it from the main application.
ENV DOCKERIZE_VERSION v0.6.1
RUN curl -sL \
    --output dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
    https://github.com/jwilder/dockerize/releases/download/$DOCKERIZE_VERSION/dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz && \
    tar -C /usr/local/bin -xzvf dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz && \
    rm dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz

# Restore the un-privileged user running the application
ARG DOCKER_USER
USER ${DOCKER_USER}

# Run django development server (wrapped by dockerize to ensure the db is ready
# to accept connections before running the development server)
CMD dockerize -wait tcp://db:5432 -timeout 60s \
    python manage.py runserver 0.0.0.0:8000

# ---- Production image ----
FROM core as production

# The default command runs gunicorn WSGI server in the sandbox
CMD gunicorn -c /usr/local/etc/gunicorn/{{cookiecutter.module_name}}.py {{cookiecutter.module_name}}.wsgi:application
