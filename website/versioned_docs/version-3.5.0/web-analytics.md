---
id: web-analytics
title: Add web analytics to your site
sidebar_label: Web Analytics
---

Richie has native support to [Google Universal Analytics](#google-analytics) and [Google Tag Manager](#google-tag-manager) Web Analytics solutions.
The purpose of this file is to explain how you can enable one of the supported Web Analytics providers
and how you can extend Richie with an alternative solution.

## Google Universal Analytics
Next, it is described how you can configure the **Google Universal Analytics** on your Richie site.

Add the `WEB_ANALYTICS` setting, with the Google Universal Analytics configuration. From the next example replace `TRACKING_ID` with your tracking id code.

```python
{
    'google_universal_analytics': {
        'tracking_id': 'TRACKING_ID',
    }
}
```

The current Google Universal Analytics implementation also includes custom dimensions. Those dimensions permit you to create further analyses on Google Universal Analytics or even use them to create custom reports. 
Custom dimensions with a value as example:
* Organizations codes - `UNIV_LISBON | UNIV_PORTO`
* Course code - `COURSE_XPTO`
* Course runs titles - `Summer edition | Winter edition`
* Course runs resource links - `http://example.edx:8073/courses/course-v1:edX+DemoX+Demo_Course/info`
* Page title - `Introduction to Programming`

## Google Tag

It is possible to configure the **Google Tag**, `gtag.js`, on your Richie site.

Add the `WEB_ANALYTICS` setting, with the Google Tag configuration like for example:

```python
{
    'google_tag': {
        'tracking_id': 'TRACKING_ID',
    }
}
```
And don't forget to replace the `TRACKING_ID` with your tracking id/code from Google Ads, Google Analytics, or other Google product compatible with the `gtag.js`.

The Google Tag is initialized with custom dimensions like the [Google Universal Analytics](#google-analytics).

## Google Tag Manager
Next, it is described how you can configure the **Google Tag Manager**, `gtm.js`, on your Richie site.

Add the `WEB_ANALYTICS` setting, with the Google Tag Manager configuration, for example:

```python
{
    'google_tag_manager': {
        'tracking_id': 'TRACKING_ID',
    }
}
```

And don't forget to replace the `TRACKING_ID` with your `GTM` tracking id/code.

The current Google Tag Manager implementation also defines a custom dimensions like the [Google Universal Analytics](#google-analytics).

If you want to use the Environments feature of the Google Tag Manager, you need to include the `environment` key with its value on `google_tag_manager` dict inside the `WEB_ANALYTICS` setting. 

_The environments feature in Google Tag Manager is ideal for organizations that want to preview their container changes in a test environment before those changes are published_.

```python
{
    'google_tag_manager': {
        'tracking_id': 'TRACKING_ID',
        'environment': '&gtm_auth=aaaaaaaaaaaaaaaa&gtm_preview=env-99&gtm_cookies_win=x';
    }
}
```

## Multiple Web Analytics at the same time

It is possible to configure several web analytics solutions at the same time or the same solution with different tracking identifications.


`WEB_ANALYTICS` setting example to have both Google Universal Analytics and Google Tag Manager:

```python
{
    'google_universal_analytics': {
        'tracking_id': 'UA-TRACKING_ID',
    },
    'google_tag_manager': {
        'tracking_id': 'GTM-TRACKING_ID',
    }
}
```

## Location of the web analytics javascript
Each web analytics js code can be put on the `footer` (**default** value), to put the Javascript on HTML body footer, or `header`, to put the Javascript code at the end of the HTML `head`.

Update the `WEB_ANALYTICS` setting, like:

```python
{
    'google_universal_analytics': {
        'tracking_id': 'UA-TRACKING_ID',
        'location': 'footer,
    },
}
```

## Add a new Web Analytics solution

In this section it's described how you can add support to a different Web Analytics solution.

* override the `richie/web_analytics.html` template
* define the `WEB_ANALYTICS` setting with a value that represents your solution, eg. `my-custom-web-analytics-software`
* define the `WEB_ANALYTICS` setting with your tracking identification
* optionally change `location` with `footer` (default) or `head` value

```python
{
    'my-custom-web-analytics-software': {
        'tracking_id': 'MY_CUSTOM_TRACKING_ID',
        'location': 'footer,
    },
}
```

- Example of a `richie/web_analytics.html` file customization that prints to the browser console log the dimension keys and values:
```javascript
<script type="text/javascript">
    {% for dimension_key, dimension_value_list in WEB_ANALYTICS.DIMENSIONS.items %}
        console.log("dimension: index '{{forloop.counter}}' with key '{{ dimension_key }}' with value '{{ dimension_value_list|join:" | " }}'");
    {% endfor %}
</script>
```

Output:
```
dimension: index '1' with key 'organizations_codes' with value 'COMPATIBLE-EVEN-KEELED-UTILIZATION-19 | FOCUSED-NEXT-GENERATION-FUNCTIONALITIES-22 | UNIVERSAL-MODULAR-LOCAL-AREA-NETWORK-23'
dimension: index '2' with key 'course_code' with value '00017'
dimension: index '3' with key 'course_runs_titles' with value 'Run 0'
dimension: index '4' with key 'course_runs_resource_links' with value ''
dimension: index '5' with key 'page_title' with value 'Business-focused zero-defect application'
```

But you can also contribute to Richie by creating a pull request to add support for a different web analytics solution. In this last case, you have to edit directly the `richie/web_analytics.html` template.

Example of an override of the `richie/web_analytics.html` file:
```html
{% extends "richie/web_analytics.html" %}
{% block web_analytics_additional_providers %}
    {% if provider == "my_custom_web_analytics_software_provider" %}
        <script type="text/javascript" src="{% static 'myapp/js/custom_web_analytics_software.js' %}">
        <script type="text/javascript">
            // javascript code that startups the custom web analytics software
        </script>
    {% endif %}
{% endblock web_analytics_additional_providers %}
```

The web analytics dimensions are being added to the django context using the `WEB_ANALYTICS.DIMENSIONS` dictionary. Because each dimension value could have multiple values, then each dictionary value is a list. Web analytics dimensions dictionary keys:
* `organizations_codes`
* `course_code`
* `course_runs_titles`
* `course_runs_resource_links`
* `page_title`

Example, if you only need the organization codes on your custom `richie/web_analytics.html` file:
```javascript
<script type="text/javascript">
    console.log("organization codes: '{{ WEB_ANALYTICS.DIMENSIONS.organizations_codes |join:" | " }}");
</script>
```

The frontend code also sends **events** to the web analytics provider.
Richie sends events when the user is enrolled on a course run.
To support different providers, you need to create a similar file
of `src/frontend/js/utils/api/web-analytics/google_universal_analytics.ts` and change the `src/frontend/js/utils/api/web-analytics/index.ts` file to include that newer provider.
