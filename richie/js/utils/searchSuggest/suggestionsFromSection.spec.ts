import { Course } from '../../types/Course';
import { Organization } from '../../types/Organization';
import { Subject } from '../../types/Subject';
import { suggestionsFromSection } from './suggestionsFromSection';

describe('utils/searchSuggest/suggestionsFromSection', () => {
  it('turns a course suggestion section into a list of individual course suggestions', () => {
    expect(
      suggestionsFromSection({
        model: 'courses',
        title: 'Courses',
        values: [
          { title: 'Example course #1' } as Course,
          { title: 'Example course #2' } as Course,
        ],
      }),
    ).toEqual([
      {
        data: { title: 'Example course #1' } as Course,
        model: 'courses',
      },
      {
        data: { title: 'Example course #2' } as Course,
        model: 'courses',
      },
    ]);
  });

  it('turns an organization suggestion section into a list of individual organization suggestions', () => {
    expect(
      suggestionsFromSection({
        model: 'organizations',
        title: 'Organizations',
        values: [
          { name: 'Example organization #1' } as Organization,
          { name: 'Example organization #2' } as Organization,
        ],
      }),
    ).toEqual([
      {
        data: { name: 'Example organization #1' } as Organization,
        model: 'organizations',
      },
      {
        data: { name: 'Example organization #2' } as Organization,
        model: 'organizations',
      },
    ]);
  });

  it('turns a subject suggestion section into a list of individual subject suggestions', () => {
    expect(
      suggestionsFromSection({
        model: 'subjects',
        title: 'Subjects',
        values: [
          { name: 'Example subject #1' } as Subject,
          { name: 'Example subject #2' } as Subject,
        ],
      }),
    ).toEqual([
      {
        data: { name: 'Example subject #1' } as Subject,
        model: 'subjects',
      },
      {
        data: { name: 'Example subject #2' } as Subject,
        model: 'subjects',
      },
    ]);
  });
});
