export interface LtiConsumerContentParameters {
  [index: number]: string;
  context_id: string;
  lis_person_contact_email_primary: string;
  lti_message_type: string;
  lti_version: string;
  oauth_consumer_key: string;
  oauth_nonce: string;
  oauth_signature: string;
  oauth_signature_method: string;
  oauth_timestamp: string;
  oauth_version: string;
  resource_link_id: string;
  roles: string;
  user_id: string;
}
export interface LtiConsumerContext {
  url: string;
  content_parameters: LtiConsumerContentParameters;
  is_automatic_resizing: boolean;
}

export interface LtiConsumerProps {
  id: number;
}
