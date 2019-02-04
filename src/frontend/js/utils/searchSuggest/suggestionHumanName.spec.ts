import { Category } from '../../types/Category';
import { Course } from '../../types/Course';
import { modelName } from '../../types/models';
import { Organization } from '../../types/Organization';
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

  it('returns the correct human name for a category', () => {
    const category = { title: 'Some category matter' } as Category;
    expect(
      suggestionHumanName({ model: modelName.CATEGORIES, data: category }),
    ).toEqual('Some category matter');
  });
});
