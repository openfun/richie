# Installing FUN CMS

This document aims to list all needed steps to have a working `FUN CMS` installation on your laptop.

A better approach is to use [`Docker`](https://docs.docker.com). To get started, you can read [explanations](docs/docker.md) on how `FUN CMS` uses Docker for development.


## Installing a fresh server

### Version

You need a `Ubuntu 16.04 Xenial Xerus` (the latest LTS version) fresh installation.

If you are using another operating system or distribution, you can use [`Vagrant`](https://docs.vagrantup.com/v2/getting-started/index.html) to get a running Ubuntu 16.04 server in seconds.


### System update

Be sure to have fresh packages on the server (kernel, libc, ssl patches...):
post
```sh
sudo apt-get -y update
sudo apt-get -y dist-upgrade
```


## Database part

You must first install `postgresql`.

```sh
// On Linux
sudo apt-get -y install postgresql-9.5

// On OS X
brew install postgresql@9.5
brew services start postgresql@9.5
// don't forget to add your new postgres install to the $PATH
```

`Postgresql` is now running.

Then you can create the database owner and the database itself, using the `postgres` user:

```sh
sudo -u postgres -i // skip this on OS X as the default install will use your local user
createuser funadmin -sP
```

Note: we created the user as a superuser. This should only be done in dev/test environments.

Now, create the database with this user:

```sh
createdb fun_cms -O funadmin -W
exit
```


## Application part

### Python and other requirements

We use `Python 3.5` which is the one installed by default in `Ubuntu 16.04`.

You can install it on OS X using the following commands. Make sure to always run `python3` instead of `python` and `pip3` instead of `pip` to ensure the correct version of Python (your homebrew install of 3) is used.

```
brew install python3
brew postinstall python3
```


### The virtualenv

Place yourself in the application directory `app`:

    cd app


We choose to run our application in a virtual environment and manage our Python dependencies using `pipenv` which you can install with pip:

    pip install pipenv


You can now open a new shell with the virtualenv activated:

    pipenv shell

If packages are not installed:

    pipenv install --dev

The "dev" option installs packages specific to a dev environment and should not be used in production.


### Settings

Settings are defined in different files for each of the following environments:

- dev: settings for development on developpers' local environment,
- ci: settings used on the continuous integration platform,
- staging: settings for deployment to the staging environment,
- preprod: settings for deployment to the pre-production environment,
- prod: settings for deployment to the production environment.

The dev environment is defined as the default environment.

For development, you can add your own settings file named `local.py` to customize settings to your needs. It will be ignored by git.


### Run server

Make sure your database is up-to-date before running the application the first time and after each modification to your models:

    python manage.py migrate

You can now create a superuser account:

    python manage.py createsuperuser

Run the tests

    python manage.py test

You should now be able to start Django and view the site at [localhost:8000](http://localhost:8000)

    python manage.py runserver
