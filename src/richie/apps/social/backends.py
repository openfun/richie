"""Django authentication backends.

For more information visit
https://docs.djangoproject.com/en/dev/topics/auth/customizing/.

This authentication backend is inspired by the official edX auth-backends
project:
https://github.com/edx/auth-backends/blob/master/auth_backends/backends.py
"""
import base64
import datetime
from calendar import timegm

from django.conf import settings
from django.core.cache import cache

from jose import jwk, jwt
from jose.jwt import ExpiredSignatureError, JWTClaimsError, JWTError
from social_core.backends.oauth import BaseOAuth2
from social_core.backends.open_id_connect import OpenIdConnectAuth
from social_core.exceptions import AuthTokenError

EDX_USER_PROFILE_TO_DJANGO = getattr(settings, "EDX_USER_PROFILE_TO_DJANGO", None) or {
    "preferred_username": "username",
    "email": "email",
    "name": "full_name",
    "given_name": "first_name",
    "family_name": "last_name",
    "locale": "language",
    "user_id": "user_id",
}


# pylint: disable=abstract-method,invalid-name
class EdXOIDC(OpenIdConnectAuth):
    """
    OIDC-based backend to authenticate with OpenEdx's LMS OpenID provider.

    DEPRECATED: this backend can be used with old OpenEdx releases, e.g.
    Dogwood.
    """

    name = "edx-oidc"

    DEFAULT_SCOPE = ["openid", "profile", "email"]
    ID_KEY = "preferred_username"
    REDIRECT_STATE = False

    def endpoint(self):
        """Get OIDC endpoint."""
        return self.setting("ENDPOINT").strip("/")

    @property
    def ID_TOKEN_ISSUER(self):
        """Build ID_TOKEN_ISSUER from the endpoint setting."""
        return self.endpoint()

    @property
    def ACCESS_TOKEN_URL(self):
        """Build ACCESS_TOKEN_URL from the endpoint setting."""
        return f"{self.endpoint()}/access_token/"

    @property
    def AUTHORIZATION_URL(self):
        """Build AUTHORIZATION_URL from the endpoint setting."""
        return f"{self.endpoint()}/authorize/"

    @property
    def USERINFO_URL(self):
        """Build USERINFO_URL from the endpoint setting."""
        return f"{self.endpoint()}/user_info/"

    def get_jwks_keys(self):
        """Returns the keys used to decode the ID token.

        Note: edX uses symmetric keys, so bypass the parent class's calls to an
        external server and return the key from settings.
        """
        k = self.setting("ID_TOKEN_DECRYPTION_KEY")
        k = base64.urlsafe_b64encode(k.encode("utf-8")).rstrip(b"=").decode("utf-8")
        return [{"k": k, "kty": "oct", "alg": "HS256"}]

    def validate_and_return_id_token(self, id_token, access_token):
        """
        Validates the id_token according to the steps at
        http://openid.net/specs/openid-connect-core-1_0.html#IDTokenValidation.
        """
        key = self.find_valid_key(id_token)

        if not key:
            raise AuthTokenError(self, "Signature verification failed")

        alg = key["alg"]
        rsa_key = jwk.construct(key)

        k = {
            "alg": rsa_key._algorithm,  # pylint: disable=protected-access
            "kty": "oct",
            "k": base64.urlsafe_b64encode(rsa_key.prepared_key)
            .rstrip(b"=")
            .decode("utf-8"),
        }

        try:
            claims = jwt.decode(
                id_token,
                k,
                algorithms=[alg],
                audience=self.setting("KEY"),
                issuer=self.id_token_issuer(),
                options=self.JWT_DECODE_OPTIONS,
            )
        except ExpiredSignatureError as error:
            raise AuthTokenError(self, "Signature has expired") from error
        except JWTClaimsError as error:
            raise AuthTokenError(self, str(error)) from error
        except JWTError as error:
            raise AuthTokenError(self, "Invalid signature") from error

        self.validate_claims(claims)

    def validate_claims(self, id_token):
        """Validate decoded JWT token."""

        if id_token["iss"] != self.id_token_issuer():
            raise AuthTokenError(self, "Invalid issuer")

        client_id = self.setting("KEY")

        if isinstance(id_token["aud"], str):
            id_token["aud"] = [id_token["aud"]]

        if client_id not in id_token["aud"]:
            raise AuthTokenError(self, "Invalid audience")

        if len(id_token["aud"]) > 1 and "azp" not in id_token:
            raise AuthTokenError(self, "Incorrect id_token: azp")

        if "azp" in id_token and id_token["azp"] != client_id:
            raise AuthTokenError(self, "Incorrect id_token: azp")

        utc_timestamp = timegm(datetime.datetime.utcnow().utctimetuple())
        if utc_timestamp > id_token["exp"]:
            raise AuthTokenError(self, "Signature has expired")

        if "nbf" in id_token and utc_timestamp < id_token["nbf"]:
            raise AuthTokenError(self, "Incorrect id_token: nbf")

        # Verify the token was issued in the last 10 minutes
        iat_leeway = self.setting("ID_TOKEN_MAX_AGE", self.ID_TOKEN_MAX_AGE)
        if utc_timestamp > id_token["iat"] + iat_leeway:
            raise AuthTokenError(self, "Incorrect id_token: iat")


