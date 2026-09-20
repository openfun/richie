---
id: enrollment-awareness-rules
title: Making the enrollment call to action aware of the course run
sidebar_label: Enrollment awareness rules
---

The enrollment call to action (CTA) displayed on a course page says "Enroll now", or
"Log in to enroll" for anonymous users, whatever the course run. Often, the enrollment step
needs to say something more depending on the business context of the course run: a course is
free, a certificate is sold separately, the course is hosted on another platform and enrolling
takes the user out of the site, etc.

Rather than hardcoding these cases, Richie lets you declare **enrollment awareness rules**:
each rule has a condition on the course run and an effect on the CTA. Adding a new business
need is adding a rule in your settings, no code change needed.

## Configuration

Rules are declared with the `RICHIE_ENROLLMENT_AWARENESS_RULES` setting:

```python
from django.utils.translation import gettext_lazy as _

RICHIE_ENROLLMENT_AWARENESS_RULES = [
    {
        "id": "free-course",
        "when": {"offer": ["free"]},
        "cta": {
            "enroll": _("Enroll now for free"),
            "login": _("Log in to enroll for free"),
        },
    },
    {
        "id": "external-platform",
        "when": {"is_external": True},
        "cta": {"enroll": _("Enroll on the partner platform")},
        "message": {
            "variant": "warning",
            "text": _("This course runs on another platform. Enrolling will take you out of this site."),
        },
    },
    {
        "id": "paid-certificate",
        "when": {"certificate_offer": ["paid"]},
        "message": {
            "variant": "info",
            "text": _("The course is free. A certificate is available for a fee."),
        },
    },
]
```

Each rule is a dictionary with the following keys:

### id

A unique string identifying the rule. It is used as a key when rendering the messages.

### when

A dictionary of conditions on the course run. **All** the conditions of a rule must match for
the rule to apply. The available conditions are:

| Condition           | Type    | Matches when                                                        |
| ------------------- | ------- | ------------------------------------------------------------------- |
| `offer`             | list    | the course run `offer` is one of the values                         |
| `certificate_offer` | list    | the course run `certificate_offer` is one of the values             |
| `languages`         | list    | at least one of the course run languages is in the values           |
| `is_external`       | boolean | the course run is (`True`) or is not (`False`) hosted outside of the configured `RICHIE_LMS_BACKENDS` |

A course run is considered external when its `resource_link` matches none of the
`JS_COURSE_REGEX` of the configured LMS backends: Richie then renders a plain link to the
resource instead of the enrollment button.

Unknown conditions are rejected with an `ImproperlyConfigured` error.

### cta (optional)

A dictionary with the labels replacing the default ones on the CTA:

- `enroll`: replaces "Enroll now",
- `login`: replaces "Log in to enroll", shown to anonymous users.

### message (optional)

A message displayed next to the CTA, as a dictionary with:

- `variant`: `info` or `warning`. Warnings are announced to assistive technologies,
- `text`: the message.

A rule must define at least a `cta` or a `message`.

## Evaluation

Rules are evaluated in the order they are declared, against each course run rendered on the
course page:

- the messages of **all** the matching rules are displayed, in order,
- for each CTA label, the **first** matching rule defining it wins.

Labels and texts can be lazy translation strings: they are rendered in the language of the
current request.

## Styling

Messages are rendered as a list with the `enrollment-awareness` class and one
`enrollment-awareness__message--{variant}` modifier per message. Their colors are defined in
the `course-detail` theme scheme with the `awareness-info-*` and `awareness-warning-*` keys.
