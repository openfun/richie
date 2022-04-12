site-factory:
  jobs:
    # Git jobs
    #
    # Check validity of git history
    - lint-git:
        filters:
          tags:
            only: /.*/
    # Check that circleci configuration is updated
    - check-configuration:
        ci_update_options: "${CI-UPDATE-OPTIONS}"
        filters:
          branches:
            ignore: main
    # Lint bash scripts in /bin
    - lint-bash:
        filters:
          tags:
            only: /.*/
