# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

import filer.fields.image


class Migration(migrations.Migration):

    dependencies = [
        ("cms", "0016_auto_20160608_1535"),
        migrations.swappable_dependency(settings.FILER_IMAGE_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="LargeBanner",
            fields=[
                (
                    "cmsplugin_ptr",
                    models.OneToOneField(
                        parent_link=True,
                        related_name="large_banner_largebanner",
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        to="cms.CMSPlugin",
                    ),
                ),
                ("title", models.CharField(max_length=255)),
                (
                    "logo_alt_text",
                    models.CharField(
                        max_length=255,
                        null=True,
                        verbose_name="logo alt text",
                        blank=True,
                    ),
                ),
                (
                    "background_image",
                    filer.fields.image.FilerImageField(
                        related_name="background_image",
                        on_delete=django.db.models.deletion.SET_NULL,
                        verbose_name="background image",
                        blank=True,
                        to=settings.FILER_IMAGE_MODEL,
                        null=True,
                    ),
                ),
                (
                    "logo",
                    filer.fields.image.FilerImageField(
                        related_name="logo",
                        on_delete=django.db.models.deletion.PROTECT,
                        verbose_name="logo",
                        to=settings.FILER_IMAGE_MODEL,
                    ),
                ),
            ],
            options={"abstract": False},
            bases=("cms.cmsplugin",),
        )
    ]
