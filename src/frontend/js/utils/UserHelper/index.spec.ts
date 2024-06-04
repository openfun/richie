import { OpenEdxApiProfileFactory } from 'utils/test/factories/openEdx';
import { UserFactory } from 'utils/test/factories/richie';
import { UserHelper } from 'utils/UserHelper/index';

describe('UserHelper', () => {
  describe('getName', () => {
    it("should return the user's full name if a User object is provided", () => {
      const user = UserFactory({ full_name: 'Richie Cunningham' }).one();

      expect(UserHelper.getName(user)).toEqual('Richie Cunningham');
    });

    it("should return the user's name if an OpenEdx profile object is provided", () => {
      const profile = OpenEdxApiProfileFactory({ name: 'Richie Cunningham' }).one();

      expect(UserHelper.getName(profile)).toEqual('Richie Cunningham');
    });

    it.each([
      UserFactory({ full_name: undefined, username: 'richie_cunningham' }).one(),
      OpenEdxApiProfileFactory({ name: undefined, username: 'richie_cunningham' }).one(),
    ])("should return the user's username if full name is not defined", (user) => {
      expect(UserHelper.getName(user)).toEqual('richie_cunningham');
    });
  });
});
