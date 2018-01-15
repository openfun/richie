# -*- coding: utf-8 -*-
from django.conf.urls import patterns, url

from .views import OrganizationDetailView, OrganizationListView

urlpatterns = [
    url(r'^$', OrganizationListView.as_view(), name='organization_list'),
    url(r'^(?P<slug>[-\w]+)/$', OrganizationDetailView.as_view(), name='organization_detail'),
]
