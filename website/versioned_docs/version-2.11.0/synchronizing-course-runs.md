---
id: synchronizing-course-runs
title: Synchronizing course runs between Richie and OpenEdX
sidebar_label: Synchronizing course runs
---

Richie can receive automatic course runs updates on a dedicated API endpoint.

## Configure a shared secret

In order to activate the course run synchronization API endpoint, you first need to configure the
`RICHIE_COURSE_RUN_SYNC_SECRETS` setting with one or more secrets:

```python
RICHIE_COURSE_RUN_SYNC_SECRETS = ["SharedSecret", "OtherSharedSecret"]
```

This setting collects several secrets in order to allow rotating them without any downtime. Any
of the secrets listed in this setting can be used to sign your queries.

Your secret should be shared with the LMS or distant system that needs to synchronize its course
runs with the Richie instance. Richie will try the declared secrets one by one until it finds
one that matches the signature sent by the remote system.

## Configure LMS backends

You then need to configure the LMS handler via the `RICHIE_LMS_BACKENDS` setting as explained
in our [guide on configuring LMS backends](lms-backends#configuring-the-lms-handler). This is
required if you want Richie to create a new course run automatically and associate it with the
right course when the resource link submitted to the course run synchronization API endpoint is
unknown to Richie.

Each course run can be set to react differently to a synchronization request, thanks to the
`sync_mode` field. This field can be set to one of the following values:

+ `manual`: this course run is ignored by the course runs synchronization script. In this case,
    the course run can only be edited manually using the DjangoCMS frontend editing.
+ `sync_to_draft`: only the draft version of this course run is synchronized. A manual
    publication is necessary for the update to be visible on the public site.
+ `sync_to_public`: the public version of this course run is updated by the synchronization
    script. As a results, updates are directly visible on the public site without further
    publication by a staff user in Richie.

A [DEFAULT_COURSE_RUN_SYNC_MODE parameter](lms-backends#default_course_run_sync_mode) in the
`RICHIE_LMS_BACKENDS` setting, defines what default value is used for new course runs.

## Make a synchronization query

You can refer to the [documentation of the course run synchronization API][sync-api] for details
on the query expected by this endpoint.

We also share here our sample code to call this synchronization endpoint from OpenEdX. This code
should run on the `post_publish` signal emitted by the OpenEdX `cms` application each time a
course run is modified and published.

Or you can use the [Richie Open edX Synchronization](https://github.com/fccn/richie-openedx-sync)
which is based on the following code sample and also includes the enrollment count.

Given a `COURSE_HOOK` setting defined as follows in your OpenEdX instance:

```python
COURSE_HOOK = {
    "secret": "SharedSecret",
    "url": "https://richie.example.com/api/v1.0/course-runs-sync/",
}
```

The code for the synchronization function in OpenEdX could look like this:

```python
import hashlib
import hmac
import json

from django.conf import settings

from microsite_configuration import microsite
import requests
from xmodule.modulestore.django import modulestore


def update_course(course_key, *args, **kwargs):
    """Synchronize an OpenEdX course, identified by its course key, with a Richie instance."""
    course = modulestore().get_course(course_key)
    edxapp_domain = microsite.get_value("site_domain", settings.LMS_BASE)

    data = {
        "resource_link": "https://{:s}/courses/{!s}/info".format(
            edxapp_domain, course_key
        ),
        "start": course.start and course.start.isoformat(),
        "end": course.end and course.end.isoformat(),
        "enrollment_start": course.enrollment_start and course.enrollment_start.isoformat(),
        "enrollment_end": course.enrollment_end and course.enrollment_end.isoformat(),
        "languages": [course.language or settings.LANGUAGE_CODE],
    }

    signature = hmac.new(
        setting.COURSE_HOOK["secret"].encode("utf-8"),
        msg=json.dumps(data).encode("utf-8"),
        digestmod=hashlib.sha256,
    ).hexdigest()

    response = requests.post(
        setting.COURSE_HOOK["url"],
        json=data,
        headers={"Authorization": "SIG-HMAC-SHA256 {:s}".format(signature)},
    )
```

Thanks to the signal emitted in OpenEdX, this function can then be triggered each time a course
is modified and published:

```python
from django.dispatch import receiver
from xmodule.modulestore.django import SignalHandler


@receiver(SignalHandler.course_published, dispatch_uid='update_course_on_publish')
def update_course_on_publish(sender, course_key, **kwargs):
    update_course(course_key)
```

[sync-api]: api/course-run-synchronization-api
