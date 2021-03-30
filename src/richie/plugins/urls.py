"""
Plugins urls
"""

from django.urls import include, path

from richie.plugins.lti_consumer.urls import url_patterns as lti_consumer_url_patterns

urlpatterns = [path("plugins/", include([*lti_consumer_url_patterns]))]
