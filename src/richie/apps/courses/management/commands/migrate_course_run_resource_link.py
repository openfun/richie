"""Command migrating richie course_runs course_link to joanie uri."""

import logging
from http import HTTPStatus

from django.conf import settings
from django.core.management.base import BaseCommand

import requests
from requests.exceptions import RequestException

from richie.apps.courses.models import CourseRun

logger = logging.getLogger("richie.commands.core.migrate_course_run_course_link")


class Command(BaseCommand):
    """
    Migrate course run course link from edx to joanie uri.
    """

    help = __doc__

    def handle(self, *args, **options):
        """
        Handle the command migrating existing course run with the course link return by joanie.
        """
        joanie_backend = settings.JOANIE_BACKEND
        course_runs_to_update = []
        for course_run in CourseRun.objects.iterator():
            try:
                response = requests.get(
                    f"{joanie_backend['BASE_URL']}/api/v1.0/edx_imports/course-run/",
                    params={"resource_link": course_run.resource_link},
                    headers={
                        "Authorization": f"Bearer {joanie_backend['API_TOKEN']}",
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                    },
                    timeout=5,
                )
            except RequestException as error:
                logger.error(
                    "Failed to migrate course run %s, joanie endpoint returns error %s",
                    course_run.id,
                    error,
                )
                continue

            if response.status_code != HTTPStatus.OK:
                logger.error(
                    "Failed to migrate course run %s, joanie endpoint returns status_code"
                    " %s with message %s",
                    course_run.id,
                    response.status_code,
                    response.text,
                )
                continue

            joanie_course_run = response.json()

            course_run.resource_link = joanie_course_run["uri"]
            course_runs_to_update.append(course_run)

        CourseRun.objects.bulk_update(
            course_runs_to_update, ["resource_link"], batch_size=100
        )
