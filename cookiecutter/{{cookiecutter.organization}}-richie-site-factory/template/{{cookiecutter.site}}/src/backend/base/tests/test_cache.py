"""Test site cache plugin"""

import datetime
from unittest import mock

from django.core.cache.backends.dummy import DummyCache
from django.test import TestCase, override_settings

from base.cache import RedisCacheWithFallback
from django_redis.cache import RedisCache


class RedisCacheWithFallbackTestCase(TestCase):
    """
    Test suite for the RedisCacheWithFallback

    Credits:
    - https://github.com/Kub-AT/django-cache-fallback
    """

    @override_settings(
        CACHES={
            "default": {
                "BACKEND": "base.cache.RedisCacheWithFallback",
                "LOCATION": "mymaster/redis-sentinel:26379,redis-sentinel:26379/0",
                "OPTIONS": {
                    "CLIENT_CLASS": "richie.apps.core.cache.SentinelClient",
                },
            },
            "memory_cache": {
                "BACKEND": "django.core.cache.backends.dummy.DummyCache",
            },
        }
    )
    def test_client(self):
        """Test class instance of caches"""
        client = RedisCacheWithFallback(None, {})
        self.assertIs(type(client), RedisCacheWithFallback)
        self.assertIs(type(client._redis_cache), RedisCache)
        self.assertIs(type(client._fallback_cache), DummyCache)

    @mock.patch.object(RedisCacheWithFallback, "_call_fallback_cache")
    @mock.patch.object(RedisCacheWithFallback, "_call_redis_cache")
    def test_get_redis_cache(self, redis_cache_mock, fallback_cache_mock):
        """Test that redis_cache is used by default."""
        client = RedisCacheWithFallback(None, {})
        client.get("irrelevent")

        redis_cache_mock.assert_called_once()
        fallback_cache_mock.assert_not_called()

    @mock.patch("base.cache.logger")
    @mock.patch.object(RedisCacheWithFallback, "_call_fallback_cache")
    @mock.patch.object(RedisCacheWithFallback, "_call_redis_cache")
    def test_get_fallback_cache(
        self, redis_cache_mock, fallback_cache_mock, logger_mock
    ):
        """
        Test case when redis_cache raises an exception,
        logger logs the exception then fallback_cache takes over
        """
        client = RedisCacheWithFallback(None, {})
        client.get("irrelevent")

        redis_cache_mock.assert_called_once()
        fallback_cache_mock.assert_not_called()

        redis_cache_mock.side_effect = Exception()
        client.get("irrelevent")

        logger_mock.warning.assert_called_with(
            "[DEGRADED CACHE MODE] - Switch to fallback cache"
        )
        logger_mock.exception.assert_called_once()
        fallback_cache_mock.assert_called_once()

    @override_settings(
        CACHES={
            "default": {
                "BACKEND": "base.cache.RedisCacheWithFallback",
                "LOCATION": "mymaster/redis-sentinel:26379,redis-sentinel:26379/0",
                "OPTIONS": {
                    "CLIENT_CLASS": "richie.apps.core.cache.SentinelClient",
                },
            },
            "memory_cache": {
                "BACKEND": "django.core.cache.backends.dummy.DummyCache",
            },
        }
    )
    @mock.patch.object(DummyCache, "delete")
    @mock.patch.object(RedisCacheWithFallback, "_call_redis_cache")
    def test_invalidate_fallback_cache(self, redis_cache_mock, delete_mock):
        """
        Test that fallback_cache is invalidated every 60 seconds
        when Redis is up
        """
        now = datetime.datetime.now()

        client = RedisCacheWithFallback(None, {})
        client.get("round_0")
        redis_cache_mock.reset_mock()
        delete_mock.reset_mock()

        # A second cache access should not delete the fallback cache again
        client.get("round_1")
        redis_cache_mock.assert_called_once()
        delete_mock.assert_not_called()
        redis_cache_mock.reset_mock()
        delete_mock.reset_mock()

        # Another call to Redis cache 120 seconds later
        # should delete the fallback cache again
        read_time = now + datetime.timedelta(seconds=120)
        with mock.patch("base.utils.datetime") as mock_datetime:
            mock_datetime.now.return_value = read_time
            client.get("round_2")

        redis_cache_mock.assert_called_once()
        delete_mock.assert_called_once()
        redis_cache_mock.reset_mock()
        delete_mock.reset_mock()

        # Another call to Redis cache 30 seconds later (<1 minute)
        # should not delete the fallback cache again
        read_time += datetime.timedelta(seconds=30)
        with mock.patch("base.utils.datetime") as mock_datetime:
            mock_datetime.now.return_value = read_time
            client.get("round_3")

        redis_cache_mock.assert_called_once()
        delete_mock.assert_not_called()
        redis_cache_mock.reset_mock()
        delete_mock.reset_mock()

        # Another call to Redis cache exactly 1 minute after
        # the latest call should not delete the fallback cache again
        read_time += datetime.timedelta(seconds=30)
        with mock.patch("base.utils.datetime") as mock_datetime:
            mock_datetime.now.return_value = read_time
            client.get("round_4")

        redis_cache_mock.assert_called_once()
        delete_mock.assert_not_called()
        redis_cache_mock.reset_mock()
        delete_mock.reset_mock()

        # Another call to Redis cache exactly 1 minute and 1 second after
        # the latest call should delete the fallback cache again
        read_time += datetime.timedelta(seconds=1)
        with mock.patch("base.utils.datetime") as mock_datetime:
            mock_datetime.now.return_value = read_time
            client.get("round_5")

        redis_cache_mock.assert_called_once()
        delete_mock.assert_called_once()
        redis_cache_mock.reset_mock()
        delete_mock.reset_mock()
