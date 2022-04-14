#!/usr/bin/env bash

PROJECT_DIRECTORY=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/..
SITES_DIRECTORY="sites"

# Set default active site
RICHIE_SITE="${RICHIE_SITE:-funmooc}"

# console colors
declare -r COLOR_INFO="\033[0;36m"
declare -r COLOR_RESET="\033[0m"

export COLOR_INFO
export COLOR_RESET
export PROJECT_DIRECTORY
export SITES_DIRECTORY
export RICHIE_SITE
