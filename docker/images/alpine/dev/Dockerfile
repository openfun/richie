# The base image we inherit from is richie:alpine, but you can override this by
# passing a build argument to your build command, e.g.:
#
# docker build --build-arg BASE_TAG=${CIRCLE_SHA1}-alpine .
#
ARG BASE_TAG=alpine

FROM richie:${BASE_TAG}

# Switch back to the root user to install development dependencies
USER root:root

# Create statics and media folders as defined in Development settings
RUN mkdir -p /data/{media,static}

# Install curl
RUN apk --no-cache add --update \
        curl \
        gcc \
        musl-dev \
        vim

# Install development dependencies
RUN pip install -e .[dev]

# Install dockerize. It is used to ensure that the database service is accepting
# connections before trying to access it from the main application.
ENV DOCKERIZE_VERSION v0.6.1
RUN curl -sL \
        --output dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
        https://github.com/jwilder/dockerize/releases/download/$DOCKERIZE_VERSION/dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz && \
        tar -C /usr/local/bin -xzvf dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz && \
        rm dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz
