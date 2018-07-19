# Plugins module

This Python module contains all our Django-CMS plugins as Django applications,
therefore should be designed so.

    src
        richie
            plugins
                myplugin
                    __init__.py
                    migrations
                        0001_init.py
                    templates
                        myplugin.html
                    cms_plugin.py
                    models.py
                    factories.py
                    tests.py


They should be added to Django project `INSTALLED_APPS` constant as follow:

    INSTALLED_APPS = (
        ...
        "richie.plugins.large_banner",
        "richie.plugins.section",
        "richie.plugins.simple_text_ckeditor",
        ...
    )