# pylint: disable=abstract-method
class EdXOAuth2(BaseOAuth2):
    """
    OAuth2-based backend to authenticate with OpenEdx's LMS OAuth2 provider
    (hawthorn release).
    """

    name = "edx-oauth2"

    ACCESS_TOKEN_METHOD = "POST"  # nosec
    DEFAULT_SCOPE = ["profile", "email"]
    ID_KEY = "preferred_username"

    # EXTRA_DATA is used to store important data in the
    # UserSocialAuth.extra_data field. See:
    # https://python-social-auth.readthedocs.io/en/latest/backends/oauth.html?highlight=extra_data
    EXTRA_DATA = [
        # Update the stored user_id, if it's present in the response
        ("user_id", "user_id", True),
        # Update the stored refresh_token, if it's present in the response
        ("refresh_token", "refresh_token", True),
    ]

    def endpoint(self):
        """Get OAuth2 provider endpoint."""
        return self.setting("ENDPOINT").strip("/")

    @property
    def provider_configuration(self):
        """Get OAuth2 provider configuration and cache its configuration for a week."""

        cache_key = "edx_oauth2_provider_configuration"
        config = cache.get(cache_key)

        if not config:
            config = self.get_json(
                self.endpoint() + "/.well-known/openid-configuration"
            )

            # Cache for one week since the configuration rarely changes
            cache.set(
                cache_key,
                config,
                self.setting("PROVIDER_CONFIGURATION_CACHE_TTL", 604800),
            )

        return config

    def authorization_url(self):
        """Get OAuth2 provider authorization URL."""
        return self.provider_configuration.get("authorization_endpoint")

    def access_token_url(self):
        """Get OAuth2 provider access token URL."""
        return self.provider_configuration.get("token_endpoint")

    def end_session_url(self):
        """Get OAuth2 provider end session URL."""
        return self.provider_configuration.get("end_session_endpoint")

    def auth_complete_params(self, state=None):
        """Force the access token type to be JWT."""
        params = super().auth_complete_params(state)
        params.update({"token_type": "jwt"})
        return params

    def _get_jwks_keys(self):
        """Returns the keys used to decode the access token.

        Note: edX uses symmetric keys, so bypass the parent class's calls to an
        external server and return the key from settings.
        """
        k = self.setting("KEY")
        k = base64.urlsafe_b64encode(k.encode("utf-8")).rstrip(b"=").decode("utf-8")
        return [{"k": k, "kty": "oct", "alg": "HS256"}]

    def user_data(self, access_token, *args, **kwargs):
        """Get claimed user data from the JWT formatted access token."""
        decoded_access_token = jwt.decode(
            access_token,
            self._get_jwks_keys(),
            # We must skip verifications as edx does [1].
            # [1] https://github.com/edx/auth-backends/blob/6bf9d856c8e4cc4c1a72f67158468f8c94e3fca1/auth_backends/backends.py#L312 # noqa pylint: disable=line-too-long
            options={
                "verify_signature": False,
                "verify_aud": False,
                "verify_iat": False,
                "verify_exp": False,
                "verify_nbf": False,
                "verify_iss": False,
                "verify_sub": False,
                "verify_jti": False,
                "verify_at_hash": False,
                "leeway": 0,
            },
        )
        return {
            key: decoded_access_token[key]
            for key in EDX_USER_PROFILE_TO_DJANGO
            if key in decoded_access_token
        }

    def get_user_details(self, response):
        """Convert claim user details from the response."""
        return {
            d: response[s]
            for s, d in EDX_USER_PROFILE_TO_DJANGO.items()
            if s in response
        }
