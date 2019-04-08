"""Make models.py a module containing one file per model as it was getting too long."""
# flake8: noqa
# pylint: disable=wildcard-import

from .blog import *
from .category import *
from .course import *
from .organization import *
from .person import *

ROOT_REVERSE_IDS = [
    model.ROOT_REVERSE_ID
    for model in [BlogPost, Category, Course, Organization, Person]
]
