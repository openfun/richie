---
id: web-analytics
title: Add web analytics to your site
sidebar_label: Web Analytics
---

Richie has native support to [Google Analytics](#google-analytics) and [Google Tag Manager](#google-tag-manager) Web Analytics solutions.
The purpose of this file is to explain how you can enable one of the supported Web Analytics providers
and how you can extend Richie with an alternative solution.

## Google Analytics
Next, it is described how you can configure the **Google Analytics** on your Richie site.

- Add the `WEB_ANALYTICS_ID` setting, with your Google Analytics tracking id code.

The current Google Analytics implementation also includes custom dimensions. Those dimensions permit you to create further analyses on Google Analytics or even use them to create custom reports.
Custom dimensions with a value as example:
* Organizations codes - `UNIV_LISBON | UNIV_PORTO`
* Course code - `COURSE_XPTO`
* Course runs titles - `Summer edition | Winter edition`
* Course runs resource links - `http://example.edx:8073/courses/course-v1:edX+DemoX+Demo_Course/info`
* Page title - `Introduction to Programming`

## Google Tag Manager
Next, it is described how you can configure the **Google Tag Manager** on your Richie site.

- Add the `WEB_ANALYTICS_ID` setting, with your Google Tag Manager tracking id code.
- Add the `WEB_ANALYTICS_PROVIDER` setting with the `google_tag_manager` value.

The current Google Tag Manager implementation also defines a custom dimensions like the [Google Analytics](#google-analytics).

## Location of the web analytics javascript
Use the `WEB_ANALYTICS_LOCATION` settings to decide where do you want to put the Javascript code. Use `head` (**default** value), to put the Javascript on HTML header, or `footer`, to put the Javascript code to the bottom of the body.

## Add a new Web Analytics solution

In this section it's described how you can add support to a different Web Analytics solution.

* override the `richie/web_analytics.html` template
* define the `WEB_ANALYTICS_ID` setting with your tracking identification
* define the `WEB_ANALYTICS_PROVIDER` setting with a value that represents your solution, eg. `my-custom-web-analytics-software`
* optionally change `WEB_ANALYTICS_LOCATION` setting with `head` (default) or `footer` value

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
{% block web_analytics %}
    {% if WEB_ANALYTICS_ID %}
        {% if WEB_ANALYTICS_PROVIDER == "my_custom_web_analytics_software" %}
            <script type="text/javascript" src="{% static 'myapp/js/custom_web_analytics_software.js' %}">
            <script type="text/javascript">
                // javascript code that startups the custom web analytics software
            </script>
        {% endif %}
    {% endif %}
{% endblock web_analytics %}
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
of `src/frontend/js/utils/api/web-analytics/google_analytics.ts` and change the `src/frontend/js/utils/api/web-analytics/index.ts` file to include that newer provider.
