"""
Utils that can be useful throughout Richie's courses app
"""

import hashlib
import hmac

from django.utils.text import slugify


def normalize_code(code):
    """Normalize object codes to avoid duplicates."""
    return slugify(code, allow_unicode=True).upper() if code else None


def get_signature(message, secret):
    """Return a SHA256 signature for the message."""
    digest = hmac.new(
        secret.encode("utf-8"),
        msg=message.encode("utf-8"),
        digestmod=hashlib.sha256,
    ).hexdigest()
    return f"SIG-HMAC-SHA256 {digest:s}"
