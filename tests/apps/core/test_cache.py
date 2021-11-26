"""
Test suite for the cache module in the `core` application
"""

import time
from datetime import datetime

from django.core.cache import cache, caches
from django.http import HttpRequest, HttpResponse
from django.test import TestCase
from django.utils.cache import patch_response_headers
from django.utils.http import http_date

from django_redis.serializers import json as json_serializer
from django_redis.serializers import msgpack as msgpack_serializer

from richie.apps.core.cache import LimitBrowserCacheTTLHeaders

# pylint: disable=too-many-public-methods


class TestSentinelClient(TestCase):
    """
    Test case for the SentinelClient

    Credits :
    - https://github.com/lamoda/django-sentinel
    - https://github.com/KabbageInc/django-redis-sentinel
    """

    def setUp(self) -> None:
        """Clears the cache before each test"""
        cache.clear()

    @staticmethod
    def test_close():
        """Calling close on the cache backend should not raise any error"""
        default_cache = caches["default"]
        default_cache.set("f", "1")
        default_cache.close()

    def test_decr(self):
        """Test the decr cache operation"""
        cache.set("num", 20)

        cache.decr("num")
        res = cache.get("num")
        self.assertEqual(res, 19)

        cache.decr("num", 20)
        res = cache.get("num")
        self.assertEqual(res, -1)

        cache.decr("num", 2)
        res = cache.get("num")
        self.assertEqual(res, -3)

        cache.set("num", 20)

        cache.decr("num")
        res = cache.get("num")
        self.assertEqual(res, 19)

        # max 64 bit signed int + 1
        cache.set("num", 9223372036854775808)

        cache.decr("num")
        res = cache.get("num")
        self.assertEqual(res, 9223372036854775807)

        cache.decr("num", 2)
        res = cache.get("num")
        self.assertEqual(res, 9223372036854775805)

    def test_delete(self):
        """Test the delete cache operation"""
        cache.set_many({"a": 1, "b": 2, "c": 3})
        res = cache.delete("a")
        self.assertTrue(bool(res))

        res = cache.get_many(["a", "b", "c"])
        assert res == {"b": 2, "c": 3}

        res = cache.delete("a")
        self.assertFalse(bool(res))

    def test_delete_many(self):
        """Test the delete_many cache operation"""
        cache.set_many({"a": 1, "b": 2, "c": 3})
        res = cache.delete_many(["a", "b"])
        self.assertTrue(bool(res))

        res = cache.get_many(["a", "b", "c"])
        self.assertEqual(res, {"c": 3})

        res = cache.delete_many(["a", "b"])
        self.assertFalse(bool(res))

    def test_delete_many_generator(self):
        """Test the delete_many cache operation with a generator"""
        cache.set_many({"a": 1, "b": 2, "c": 3})
        res = cache.delete_many(key for key in ["a", "b"])
        self.assertTrue(bool(res))

        res = cache.get_many(["a", "b", "c"])
        self.assertEqual(res, {"c": 3})

        res = cache.delete_many(["a", "b"])
        self.assertFalse(bool(res))

    def test_delete_many_empty_generator(self):
        """Test the delete_many cache operation with an empty generator"""
        res = cache.delete_many(key for key in [])
        self.assertFalse(bool(res))

    def test_delete_pattern(self):
        """Test the delete_pattern cache operation"""
        for key in ["foo-aa", "foo-ab", "foo-bb", "foo-bc"]:
            cache.set(key, "foo")

        res = cache.delete_pattern("*foo-a*")
        self.assertTrue(bool(res))

        keys = cache.keys("foo*")
        self.assertEqual(set(keys), {"foo-bb", "foo-bc"})

        res = cache.delete_pattern("*foo-a*")
        self.assertFalse(bool(res))

    def test_expire(self):
        """Test the expire cache operation"""
        cache.set("foo", "bar", timeout=None)
        cache.expire("foo", 20)
        ttl = cache.ttl("foo")
        self.assertGreater(ttl + 0.5, 20)

    def test_get_default(self):
        """Test get cache operation with a default value"""
        res = cache.get("test_key")
        self.assertIsNone(res)

        res = cache.get("test_key", "default_value")
        self.assertEqual(res, "default_value")

    def test_get_many(self):
        """Test the get_many cache operation"""
        cache.set("a", 1)
        cache.set("b", 2)
        cache.set("c", 3)

        res = cache.get_many(["a", "b", "c"])
        self.assertEqual(res, {"a": 1, "b": 2, "c": 3})

    def test_get_many_unicode(self):
        """Test the get_many cache operation with unicode values"""
        cache.set("a", "àầä")
        cache.set("b", "bèéë")
        cache.set("c", "çééé")

        res = cache.get_many(["a", "b", "c"])
        self.assertEqual(res, {"a": "àầä", "b": "bèéë", "c": "çééé"})

    def test_get_set_bool(self):
        """Test the get and set cache operations with boolean values"""
        cache.set("bool", True)
        res = cache.get("bool")

        self.assertIsInstance(res, bool)
        self.assertTrue(res)

        cache.set("bool", False)
        res = cache.get("bool")

        self.assertIsInstance(res, bool)
        self.assertFalse(res)

    def test_get_set_dict(self):
        """Test the get and set cache operations with dict values"""
        # pylint: disable=protected-access
        if isinstance(cache.client._serializer, json_serializer.JSONSerializer):
            self.skipTest("Datetimes are not JSON serializable")

        # pylint: disable=protected-access
        if isinstance(cache.client._serializer, msgpack_serializer.MSGPackSerializer):
            # MSGPackSerializer serializers use the isoformat for datetimes
            # https://github.com/msgpack/msgpack-python/issues/12
            now_dt = datetime.now().isoformat()
        else:
            now_dt = datetime.now()

        test_dict = {"id": 1, "date": now_dt, "name": "Foo"}

        cache.set("test_key", test_dict)
        res = cache.get("test_key")

        self.assertIsInstance(res, dict)
        self.assertEqual(res["id"], 1)
        self.assertEqual(res["name"], "Foo")
        self.assertEqual(res["date"], now_dt)

    def test_save_float(self):
        """Test the get and set cache operations with float values"""
        float_val = 1.345620002

        cache.set("test_key", float_val)
        res = cache.get("test_key")

        self.assertIsInstance(res, float)
        self.assertEqual(res, float_val)

    def test_get_set_integer(self):
        """Test the get and set cache operations on int values"""
        cache.set("test_key", 2)
        res = cache.get("test_key", "Foo")

        self.assertIsInstance(res, int)
        self.assertEqual(res, 2)

    def test_get_set_string(self):
        """Test the get and set cache operations on string values"""
        cache.set("test_key", "hello" * 1000)
        res = cache.get("test_key")

        self.assertIsInstance(res, str)
        self.assertEqual(res, "hello" * 1000)

        cache.set("test_key", "2")
        res = cache.get("test_key")

        self.assertIsInstance(res, str)
        self.assertEqual(res, "2")

    def test_save_unicode(self):
        """Test the get and set cache operations on unicode string values"""
        cache.set("test_key", "heló")
        res = cache.get("test_key")

        self.assertIsInstance(res, str)
        self.assertEqual(res, "heló")

    def test_incr(self):
        """Test the incr cache operation"""
        cache.set("num", 1)

        cache.incr("num")
        res = cache.get("num")
        self.assertEqual(res, 2)

        cache.incr("num", 10)
        res = cache.get("num")
        self.assertEqual(res, 12)

        # max 64 bit signed int
        cache.set("num", 9223372036854775807)

        cache.incr("num")
        res = cache.get("num")
        self.assertEqual(res, 9223372036854775808)

        cache.incr("num", 2)
        res = cache.get("num")
        self.assertEqual(res, 9223372036854775810)

        cache.set("num", 3)

        cache.incr("num", 2)
        res = cache.get("num")
        self.assertEqual(res, 5)

    def test_incr_error(self):
        """Calling incr cachi operation on an non-existing key should raise an error"""
        with self.assertRaises(ValueError):
            # key not exists
            cache.incr("numnum")

    def test_incr_version(self):
        """Test the incr_version cache operation"""
        cache.set("keytest", 2)
        cache.incr_version("keytest")

        res = cache.get("keytest")
        self.assertIsNone(res)

        res = cache.get("keytest", version=2)
        self.assertEqual(res, 2)

    def test_iter_keys(self):
        """Test the iter_keys cache operation"""
        cache.set("foo1", 1)
        cache.set("foo2", 1)
        cache.set("foo3", 1)

        # Test simple result
        result = set(cache.iter_keys("foo*"))
        self.assertEqual(result, {"foo1", "foo2", "foo3"})

        # Test limited result
        result = list(cache.iter_keys("foo*", itersize=2))
        self.assertEqual(len(result), 3)

        # Test generator object
        result = cache.iter_keys("foo*")
        self.assertIsNotNone(next(result))

    def test_lock(self):
        """Test the lock cache operation"""
        lock = cache.lock("foobar")
        lock.acquire(blocking=True)

        self.assertTrue("foobar" in cache)
        lock.release()
        self.assertFalse("foobar" in cache)

    def test_persist(self):
        """Test the persist cache operation"""
        cache.set("foo", "bar", timeout=20)
        cache.persist("foo")

        ttl = cache.ttl("foo")
        self.assertIsNone(ttl)

    def test_set_add(self):
        """Test the add cache operation"""
        cache.set("add_key", "Initial value")
        cache.add("add_key", "New value")
        res = cache.get("add_key")
        self.assertEqual(res, "Initial value")

    def test_set_many(self):
        """Test the set_many cache operation"""
        cache.set_many({"a": 1, "b": 2, "c": 3})
        res = cache.get_many(["a", "b", "c"])
        self.assertEqual(res, {"a": 1, "b": 2, "c": 3})

    def test_setnx(self):
        """Test the SETNX (set if not exist) cache operation"""
        # we should ensure there is no test_key_nx in redis
        cache.delete("test_key_nx")
        res = cache.get("test_key_nx", None)
        self.assertIsNone(res)

        res = cache.set("test_key_nx", 1, nx=True)
        self.assertTrue(res)
        # test that second set will have
        res = cache.set("test_key_nx", 2, nx=True)
        self.assertFalse(res)
        res = cache.get("test_key_nx")
        self.assertEqual(res, 1)

        cache.delete("test_key_nx")
        res = cache.get("test_key_nx", None)
        self.assertIsNone(res)

    def test_setnx_timeout(self):
        """Test the timeout option on the SETNX cache operation"""
        # test that timeout still works for nx=True
        res = cache.set("test_key_nx", 1, timeout=2, nx=True)
        self.assertTrue(res)
        time.sleep(3)
        res = cache.get("test_key_nx", None)
        self.assertIsNone(res)

        # test that timeout will not affect key, if it was there
        cache.set("test_key_nx", 1)
        res = cache.set("test_key_nx", 2, timeout=2, nx=True)
        self.assertFalse(res)
        time.sleep(3)
        res = cache.get("test_key_nx", None)
        self.assertEqual(res, 1)

        cache.delete("test_key_nx")
        res = cache.get("test_key_nx", None)
        self.assertIsNone(res)

    def test_timeout(self):
        """Test the expiration of cache entries"""
        cache.set("test_key", 222, timeout=3)
        time.sleep(4)

        res = cache.get("test_key", None)
        self.assertIsNone(res)

    def test_timeout_0(self):
        """Ensure that cache entries expire immediately if the specified timeout is 0"""
        cache.set("test_key", 222, timeout=0)
        res = cache.get("test_key", None)
        self.assertIsNone(res)

    def test_ttl(self):
        """Test the ttl cache operation"""
        # Test ttl
        cache.set("foo", "bar", 10)
        ttl = cache.ttl("foo")
        self.assertGreater(ttl + 0.5, 10)

        # Test ttl None
        cache.set("foo", "foo", timeout=None)
        ttl = cache.ttl("foo")
        self.assertIsNone(ttl)

        # Test ttl with expired key
        cache.set("foo", "foo", timeout=-1)
        ttl = cache.ttl("foo")
        self.assertEqual(ttl, 0)

        # Test ttl with not existent key
        ttl = cache.ttl("not-existent-key")
        self.assertEqual(ttl, 0)

    def test_version(self):
        """Test the version option of the get/set cache operations"""
        cache.set("keytest", 2, version=2)
        res = cache.get("keytest")
        self.assertIsNone(res)

        res = cache.get("keytest", version=2)
        self.assertEqual(res, 2)


