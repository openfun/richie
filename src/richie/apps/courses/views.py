"""
Courses model views
"""

from cms.api import Page
from dal import autocomplete


class PageAdminAutocomplete(autocomplete.Select2QuerySetView):
    """
    Autocomplete view for Person search in admin
    """

    def get_queryset(self):
        """
        Return queryset to use for returning autocomplete results.

        User needs to be authenticated with the view permission on Person model.

        Without any search keyword from ``self.q`` every results are returned, if
        keyword is given results are filtered on it with insensitive ``contains``.
        """
        model_name = self.kwargs["model_name"]

        # Filter out results depending on the visitor
        if (
            not self.request.user.is_authenticated
            or not self.request.user.is_staff
            or not self.request.user.has_perm(f"courses.view_{model_name}")
        ):
            return Page.objects.none()

        # Retrieve only draft pages
        qs = Page.objects.filter(
            publisher_is_draft=True, **{f"{model_name}__isnull": False}
        )

        # Perform autocompletion search on Person page
        if self.q:
            qs = qs.filter(title_set__title__icontains=self.q)

        # Ensure we get a distinct list.
        # NOTE: Order is currently not taken care of since correct implementation
        # with page language fallback is something complicated to achieve
        return qs.distinct()
