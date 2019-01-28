import { Course } from '../../types/Course';
import { modelName } from '../../types/models';
import { Organization } from '../../types/Organization';
import { Subject } from '../../types/Subject';
import { suggestionHumanName } from './suggestionHumanName';

describe('utils/searchSuggest/suggestionHumanName', () => {
  it('returns the correct human name for a course', () => {
    const course = { title: 'Some course title' } as Course;
    expect(
      suggestionHumanName({ model: modelName.COURSES, data: course }),
    ).toEqual('Some course title');
  });

  it('returns the correct human name for an organization', () => {
    const organization = { title: 'Some organization name' } as Organization;
    expect(
      suggestionHumanName({
        data: organization,
        model: modelName.ORGANIZATIONS,
      }),
    ).toEqual('Some organization name');
  });

  it('returns the correct human name for a subject', () => {
    const subject = { title: 'Some subject matter' } as Subject;
    expect(
      suggestionHumanName({ model: modelName.SUBJECTS, data: subject }),
    ).toEqual('Some subject matter');
  });
});
