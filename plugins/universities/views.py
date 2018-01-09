from django.views import generic
from django.views.generic import DetailView

from .models import University

class UniversityDetailView(DetailView):
    """
    DetailView to customize a university page
    """
    template_name = 'universities/detail.html'
    context_object_name = 'university'

    def get_queryset(self):
        return University.objects

    def get_context_data(self, **kwargs):
        context = super(UniversityDetailView, self).get_context_data(**kwargs)
        return context

university_detail = UniversityDetailView.as_view()
