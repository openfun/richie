#!/usr/bin/env bash

# A bug in cookiecutter forces us to delete the not rendered directories first
# as they can't be overidden
rm -Rf .circleci
rm -Rf template

if ! [[ "{{ cookiecutter.organization }}" =~ ^[a-z0-9]+$ ]] ; then
    echo "ERROR: organization should be composed of lower case letters only"
    exit 1
fi
