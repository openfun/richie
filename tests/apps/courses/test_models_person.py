"""
Unit tests for the Person model
"""

from django.test import TestCase
from django.test.utils import override_settings
from django.utils import translation

from cms.api import add_plugin, create_page

from richie.apps.core.helpers import create_i18n_page
from richie.apps.courses.cms_plugins import PersonPlugin
from richie.apps.courses.factories import BlogPostFactory, CourseFactory, PersonFactory
from richie.apps.courses.models import BlogPost, Course


class PersonModelsTestCase(TestCase):
    """
    Unit test suite to validate the behavior of the Person model
    """

    def test_models_person_str(self):
        """
        The string representation should be built with the page `title`
        and all person fields. Only 1 query to the associated page should be generated.
        """
        page = create_page(
            "Page of Lady Louise Dupont", "courses/cms/person_detail.html", "en"
        )
        person = PersonFactory(extended_object=page)
        with self.assertNumQueries(2):
            self.assertEqual(str(person), "Person: Page of Lady Louise Dupont")

    # get_es_id
    def test_get_es_id_for_draft_person_with_public_extension(self):
        """
        A draft person with a public extension. Its ES ID is the ID of the page linked to the
        public extension.
        """
        person = PersonFactory(should_publish=True)
        self.assertEqual(
            person.get_es_id(), str(person.public_extension.extended_object_id)
        )

    def test_get_es_id_for_published_person(self):
        """
        A published person. Its ES ID is the ID of the page linked to it.
        """
        person = PersonFactory(should_publish=True)
        self.assertEqual(
            person.public_extension.get_es_id(),
            str(person.public_extension.extended_object_id),
        )

    def test_get_es_id_for_draft_person_with_no_public_extension(self):
        """
        A draft person with no public extension. It has no ES ID.
        """
        person = PersonFactory()
        self.assertEqual(person.get_es_id(), None)

    # get_courses

    def test_models_person_get_courses(self):
        """
        It should be possible to retrieve the list of related courses on the person instance.
        The number of queries should be minimal.
        """
        person = PersonFactory(should_publish=True)
        courses = CourseFactory.create_batch(
            3, page_title="my title", fill_team=[person], should_publish=True
        )
        retrieved_courses = person.get_courses()

        with self.assertNumQueries(2):
            self.assertEqual(set(retrieved_courses), set(courses))

        with self.assertNumQueries(0):
            for course in retrieved_courses:
                self.assertEqual(
                    course.extended_object.prefetched_titles[0].title, "my title"
                )

    def test_models_person_get_courses_language_fallback_draft(self):
        """
        Validate that the reverse courses lookup works as expected with language fallback
        on a draft page.
        """
        person1, person2, person3 = PersonFactory.create_batch(3, should_publish=True)
        course = CourseFactory(should_publish=True)
        placeholder = course.extended_object.placeholders.get(slot="course_team")
        cms_languages = {
            "default": {
                "public": True,
                "hide_untranslated": False,
                "redirect_on_fallback": False,
                "fallbacks": ["en", "fr", "de"],
            }
        }

        # Reverse plugin lookups should fallback up to the second priority language
        add_plugin(
            language="de",
            placeholder=placeholder,
            plugin_type="PersonPlugin",
            **{"page": person1.extended_object},
        )
        with override_settings(CMS_LANGUAGES=cms_languages):
            with translation.override("en"):
                self.assertEqual(list(person1.get_courses()), [course])
                self.assertEqual(list(person2.get_courses()), [])
                self.assertEqual(list(person3.get_courses()), [])

            with translation.override("fr"):
                self.assertEqual(list(person1.get_courses()), [course])
                self.assertEqual(list(person2.get_courses()), [])
                self.assertEqual(list(person3.get_courses()), [])

            with translation.override("de"):
                self.assertEqual(list(person1.get_courses()), [course])
                self.assertEqual(list(person2.get_courses()), [])
                self.assertEqual(list(person3.get_courses()), [])

        # Reverse plugin lookups should fallback to the first priority language if available
        # and ignore the second priority language unless it is the current language
        add_plugin(
            language="fr",
            placeholder=placeholder,
            plugin_type="PersonPlugin",
            **{"page": person2.extended_object},
        )
        with override_settings(CMS_LANGUAGES=cms_languages):
            with translation.override("en"):
                self.assertEqual(list(person1.get_courses()), [])
                self.assertEqual(list(person2.get_courses()), [course])
                self.assertEqual(list(person3.get_courses()), [])

            with translation.override("fr"):
                self.assertEqual(list(person1.get_courses()), [])
                self.assertEqual(list(person2.get_courses()), [course])
                self.assertEqual(list(person3.get_courses()), [])

            with translation.override("de"):
                self.assertEqual(list(person1.get_courses()), [course])
                self.assertEqual(list(person2.get_courses()), [])
                self.assertEqual(list(person3.get_courses()), [])

        # Reverse plugin lookups should stick to the current language if available and
        # ignore plugins on fallback languages
        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="PersonPlugin",
            **{"page": person3.extended_object},
        )
        with override_settings(CMS_LANGUAGES=cms_languages):
            with translation.override("en"):
                self.assertEqual(list(person1.get_courses()), [])
                self.assertEqual(list(person2.get_courses()), [])
                self.assertEqual(list(person3.get_courses()), [course])

            with translation.override("fr"):
                self.assertEqual(list(person1.get_courses()), [])
                self.assertEqual(list(person2.get_courses()), [course])
                self.assertEqual(list(person3.get_courses()), [])

            with translation.override("de"):
                self.assertEqual(list(person1.get_courses()), [course])
                self.assertEqual(list(person2.get_courses()), [])
                self.assertEqual(list(person3.get_courses()), [])

    @override_settings(
        LANGUAGES=(("en", "en"), ("fr", "fr"), ("de", "de")),
        CMS_LANGUAGES={
            "default": {
                "public": True,
                "hide_untranslated": False,
                "redirect_on_fallback": False,
                "fallbacks": ["en", "fr", "de"],
            }
        },
    )
    # pylint: disable=too-many-statements
    def test_models_person_get_courses_language_fallback_published(self):
        """
        Validate that the reverse courses lookup works as expected with language fallback
        on a published page.
        """
        person1, person2, person3 = PersonFactory.create_batch(3, should_publish=True)
        public_person1 = person1.public_extension
        public_person2 = person2.public_extension
        public_person3 = person3.public_extension

        course, course_unpublished = CourseFactory.create_batch(
            2, page_languages=["en", "fr", "de"], should_publish=True
        )

        public_course = course.public_extension

        public_course_unpublished = course_unpublished.public_extension
        course_unpublished.extended_object.unpublish("en")
        course_unpublished.extended_object.unpublish("fr")
        course_unpublished.extended_object.unpublish("de")

        placeholder = public_course.extended_object.placeholders.get(slot="course_team")
        placeholder_unpublished = (
            public_course_unpublished.extended_object.placeholders.get(
                slot="course_team"
            )
        )
        # Reverse plugin lookups should fallback up to the second priority language
        add_plugin(
            language="de",
            placeholder=placeholder,
            plugin_type="PersonPlugin",
            **{"page": person1.extended_object},
        )
        add_plugin(
            language="de",
            placeholder=placeholder_unpublished,
            plugin_type="PersonPlugin",
            **{"page": person1.extended_object},
        )

        with translation.override("en"):
            self.assertEqual(list(public_person1.get_courses()), [public_course])
            self.assertEqual(list(public_person2.get_courses()), [])
            self.assertEqual(list(public_person3.get_courses()), [])

        with translation.override("fr"):
            self.assertEqual(list(public_person1.get_courses()), [public_course])
            self.assertEqual(list(public_person2.get_courses()), [])
            self.assertEqual(list(public_person3.get_courses()), [])

        with translation.override("de"):
            self.assertEqual(list(public_person1.get_courses()), [public_course])
            self.assertEqual(list(public_person2.get_courses()), [])
            self.assertEqual(list(public_person3.get_courses()), [])

        # Reverse plugin lookups should fallback to the first priority language if available
        # and ignore the second priority language unless it is the current language
        add_plugin(
            language="fr",
            placeholder=placeholder,
            plugin_type="PersonPlugin",
            **{"page": person2.extended_object},
        )
        add_plugin(
            language="fr",
            placeholder=placeholder_unpublished,
            plugin_type="PersonPlugin",
            **{"page": person2.extended_object},
        )
        with translation.override("en"):
            self.assertEqual(list(public_person1.get_courses()), [])
            self.assertEqual(list(public_person2.get_courses()), [public_course])
            self.assertEqual(list(public_person3.get_courses()), [])

        with translation.override("fr"):
            self.assertEqual(list(public_person1.get_courses()), [])
            self.assertEqual(list(public_person2.get_courses()), [public_course])
            self.assertEqual(list(public_person3.get_courses()), [])

        with translation.override("de"):
            self.assertEqual(list(public_person1.get_courses()), [public_course])
            self.assertEqual(list(public_person2.get_courses()), [])
            self.assertEqual(list(public_person3.get_courses()), [])

        # Reverse plugin lookups should stick to the current language if available and
        # ignore plugins on fallback languages
        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="PersonPlugin",
            **{"page": person3.extended_object},
        )
        add_plugin(
            language="en",
            placeholder=placeholder_unpublished,
            plugin_type="PersonPlugin",
            **{"page": person3.extended_object},
        )
        with translation.override("en"):
            self.assertEqual(list(public_person1.get_courses()), [])
            self.assertEqual(list(public_person2.get_courses()), [])
            self.assertEqual(list(public_person3.get_courses()), [public_course])

        with translation.override("fr"):
            self.assertEqual(list(public_person1.get_courses()), [])
            self.assertEqual(list(public_person2.get_courses()), [public_course])
            self.assertEqual(list(public_person3.get_courses()), [])

        with translation.override("de"):
            self.assertEqual(list(public_person1.get_courses()), [public_course])
            self.assertEqual(list(public_person2.get_courses()), [])
            self.assertEqual(list(public_person3.get_courses()), [])

    def test_models_person_get_courses_public_person_page(self):
        """
        When a person is added on a draft course, the course should not be visible on
        the public person page until the course is published.
        """
        person = PersonFactory(should_publish=True)
        person_page = person.extended_object
        course = CourseFactory(page_title="my title", should_publish=True)
        course_page = course.extended_object

        # Add a person to the course but don't publish the modification
        placeholder = course_page.placeholders.get(slot="course_team")
        add_plugin(placeholder, PersonPlugin, "en", page=person_page)

        self.assertEqual(list(person.get_courses()), [course])
        self.assertEqual(list(person.public_extension.get_courses()), [])

        # Now publish the modification and check that the course is displayed
        # on the public person page
        course.extended_object.publish("en")
        self.assertEqual(
            list(person.public_extension.get_courses()), [course.public_extension]
        )

        # If the course is unpublished, it should not be displayed on the public
        # page anymore
        course_page.unpublish("en")
        self.assertEqual(list(person.get_courses()), [course])
        self.assertEqual(list(person.public_extension.get_courses()), [])

    def test_models_person_get_courses_several_languages(self):
        """
        The courses should not be duplicated if they exist in several languages.
        """
        person = PersonFactory(should_publish=True)
        CourseFactory(
            page_title={"en": "my title", "fr": "mon titre"},
            fill_team=[person],
            should_publish=True,
        )
        self.assertEqual(Course.objects.count(), 2)
        self.assertEqual(person.get_courses().count(), 1)

    def test_models_person_get_courses_snapshots(self):
        """
        Snapshot courses should be excluded from the list of courses returned.
        The new filter query we added to exclude snapshots should not create duplicates.
        Indeed, we had to add a "distinct" clause to the query so this test enforces it.
        """
        # We create a root page because it was responsible for duplicate results when the
        # distinct clause is not applied.
        # This is because of the clause "extended_object__node__parent__cms_pages__..."
        # which is there to exclude snapshots but also acts on the main course page and
        # checks its parent (so the root page) and the duplicate comes from the fact that
        # the parent has a draft and a public page... so "cms_pages" has a cardinality of 2
        root_page = create_i18n_page("my title", published=True)

        person = PersonFactory(should_publish=True)
        course = CourseFactory(
            page_parent=root_page, fill_team=[person], should_publish=True
        )
        CourseFactory(
            page_parent=course.extended_object, fill_team=[person], should_publish=True
        )

        self.assertEqual(Course.objects.count(), 4)
        self.assertEqual(person.get_courses().count(), 1)
        self.assertEqual(person.public_extension.get_courses().count(), 1)

    # get_blogposts

    def test_models_person_get_blogposts(self):
        """
        It should be possible to retrieve the list of related blogposts on the person
        instance. The number of queries should be minimal.
        """
        person = PersonFactory(should_publish=True)
        blogposts = BlogPostFactory.create_batch(
            2, page_title="my title", fill_author=[person], should_publish=True
        )
        retrieved_blogposts = person.get_blogposts()

        with self.assertNumQueries(2):
            self.assertEqual(set(retrieved_blogposts), set(blogposts))

        with self.assertNumQueries(0):
            for blogpost in retrieved_blogposts:
                self.assertEqual(
                    blogpost.extended_object.prefetched_titles[0].title, "my title"
                )

    def test_models_person_get_blogposts_language_fallback_draft(self):
        """
        Validate that the reverse blogposts lookup works as expected with language fallback
        on a draft page.
        """
        person1, person2, person3 = PersonFactory.create_batch(3, should_publish=True)
        blogpost = BlogPostFactory(should_publish=True)
        placeholder = blogpost.extended_object.placeholders.get(slot="author")
        cms_languages = {
            "default": {
                "public": True,
                "hide_untranslated": False,
                "redirect_on_fallback": False,
                "fallbacks": ["en", "fr", "de"],
            }
        }

        # Reverse plugin lookups should fallback up to the second priority language
        add_plugin(
            language="de",
            placeholder=placeholder,
            plugin_type="PersonPlugin",
            **{"page": person1.extended_object},
        )
        with override_settings(CMS_LANGUAGES=cms_languages):
            with translation.override("en"):
                self.assertEqual(list(person1.get_blogposts()), [blogpost])
                self.assertEqual(list(person2.get_blogposts()), [])
                self.assertEqual(list(person3.get_blogposts()), [])

            with translation.override("fr"):
                self.assertEqual(list(person1.get_blogposts()), [blogpost])
                self.assertEqual(list(person2.get_blogposts()), [])
                self.assertEqual(list(person3.get_blogposts()), [])

            with translation.override("de"):
                self.assertEqual(list(person1.get_blogposts()), [blogpost])
                self.assertEqual(list(person2.get_blogposts()), [])
                self.assertEqual(list(person3.get_blogposts()), [])

        # Reverse plugin lookups should fallback to the first priority language if available
        # and ignore the second priority language unless it is the current language
        add_plugin(
            language="fr",
            placeholder=placeholder,
            plugin_type="PersonPlugin",
            **{"page": person2.extended_object},
        )
        with override_settings(CMS_LANGUAGES=cms_languages):
            with translation.override("en"):
                self.assertEqual(list(person1.get_blogposts()), [])
                self.assertEqual(list(person2.get_blogposts()), [blogpost])
                self.assertEqual(list(person3.get_blogposts()), [])

            with translation.override("fr"):
                self.assertEqual(list(person1.get_blogposts()), [])
                self.assertEqual(list(person2.get_blogposts()), [blogpost])
                self.assertEqual(list(person3.get_blogposts()), [])

            with translation.override("de"):
                self.assertEqual(list(person1.get_blogposts()), [blogpost])
                self.assertEqual(list(person2.get_blogposts()), [])
                self.assertEqual(list(person3.get_blogposts()), [])

        # Reverse plugin lookups should stick to the current language if available and
        # ignore plugins on fallback languages
        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="PersonPlugin",
            **{"page": person3.extended_object},
        )
        with override_settings(CMS_LANGUAGES=cms_languages):
            with translation.override("en"):
                self.assertEqual(list(person1.get_blogposts()), [])
                self.assertEqual(list(person2.get_blogposts()), [])
                self.assertEqual(list(person3.get_blogposts()), [blogpost])

            with translation.override("fr"):
                self.assertEqual(list(person1.get_blogposts()), [])
                self.assertEqual(list(person2.get_blogposts()), [blogpost])
                self.assertEqual(list(person3.get_blogposts()), [])

            with translation.override("de"):
                self.assertEqual(list(person1.get_blogposts()), [blogpost])
                self.assertEqual(list(person2.get_blogposts()), [])
                self.assertEqual(list(person3.get_blogposts()), [])

    @override_settings(
        LANGUAGES=(("en", "en"), ("fr", "fr"), ("de", "de")),
        CMS_LANGUAGES={
            "default": {
                "public": True,
                "hide_untranslated": False,
                "redirect_on_fallback": False,
                "fallbacks": ["en", "fr", "de"],
            }
        },
    )
    # pylint: disable=too-many-statements
    def test_models_person_get_blogposts_language_fallback_published(self):
        """
        Validate that the reverse blogposts lookup works as expected with language fallback
        on a published page.
        """
        person1, person2, person3 = PersonFactory.create_batch(3, should_publish=True)
        public_person1 = person1.public_extension
        public_person2 = person2.public_extension
        public_person3 = person3.public_extension

        blogpost, blogpost_unpublished = BlogPostFactory.create_batch(
            2, page_languages=["en", "fr", "de"], should_publish=True
        )

        public_blogpost = blogpost.public_extension

        public_blogpost_unpublished = blogpost_unpublished.public_extension
        blogpost_unpublished.extended_object.unpublish("en")
        blogpost_unpublished.extended_object.unpublish("fr")
        blogpost_unpublished.extended_object.unpublish("de")

        placeholder = public_blogpost.extended_object.placeholders.get(slot="author")
        placeholder_unpublished = (
            public_blogpost_unpublished.extended_object.placeholders.get(slot="author")
        )
        # Reverse plugin lookups should fallback up to the second priority language
        add_plugin(
            language="de",
            placeholder=placeholder,
            plugin_type="PersonPlugin",
            **{"page": person1.extended_object},
        )
        add_plugin(
            language="de",
            placeholder=placeholder_unpublished,
            plugin_type="PersonPlugin",
            **{"page": person1.extended_object},
        )

        with translation.override("en"):
            self.assertEqual(list(public_person1.get_blogposts()), [public_blogpost])
            self.assertEqual(list(public_person2.get_blogposts()), [])
            self.assertEqual(list(public_person3.get_blogposts()), [])

        with translation.override("fr"):
            self.assertEqual(list(public_person1.get_blogposts()), [public_blogpost])
            self.assertEqual(list(public_person2.get_blogposts()), [])
            self.assertEqual(list(public_person3.get_blogposts()), [])

        with translation.override("de"):
            self.assertEqual(list(public_person1.get_blogposts()), [public_blogpost])
            self.assertEqual(list(public_person2.get_blogposts()), [])
            self.assertEqual(list(public_person3.get_blogposts()), [])

        # Reverse plugin lookups should fallback to the first priority language if available
        # and ignore the second priority language unless it is the current language
        add_plugin(
            language="fr",
            placeholder=placeholder,
            plugin_type="PersonPlugin",
            **{"page": person2.extended_object},
        )
        add_plugin(
            language="fr",
            placeholder=placeholder_unpublished,
            plugin_type="PersonPlugin",
            **{"page": person2.extended_object},
        )
        with translation.override("en"):
            self.assertEqual(list(public_person1.get_blogposts()), [])
            self.assertEqual(list(public_person2.get_blogposts()), [public_blogpost])
            self.assertEqual(list(public_person3.get_blogposts()), [])

        with translation.override("fr"):
            self.assertEqual(list(public_person1.get_blogposts()), [])
            self.assertEqual(list(public_person2.get_blogposts()), [public_blogpost])
            self.assertEqual(list(public_person3.get_blogposts()), [])

        with translation.override("de"):
            self.assertEqual(list(public_person1.get_blogposts()), [public_blogpost])
            self.assertEqual(list(public_person2.get_blogposts()), [])
            self.assertEqual(list(public_person3.get_blogposts()), [])

        # Reverse plugin lookups should stick to the current language if available and
        # ignore plugins on fallback languages
        add_plugin(
            language="en",
            placeholder=placeholder,
            plugin_type="PersonPlugin",
            **{"page": person3.extended_object},
        )
        add_plugin(
            language="en",
            placeholder=placeholder_unpublished,
            plugin_type="PersonPlugin",
            **{"page": person3.extended_object},
        )
        with translation.override("en"):
            self.assertEqual(list(public_person1.get_blogposts()), [])
            self.assertEqual(list(public_person2.get_blogposts()), [])
            self.assertEqual(list(public_person3.get_blogposts()), [public_blogpost])

        with translation.override("fr"):
            self.assertEqual(list(public_person1.get_blogposts()), [])
            self.assertEqual(list(public_person2.get_blogposts()), [public_blogpost])
            self.assertEqual(list(public_person3.get_blogposts()), [])

        with translation.override("de"):
            self.assertEqual(list(public_person1.get_blogposts()), [public_blogpost])
            self.assertEqual(list(public_person2.get_blogposts()), [])
            self.assertEqual(list(public_person3.get_blogposts()), [])

    def test_models_person_get_blogposts_public_person_page(self):
        """
        When a person is added on a draft blog post, the blog post should not be visible on
        the public person page until the blog post is published.
        """
        person = PersonFactory(should_publish=True)
        person_page = person.extended_object
        blog_post = BlogPostFactory(page_title="my title", should_publish=True)
        blog_post_page = blog_post.extended_object

        # Add a person to the blog post but don't publish the modification
        placeholder = blog_post_page.placeholders.get(slot="author")
        add_plugin(placeholder, PersonPlugin, "en", page=person_page)

        self.assertEqual(list(person.get_blogposts()), [blog_post])
        self.assertEqual(list(person.public_extension.get_blogposts()), [])

        # Now publish the modification and check that the blog post is displayed
        # on the public person page
        blog_post.extended_object.publish("en")
        self.assertEqual(
            list(person.public_extension.get_blogposts()), [blog_post.public_extension]
        )

        # If the blog post is unpublished, it should not be displayed on the public
        # page anymore
        blog_post_page.unpublish("en")
        self.assertEqual(list(person.get_blogposts()), [blog_post])
        self.assertEqual(list(person.public_extension.get_blogposts()), [])

    def test_models_person_get_blogposts_several_languages(self):
        """
        The blogposts should not be duplicated if they exist in several languages.
        """
        person = PersonFactory(should_publish=True)
        BlogPostFactory(
            page_title={"en": "my title", "fr": "mon titre"},
            fill_author=[person],
            should_publish=True,
        )
        self.assertEqual(BlogPost.objects.count(), 2)
        self.assertEqual(person.get_blogposts().count(), 1)
