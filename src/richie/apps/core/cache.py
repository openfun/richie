"""
Plugin for django-redis that supports redis sentinel.
Credits :
 - https://github.com/lamoda/django-sentinel
 - https://github.com/KabbageInc/django-redis-sentinel
"""

import logging
import random

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured

from django_redis.client import DefaultClient
from redis.sentinel import Sentinel

DJANGO_REDIS_LOGGER = getattr(settings, "DJANGO_REDIS_LOGGER", __name__)


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
                "Incorrect format '%s'" % (connection_string)
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

    # pylint: disable=arguments-differ
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
