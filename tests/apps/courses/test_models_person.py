"""
Unit tests for the Person model
"""
from django.test import TestCase

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
