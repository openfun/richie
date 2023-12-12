import { UserFactory } from 'utils/test/factories/richie';
import { UserHelper } from 'utils/UserHelper/index';

describe('UserHelper', () => {
  describe('getName', () => {
    it("should return the user's full name if it exists", () => {
      const user = UserFactory({ full_name: 'Richie Cunningham' }).one();

      expect(UserHelper.getName(user)).toEqual('Richie Cunningham');
    });

    it("should return the user's username if full name is not defined", () => {
      const user = UserFactory({ full_name: undefined, username: 'richie_cunningham' }).one();

      expect(UserHelper.getName(user)).toEqual('richie_cunningham');
    });
  });
});
