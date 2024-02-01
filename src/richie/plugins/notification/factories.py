"""
PlainText CMS plugin factories
"""
import factory

from .models import Notification


class NotificationFactory(factory.django.DjangoModelFactory):
    """
    Factory to create random instances of Notification for testing.
    """

    class Meta:
        model = Notification

    title = factory.Faker("text", max_nb_chars=42)
    message = factory.Faker("text", max_nb_chars=42)
    template = Notification.NOTIFICATION_TYPES[1][0]
