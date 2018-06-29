import { Course } from '../../types/Course';
import { Organization } from '../../types/Organization';
import { Subject } from '../../types/Subject';
import { suggestionHumanName } from './suggestionHumanName';

describe('utils/searchSuggest/suggestionHumanName', () => {
  it('returns the correct human name for a course', () => {
    const course = { title: 'Some course title' } as Course;
    expect(suggestionHumanName({ model: 'courses', data: course })).toEqual(
      'Some course title',
    );
  });

  it('returns the correct human name for an organization', () => {
    const organization = { name: 'Some organization name' } as Organization;
    expect(
      suggestionHumanName({ model: 'organizations', data: organization }),
    ).toEqual('Some organization name');
  });

  it('returns the correct human name for a subject', () => {
    const subject = { name: 'Some subject matter' } as Subject;
    expect(suggestionHumanName({ model: 'subjects', data: subject })).toEqual(
      'Some subject matter',
    );
  });
});
