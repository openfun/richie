import fetchMock from 'fetch-mock';
import { ContextFactory } from 'utils/test/factories';
import faker from 'faker';

describe('Base API', () => {
  const EDX_ENDPOINT = 'https://demo.endpoint/api';
  let courseId = '';
  let username = '';

  const context = ContextFactory({
    lms_backends: [
      {
        backend: 'richie.apps.courses.lms.edx.TokenEdXLMSBackend',
        course_regexp: 'course_id=(?<course_id>.*$)',
        endpoint: EDX_ENDPOINT,
        selector_regexp: '.*',
      },
    ],
  }).generate();
  (window as any).__richie_frontend_context__ = { context };
  const { default: API } = require('./edx');
  const LMSConf = context.lms_backends[0];
  const EdxAPI = API(LMSConf);

  describe('enrollment', () => {
    beforeEach(() => {
      courseId = faker.random.uuid();
      username = faker.internet.userName();
      fetchMock.restore();
    });

    describe('get', () => {
      it('returns null if the user is not enrolled to the provided course_id', async () => {
        fetchMock.get(`${EDX_ENDPOINT}/api/enrollment/v1/enrollment/${username},${courseId}`, 200);
        const response = await EdxAPI.enrollment.get(
          `https://demo.endpoint/courses?course_id=${courseId}`,
          { username },
        );
        expect(response).toBeNull();
      });

      it('returns null if the user is anonymous', async () => {
        fetchMock.get(`${EDX_ENDPOINT}/api/enrollment/v1/enrollment/${courseId}`, 401);
        const response = await EdxAPI.enrollment.get(
          `https://demo.endpoint/courses?course_id=${courseId}`,
        );
        expect(response).toBeNull();
      });

      it('returns null if request failed', async () => {
        fetchMock.get(`${EDX_ENDPOINT}/api/enrollment/v1/enrollment/${username},${courseId}`, 500);

        await expect(
          EdxAPI.enrollment.get(`https://demo.endpoint/courses?course_id=${courseId}`, {
            username,
          }),
        ).resolves.toBeNull();
      });

      it('returns course run information if user is enrolled', async () => {
        fetchMock.get(`${EDX_ENDPOINT}/api/enrollment/v1/enrollment/${username},${courseId}`, {
          is_active: true,
          user: username,
        });

        const response = await EdxAPI.enrollment.get(
          `https://demo.endpoint/courses?course_id=${courseId}`,
          { username },
        );

        expect(response.user).toEqual(username);
        expect(response.is_active).toBeTruthy();
      });
    });

    describe('isEnrolled', () => {
      it('returns true if user is enrolled', async () => {
        fetchMock.get(`${EDX_ENDPOINT}/api/enrollment/v1/enrollment/${username},${courseId}`, {
          is_active: true,
          user: username,
        });

        const response = await EdxAPI.enrollment.get(
          `https://demo.endpoint/courses?course_id=${courseId}`,
          { username },
        );

        expect(response).toBeTruthy();
      });

      it('returns false if user is not enrolled', async () => {
        fetchMock.get(`${EDX_ENDPOINT}/api/enrollment/v1/enrollment/${username},${courseId}`, 200);
        const response = await EdxAPI.enrollment.isEnrolled(
          `https://demo.endpoint/courses?course_id=${courseId}`,
          { username },
        );

        expect(response).toBeFalsy();
      });

      it('returns false if user is anonymous', async () => {
        fetchMock.get(`${EDX_ENDPOINT}/api/enrollment/v1/enrollment/${username},${courseId}`, 401);
        const response = await EdxAPI.enrollment.isEnrolled(
          `https://demo.endpoint/courses?course_id=${courseId}`,
          { username },
        );

        expect(response).toBeFalsy();
      });
    });

    describe('set', () => {
      it('returns true if user has been enrolled', async () => {
        fetchMock.post(`${EDX_ENDPOINT}/api/enrollment/v1/enrollment`, {
          is_active: true,
        });
        const response = await EdxAPI.enrollment.set(
          `https://demo.endpoint/courses?course_id=${courseId}`,
          { username },
        );

        expect(response).toBeTruthy();
      });

      it('returns false if request failed', async () => {
        fetchMock.post(`${EDX_ENDPOINT}/api/enrollment/v1/enrollment`, 500);

        const response = await EdxAPI.enrollment.set(
          `https://demo.endpoint/courses?course_id=${courseId}`,
          { username },
        );

        expect(response).toBeFalsy();
      });
    });
  });
});
