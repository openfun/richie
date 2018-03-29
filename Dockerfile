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
#     python ./manage.py collectstatic
#

# ---- base image to inherit from ----
FROM python:3.6-stretch as base

# ---- builder image ----
FROM base as builder

WORKDIR /install

COPY requirements/base.txt /requirements.txt

RUN pip install --prefix=/install -r /requirements.txt

# ---- final application image ----
FROM base

# Copy installed python dependencies
COPY --from=builder /install /usr/local

# Copy richie application (see .dockerignore)
COPY . /app/

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
