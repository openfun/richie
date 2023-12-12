import { User } from 'types/User';

export class UserHelper {
  /* Return the user's full name if it exists, otherwise return the user's username */
  static getName(user: User) {
    return user?.full_name || user.username;
  }
}
