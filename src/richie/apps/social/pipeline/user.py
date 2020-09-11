"""Module used by python-social-auth pipeline."""
from social_core.exceptions import AuthAlreadyAssociated, AuthFailed

USER_FIELDS = ["username", "email"]


# pylint: disable=unused-argument,keyword-arg-before-vararg
def get_username(strategy, details, backend, user=None, *args, **kwargs):
    """Check if the username already exists. Raise an exception if yes."""
    if "username" not in backend.setting("USER_FIELDS", USER_FIELDS):
        return None

    storage = strategy.storage

    if user:
        # The user already exists return its username.
        return {"username": storage.user.get_username(user)}

    email_as_username = strategy.setting("USERNAME_IS_FULL_EMAIL", False)

    if email_as_username and details.get("email"):
        username = details["email"]
    elif details.get("username"):
        username = details["username"]
    else:
        raise AuthFailed(backend, "Failed to retrieve a valid username.")

    if storage.user.user_exists(username=username):
        raise AuthAlreadyAssociated(
            backend, f"user with username {username} already exists."
        )

    return {"username": username}
