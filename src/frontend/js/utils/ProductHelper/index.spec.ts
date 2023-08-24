import { createIntl } from 'react-intl';
import { CourseRunFactory, ProductFactory, TargetCourseFactory } from 'utils/test/factories/joanie';
import { ProductHelper } from '.';

describe('ProductHelper', () => {
  it('should return the product date range processed from course runs dates', () => {
    const product = ProductFactory({
      target_courses: [
        TargetCourseFactory({
          course_runs: [
            CourseRunFactory({
              start: new Date('2023-08-13').toISOString(),
              end: new Date('2024-04-27').toISOString(),
            }).one(),
            CourseRunFactory({
              start: new Date('2023-09-17').toISOString(),
              end: new Date('2024-05-29').toISOString(),
            }).one(),
          ],
        }).one(),
        TargetCourseFactory({
          course_runs: [
            CourseRunFactory({
              start: new Date('2024-01-19').toISOString(),
              end: new Date('2025-02-17').toISOString(),
            }).one(),
          ],
        }).one(),
      ],
    }).one();

    expect(ProductHelper.getDateRange(product)).toEqual([
      new Date('2023-08-13'),
      new Date('2025-02-17'),
    ]);
  });

  it('should return undefined minDate when there is a course run with an undefined start date', () => {
    const product = ProductFactory({
      target_courses: [
        TargetCourseFactory({
          course_runs: [
            CourseRunFactory({
              start: undefined,
              end: new Date('2024-04-27').toISOString(),
            }).one(),
            CourseRunFactory({
              start: new Date('2023-09-17').toISOString(),
              end: new Date('2024-05-29').toISOString(),
            }).one(),
          ],
        }).one(),
        TargetCourseFactory({
          course_runs: [
            CourseRunFactory({
              start: new Date('2024-01-19').toISOString(),
              end: new Date('2025-02-17').toISOString(),
            }).one(),
          ],
        }).one(),
      ],
    }).one();

    expect(ProductHelper.getDateRange(product)).toEqual([undefined, new Date('2025-02-17')]);
  });

  it('should return undefined maxDate when there is a course run with an undefined end date', () => {
    const product = ProductFactory({
      target_courses: [
        TargetCourseFactory({
          course_runs: [
            CourseRunFactory({
              start: new Date('2023-08-13').toISOString(),
              end: undefined,
            }).one(),
            CourseRunFactory({
              start: new Date('2023-09-17').toISOString(),
              end: new Date('2024-05-29').toISOString(),
            }).one(),
          ],
        }).one(),
        TargetCourseFactory({
          course_runs: [
            CourseRunFactory({
              start: new Date('2024-01-19').toISOString(),
              end: new Date('2025-02-17').toISOString(),
            }).one(),
          ],
        }).one(),
      ],
    }).one();

    expect(ProductHelper.getDateRange(product)).toEqual([new Date('2023-08-13'), undefined]);
  });

  it('should return the product languages processed from course runs languages', () => {
    const product = ProductFactory({
      target_courses: [
        TargetCourseFactory({
          course_runs: [
            CourseRunFactory({
              languages: ['fr', 'en'],
            }).one(),
            CourseRunFactory({
              languages: ['fr', 'de'],
            }).one(),
          ],
        }).one(),
        TargetCourseFactory({
          course_runs: [
            CourseRunFactory({
              languages: ['fr', 'es'],
            }).one(),
          ],
        }).one(),
      ],
    }).one();

    expect(ProductHelper.getLanguages(product)).toEqual(['fr', 'en', 'de', 'es']);
  });

  it('should return an empty array when there is no language', () => {
    const product = ProductFactory({
      target_courses: [
        TargetCourseFactory({
          course_runs: [
            CourseRunFactory({
              languages: [],
            }).one(),
          ],
        }).one(),
      ],
    }).one();

    expect(ProductHelper.getLanguages(product)).toEqual([]);
  });

  it('should return sorted human readable languages according to the active language', () => {
    const product = ProductFactory({
      target_courses: [
        TargetCourseFactory({
          course_runs: [
            CourseRunFactory({
              languages: ['fr', 'en'],
            }).one(),
            CourseRunFactory({
              languages: ['fr', 'de'],
            }).one(),
          ],
        }).one(),
        TargetCourseFactory({
          course_runs: [
            CourseRunFactory({
              languages: ['fr', 'es'],
            }).one(),
          ],
        }).one(),
      ],
    }).one();

    const intl = createIntl({ locale: 'en' });
    expect(ProductHelper.getLanguages(product, true, intl)).toEqual(
      'English, French, German and Spanish',
    );
  });

  it('should return an empty string when there is no language', () => {
    const product = ProductFactory({
      target_courses: [
        TargetCourseFactory({
          course_runs: [
            CourseRunFactory({
              languages: [],
            }).one(),
          ],
        }).one(),
      ],
    }).one();

    const intl = createIntl({ locale: 'en' });
    expect(ProductHelper.getLanguages(product, true, intl)).toEqual('');
  });
});
