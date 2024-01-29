"""Declare and configure the models for richie's search application."""

from django.db import models


class SearchAccess(models.Model):
    """A model with no database table to hold global custom permissions."""

    class Meta:
        managed = False
        permissions = (
            ("can_manage_elasticsearch", "Allow managing Elasticsearch indices"),
        )
