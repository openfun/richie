"""Default settings for Richie's simple picture plugin."""
from django.conf import settings

SIMPLEPICTURE_PRESETS = {
    "default": {
        "src": {"size": (500, 500), "crop": "smart"},  # easythumbnail options
        "srcset": [
            {"options": {"size": (1000, 1000), "crop": "smart"}, "descriptor": "1000w"},
            {"options": {"size": (2000, 2000), "crop": "smart"}, "descriptor": "2000w"},
        ],
        "sizes": "100vw",  # e.g 1000px or 100vw
    }
}

SIMPLEPICTURE_PRESETS.update(getattr(settings, "RICHIE_SIMPLEPICTURE_PRESETS", {}))
