# -*- coding: utf-8 -*-
# Generated by Django 1.11.16 on 2018-10-15 05:52
from __future__ import unicode_literals

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

import filer.fields.image

import richie.apps.core.models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("cms", "0020_old_tree_cleanup"),
        migrations.swappable_dependency(settings.FILER_IMAGE_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Course",
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
            ],
            options={"verbose_name": "course"},
        ),
        migrations.CreateModel(
            name="CourseRun",
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
                    "resource_link",
                    models.URLField(
                        blank=True, null=True, verbose_name="Resource link"
                    ),
                ),
                (
                    "start",
                    models.DateTimeField(
                        blank=True, null=True, verbose_name="course start"
                    ),
                ),
                (
                    "end",
                    models.DateTimeField(
                        blank=True, null=True, verbose_name="course end"
                    ),
                ),
                (
                    "enrollment_start",
                    models.DateTimeField(
                        blank=True, null=True, verbose_name="enrollment start"
                    ),
                ),
                (
                    "enrollment_end",
                    models.DateTimeField(
                        blank=True, null=True, verbose_name="enrollment end"
                    ),
                ),
                (
                    "course",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="courses.Course",
                        verbose_name="course",
                    ),
                ),
            ],
            options={"verbose_name": "course run"},
        ),
        migrations.CreateModel(
            name="Licence",
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
                ("name", models.CharField(max_length=200, verbose_name="name")),
                (
                    "url",
                    models.CharField(blank=True, max_length=255, verbose_name="url"),
                ),
                ("content", models.TextField(default="", verbose_name="content")),
                (
                    "logo",
                    filer.fields.image.FilerImageField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="licence",
                        to=settings.FILER_IMAGE_MODEL,
                        verbose_name="logo",
                    ),
                ),
            ],
            options={"verbose_name": "licence"},
        ),
        migrations.CreateModel(
            name="LicencePluginModel",
            fields=[
                (
                    "cmsplugin_ptr",
                    models.OneToOneField(
                        auto_created=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        parent_link=True,
                        primary_key=True,
                        related_name="courses_licencepluginmodel",
                        serialize=False,
                        to="cms.CMSPlugin",
                    ),
                ),
                (
                    "description",
                    models.TextField(
                        blank=True, default="", verbose_name="description"
                    ),
                ),
                (
                    "licence",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="courses.Licence",
                    ),
                ),
            ],
            options={"abstract": False},
            bases=("cms.cmsplugin",),
        ),
        migrations.CreateModel(
            name="Organization",
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
                    "code",
                    models.CharField(
                        blank=True,
                        db_index=True,
                        max_length=100,
                        null=True,
                        verbose_name="code",
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
                    "public_extension",
                    models.OneToOneField(
                        editable=False,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="draft_extension",
                        to="courses.Organization",
                    ),
                ),
            ],
            options={"verbose_name": "organization"},
        ),
        migrations.CreateModel(
            name="OrganizationPluginModel",
            fields=[
                (
                    "cmsplugin_ptr",
                    models.OneToOneField(
                        auto_created=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        parent_link=True,
                        primary_key=True,
                        related_name="courses_organizationpluginmodel",
                        serialize=False,
                        to="cms.CMSPlugin",
                    ),
                ),
                (
                    "page",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="organization_plugins",
                        to="cms.Page",
                    ),
                ),
            ],
            options={"verbose_name": "organization plugin model"},
            bases=(richie.apps.core.models.PagePluginMixin, "cms.cmsplugin"),
        ),
        migrations.CreateModel(
            name="Subject",
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
                    "public_extension",
                    models.OneToOneField(
                        editable=False,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="draft_extension",
                        to="courses.Subject",
                    ),
                ),
            ],
            options={"verbose_name": "subject"},
        ),
        migrations.CreateModel(
            name="SubjectPluginModel",
            fields=[
                (
                    "cmsplugin_ptr",
                    models.OneToOneField(
                        auto_created=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        parent_link=True,
                        primary_key=True,
                        related_name="courses_subjectpluginmodel",
                        serialize=False,
                        to="cms.CMSPlugin",
                    ),
                ),
                (
                    "page",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="subject_plugins",
                        to="cms.Page",
                    ),
                ),
            ],
            options={"verbose_name": "subject plugin model"},
            bases=(richie.apps.core.models.PagePluginMixin, "cms.cmsplugin"),
        ),
        migrations.AddField(
            model_name="course",
            name="organization_main",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="main_courses",
                to="courses.Organization",
            ),
        ),
        migrations.AddField(
            model_name="course",
            name="organizations",
            field=models.ManyToManyField(
                related_name="courses", to="courses.Organization"
            ),
        ),
        migrations.AddField(
            model_name="course",
            name="public_extension",
            field=models.OneToOneField(
                editable=False,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="draft_extension",
                to="courses.Course",
            ),
        ),
    ]
