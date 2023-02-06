#!/usr/bin/env bash

# to generate the client, execute this command in joanie:
# $ ./bin/update_openapi_schema
openapi --input http://localhost:8071/v1.0/swagger.json --output js/api/joanie/gen --indent='2' --name ApiClientJoanie
