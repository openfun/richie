"""
Courses factories
"""
import factory

from django.conf import settings
from django.template.defaultfilters import slugify
from django.utils import translation

from apps.organizations.factories import OrganizationFactory

from .models import Course, CourseSubject, CourseOrganizationRelation


class CourseSubjectFactory(factory.django.DjangoModelFactory):
    """
        Django-parler compatible CourseSubject factory.
        Will generate translation for current or default language, or can be called as follow:
        `CourseSubjectFactory(with_translations=['fr', 'en'])`
    """

    class Meta:
        model = CourseSubject

    @factory.post_generation
    # pylint: disable=unused-argument, attribute-defined-outside-init
    def with_translations(self, create, extracted, **kwargs):
        """Create `django-parler` translation objects."""
        # If no specific language specified, we use active one, then default one
        languages = extracted or [translation.get_language() or settings.LANGUAGE_CODE]

        for language in languages:
            self.set_current_language(language)
            # Use faker to create a subject, slugify, then use first word as short name
            self.name = factory.Faker(
                "sentence", nb_words=3, variable_nb_words=True
            ).generate(
                {}
            )
            self.slug = slugify(self.name)
            self.short_name = self.name.split(" ")[0]
        return self


class CourseFactory(factory.django.DjangoModelFactory):
    """
        Course factory with realistic Splitmongo course key
        like "course-v1:CNAM+01032+session01"
        which matches the following pattern: "{version}:{organization_code}+{number}+{session}"
    """

    class Meta:
        model = Course
        exclude = ["version", "organization_code", "number", "session"]

    version = factory.Sequence(lambda n: "version-v{version}".format(version=n + 1))
    organization_code = factory.Faker("word")
    number = factory.Faker("numerify", text="#####")
    session = factory.Sequence(lambda n: "session{session:02d}".format(session=n + 1))

    active_session = factory.LazyAttribute(
        lambda p: "{}:{}+{}+{}".format(
            p.version, p.organization_code, p.number, p.session
        )
    )
    name = factory.Faker("catch_phrase")

    @factory.post_generation
    # pylint: disable=unused-argument, attribute-defined-outside-init, no-member
    def with_subjects(self, create, extracted, **kwargs):
        """Add CourseSubjects to ManyToMany relation."""
        if create and extracted:
            for subject in extracted:
                self.subjects.add(subject)

    @factory.post_generation
    # pylint: disable=unused-argument, attribute-defined-outside-init
    def with_organizations(self, create, extracted, **kwargs):
        """Receives Organizations and create ordered OrganizationRelation objects."""
        if create and extracted:
            for idx, organization in enumerate(extracted):
                CourseOrganizationRelation.objects.create(
                    organization=organization, course=self, rank=idx
                )


class CourseOrganizationRelationFactory(factory.django.DjangoModelFactory):
    """Course to Organization relation factory."""

    class Meta:
        model = CourseOrganizationRelation

    organization = factory.RelatedFactory(OrganizationFactory)
    course = factory.RelatedFactory(CourseFactory)
    rank = 1
