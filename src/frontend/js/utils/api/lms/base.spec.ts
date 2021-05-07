import { ContextFactory } from 'utils/test/factories';
import { APIBackend } from 'types/api';

describe('Base API', () => {
  const context = ContextFactory({
    lms_backends: [
      {
        backend: APIBackend.BASE,
        course_regexp: '(?<course_id>.*)',
        endpoint: 'https://demo.endpoint/api',
      },
    ],
  }).generate();
  window.__richie_frontend_context__ = { context };
  const { default: API } = require('./base');
  const LMSConf = context.lms_backends[0];
  const BaseAPI = API(LMSConf);

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

        const response = await BaseAPI.enrollment.get(
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
        const enrollment = await BaseAPI.enrollment.get(
          'https://demo.endpoint/courses?course_id=af1987efz98:afe78',
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
