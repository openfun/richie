import { Course } from '../../types/Course';
import { modelName } from '../../types/models';
import { Organization } from '../../types/Organization';
import { Subject } from '../../types/Subject';
import { suggestionsFromSection } from './suggestionsFromSection';

describe('utils/searchSuggest/suggestionsFromSection', () => {
  it('turns a course suggestion section into a list of individual course suggestions', () => {
    expect(
      suggestionsFromSection({
        message: { defaultMessage: 'Courses', id: 'coursesHumanName' },
        model: modelName.COURSES,
        values: [
          { title: 'Example course #1' } as Course,
          { title: 'Example course #2' } as Course,
        ],
      }),
    ).toEqual([
      {
        data: { title: 'Example course #1' } as Course,
        model: modelName.COURSES,
      },
      {
        data: { title: 'Example course #2' } as Course,
        model: modelName.COURSES,
      },
    ]);
  });

  it('turns an organization suggestion section into a list of individual organization suggestions', () => {
    expect(
      suggestionsFromSection({
        message: {
          defaultMessage: 'Organizations',
          id: 'organizationsHumanName',
        },
        model: modelName.ORGANIZATIONS,
        values: [
          { title: 'Example organization #1' } as Organization,
          { title: 'Example organization #2' } as Organization,
        ],
      }),
    ).toEqual([
      {
        data: { title: 'Example organization #1' } as Organization,
        model: modelName.ORGANIZATIONS,
      },
      {
        data: { title: 'Example organization #2' } as Organization,
        model: modelName.ORGANIZATIONS,
      },
    ]);
  });

  it('turns a subject suggestion section into a list of individual subject suggestions', () => {
    expect(
      suggestionsFromSection({
        message: { defaultMessage: 'Subjects', id: 'subjectsHumanName' },
        model: modelName.SUBJECTS,
        values: [
          { title: 'Example subject #1' } as Subject,
          { title: 'Example subject #2' } as Subject,
        ],
      }),
    ).toEqual([
      {
        data: { title: 'Example subject #1' } as Subject,
        model: modelName.SUBJECTS,
      },
      {
        data: { title: 'Example subject #2' } as Subject,
        model: modelName.SUBJECTS,
      },
    ]);
  });

  it('accepts the default suggestion section and returns the default suggestion', () => {
    expect(
      suggestionsFromSection({
        message: null,
        model: null,
        value: 'example message',
      }),
    ).toEqual([{ data: 'example message', model: null }]);
  });
});
