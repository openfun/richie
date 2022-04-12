# Run jobs for the ${SITE} site
${SITE}:
  jobs:
    - no-change:
        name: no-change-${SITE}
        filters:
          tags:
            only: /.*/
