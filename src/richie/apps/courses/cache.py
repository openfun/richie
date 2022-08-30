"""
Cache utility for courses.
"""
from datetime import timedelta

from django.utils import timezone

CACHE_MARGIN = timedelta(seconds=30)


# Django CMS Cache
def limit_course_page_cache_ttl(response):
    """
    Limit the cache ttl to be lower than the next course date that could change the course page
    presentation.
    """
    request = response._request  # pylint: disable=protected-access
    page = request.current_page
    if hasattr(page, "course"):
        dates = page.course.get_sorted_course_runs_dates()
        lower = timezone.now() - CACHE_MARGIN
        higher = timezone.now() + CACHE_MARGIN
        for date in dates:
            if date > higher:  # future date
                return int((date - timezone.now() - CACHE_MARGIN).total_seconds())
            if lower <= date <= higher:  # within the cache margin
                return 0  # do not cache
    return None
