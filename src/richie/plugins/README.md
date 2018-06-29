# Plugins module

This Python module contains all our Django-CMS plugins as Django applications,
therefore should be designed so.

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


They sould be added to Django project `INSTALLED_APPS` constant as follow:

    INSTALLED_APPS = (
        ...
        'plugins.large_banner',
        ...
    )


Factories related to the `richie` Django project or shared by several plugins should be placed in the `common` module
