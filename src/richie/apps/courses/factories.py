"""
Courses factories
"""
import os
import random

from django.core.files import File

import factory
from cms.api import add_plugin
from filer.models.imagemodels import Image

from ..core.factories import PageExtensionDjangoModelFactory
from ..core.helpers import create_text_plugin
from ..core.tests.utils import file_getter
from .models import Course, Organization, Subject

VIDEO_SAMPLE_LINKS = (
    (
        "Anant Agarwal: Why massively open online courses (still) matter",
        "//www.youtube.com/embed/rYwTA5RA9eU",
    ),
    ("Installing Open edX", "//www.youtube.com/embed/YDm6bAPxeg0"),
    (
        "Open edX Conference 2018 Opening and Welcome remarks",
        "//www.youtube.com/embed/zzx6MgBAbCc",
    ),
)


class BLDPageExtensionDjangoModelFactory(PageExtensionDjangoModelFactory):
    """
    This mixin mutualizes filling placeholders for banner, logo and description fields because
    several models share these 3 placeholders.
    """

    @factory.post_generation
    # pylint: disable=unused-argument
    def fill_banner(self, create, extracted, **kwargs):
        """
        Add a banner with a random image
        """
        if create and extracted:
            banner_placeholder = self.extended_object.placeholders.get(slot="banner")

            banner_file = file_getter(os.path.dirname(__file__), "banner")()
            wrapped_banner = File(banner_file, banner_file.name)
            banner = Image.objects.create(file=wrapped_banner)

            for language in self.extended_object.get_languages():
                add_plugin(
                    language=language,
                    placeholder=banner_placeholder,
                    plugin_type="PicturePlugin",
                    picture=banner,
                    attributes={"alt": "banner image"},
                )

    @factory.post_generation
    # pylint: disable=unused-argument
    def fill_logo(self, create, extracted, **kwargs):
        """
        Add a logo with a random image
        """
        if create and extracted:
            logo_placeholder = self.extended_object.placeholders.get(slot="logo")

            logo_file = file_getter(os.path.dirname(__file__), "logo")()
            wrapped_logo = File(logo_file, logo_file.name)
            logo = Image.objects.create(file=wrapped_logo)
            for language in self.extended_object.get_languages():
                add_plugin(
                    language=language,
                    placeholder=logo_placeholder,
                    plugin_type="PicturePlugin",
                    picture=logo,
                    attributes={"alt": "logo image"},
                )

    @factory.post_generation
    # pylint: disable=unused-argument
    def fill_description(self, create, extracted, **kwargs):
        """
        Add a text plugin for description with a long random text
        """
        if create and extracted:
            create_text_plugin(
                self.extended_object,
                "description",
                nb_paragraphs=random.randint(2, 4),
                languages=self.extended_object.get_languages(),
            )


class OrganizationFactory(BLDPageExtensionDjangoModelFactory):
    """
    A factory to automatically generate random yet meaningful organization page extensions
    in our tests.
    """

    class Meta:
        model = Organization
        exclude = ["languages", "parent", "template", "title"]

    template = Organization.TEMPLATE_DETAIL

    @factory.lazy_attribute
    def code(self):
        """
        Since `name` is required, let's just slugify it to get a meaningful code (and keep it
        below 100 characters)
        """
        return self.extended_object.get_slug()[:100]

    @factory.post_generation
    # pylint: disable=unused-argument, attribute-defined-outside-init, no-member
    def with_courses(self, create, extracted, **kwargs):
        """Add courses to ManyToMany relation."""
        if create and extracted:
            self.courses.set(extracted)


class CourseFactory(PageExtensionDjangoModelFactory):
    """
    A factory to automatically generate random yet meaningful course page extensions
    and their related page in our tests.

    The `active_session` field is set to a realistic Splitmongo course key in Open edX which
    matches the following pattern:

        {version}:{organization_code}+{number}+{session}

        e.g. "course-v1:CNAM+01032+session01"
    """

    class Meta:
        model = Course
        exclude = [
            "languages",
            "number",
            "parent",
            "session",
            "template",
            "title",
            "version",
        ]

    template = Course.TEMPLATE_DETAIL
    version = factory.Sequence(lambda n: "version-v{version}".format(version=n + 1))
    number = factory.Faker("numerify", text="#####")
    session = factory.Sequence(lambda n: "session{session:02d}".format(session=n + 1))

    active_session = factory.LazyAttribute(
        lambda o: "{version}:{organization_code}+{number}+{session}".format(
            version=o.version,
            organization_code=o.organization_main.code
            if o.organization_main
            else "xyz",
            number=o.number,
            session=o.session,
        )
    )
    organization_main = factory.SubFactory(OrganizationFactory)

    @factory.post_generation
    # pylint: disable=unused-argument
    def fill_teaser(self, create, extracted, **kwargs):
        """
        Add a video plugin for teaser with a random url
        """

        if create and extracted:
            for language in self.extended_object.get_languages():

                placeholder = self.extended_object.placeholders.get(
                    slot="course_teaser"
                )

                label, url = random.choice(VIDEO_SAMPLE_LINKS)

                add_plugin(
                    language=language,
                    placeholder=placeholder,
                    plugin_type="VideoPlayerPlugin",
                    label=label,
                    embed_link=url,
                )

    @factory.post_generation
    # pylint: disable=unused-argument
    def fill_team(self, create, extracted, **kwargs):
        """
        Add person plugin for course team from given person instance list
        """

        if create and extracted:
            for language in self.extended_object.get_languages():
                placeholder = self.extended_object.placeholders.get(slot="course_team")

                for person in extracted:
                    add_plugin(
                        language=language,
                        placeholder=placeholder,
                        plugin_type="PersonPlugin",
                        **{"person": person},
                    )

    @factory.post_generation
    # pylint: disable=unused-argument
    def fill_texts(self, create, extracted, **kwargs):
        """
        A shortand to fill some placeholder content with a text plugin.

        Placeholder slot names to fill are given from ``extracted`` argument
        in a list of slot names.
        """
        if create and extracted:
            for slot in extracted:
                create_text_plugin(
                    self.extended_object,
                    slot,
                    nb_paragraphs=1,
                    languages=self.extended_object.get_languages(),
                )

    @factory.post_generation
    # pylint: disable=unused-argument
    def with_subjects(self, create, extracted, **kwargs):
        """Add subjects to ManyToMany relation."""
        if create and extracted:
            self.subjects.set(extracted)

    @factory.post_generation
    # pylint: disable=unused-argument
    def with_organizations(self, create, extracted, **kwargs):
        """Add organizations to ManyToMany relation."""
        if create and extracted:
            self.organizations.set(extracted)


class SubjectFactory(BLDPageExtensionDjangoModelFactory):
    """
    A factory to automatically generate random yet meaningful subject page extensions
    and their related page in our tests.
    """

    class Meta:
        model = Subject
        exclude = ["languages", "template", "title", "parent"]

    template = Subject.TEMPLATE_DETAIL

    @factory.post_generation
    # pylint: disable=unused-argument, attribute-defined-outside-init, no-member
    def with_courses(self, create, extracted, **kwargs):
        """Add courses to ManyToMany relation."""
        if create and extracted:
            self.courses.set(extracted)
