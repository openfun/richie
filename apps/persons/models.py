"""
Declare and configure the model for the person application
"""
from django.db import models
from django.utils.translation import ugettext_lazy as _

from cms.extensions import PageExtension
from parler.models import TranslatableModel, TranslatedFields


class PersonTitle(TranslatableModel):
    """
    PersonTitle define i18ned list of people titles and there abbreviations
    Instances of this models should only be created by CMS administrators
    """

    translations = TranslatedFields(
        title=models.CharField(_("Title"), max_length=200),
        abbreviation=models.CharField(_("Title abbreviation"), max_length=10),
    )

    class Meta:
        verbose_name = _("person title")

    def __str__(self):
        """Human representation of a person title"""
        return "{model}: {title} ({abbreviation})".format(
            model=self._meta.verbose_name.title(),
            title=self.title,
            abbreviation=self.abbreviation,
        )


class Person(PageExtension):
    """
    The person page extension represents and records people information.
    It could be a course or news article author.

    This model should be used to record structured data about the person whereas the
    associated page object is where we record the less structured information to display on the
    page to present the person.
    """

    first_name = models.CharField(max_length=200, verbose_name=_("First name"))
    last_name = models.CharField(max_length=200, verbose_name=_("Last name"))

    person_title = models.ForeignKey("PersonTitle", related_name="persons")

    ROOT_REVERSE_ID = "persons"
    TEMPLATE_DETAIL = "persons/cms/person_detail.html"

    class Meta:
        verbose_name = _("person")

    def __str__(self):
        """Human representation of a person"""
        return "{model}: {title} ({person_title} {first_name} {last_name})".format(
            model=self._meta.verbose_name.title(),
            title=self.extended_object.get_title(),
            person_title=self.person_title.title,  # pylint: disable=no-member
            first_name=self.first_name,
            last_name=self.last_name,
        )

    def save(self, *args, **kwargs):
        """
        Enforce validation on each instance save
        """
        self.full_clean()
        super().save(*args, **kwargs)
