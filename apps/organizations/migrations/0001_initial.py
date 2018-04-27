# -*- coding: utf-8 -*-
# Generated by Django 1.11.12 on 2018-04-26 14:45
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [("cms", "0018_pagenode")]

    operations = [
        migrations.CreateModel(
            name="Organization",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("name", models.CharField(max_length=255, verbose_name="name")),
                (
                    "code",
                    models.CharField(
                        blank=True,
                        db_index=True,
                        max_length=100,
                        null=True,
                        unique=True,
                        verbose_name="code",
                    ),
                ),
                (
                    "logo",
                    models.ImageField(
                        blank=True,
                        help_text="Recommended size: 180x100",
                        upload_to="organizations/logo/",
                        verbose_name="organization logo",
                    ),
                ),
            ],
            options={"verbose_name": "organization"},
        ),
        migrations.CreateModel(
            name="OrganizationPage",
            fields=[
                (
                    "id",
                    models.AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "extended_object",
                    models.OneToOneField(
                        editable=False,
                        on_delete=django.db.models.deletion.CASCADE,
                        to="cms.Page",
                    ),
                ),
                (
                    "organization",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="organization_pages",
                        to="organizations.Organization",
                    ),
                ),
                (
                    "public_extension",
                    models.OneToOneField(
                        editable=False,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="draft_extension",
                        to="organizations.OrganizationPage",
                    ),
                ),
            ],
            options={"verbose_name": "organization page"},
        ),
        migrations.AlterUniqueTogether(
            name="organizationpage",
            unique_together=set([("extended_object", "organization")]),
        ),
    ]
