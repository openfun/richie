"""
Richie: a FUN portal for Open edX
"""
from __future__ import absolute_import, unicode_literals

import os

import pkg_resources
from setuptools.config import read_configuration

PROJECT_DIR = os.path.join(os.path.dirname(__file__), "../..")


def _extract_version(package_name):
    """
    Get package version from installed distribution or configuration file if not
    installed
    """
    try:
        return pkg_resources.get_distribution(package_name).version
    except pkg_resources.DistributionNotFound:
        _conf = read_configuration(os.path.join(PROJECT_DIR, "setup.cfg"))
    return _conf["metadata"]["version"]


__version__ = _extract_version("richie")
