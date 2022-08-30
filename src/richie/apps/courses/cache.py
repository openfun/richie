"""
Cache utility for courses.
"""
from django.utils import timezone


# Django CMS Cache
def limit_course_page_cache_ttl(response):
    """
    Limit the cache ttl to be lower than the next course date that could change the course page
    presentation.
    """
    request = response._request  # pylint: disable=protected-access
    page = request.current_page
    if hasattr(page, "course"):
        next_date = page.course.next_course_run_date()
        if next_date:
            return int((next_date - timezone.now()).total_seconds() - 1)
    return None
