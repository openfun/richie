"""Update Elasticsearch indices each time a page is modified."""
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from django.db import transaction

from richie.apps.courses.models import Category, Course, Organization
from richie.apps.search.index_manager import richie_bulk
from richie.apps.search.indexers import ES_INDICES


def update_course(instance, _language):
    """
    Update Elasticsearch indices when a course was modified and published:
    - update the course document in the Elasticsearch courses index.

    Returns None if the page was related to a course and the Elasticsearch update is done.
    Raises ObjectDoesNotExist if the page instance is not related to a course.
    """
    course = Course.objects.get(draft_extension__extended_object=instance)
    richie_bulk([ES_INDICES.courses.get_es_document_for_course(course)])


def update_course_run(instance, _language):
    """
    Update Elasticsearch indices when a course run was modified and published:
    - update the course document in the Elasticsearch courses index for the parent course
      of this course run.

    Returns None if the page was related to a course run and the Elasticsearch update is done.
    Raises ObjectDoesNotExist if the page instance is not related to a course run.
    """
    course = instance.courserun.get_course().public_extension
    richie_bulk([ES_INDICES.courses.get_es_document_for_course(course)])


def update_organization(instance, language):
    """
    Update Elasticsearch indices when an organization was modified and published:
    - update the organization document in the Elasticsearch organizations index for the
      organization and its direct parent (because the parent ID may change from Parent to Leaf),
    - update the course documents in the Elasticsearch courses index for all courses linked to
      this organization.

    Returns None if the page was related to an organization and the Elasticsearch update is done.
    Raises ObjectDoesNotExist if the page instance is not related to an organization.
    """
    organization = Organization.objects.get(draft_extension__extended_object=instance)
    actions = [
        ES_INDICES.courses.get_es_document_for_course(course)
        for course in organization.get_courses(language)
    ]
    actions.append(
        ES_INDICES.organizations.get_es_document_for_organization(organization)
    )

    # Update the organization's parent only if it exists
    try:
        parent = organization.extended_object.get_parent_page().organization
    except AttributeError:
        pass
    else:
        actions.append(
            ES_INDICES.organizations.get_es_document_for_organization(parent)
        )

    richie_bulk(actions)


def update_category(instance, language):
    """
    Update Elasticsearch indices when a category was modified and published:
    - update the category document in the Elasticsearch categories index for the category
      and its direct parent (because the parent ID may change from Parent to Leaf),
    - update the course documents in the Elasticsearch courses index for all courses linked to
      this category.

    Returns None if the page was related to a category and the Elasticsearch update is done.
    Raises ObjectDoesNotExist if the page instance is not related to a category.
    """
    category = Category.objects.get(draft_extension__extended_object=instance)
    actions = [
        ES_INDICES.courses.get_es_document_for_course(course)
        for course in category.get_courses(language)
    ]
    actions.append(ES_INDICES.categories.get_es_document_for_category(category))

    # Update the category's parent only if it exists
    try:
        parent = category.extended_object.get_parent_page().category
    except AttributeError:
        pass
    else:
        actions.append(ES_INDICES.categories.get_es_document_for_category(parent))

    richie_bulk(actions)


def update_page_extension(instance, language):
    """
    Try updating each type of page extension one-by-one until one works (because we don't know
    to which type of page extension this page is related).
    """
    for method in [
        update_course,
        update_course_run,
        update_category,
        update_organization,
    ]:
        try:
            # The method should raise an ObjectDoesNotExist exception if the page extension
            # linked to this instance is of another type.
            method(instance, language)
        except ObjectDoesNotExist:
            continue
        else:
            return


# pylint: disable=unused-argument
def on_page_publish(sender, instance, language, **kwargs):
    """
    Trigger update of the Elasticsearch indices impacted by the modification of the instance
    only once the database transaction is successful.
    """
    if getattr(settings, "RICHIE_KEEP_SEARCH_UPDATED", True):
        transaction.on_commit(lambda: update_page_extension(instance, language))
