---
id: course-run-synchronization-api
title: Course run synchronization API
sidebar_label: course run sync
---

API endpoint allowing remote systems to synchronize their course runs with a Richie instance.

## Synchronization endpoint [/api/1.0/course-runs-sync]

This documentation describes version "1.0" of this API endpoint.

### Synchronize a course run [POST]

It takes a JSON object containing the course run details:

- resource_link: `https://lms.example.com/courses/course-v1:001+001+001/info` (string, required) -
  url of the course syllabus on the LMS from which a unique course identifier can be extracted
- start: `2018-02-01T06:00:00Z` (string, optional) - ISO 8601 date, when this session of the
  course starts
- end: `2018-02-28T06:00:00Z` (string, optional) - ISO 8601 date, when this session of the course
  ends
- enrollment_start: `2018-01-01T06:00:00Z` (string, optional) - ISO 8601 date, when enrollment
  for this session of the course starts
- enrollment_end: `2018-01-31T06:00:00Z` (string, optional) - ISO 8601 date, when enrollment for
  this session of the course ends
- languages: ['fr', 'en'] (array[string], required) - ISO 639-1 code (2 letters) for the course's
  languages


+ Request (application/json)
    + Headers
        + Authorization: `SIG-HMAC-SHA256 xxxxxxx` (string, required) - Authorization header
            containing the digest of the utf-8 encoded json representation of the submitted data
            for the given secret key and SHA256 digest algorithm (see [synchronizing-course-runs]
            for an example).
    + Body
            ```json
            {
                "resource_link": "https://lms.example.com/courses/course-v1:001+001+001/info",
                "start": "2021-02-01T00:00:00Z",
                "end": "2021-02-31T23:59:59Z",
                "enrollment_start": "2021-01-01T00:00:00Z",
                "enrollment_end": "2021-01-31T23:59:59Z",
                "languages": ["en", "fr"]
            }
            ```

+ Response 200 (application/json)

    + Body
            ```json
            {
                "success": True
            }
            ```
