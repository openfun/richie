import { CourseRun } from 'types';
import { EnrollmentAwarenessRule } from 'types/commonDataProps';
import { CourseRunFactory } from 'utils/test/factories/richie';
import { getEnrollmentAwareness, matchesEnrollmentAwarenessRule } from '.';

describe('utils/enrollmentAwareness', () => {
  const freeRule: EnrollmentAwarenessRule = {
    id: 'free-course',
    when: { offer: ['free'] },
    cta: { enroll: 'Enroll now for free', login: 'Log in to enroll for free' },
  };
  const externalRule: EnrollmentAwarenessRule = {
    id: 'external-platform',
    when: { is_external: true },
    cta: { enroll: 'Enroll on the partner platform' },
    message: { variant: 'warning', text: 'This course runs on another platform.' },
  };
  const certificateRule: EnrollmentAwarenessRule = {
    id: 'paid-certificate',
    when: { certificate_offer: ['paid'], languages: ['fr', 'en'] },
    message: { variant: 'info', text: 'A certificate is available for a fee.' },
  };

  const courseRun = (overrides: Partial<CourseRun>): CourseRun => ({
    ...CourseRunFactory().one(),
    offer: 'free',
    certificate_offer: 'paid',
    languages: ['en'],
    ...overrides,
  });

  describe('matchesEnrollmentAwarenessRule', () => {
    it('matches when every condition matches', () => {
      expect(
        matchesEnrollmentAwarenessRule(certificateRule, courseRun({}), { isExternal: false }),
      ).toBe(true);
    });

    it('does not match when one condition fails', () => {
      expect(
        matchesEnrollmentAwarenessRule(certificateRule, courseRun({ languages: ['de'] }), {
          isExternal: false,
        }),
      ).toBe(false);
      expect(
        matchesEnrollmentAwarenessRule(certificateRule, courseRun({ certificate_offer: 'free' }), {
          isExternal: false,
        }),
      ).toBe(false);
    });

    it('treats a missing offer as not matching an offer condition', () => {
      expect(
        matchesEnrollmentAwarenessRule(freeRule, courseRun({ offer: undefined }), {
          isExternal: false,
        }),
      ).toBe(false);
    });

    it('matches the external condition against the context', () => {
      expect(
        matchesEnrollmentAwarenessRule(externalRule, courseRun({}), { isExternal: true }),
      ).toBe(true);
      expect(
        matchesEnrollmentAwarenessRule(externalRule, courseRun({}), { isExternal: false }),
      ).toBe(false);
    });
  });

  describe('getEnrollmentAwareness', () => {
    it('returns no label and no message without rules', () => {
      expect(getEnrollmentAwareness(undefined, courseRun({}), { isExternal: false })).toEqual({
        messages: [],
      });
      expect(getEnrollmentAwareness([], courseRun({}), { isExternal: false })).toEqual({
        messages: [],
      });
    });

    it('collects the labels and messages of all the matching rules', () => {
      expect(
        getEnrollmentAwareness([freeRule, externalRule, certificateRule], courseRun({}), {
          isExternal: true,
        }),
      ).toEqual({
        enrollLabel: 'Enroll now for free',
        loginLabel: 'Log in to enroll for free',
        messages: [
          {
            id: 'external-platform',
            variant: 'warning',
            text: 'This course runs on another platform.',
          },
          {
            id: 'paid-certificate',
            variant: 'info',
            text: 'A certificate is available for a fee.',
          },
        ],
      });
    });

    it('lets the first matching rule win for each label', () => {
      expect(
        getEnrollmentAwareness([externalRule, freeRule], courseRun({}), { isExternal: true }),
      ).toMatchObject({
        enrollLabel: 'Enroll on the partner platform',
        loginLabel: 'Log in to enroll for free',
      });
    });

    it('ignores the rules that do not match', () => {
      expect(
        getEnrollmentAwareness(
          [freeRule, externalRule, certificateRule],
          courseRun({ offer: 'paid' }),
          {
            isExternal: false,
          },
        ),
      ).toEqual({
        enrollLabel: undefined,
        loginLabel: undefined,
        messages: [
          {
            id: 'paid-certificate',
            variant: 'info',
            text: 'A certificate is available for a fee.',
          },
        ],
      });
    });
  });
});
