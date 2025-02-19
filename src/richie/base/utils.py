import collections.abc
from datetime import datetime, timedelta
from functools import wraps


def merge_dict(base_dict, update_dict):
    """Utility for deep dictionary updates.

    >>> d1 = {'k1':{'k11':{'a': 0, 'b': 1}}}
    >>> d2 = {'k1':{'k11':{'b': 10}, 'k12':{'a': 3}}}
    >>> merge_dict(d1, d2)
    {'k1': {'k11': {'a': 0, 'b': 10}, 'k12':{'a': 3}}}

    """
    for key, value in update_dict.items():
        if isinstance(value, collections.abc.Mapping):
            base_dict[key] = merge_dict(base_dict.get(key, {}), value)
        else:
            base_dict[key] = value
    return base_dict


class throttle(object):
    """
    Throttle Decorator

    Limit execution of a function to a defined interval
    """

    def __init__(self, interval):
        """
        Initialize throttle decorator
        Define the throttle_interval with the provided interval (in seconds)
        and set time_of_last_call to the earliest representable datetime
        """
        self.throttle_interval = timedelta(seconds=interval)
        self.time_of_last_call = datetime.min

    def __call__(self, callback):
        """
        Process `elapsed_since_last_call`,
        if it is greater than `throttle_interval`, callback is executed.
        """

        @wraps(callback)
        def wrapper(*args, **kwargs):
            now = datetime.now()
            elapsed_since_last_call = now - self.time_of_last_call

            if elapsed_since_last_call > self.throttle_interval:
                self.time_of_last_call = now
                return callback(*args, **kwargs)

        return wrapper
