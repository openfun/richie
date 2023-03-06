#!/usr/bin/env bash
openapi --input http://localhost:8071/v1.0/swagger/?format=openapi --output js/api/joanie/gen --indent='2' --name ApiClientJoanie
