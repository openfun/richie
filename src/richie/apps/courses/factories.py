"""
Courses factories
"""
import os
import random
from datetime import datetime, timedelta

from django.core.files import File
from django.utils import timezone

import factory
import pytz
from cms.api import add_plugin
from filer.models.imagemodels import Image

from ..core.factories import FilerImageFactory, PageExtensionDjangoModelFactory
from ..core.helpers import create_text_plugin
from ..core.tests.utils import file_getter
from .models import Course, CourseRun, Licence, Organization, Subject

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
    def fill_licences(self, create, extracted, **kwargs):
        """
        Add licence plugin for course licence placeholders from given licence
        instance list
        """
        if create and extracted:
            for language in self.extended_object.get_languages():
                for slot, licence in extracted:
                    placeholder = self.extended_object.placeholders.get(slot=slot)
                    add_plugin(
                        language=language,
                        placeholder=placeholder,
                        plugin_type="LicencePlugin",
                        **{"licence": licence},
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


class CourseRunFactory(factory.django.DjangoModelFactory):
    """
    A factory to automatically generate random yet meaningful course runs in our tests.

    Random dates are proposed realistically so that:
        - now <= start
        - enrollment_start <= start <= end
        - enrollment_start <= enrollment_end <= end
    """

    class Meta:
        model = CourseRun

    course = factory.SubFactory(CourseFactory)
    resource_link = factory.Faker("uri")

    # pylint: disable=no-self-use
    @factory.lazy_attribute
    def start(self):
        """
        A start datetime for the course run is chosen randomly in the future (it can
        of course be forced if we want something else), then the other significant dates
        for the course run are chosen randomly in periods that make sense with this start date.
        """
        now = timezone.now()
        period = timedelta(days=1000)
        return pytz.timezone("UTC").localize(
            datetime.fromordinal(
                random.randrange(now.toordinal(), (now + period).toordinal())
            )
        )

    @factory.lazy_attribute
    def end(self):
        """
        The end datetime is at a random duration after the start datetme (we pick within 90 days).
        """
        if not self.start:
            return None
        period = timedelta(days=90)
        return pytz.timezone("UTC").localize(
            datetime.fromordinal(
                random.randrange(
                    self.start.toordinal(), (self.start + period).toordinal()
                )
            )
        )

    @factory.lazy_attribute
    def enrollment_start(self):
        """
        The start of enrollment is a random datetime before the start datetime.
        """
        if not self.start:
            return None
        period = timedelta(days=90)
        return pytz.timezone("UTC").localize(
            datetime.fromordinal(
                random.randrange(
                    (self.start - period).toordinal(), self.start.toordinal()
                )
            )
        )

    @factory.lazy_attribute
    def enrollment_end(self):
        """
        The end of enrollment is a random datetime between the start of enrollment
        and the end of the course.
        If the enrollment start and end datetimes have been forced to incoherent dates,
        then just don't set any end of enrollment...
        """
        if not self.start:
            return None
        end = self.end or self.start + timedelta(days=random.randint(1, 90))
        enrollment_start = self.enrollment_start or self.start - timedelta(
            days=random.randint(1, 90)
        )
        return pytz.timezone("UTC").localize(
            datetime.fromordinal(
                random.randrange(enrollment_start.toordinal(), end.toordinal())
            )
        )


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


class LicenceFactory(factory.django.DjangoModelFactory):
    """
    A factory to automatically generate random yet meaningful licences.
    """

    class Meta:
        model = Licence

    name = factory.Faker("sentence", nb_words=3)
    logo = factory.SubFactory(FilerImageFactory)
    url = factory.Faker("uri")
    content = factory.Faker("text", max_nb_chars=300)
