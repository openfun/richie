"""
Plugin for django-redis that supports redis sentinel.
Credits :
 - https://github.com/lamoda/django-sentinel
 - https://github.com/KabbageInc/django-redis-sentinel

RedisCache with a fallback cache to prevent denial of service if Redis is down
Freely inspired by django-cache-fallback

Credits:
- https://github.com/Kub-AT/django-cache-fallback/
"""

import logging
import random

from django.conf import settings
from django.core.cache import caches
from django.core.cache.backends.base import BaseCache
from django.core.exceptions import ImproperlyConfigured
from django.utils.cache import get_max_age, patch_response_headers
from django.utils.deprecation import MiddlewareMixin

from cms.cache import CMS_PAGE_CACHE_VERSION_KEY
from django_redis.cache import RedisCache
from django_redis.client import DefaultClient
from redis.sentinel import Sentinel

from .utils import Throttle

FALLBACK_CACHE_INVALIDATION_INTERVAL = 60  # seconds
DJANGO_REDIS_LOGGER = getattr(settings, "DJANGO_REDIS_LOGGER", __name__)
logger = logging.getLogger(DJANGO_REDIS_LOGGER)


class SentinelClient(DefaultClient):
    """
    Sentinel client object extending django-redis DefaultClient
    """

    def __init__(self, server, params, backend):
        """
        Slightly different logic than connection to multiple Redis servers.
        Reserve only one write and one read descriptor, as they will be closed on exit anyway.
        """
        super().__init__(server, params, backend)
        self._client_write = None
        self._client_read = None
        (
            self._master_name,
            self._sentinel_hosts,
            self._database_name,
        ) = self.parse_connection_string(server)
        self.log = logging.getLogger(DJANGO_REDIS_LOGGER)

    @staticmethod
    def parse_connection_string(connection_string):
        """
        Parse connection string in format:
            master_name/sentinel_server:port,sentinel_server:port/db_id
        Returns master name, list of tuples with pair (host, port) and db_id
        """
        try:
            master_name, servers_string, database_name = connection_string.split("/")
            servers = [host_port.split(":") for host_port in servers_string.split(",")]
            sentinel_hosts = [(host, int(port)) for host, port in servers]
        except (ValueError, TypeError, IndexError) as error:
            raise ImproperlyConfigured(
                f"Incorrect format '{connection_string:s}'"
            ) from error

        return master_name, sentinel_hosts, database_name

    def get_client(self, write=True, tried=(), show_index=False):
        """
        Method used to obtain a raw redis client.

        This function is used by almost all cache backend
        operations to obtain a native redis client/connection
        instance.
        """
        self.log.debug("get_client called: write=%s", write)
        if write:
            if self._client_write is None:
                self._client_write = self.connect(write)

            if show_index:
                return self._client_write, 0
            return self._client_write

        if self._client_read is None:
            self._client_read = self.connect(write)

        if show_index:
            return self._client_read, 0
        return self._client_read

    # pylint: disable=arguments-renamed
    def connect(self, write=True):
        """
        Create a redis connection with connection pool.
        """
        self.log.debug("connect called: write=%s", write)

        sentinel_timeout = self._options.get("SENTINEL_TIMEOUT", 1)
        password = self._options.get("PASSWORD", None)
        sentinel = Sentinel(
            self._sentinel_hosts, socket_timeout=sentinel_timeout, password=password
        )

        if write:
            host, port = sentinel.discover_master(self._master_name)
        else:
            try:
                host, port = random.choice(  # nosec
                    sentinel.discover_slaves(self._master_name)
                )
            except IndexError:
                self.log.debug("no slaves are available. using master for read.")
                host, port = sentinel.discover_master(self._master_name)

        if password:
            connection_url = f"redis://:{password}@{host}:{port}/{self._database_name}"
        else:
            connection_url = f"redis://{host}:{port}/{self._database_name}"
        self.log.debug("Connecting to: %s", connection_url)
        return self.connection_factory.connect(connection_url)

    def close(self, **kwargs):
        """
        Closing old connections, as master may change in time of inactivity.
        """
        self.log.debug("close called")
        if self._client_read:
            # pylint: disable=protected-access
            for connection in self._client_read.connection_pool._available_connections:
                connection.disconnect()
            self.log.debug("client_read closed")

        if self._client_write:
            # pylint: disable=protected-access
            for connection in self._client_write.connection_pool._available_connections:
                connection.disconnect()
            self.log.debug("client_write closed")

        del self._client_write
        del self._client_read
        self._client_write = None
        self._client_read = None


class LimitBrowserCacheTTLHeaders(MiddlewareMixin):
    """
    This middleware allows to define a maximum cache timeout for the cache
    response headers (Cache-control: max-age and Expires).

    It can be configured with the MAX_BROWSER_CACHE_TTL setting.
    This value is expressed in seconds.

    LimitBrowserCacheTTLHeaders should be placed at the beginning of the
    MIDDLEWARE list, so that it'll get called last during the response phase.
    """

    # pylint: disable=no-self-use
    def process_response(self, request, response):
        """
        Rewrite the "Cache-control" and "Expires headers" in the response
        if needed.
        """
        max_ttl = getattr(settings, "MAX_BROWSER_CACHE_TTL", 600)
        if max_ttl:
            try:
                max_ttl = int(max_ttl)
                if max_ttl < 0:
                    raise ValueError("MAX_BROWSER_CACHE_TTL must be a positive integer")
            except (ValueError, TypeError) as err:
                logger.error(err)
                return response

            max_age = get_max_age(response)
            if max_age is not None and max_age > max_ttl:
                if response.has_header("Expires"):
                    # Remove the Expires response Header because patch_response_headers()
                    # adds it only if it isn't already set
                    del response["Expires"]
                patch_response_headers(response, cache_timeout=max_ttl)

        return response


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
        self.redis_cache = RedisCache(server, params)
        self.fallback_cache = caches["memory_cache"]

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
            self._invalidate_fallback_cache()
            return next_cache_state
        except Exception as e:  # pylint: disable=W0718
            logger.warning("[DEGRADED CACHE MODE] - Switch to fallback cache")
            logger.exception(e)
            return self._call_fallback_cache(method, args, kwargs)

    def _call_redis_cache(self, method, args, kwargs):
        """
        Exec the provided method through the redis cache instance
        """
        return getattr(self.redis_cache, method)(*args, **kwargs)

    def _call_fallback_cache(self, method, args, kwargs):
        """
        Exec the provided method through the fallback cache instance
        """
        return getattr(self.fallback_cache, method)(*args, **kwargs)

    @Throttle(FALLBACK_CACHE_INVALIDATION_INTERVAL)  # 60 seconds
    def _invalidate_fallback_cache(self):
        """
        Invalidate cms page cache in the fallback cache.
        """
        self.fallback_cache.delete(CMS_PAGE_CACHE_VERSION_KEY)

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
