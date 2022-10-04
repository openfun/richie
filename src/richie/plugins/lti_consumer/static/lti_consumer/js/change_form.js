$(document).ready(() => {
  const $lti_provider_id = $("#id_lti_provider_id");
  const $foldable_fields = $(".field-oauth_consumer_key, .field-form_shared_secret");

  const set_foldable_fields_visibility = () => {
    if ($lti_provider_id.val()) {
      $foldable_fields.hide();
    }
    else {
      $foldable_fields.show();
    }
  };

  set_foldable_fields_visibility();
  $lti_provider_id.on('change', set_foldable_fields_visibility);
});
