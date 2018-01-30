import os
import sys
import csv
from optparse import make_option

from bs4 import BeautifulSoup
import requests

from django.conf import settings
from django.contrib.auth.models import User
from django.core.management.base import BaseCommand, CommandError
from django.utils.translation import activate

from cms import api

from filer import utils
from filer.models.imagemodels import Image as Filer_Image

from aldryn_categories.models import Category
from aldryn_newsblog.models import Article
from aldryn_newsblog.cms_appconfig import NewsBlogConfig
from aldryn_people.models import Person


ARTICLES = "core/fixtures/newsfeed_article.csv"
CATEGORIES = "core/fixtures/newsfeed_articlecategory.csv"
FUN_ROOT_URL = "https://www.fun-mooc.fr/"
IMAGE_FOLDER = "../data/media/filer_public/"

LANGUAGE = "fr"

USERNAME = "bot old_db_migrate"


class Command(BaseCommand):
    help = "Import News pages from FUN v4"
    option_list = BaseCommand.option_list + (
        make_option(
            "-c",
            "--clear",
            dest="clear",
            action="store_true",
            default=False,
            help="Clear Articles and Categories from database (only in developpement environement)",
        ),
    )

    def __init__(self):
        self.editor_user, _ = User.objects.get_or_create(
            username=USERNAME, email="bot@example.com"
        )
        self.editor_person, _ = Person.objects.get_or_create(user=self.editor_user)
        self.app_config, _ = NewsBlogConfig.objects.get_or_create(
            namespace="aldryn_newsblog_default"
        )
        self.article_iframe_list = []

    def handle(self, *args, **options):
        if options["clear"]:
            if not settings.DEBUG:
                raise CommandError(
                    "You can't delete Articles and Categories if DEBUG=False"
                )
            else:
                Article.objects.all().delete()
                Category.objects.all().delete()

        # Get csv files in lists
        # Some text fields are very long some we need to increase the maxsize
        csv.field_size_limit(sys.maxsize)
        # As Newsblog uses Parler to i18n its models, all requests are made on activated languages
        activate(LANGUAGE)
        categories = Category.objects.all()
        higher_category_id = Category.objects.count() + 1
        new_category_id = 0

        with open(ARTICLES, "r") as csvfile_article:
            old_articles = list(
                csv.DictReader(csvfile_article, delimiter="\t", quotechar="|")
            )

        with open(CATEGORIES, "r") as csvfile_articlecategory:
            old_categories = list(
                csv.DictReader(csvfile_articlecategory, delimiter="\t", quotechar="|")
            )

        """ Create categories from fixtures """
        for line in old_categories:
            if not Category.objects.filter(translations__slug=line["slug"]).exists():
                new_category_id += 1
                fields = {
                    "name": line["name"],
                    "slug": line["slug"],
                    "_current_language": LANGUAGE,
                    "lft": 1,
                    "rgt": 2,
                    "tree_id": new_category_id + higher_category_id,
                    "depth": 1,
                }
                category = self.create_category(**fields)
                print(
                    "New category ------------------------------------------------------------"
                )
                print(category)

        """ Create articles from fixtures """
        for line in old_articles:
            if not Article.objects.filter(translations__slug=line["slug"]).exists():
                """ download image """
                if line["thumbnail"] != "":
                    image_name = line["thumbnail"].replace("newsfeed/", "")
                    django_path = self.download_file(image_name, line["thumbnail"])
                    main_image = self.create_image(image_name, django_path)

                """ import boby images and links (pdf) """
                body = line["CONCAT('|',text,'|')"].replace("\\n", " ").replace(
                    "\\t", ""
                )
                soup = BeautifulSoup(body)

                all_body_images = soup.findAll("img")
                for body_image in all_body_images:
                    uri = body_image["src"]
                    body_image_name = uri[uri.rfind("/") + 1:]
                    django_path = self.download_file(body_image_name, uri)

                    self.create_image(body_image_name, django_path)
                    body = body.replace(
                        uri, "/media/filer_public/" + django_path + body_image_name
                    )

                all_body_links = soup.find_all("a")
                for body_link in all_body_links:
                    try:
                        uri = body_link["href"]
                    except KeyError:
                        pass  # there is a empty <a></a>

                    if uri[-3:-4] == ".":  # identify the . of a file extention
                        # this code seems DEAD
                        raise
                        body_link_name = uri[uri.rfind("/") + 1:]
                        django_path = self.download_file(body_link_name, uri)

                        self.create_image(body_link_name, django_path)
                        body = body.replace(
                            uri, "/media/filer_public/" + django_path + body_link_name
                        )

                """ identify iframe tag for video placeholder """
                # There is 5 articles with usuported iframe
                # There articles will be change by hand to save time
                all_body_iframes = soup.find_all("iframe")
                for body_iframe in all_body_iframes:
                    self.article_iframe_list.append((line["title"], body_iframe["src"]))

                """ import article """
                params = {
                    "title": line["title"],
                    "slug": line["slug"],
                    "author": self.editor_person,
                    "owner": self.editor_user,
                    "app_config": self.app_config,
                    "publishing_date": line["created_at"] + "+01:00",
                    "is_published": True,
                    "_current_language": LANGUAGE,
                    "lead_in": line["lead_paragraph"],
                }
                if main_image:
                    params.update({"featured_image": main_image})

                new_article = self.create_article(**params)
                self.add_plugin_text(new_article, body)

                print(
                    "New article ----------------------------------------------------------"
                )
                print(new_article.title)

                if line["category_id"] != "NULL":
                    new_article.categories.add(
                        self.find_category_article(line["category_id"], old_categories)
                    )
                    new_article.save()

        print("########## END ##########")
        print("--- WARNING ---")
        print("Articles embedding video in IFRAME have to be handled manualy.")
        print("You'll need to split the text body in two parts")
        print("and replace iframe tag by a video placeholder.")
        print("Articles :")
        for article in self.article_iframe_list:
            print(article[0] + " - video link: " + article[1])

    def download_file(self, image_name, path):
        # All files are in /media/
        # But some files path have /media/ prefix and some don't have it
        # The BD tables path don't have it
        # The body articles included links have it
        r = requests.get(FUN_ROOT_URL + "media/" + path.replace("/media/", ""))

        django_path = utils.generate_filename.randomized(None, "")

        """ create all folder"""
        if not os.path.exists(os.path.dirname(IMAGE_FOLDER + django_path)):
            try:
                os.makedirs(os.path.dirname(IMAGE_FOLDER + django_path))
            except OSError as exc:  # Guard against race condition
                if exc.errno != errno.EEXIST:
                    raise

        with open(IMAGE_FOLDER + django_path + image_name, "wb") as f:
            f.write(r.content)

        return django_path

    def find_category_article(self, old_category_id, data_newsfeed_articlecategory):
        # In the article file we have the id of the old category
        # We need to find the old name to find it in the new database
        category_name = None
        category = None

        for line in data_newsfeed_articlecategory:
            if line["id"] == old_category_id:
                category_name = line["name"]

        if category_name:
            for line in Category.objects.all():
                line._current_language = LANGUAGE
                if line.name == category_name:
                    category = line

        return category

    def create_image(self, image_name, django_path):
        params = {
            "author": None,
            "original_filename": image_name,
            "is_public": True,
            "file": "filer_public/" + django_path + image_name,
        }
        image = Filer_Image.objects.create(**params)

        return image

    def create_category(self, **kwargs):
        root = Category.objects.create(**kwargs)

    def create_article(self, **kwargs):
        article = Article.objects.create(**kwargs)
        return article

    def add_plugin_text(self, article, content):
        api.add_plugin(article.content, "TextPlugin", LANGUAGE, body=content)
