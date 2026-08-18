---
id: native-installation
title: Installing Richie on your machine
sidebar_label: Native installation
---

This document aims to list all needed steps to have a working `Richie`
installation on your laptop.

A better approach is to use [`Docker`](https://docs.docker.com) as explained in
our guide for [container-native installation](installation.md) instructions.

## Installing a fresh server

### Version

You need a `Ubuntu 18.04 Bionic Beaver` (the latest LTS version) fresh
installation.

If you are using another operating system or distribution, you can use
[`Vagrant`](https://docs.vagrantup.com/v2/getting-started/index.html) to get a
running Ubuntu 18.04 server in seconds.

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
sudo apt-get -y install postgresql

// On OS X
brew install postgresql@10
brew services start postgresql@10
// don't forget to add your new postgres install to the $PATH
```

`Postgresql` is now running.

Then you can create the database owner and the database itself, using the
`postgres` user:

```sh
sudo -u postgres -i // skip this on OS X as the default install will use your local user
createuser fun -sP
```

Note: we created the user as a superuser. This should only be done in dev/test
environments.

Now, create the database with this user:

```sh
createdb richie -O fun -W
exit
```

## Elasticsearch

### Ubuntu

Download and install the Public Signing Key

```bash
    $ wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | sudo apt-key add -
```

You may need to install the apt-transport-https package on Debian before
proceeding:

```bash
    $ sudo apt-get install apt-transport-https
```

Save the repository definition to /etc/apt/sources.list.d/elastic-6.3.1.list:

```bash
    $ echo "deb https://artifacts.elastic.co/packages/6.3.1/apt stable main" | sudo tee -a /etc/apt/sources.list.d/elastic-6.3.1.list
```

Update repository and install

```bash
    $ sudo apt-get update
    $ sudo apt-get install elasticsearch
    $ sudo /etc/init.d/elasticsearch start
```

### OS X

```bash
    $ brew install elasticsearch
```

## Application part

### Python and other requirements

We use `Python 3.6` which is the one installed by default in `Ubuntu 18.04`.

You can install it on OS X using the following commands. Make sure to always run
`python3` instead of `python` and `pip3` instead of `pip` to ensure the correct
version of Python (your homebrew install of 3) is used.

```bash
    brew install python3
    brew postinstall python3
```

### The virtualenv

Place yourself in the application directory `app`:

```bash
    cd app
```

We choose to run our application in a virtual environment.

For this, we'll install `virtualenvwrapper` and add an environment:

```bash
    pip install virtualenvwrapper
```

You can open a new shell to activate the virtualenvwrapper commands, or simply
do:

```bash
    source $(which virtualenvwrapper.sh)
```

Then create the virtual environment for `richie`:

```bash
    mkvirtualenv richie --no-site-packages --python=python3
```

The virtualenv should now be activated and you can install the Python
dependencies for development:

```bash
    pip install -e .[dev]
```

The "dev.txt" requirement file installs packages specific to a dev environment
and should not be used in production.

### Frontend build

This project is a hybrid that uses both Django generated pages and frontend JS
code. As such, it includes a frontend build process that comes in two parts: JS
& CSS.

We need NPM to install the dependencies and run the build, which depends on a
version of Nodejs specified in package.json under `volta` property. See [the
Volta website](https://volta.sh/) for instructions on how to install Volta.
Once Volta is installed, it will automatically install the correct version of
Nodejs and Yarn specified in package.json under `volta` property.

As a prerequisite to running the frontend build for either JS or CSS, you'll
need to [install yarn](https://yarnpkg.com/lang/en/docs/install/) and download
dependencies _via_:

```bash
    yarn install
```

- JS build

```bash
    yarn run build
```

- CSS build

This will compile all our SCSS files into one bundle and put it in the static
folder we're serving.

```bash
    yarn run sass
```

### Run server

Make sure your database is up-to-date before running the application the first
time and after each modification to your models:

```bash
    python sandbox/manage.py migrate
```

You can create a superuser account:

```bash
    python sandbox/manage.py createsuperuser
```

Run the tests

```bash
    python sandbox/manage.py test
```

You should now be able to start Django and view the site at
[localhost:8000](http://localhost:8000)

```bash
    python sandbox/manage.py runserver
```
