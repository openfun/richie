# -*- coding: utf-8 -*-
from django.conf.urls import patterns, url

from .views import UniversityDetailView

urlpatterns = [
    url(r'^(?P<slug>[-\w]+)/$', UniversityDetailView.as_view(), name='university'),
]
