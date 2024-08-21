import { createIntl } from 'react-intl';
import {
  CertificateProductFactory,
  CourseRunFactory,
  CredentialProductFactory,
  EnrollmentFactory,
  ProductFactory,
  TargetCourseFactory,
} from 'utils/test/factories/joanie';
import { CourseStateFactory } from 'utils/test/factories/richie';
import { Priority } from 'types';
import { ProductHelper } from '.';

describe('ProductHelper', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('getDateRange', () => {
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
  });

  describe('getLanguages', () => {
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

  describe('hasRemainingSeats', () => {
    it('should return false when the product is undefined', () => {
      expect(ProductHelper.hasRemainingSeats(undefined)).toBe(false);
    });

    it('should return true when the product has no order group', () => {
      const product = ProductFactory({
        remaining_order_count: null,
      }).one();

      expect(ProductHelper.hasRemainingSeats(product)).toBe(true);
    });

    it('should return true when the product has remaining seats', () => {
      const product = ProductFactory({
        remaining_order_count: 10,
      }).one();

      expect(ProductHelper.hasRemainingSeats(product)).toBe(true);
    });

    it('should return false when the product does not have remaining seats', () => {
      const product = ProductFactory({
        remaining_order_count: 0,
      }).one();

      expect(ProductHelper.hasRemainingSeats(product)).toBe(false);
    });
  });

  describe('hasOpenedTargetCourse', () => {
    const openedCourseRunFactory = CourseRunFactory({
      state: CourseStateFactory({
        priority: Priority.ONGOING_OPEN,
      }).one(),
    });

    const closedCourseRunFactory = CourseRunFactory({
      state: CourseStateFactory({
        priority: Priority.ARCHIVED_CLOSED,
      }).one(),
    });

    it('should return false when the product is undefined', () => {
      expect(ProductHelper.hasOpenedTargetCourse(undefined)).toBe(false);
    });

    it('should throw an error when the product is a certificate and the enrollment is undefined', () => {
      const product = CertificateProductFactory().one();

      expect(() => ProductHelper.hasOpenedTargetCourse(product, undefined)).toThrowError(
        'Unable to check if the certificate product relies on an opened course run without enrollment.',
      );
    });

    it('should return true when the product is a certificate and the related course run is opened', () => {
      const product = CertificateProductFactory().one();
      const courseRun = openedCourseRunFactory.one();
      const enrollment = EnrollmentFactory({ course_run: courseRun }).one();

      expect(ProductHelper.hasOpenedTargetCourse(product, enrollment)).toBe(true);
    });

    it('should return false when the product is a certificate and the related course run is not opened', () => {
      const product = CertificateProductFactory().one();
      const courseRun = closedCourseRunFactory.one();
      const enrollment = EnrollmentFactory({ course_run: courseRun }).one();

      expect(ProductHelper.hasOpenedTargetCourse(product, enrollment)).toBe(false);
    });

    it('should return false when the product is a credential and has not target courses', () => {
      const product = CredentialProductFactory({ target_courses: [] }).one();

      expect(ProductHelper.hasOpenedTargetCourse(product)).toBe(false);
    });

    it('should return false when the product is a credential and at least one target course has no opened course run', () => {
      const targetCourseOpen = TargetCourseFactory({
        course_runs: [openedCourseRunFactory.one(), closedCourseRunFactory.one()],
      }).one();
      const targetCourseClosed = TargetCourseFactory({
        course_runs: [closedCourseRunFactory.one(), closedCourseRunFactory.one()],
      }).one();
      const product = CredentialProductFactory({
        target_courses: [targetCourseOpen, targetCourseClosed],
      }).one();

      expect(ProductHelper.hasOpenedTargetCourse(product)).toBe(false);
    });

    it('should return false when the product is a credential and target courses has one opened course run', () => {
      const targetCourseOpen = TargetCourseFactory({
        course_runs: [openedCourseRunFactory.one(), closedCourseRunFactory.one()],
      }).many(1);
      const product = CredentialProductFactory({ target_courses: targetCourseOpen }).one();

      expect(ProductHelper.hasOpenedTargetCourse(product)).toBe(true);
    });
  });

  describe('isPurchasable', () => {
    it('should return false when the product is undefined', () => {
      expect(ProductHelper.isPurchasable(undefined)).toBe(false);
    });

    it('should return false when the product does not have opened target courses', () => {
      jest.spyOn(ProductHelper, 'hasOpenedTargetCourse').mockReturnValue(false);
      jest.spyOn(ProductHelper, 'hasRemainingSeats').mockReturnValue(true);
      const product = ProductFactory().one();

      expect(ProductHelper.isPurchasable(product)).toBe(false);
    });

    it('should return false when the product does not remaining seats', () => {
      jest.spyOn(ProductHelper, 'hasOpenedTargetCourse').mockReturnValue(true);
      jest.spyOn(ProductHelper, 'hasRemainingSeats').mockReturnValue(false);
      const product = ProductFactory().one();

      expect(ProductHelper.isPurchasable(product)).toBe(false);
    });

    it('should return false when the product does not have opened target courses and remaining seats', () => {
      jest.spyOn(ProductHelper, 'hasOpenedTargetCourse').mockReturnValue(false);
      jest.spyOn(ProductHelper, 'hasRemainingSeats').mockReturnValue(false);
      const product = ProductFactory().one();

      expect(ProductHelper.isPurchasable(product)).toBe(false);
    });

    it('should return true when the product has opened target courses and remaining seats', () => {
      jest.spyOn(ProductHelper, 'hasOpenedTargetCourse').mockReturnValue(true);
      jest.spyOn(ProductHelper, 'hasRemainingSeats').mockReturnValue(true);
      const product = ProductFactory().one();

      expect(ProductHelper.isPurchasable(product)).toBe(true);
    });
  });
});
