import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import context from 'utils/context';
import { location } from 'utils/indirection/window';
import API from './dummy';

jest.mock('utils/indirection/window', () => ({
  location: {
    reload: jest.fn(),
  },
}));

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: {
      backend: 'dummy',
      endpoint: 'https://demo.endpoint/api',
    },
    lms_backends: [
      {
        backend: 'dummy',
        course_regexp: '(?<course_id>.*)',
        endpoint: 'https://demo.endpoint/api',
      },
    ],
  }).one(),
}));

describe('Dummy API', () => {
  const LMSConf = context.lms_backends![0];
  const BaseAPI = API(LMSConf);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('user', () => {
    it('simulates that authenticated user is admin', async () => {
      // Not logged-in.
      let response = await BaseAPI.user.me();
      expect(response).toBeNull();

      // Log-in.
      await BaseAPI.user.login();

      // Is logged-in.
      response = await BaseAPI.user.me();
      expect(response?.username).toBe('admin');
      expect(response?.access_token).toBeDefined();
    });

    it('reloads the page when login is called', async () => {
      BaseAPI.user.login();
      expect(location.reload).toHaveBeenCalledTimes(1);
    });

    it('reloads the page when register is called', async () => {
      BaseAPI.user.register();
      expect(location.reload).toHaveBeenCalledTimes(1);
    });
  });

  describe('enrollment', () => {
    beforeEach(() => {
      sessionStorage.clear();
    });
    describe('get', () => {
      it('returns nothing if the user is not enrolled to the provided course_id', async () => {
        const response = await BaseAPI.enrollment.get(
          'https://demo.endpoint/courses?course_id=af1987efz98:afe78',
          { username: 'johndoe' },
        );
        expect(response).toBeNull();
      });

      it('returns course run information if user is enrolled', async () => {
        await BaseAPI.enrollment.set('https://demo.endpoint/courses?course_id=af1987efz98:afe78', {
          username: 'johndoe',
        });

        const response: any = await BaseAPI.enrollment.get(
          'https://demo.endpoint/courses?course_id=af1987efz98:afe78',
          { username: 'johndoe' },
        );

        expect(response.user).toEqual('johndoe');
        expect(response.is_active).toBeTruthy();
      });
    });

    describe('isEnrolled', () => {
      it('returns true if user is enrolled', async () => {
        await BaseAPI.enrollment.set('https://demo.endpoint/courses?course_id=af1987efz98:afe78', {
          username: 'johndoe',
        });

        const enrollment = await BaseAPI.enrollment.get(
          'https://demo.endpoint/courses?course_id=af1987efz98:afe78',
          { username: 'johndoe' },
        );

        const response = await BaseAPI.enrollment.isEnrolled(enrollment);

        expect(response).toStrictEqual(true);
      });

      it('returns false if user is not enrolled', async () => {
        const enrollment = await BaseAPI.enrollment.get(
          'https://demo.endpoint/courses?course_id=af1987efz98:afe78',
          { username: 'johndoe' },
        );

        const response = await BaseAPI.enrollment.isEnrolled(enrollment);

        expect(response).toStrictEqual(false);
      });

      it('returns false if user is anonymous', async () => {
        const enrollment: any = await BaseAPI.enrollment.get(
          'https://demo.endpoint/courses?course_id=af1987efz98:afe78',
          { username: 'johndoe' },
        );

        const response = await BaseAPI.enrollment.isEnrolled(enrollment);

        expect(response).toStrictEqual(false);
      });
    });

    describe('set', () => {
      it('enrolls user', async () => {
        const response = await BaseAPI.enrollment.set(
          'https://demo.endpoint/courses?course_id=af1987efz98:afe78',
          { username: 'johndoe' },
        );

        expect(response).toBeTruthy();
        expect(
          sessionStorage.getItem(
            `johndoe-https://demo.endpoint/courses?course_id=af1987efz98:afe78`,
          ),
        ).toEqual('true');
      });
    });
  });
});
