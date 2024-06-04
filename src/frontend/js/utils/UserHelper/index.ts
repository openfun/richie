import { User } from 'types/User';
import { OpenEdxApiProfile } from 'types/openEdx';

function isUser(object: User | OpenEdxApiProfile): object is User {
  return object.hasOwnProperty('full_name');
}

function isOpenEdxApiProfile(object: User | OpenEdxApiProfile): object is OpenEdxApiProfile {
  return object.hasOwnProperty('name');
}

export class UserHelper {
  /* Return the user's full name if it exists, otherwise return the user's username */
  static getName(user: User | OpenEdxApiProfile) {
    if (isUser(user) && user.full_name) {
      return user.full_name;
    }

    if (isOpenEdxApiProfile(user) && user.name) {
      return user.name;
    }

    return user.username;
  }
}
