"""
Default settings for the Richie courses app.

If you use Django Configuration for your settings, you can use our mixin to import these
default settings:
    ```
    from configurations import Configuration
    from richie.apps.courses.settings.mixins import RichieCoursesConfigurationMixin

    class MyConfiguration(RichieCoursesConfigurationMixin, Configuration):
        ...
    ```

Otherwise, you can just use the usual Django pattern in your settings.py file:
    ```
    from richie.apps.courses.settings import *
    ```
"""

RICHIE_SIMPLEPICTURE_PRESETS = {
    "glimpse": {
        "src": {"size": (300, 150), "crop": "smart"},
        "srcset": [
            {
                "options": {"size": (300, 150), "crop": "smart", "upscale": True},
                "descriptor": "300w",
            },
            {
                "options": {"size": (600, 300), "crop": "smart", "upscale": True},
                "descriptor": "600w",
            },
            {
                "options": {"size": (1200, 600), "crop": "smart", "upscale": True},
                "descriptor": "1200w",
            },
        ],
        "sizes": "300px",
    }
}
