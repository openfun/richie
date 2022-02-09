import fetchMock from 'fetch-mock';
import { ContextFactory as mockContextFactory } from 'utils/test/factories';
import faker from 'faker';
import { handle } from 'utils/errors/handle';
import context from 'utils/context';
import API from './openedx-hawthorn';

jest.mock('utils/errors/handle');
jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockContextFactory({
    lms_backends: [
      {
        backend: 'openedx-hawthorn',
        course_regexp: 'course_id=(?<course_id>.*$)',
        endpoint: 'https://demo.endpoint/api',
      },
    ],
  }).generate(),
}));
const mockHandle: jest.Mock<typeof handle> = handle as any;

describe('OpenEdX Hawthorn API', () => {
  const EDX_ENDPOINT = 'https://demo.endpoint/api';
  let courseId = '';
  let username = '';

  const LMSConf = context.lms_backends![0];
  const HawthornApi = API(LMSConf);

  describe('APIOptions', () => {
    it('if a route is overriden through APIOptions, related request uses it', async () => {
      const CustomApi = API(LMSConf, {
        routes: {
          user: {
            me: `${LMSConf.endpoint}/my-custom-api/user/v2.0/whoami`,
          },
        },
      });

      fetchMock.get(`${EDX_ENDPOINT}/my-custom-api/user/v2.0/whoami`, 401);

      await expect(CustomApi.user.me()).resolves.toBe(null);
    });
  });

  describe('enrollment', () => {
    beforeEach(() => {
      courseId = faker.datatype.uuid();
      username = faker.internet.userName();
      fetchMock.restore();
      mockHandle.mockRestore();
    });

    describe('get', () => {
      it('returns null if the user is not enrolled to the provided course_id', async () => {
        fetchMock.get(`${EDX_ENDPOINT}/api/enrollment/v1/enrollment/${username},${courseId}`, 200);
        const response = await HawthornApi.enrollment.get(
          `https://demo.endpoint/courses?course_id=${courseId}`,
          { username },
        );
        expect(response).toBeNull();
      });

      it('returns null if the user is anonymous', async () => {
        fetchMock.get(`${EDX_ENDPOINT}/api/enrollment/v1/enrollment/${courseId}`, '');
        const response = await HawthornApi.enrollment.get(
          `https://demo.endpoint/courses?course_id=${courseId}`,
          null,
        );
        expect(response).toBeNull();
      });

      it('throws HttpError if request fails', async () => {
        fetchMock.get(`${EDX_ENDPOINT}/api/enrollment/v1/enrollment/${username},${courseId}`, 500);

        await expect(
          HawthornApi.enrollment.get(`https://demo.endpoint/courses?course_id=${courseId}`, {
            username,
          }),
        ).rejects.toThrow('Internal Server Error');

        expect(mockHandle).toHaveBeenCalledWith(
          new Error('[GET - Enrollment] > 500 - Internal Server Error'),
        );
      });

      it('returns course run information if user is enrolled', async () => {
        fetchMock.get(`${EDX_ENDPOINT}/api/enrollment/v1/enrollment/${username},${courseId}`, {
          is_active: true,
          user: username,
        });

        const response: any = await HawthornApi.enrollment.get(
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

        const response = await HawthornApi.enrollment.get(
          `https://demo.endpoint/courses?course_id=${courseId}`,
          { username },
        );

        expect(response).toBeTruthy();
      });

      it('returns false if user is not enrolled', async () => {
        fetchMock.get(`${EDX_ENDPOINT}/api/enrollment/v1/enrollment/${username},${courseId}`, 200);

        const enrollment = await HawthornApi.enrollment.get(
          `https://demo.endpoint/courses?course_id=${courseId}`,
          { username },
        );

        const response = await HawthornApi.enrollment.isEnrolled(enrollment);

        expect(response).toStrictEqual(false);
      });
    });

    describe('set', () => {
      it('returns true if user has been enrolled', async () => {
        fetchMock.post(`${EDX_ENDPOINT}/api/enrollment/v1/enrollment`, {
          is_active: true,
        });
        const response = await HawthornApi.enrollment.set(
          `https://demo.endpoint/courses?course_id=${courseId}`,
          { username },
        );

        expect(response).toBeTruthy();
      });

      it('throws HttpError if request fails', async () => {
        fetchMock.post(`${EDX_ENDPOINT}/api/enrollment/v1/enrollment`, 500);

        await expect(
          HawthornApi.enrollment.set(`https://demo.endpoint/courses?course_id=${courseId}`, {
            username,
          }),
        ).rejects.toThrow('Internal Server Error');

        expect(mockHandle).toHaveBeenCalledWith(
          new Error('[SET - Enrollment] > 500 - Internal Server Error'),
        );
      });
    });
  });
});
