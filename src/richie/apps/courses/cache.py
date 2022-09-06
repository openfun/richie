"""
Cache utility for courses.
"""
from .models import Course

# Django CMS Cache
def limit_course_page_cache_ttl(response):
    """
    Limit the cache ttl to be lower than the next course date that could change the course page
    presentation.
    """
    try:
        return response._request.current_page.course.compute_max_cache_ttl()
    except (Course.DoesNotExist, AttributeError):
        return