class TestLimitBrowserCacheTTLHeaders(TestCase):
    """
    Test case for the LimitBrowserCacheTTLHeaders middleware.
    """

    def test_middleware_limit_cache_with_no_cache_headers(self):
        """
        Ensure that the middleware does not rewrite the response if it does
        not contains Cache headers.
        """
        response = HttpResponse("OK")
        expected_headers = response.serialize_headers()

        with self.settings(MAX_BROWSER_CACHE_TTL=1):
            middleware = LimitBrowserCacheTTLHeaders(lambda request: response)
            response_to_test = middleware(HttpRequest())
            self.assertEqual(expected_headers, response_to_test.serialize_headers())

    def test_middleware_limit_cache_reached(self):
        """
        Ensure that the middleware rewrite the response if the cache headers
        timeout are greater than MAX_BROWSER_CACHE_TTL
        """
        response = HttpResponse("OK")
        patch_response_headers(response, cache_timeout=3600)

        self.assertIn("max-age=3600", response["Cache-Control"])

        with self.settings(MAX_BROWSER_CACHE_TTL=5):
            middleware = LimitBrowserCacheTTLHeaders(lambda request: response)
            response_to_test = middleware(HttpRequest())
            expected_expires = http_date(time.time() + 5)
            self.assertEqual(expected_expires, response_to_test["Expires"])
            self.assertIn("max-age=5", response_to_test["Cache-Control"])

    def test_middleware_limit_cache_not_set(self):
        """
        The MAX_BROWSER_CACHE_TTL setting should default to 600 if not set in the project
        """
        response = HttpResponse("OK")
        patch_response_headers(response, cache_timeout=3600)

        self.assertIn("max-age=3600", response["Cache-Control"])

        middleware = LimitBrowserCacheTTLHeaders(lambda request: response)
        response_to_test = middleware(HttpRequest())
        expected_expires = http_date(time.time() + 600)
        self.assertEqual(expected_expires, response_to_test["Expires"])
        self.assertIn("max-age=600", response_to_test["Cache-Control"])

    def test_middleware_limit_cache_not_reached(self):
        """
        Ensure that the middleware does not rewrite the response if the cache
        headers timeout are lower than MAX_BROWSER_CACHE_TTL
        """
        response = HttpResponse("OK")
        patch_response_headers(response, cache_timeout=30)
        expected_headers = response.serialize_headers()
        self.assertIn("max-age=30", response["Cache-Control"])

        with self.settings(MAX_BROWSER_CACHE_TTL=60):
            middleware = LimitBrowserCacheTTLHeaders(lambda request: response)
            response_to_test = middleware(HttpRequest())
            self.assertEqual(expected_headers, response_to_test.serialize_headers())

    def test_middleware_limit_cache_invalid_settings(self):
        """
        Ensure that the middleware does not rewrite the response if
        MAX_BROWSER_CACHE_TTL is not a positive integer.
        """

        def response_builder(request):
            response = HttpResponse("OK")
            patch_response_headers(response, cache_timeout=3600)
            return response

        with self.settings(MAX_BROWSER_CACHE_TTL=-10):
            middleware = LimitBrowserCacheTTLHeaders(response_builder)
            response = middleware(HttpRequest())
            self.assertEqual(http_date(time.time() + 3600), response["Expires"])
            self.assertIn("max-age=3600", response["Cache-Control"])

        with self.settings(MAX_BROWSER_CACHE_TTL="pouet"):
            middleware = LimitBrowserCacheTTLHeaders(response_builder)
            response = middleware(HttpRequest())
            self.assertEqual(http_date(time.time() + 3600), response["Expires"])
            self.assertIn("max-age=3600", response["Cache-Control"])

        with self.settings(MAX_BROWSER_CACHE_TTL=None):
            middleware = LimitBrowserCacheTTLHeaders(response_builder)
            response = middleware(HttpRequest())
            self.assertEqual(http_date(time.time() + 3600), response["Expires"])
            self.assertIn("max-age=3600", response["Cache-Control"])
