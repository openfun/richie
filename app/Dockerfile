FROM python:3.6-stretch
WORKDIR /app
ENV LC_ALL C.UTF-8
ENV LANG C.UTF-8

# Add repository to install the connector to postgresql 9.6
# Remove the package lists after installation as a good practice
RUN echo 'deb http://apt.postgresql.org/pub/repos/apt/ stretch-pgdg main' > /etc/apt/sources.list.d/pgdg.list && \
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - && \
    apt-get update && \
    apt-get install -y python3-dev postgresql-server-dev-9.6 && \
    rm -rf /var/lib/apt/lists/*

# Start by adding only the pipfile so that the next layer with all
# Python installs does not change each time our code changes
ADD Pipfile /app/Pipfile
RUN pip install pipenv && \
    pipenv install --dev
