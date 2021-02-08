$(document).ready(() => {
  const $lti_provider_id = $("#id_lti_provider_id");
  const $credentials_fields = $(".field-oauth_consumer_key, .field-shared_secret");

  const set_credentials_fields_visibility = () => {
    if ($lti_provider_id.val()) {
      $credentials_fields.hide();
    }
    else {
      $credentials_fields.show();
    }
  };

  set_credentials_fields_visibility();
  $lti_provider_id.on('change', set_credentials_fields_visibility);
});

