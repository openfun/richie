import { Maybe, Nullable } from './utils';

export interface KeycloakApiProfile {
  username: Maybe<string>;
  firstName: Maybe<Nullable<string>>;
  lastName: Maybe<Nullable<string>>;
  email: Maybe<string>;
}
