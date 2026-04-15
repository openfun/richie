import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { handle } from 'utils/errors/handle';
import { location } from 'utils/indirection/window';
import LMSHandler from '.';

jest.mock('utils/indirection/window', () => ({
  location: {
    pathname: '/courses/a-test-course/',
    assign: jest.fn(),
  },
}));
jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    lms_backends: [
      {
        backend: 'dummy',
        endpoint: 'https://demo.endpoint/api',
        course_regexp: '.*base.org/.*',
      },
      {
        backend: 'openedx-hawthorn',
        endpoint: 'https://edx.endpoint/api',
        course_regexp: '.*edx.org/.*',
      },
      {
        backend: 'openedx-hawthorn',
        endpoint: 'https://nau.endpoint/api',
        course_regexp: '.*nau.org/.*',
        next_url: 'richie-nau',
      },
    ],
  }).one(),
}));

const mockHandle: jest.Mock<typeof handle> = handle as any;
jest.mock('utils/errors/handle');

describe('API LMS', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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

  it('uses default "richie" next prefix for openedx-hawthorn without next_url configured', () => {
    const api = LMSHandler('https://edx.org/courses/a-test-course');
    api.user.login();
    expect(location.assign).toHaveBeenCalledWith(
      `https://edx.endpoint/api/login?next=richie${location.pathname}`,
    );
  });

  it('uses configured next_url prefix for openedx-hawthorn with next_url set', () => {
    const api = LMSHandler('https://nau.org/courses/a-test-course');
    api.user.login();
    expect(location.assign).toHaveBeenCalledWith(
      `https://nau.endpoint/api/login?next=richie-nau${location.pathname}`,
    );
  });
});
