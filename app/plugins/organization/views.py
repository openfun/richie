from django.views import generic
from django.views.generic import DetailView, ListView

from .models import Organization

class OrganizationDetailView(DetailView):
    """
    DetailView to customize a Organization page
    """
    template_name = 'organization/detail.html'
    context_object_name = 'organization'

    def get_queryset(self):
        return Organization.objects

    def get_context_data(self, **kwargs):
        context = super(OrganizationDetailView, self).get_context_data(**kwargs)
        return context

class OrganizationListView(ListView):
    template = 'organization/organization_list.html'
    context_object_name = 'organization'

    def get_queryset(self):
        print('totototototototototototototototo')
        return Organization.objects.filter(is_detail_page_enabled=True, is_obsolete=False).order_by('-score')