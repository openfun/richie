"""
Declare and configure the models for the courses application
"""
from django.utils.translation import ugettext_lazy as _

from cms.extensions.extension_pool import extension_pool

from ...core.models import BasePageExtension


class Subject(BasePageExtension):
    """
    The subject page extension represents and records a thematic in the catalog.

    This model should be used to record structured data about the thematic whereas the
    associated page object is where we record the less structured information to display on the
    page that presents the thematic.
    """

    ROOT_REVERSE_ID = "subjects"
    TEMPLATE_DETAIL = "courses/cms/subject_detail.html"

    class Meta:
        verbose_name = _("subject")

    def __str__(self):
        """Human representation of a subject"""
        return "{model}: {title}".format(
            model=self._meta.verbose_name.title(),
            title=self.extended_object.get_title(),
        )

    def copy_relations(self, oldinstance, language):
        """
        We must manually copy the many-to-many relations from the "draft" instance
        to the "published" instance.
        """
        self.courses.set(oldinstance.courses.drafts())


extension_pool.register(Subject)
