"""
Declare and configure the model for the person application
"""
from django.db import models
from django.utils import translation
from django.utils.translation import ugettext_lazy as _

from cms.api import Page
from cms.extensions.extension_pool import extension_pool
from cms.models.pluginmodel import CMSPlugin
from parler.models import TranslatableModel, TranslatedFields

from ..core.models import BasePageExtension


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


class Person(BasePageExtension):
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
        return "{model}: {title} ({full_name})".format(
            model=self._meta.verbose_name.title(),
            title=self.extended_object.get_title(),
            full_name=self.get_full_name(),
        )

    def save(self, *args, **kwargs):
        """
        Enforce validation on each instance save
        """
        self.full_clean()
        super().save(*args, **kwargs)

    def get_full_name(self):
        """
        Return person's full name
        """
        return "{person_title} {first_name} {last_name}".format(
            person_title=self.person_title.title,
            first_name=self.first_name,
            last_name=self.last_name,
        )


class PersonPluginModel(CMSPlugin):
    """
    Person plugin model handles the relation from PersonPlugin
    to their Person instance
    """

    page = models.ForeignKey(
        Page, limit_choices_to={"publisher_is_draft": True, "person__isnull": False}
    )

    class Meta:
        verbose_name = _("person plugin model")

    def __str__(self):
        """Human representation of a person plugin"""
        return "{model:s}: {id:d}".format(
            model=self._meta.verbose_name.title(), id=self.id
        )

    @property
    def relevant_page(self):
        """
        the plugin should show the published page whenever it exists or the draft page otherwise.

        On a public content, the draft page should not be shown at all but this is left to the
        template.
        """
        if self.page.is_published(translation.get_language()):
            return self.page.get_public_object()
        return self.page

    def check_publication(self, language=None):
        """
        Allow checking if the page is published without passing any language (unlike the
        "is_published" method on the page object): if not explicitly passed as argument, the
        language is retrieved from the context.

        The actual check is subcontracted to the "is_published" method on the related Django CMS
        Page object.

        Note: We choose not to name our method "is_published" like Django CMS, because it is a
        bad practice. Indeed, someone may think it is a property and use it without invocating it
        and the returned value (a bound method) will always be truthy... This issue happened a lot
        with the "is_authenticated" method on Django's User model before they converted it to a
        property.
        """
        language = language or translation.get_language()
        return self.page.is_published(language)


extension_pool.register(Person)
