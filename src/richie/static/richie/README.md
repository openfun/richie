# Richie statics

This directory will receive front-end builds that will be distributed with
Richie. To make them available in your Django project, please add `richie` to
your `settings.INSTALLED_APPS` and load them in your main template, _e.g._:

```html
{% load staticfiles %}
<!doctype html>
<html>
    <head>
        <!-- [...] head content -->

        <!-- Load Richie's default styles -->
        <link rel="stylesheet" type="text/css" href="{% static 'richie/css/main.css' %}">
        <!-- Load Richie's front-end application -->
        <script src="{% static 'richie/js/index.js' %}"></script>
    </head>
    <body>
        <!-- Template content goes here -->
    </body>
</html>
```
