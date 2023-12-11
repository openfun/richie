import { JoanieUserApiAbilityActions } from 'types/User';
import { JoanieUserProfileFactory } from 'utils/test/factories/joanie';
import { JoanieUserProfileActions } from './types';
import AbilitiesHelper from '.';

describe('Abilities.JoanieUserProfile', () => {
  it.each([
    {
      label: 'User has access to both a course and an organization',
      abilities: {
        [JoanieUserApiAbilityActions.HAS_ORGANIZATION_ACCESS]: true,
        [JoanieUserApiAbilityActions.HAS_COURSE_ACCESS]: true,
      },
    },
    {
      label: 'User has access to a course',
      abilities: {
        [JoanieUserApiAbilityActions.HAS_ORGANIZATION_ACCESS]: false,
        [JoanieUserApiAbilityActions.HAS_COURSE_ACCESS]: true,
      },
    },
    {
      label: 'User has access to an organization',
      abilities: {
        [JoanieUserApiAbilityActions.HAS_ORGANIZATION_ACCESS]: true,
        [JoanieUserApiAbilityActions.HAS_COURSE_ACCESS]: false,
      },
    },
  ])('should allow ACCESS_TEACHER_DASHBOARD when "$label"', ({ abilities }) => {
    const joanieUser = JoanieUserProfileFactory({
      abilities,
    }).one();
    expect(AbilitiesHelper.can(joanieUser, JoanieUserProfileActions.ACCESS_TEACHER_DASHBOARD)).toBe(
      true,
    );
    expect(
      AbilitiesHelper.cannot(joanieUser, JoanieUserProfileActions.ACCESS_TEACHER_DASHBOARD),
    ).toBe(false);
  });

  it("shouldn't allow access to the teacher dashboard when the user doesn't have access to either the course or the organization", () => {
    const joanieUserProfile = JoanieUserProfileFactory({
      abilities: {
        [JoanieUserApiAbilityActions.HAS_ORGANIZATION_ACCESS]: false,
        [JoanieUserApiAbilityActions.HAS_COURSE_ACCESS]: false,
      },
    }).one();
    expect(
      AbilitiesHelper.can(joanieUserProfile, JoanieUserProfileActions.ACCESS_TEACHER_DASHBOARD),
    ).toBe(false);
    expect(
      AbilitiesHelper.cannot(joanieUserProfile, JoanieUserProfileActions.ACCESS_TEACHER_DASHBOARD),
    ).toBe(true);
  });
});
