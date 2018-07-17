"""
Define a named tuple type that will enforce the necessary keys for our ES_INDICES setting
(and also make iteration, both with and without keys, trivial)
"""
from collections import namedtuple

IndicesList = namedtuple("IndicesList", ["courses", "organizations", "subjects"])
