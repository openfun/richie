if [ $# -lt 1 ]; then
    echo -e "Missing parameter. Usage: ./autorelease [github_token]"
    exit 1
fi

CHANGELOG_FILE="CHANGELOG.md"

git fetch --prune --unshallow --tags

# Sort tags by date and pick the last one
LAST_TAG_RAW=$(git for-each-ref --sort=creatordate --format '%(refname:short)' refs/tags | tail -1)

# Remove 'v' in front of the tag
LAST_TAG="${LAST_TAG_RAW:1}"

# Find the tag's corresponding line in the CHANGELOG
LINE_BEGIN=$(grep -n "## \[${LAST_TAG}\]" ${CHANGELOG_FILE} | cut -d : -f 1)

# Start at the first paragraph instead of the title
LINE_BEGIN=$((${LINE_BEGIN} + 2))

# If there is un "Unreleased" title, the 2nd most recent tag is the 3rd title
grep "## [Unreleased]" ${CHANGELOG_FILE}
TAG_NUMBER=2
if [ $? -eq 0 ]; then
    TAG_NUMBER=3
fi

CHANGELOG_TITLES=$(grep -n "## \[" ${CHANGELOG_FILE})
LINE_END=$(echo "${CHANGELOG_TITLES}" | cut -d $'\n' -f ${TAG_NUMBER} | cut -d : -f 1)

if [ -z ${LINE_END} ]; then
    # Only one title, so the changelog goes until the end of the file
    LINE_END=$(($(cat ${CHANGELOG_FILE} | wc -l) + 1))
else
    # Remove next title
    LINE_END=$((${LINE_END} - 2))
fi

# Get content between computed lines
CONTENT=$(sed -n "${LINE_BEGIN},${LINE_END}p" ${CHANGELOG_FILE})

# Replace " with \" for json formatting
CONTENT=$(sed -E 's/([^\\])"/\1\\\\"/g' <<< ${CONTENT})

# Works for remote repositories using https instead of ssh (it's the case for github's servers)
REMOTE="$(git remote -v | cut -d $'\n' -f 1 | cut -d ' ' -f 1 | cut -d $'\t' -f 2)"
OWNER=$(sed "s/https:\/\/github.com\/\(.*\)\/\(.*\)/\1/" <<< "${REMOTE}")
REPOSITORY=$(sed "s/https:\/\/github.com\/\(.*\)\/\(.*\)/\2/" <<< "${REMOTE}" | cut -d . -f 1)
TOKEN=$1

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
