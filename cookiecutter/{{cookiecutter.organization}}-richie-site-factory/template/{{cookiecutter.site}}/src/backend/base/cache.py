"""
    RedisCache with a fallback cache to prevent denial of service if Redis is down
    Freely inspired by django-cache-fallback

    Credits:
    - https://github.com/Kub-AT/django-cache-fallback/
"""

import logging

from django.conf import settings
from django.core.cache import caches
from django.core.cache.backends.base import BaseCache

from cms.cache import CMS_PAGE_CACHE_VERSION_KEY
from django_redis.cache import RedisCache

from .utils import throttle

FALLBACK_CACHE_INVALIDATION_INTERVAL = 60  # seconds
DJANGO_REDIS_LOGGER = getattr(settings, "DJANGO_REDIS_LOGGER", __name__)
logger = logging.getLogger(DJANGO_REDIS_LOGGER)


class RedisCacheWithFallback(BaseCache):
    """
    BaseCache object with a redis_cache used as main cache
    and the "fallback" aliased cache which takes over
    in case redis_cache is down.
    """

    def __init__(self, server, params):
        """
        Instantiate the Redis Cache with server and params
        and retrieve the cache with alias "fallback"
        """
        super().__init__(params)
        self._redis_cache = RedisCache(server, params)
        self._fallback_cache = caches["memory_cache"]

    def _call_with_fallback(self, method, *args, **kwargs):
        """
        Try first to exec provided method through Redis cache instance,
        in case of success, invalidate the fallback cache so it is clean and
        ready for next failure,
        in case of failure, logger reports the exception and
        the fallback cache takes over.
        """
        try:
            next_cache_state = self._call_redis_cache(method, args, kwargs)
        except Exception as e:
            logger.warning("[DEGRADED CACHE MODE] - Switch to fallback cache")
            logger.exception(e)
            return self._call_fallback_cache(method, args, kwargs)
        else:
            self._invalidate_fallback_cache()
            return next_cache_state

    def _call_redis_cache(self, method, args, kwargs):
        """
        Exec the provided method through the redis cache instance
        """
        return getattr(self._redis_cache, method)(*args, **kwargs)

    def _call_fallback_cache(self, method, args, kwargs):
        """
        Exec the provided method through the fallback cache instance
        """
        return getattr(self._fallback_cache, method)(*args, **kwargs)

    @throttle(FALLBACK_CACHE_INVALIDATION_INTERVAL)  # 60 seconds
    def _invalidate_fallback_cache(self):
        """
        Invalidate cms page cache in the fallback cache.
        """
        self._fallback_cache.delete(CMS_PAGE_CACHE_VERSION_KEY)

    def get_backend_timeout(self, *args, **kwargs):
        """
        Pass get_backend_timeout cache method to _call_with_fallback
        """
        return self._call_with_fallback("get_backend_timeout", *args, **kwargs)

    def make_key(self, *args, **kwargs):
        """
        Pass make_key cache method to _call_with_fallback
        """
        return self._call_with_fallback("make_key", *args, **kwargs)

    def add(self, *args, **kwargs):
        """
        Pass add cache method to _call_with_fallback
        """
        return self._call_with_fallback("add", *args, **kwargs)

    def get(self, *args, **kwargs):
        """
        Pass get cache method to _call_with_fallback
        """
        return self._call_with_fallback("get", *args, **kwargs)

    def set(self, *args, **kwargs):
        """
        Pass set cache method to _call_with_fallback
        """
        return self._call_with_fallback("set", *args, **kwargs)

    def touch(self, *args, **kwargs):
        """
        Pass touch cache method to _call_with_fallback
        """
        return self._call_with_fallback("touch", *args, **kwargs)

    def delete(self, *args, **kwargs):
        """
        Pass delete cache method to _call_with_fallback
        """
        return self._call_with_fallback("delete", *args, **kwargs)

    def get_many(self, *args, **kwargs):
        """
        Pass get_many cache method to _call_with_fallback
        """
        return self._call_with_fallback("get_many", *args, **kwargs)

    def get_or_set(self, *args, **kwargs):
        """
        Pass get_or_set cache method to _call_with_fallback
        """
        return self._call_with_fallback("get_or_set", *args, **kwargs)

    def has_key(self, *args, **kwargs):
        """
        Pass has_key cache method to _call_with_fallback
        """
        return self._call_with_fallback("has_key", *args, **kwargs)

    def incr(self, *args, **kwargs):
        """
        Pass incr cache method to _call_with_fallback
        """
        return self._call_with_fallback("incr", *args, **kwargs)

    def decr(self, *args, **kwargs):
        """
        Pass decr cache method to _call_with_fallback
        """
        return self._call_with_fallback("decr", *args, **kwargs)

    def set_many(self, *args, **kwargs):
        """
        Pass set_many cache method to _call_with_fallback
        """
        return self._call_with_fallback("set_many", *args, **kwargs)

    def delete_many(self, *args, **kwargs):
        """
        Pass delete_many cache method to _call_with_fallback
        """
        return self._call_with_fallback("delete_many", *args, **kwargs)

    def clear(self):
        """
        Pass clear cache method to _call_with_fallback
        """
        return self._call_with_fallback("clear")

    def validate_key(self, *args, **kwargs):
        """
        Pass validate_key cache method to _call_with_fallback
        """
        return self._call_with_fallback("validate_key", *args, **kwargs)

    def incr_version(self, *args, **kwargs):
        """
        Pass incr_version cache method to _call_with_fallback
        """
        return self._call_with_fallback("incr_version", *args, **kwargs)

    def decr_version(self, *args, **kwargs):
        """
        Pass decr_version cache method to _call_with_fallback
        """
        return self._call_with_fallback("decr_version", *args, **kwargs)
