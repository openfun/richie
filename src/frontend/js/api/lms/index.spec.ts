import { ContextFactory as mockContextFactory } from 'utils/test/factories';
import { handle } from 'utils/errors/handle';
import LMSHandler from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockContextFactory({
    lms_backends: [
      {
        backend: 'base',
        endpoint: 'https://demo.endpoint/api',
        course_regexp: '.*base.org/.*',
      },
      {
        backend: 'openedx-hawthorn',
        endpoint: 'https://edx.endpoint/api',
        course_regexp: '.*edx.org/.*',
      },
    ],
  }).generate(),
}));

const mockHandle: jest.Mock<typeof handle> = handle as any;
jest.mock('utils/errors/handle');

describe('API LMS', () => {
  it('returns OpenEdX API if url that match edx selector is provided', () => {
    const api = LMSHandler('https://edx.org/courses/a-test-course');
    expect(api).toBeDefined();
  });

  it('returns Base API if url that match base selector is provided', () => {
    const api = LMSHandler('https://base.org/course/a-test-course');
    expect(api).toBeDefined();
  });

  it('throw an error if an unknown url is provided', () => {
    expect(() => LMSHandler('https://unknown.org/course/a-test-course')).toThrow(
      `No LMS Backend found for https://unknown.org/course/a-test-course.`,
    );
    expect(mockHandle).toHaveBeenCalledWith(
      new Error('No LMS Backend found for https://unknown.org/course/a-test-course.'),
    );
  });
});
