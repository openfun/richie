#! /usr/bin/sh

if [ $# -ne 2 ]; then
    echo -e "Wrong arguments. Usage: $0 TAG_NAME GITHUB_TOKEN"
    exit 1
fi

CHANGELOG_FILE="CHANGELOG.md"

# Sort tags by date and pick the last one
LAST_TAG_RAW=$1

# Remove 'v' in front of the tag
LAST_TAG="${LAST_TAG_RAW:1}"

# The format is based on [Keep a Changelog] -> 1
# ## [Unreleased]                           -> 2
# ## [Current tag]                          -> 3
# ## [Previous tag]                         -> 4
# If no previous tag, [.*] matches one of the links at the bottom of the file and the result is the same
CHANGELOG_TITLES=$(grep -n "\[.*\]" ${CHANGELOG_FILE})
LINE_BEGIN=$(echo "${CHANGELOG_TITLES}" | cut -d $'\n' -f 3 | cut -d : -f 1)
LINE_END=$(echo "${CHANGELOG_TITLES}" | cut -d $'\n' -f 4 | cut -d : -f 1)

# Remote title at the beginning and newlines at the end
LINE_BEGIN=$((${LINE_BEGIN} + 2))
LINE_END=$((${LINE_END} - 2))

# Get content between computed lines
CONTENT=$(sed -n "${LINE_BEGIN},${LINE_END}p" ${CHANGELOG_FILE})

# Replace " with \" for json formatting
CONTENT=$(sed -E 's/([^\\])"/\1\\\\"/g' <<< ${CONTENT})

# Works for remote repositories using https instead of ssh (it's the case for github's servers)
REMOTE="$(git remote -v | cut -d $'\n' -f 1 | cut -d ' ' -f 1 | cut -d $'\t' -f 2)"
OWNER=$(sed "s/https:\/\/github.com\/\(.*\)\/\(.*\)/\1/" <<< "${REMOTE}")
REPOSITORY=$(sed "s/https:\/\/github.com\/\(.*\)\/\(.*\)/\2/" <<< "${REMOTE}" | cut -d . -f 1)
TOKEN=$2

API_JSON=$(printf "{\
\"tag_name\": \"${LAST_TAG_RAW}\",\
\"target_commitish\": \"master\",\
\"name\": \"${LAST_TAG}\",\
\"body\": \"${CONTENT}%s\",\
\"draft\": false,\
\"prerelease\": true\
}")

# Replace all newlines with literal \n
API_JSON=$(sed -E ':a;N;$!ba;s/\r{0,1}\n/\\n/g' <<< ${API_JSON})

curl \
    -X POST \
    -H "Authorization: token ${TOKEN}" \
    "https://api.github.com/repos/${OWNER}/${REPOSITORY}/releases" \
    -d "${API_JSON}"
